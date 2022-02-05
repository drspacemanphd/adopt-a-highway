import * as _ from 'lodash';
import { S3, SSM, Rekognition, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import axios from 'axios';

const REGION = process.env.REGION;
const FLAGGED_SUBMISSIONS_BUCKET = process.env.FLAGGED_SUBMISSIONS_BUCKET;
const REJECTED_SUBMISSIONS_BUCKET = process.env.REJECTED_SUBMISSIONS_BUCKET;

const s3 = new S3({ region: REGION });
const rekognition = new Rekognition({ region: REGION });
const ssm = new SSM({ region: REGION });

const TRASH_RELATED_LABELS = [
  'trash',
  'plastic bag',
  'bottle',
  'can',
  'tin'
];

// Design in case of multiple images, knowing max records length is 1 per Cloudformation config
export const handler = async (event: SQSEvent) => {
  console.log(`Handling ${event.Records?.length} records`);

  const { validMessages, invalidMessages } = await partitionImages(event.Records);
  logInvalidMessages(invalidMessages);

  const unflaggedImages: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}> = await handleContentModerationAnalysis(validMessages);
  
  const imagesWithLitter: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }> = await handleImageLabelAnalysis(unflaggedImages);

  imagesWithLitter.forEach((image) => console.log(JSON.stringify(image.response.value.Labels)));

  const usernameSecretName = process.env.ArcgisUsername;
  const userPasswordSecretName = process.env.ArcgisPassword;

  const { Parameters } = await ssm.getParameters({
    Names: [
      usernameSecretName,
      userPasswordSecretName
    ],
    WithDecryption: true }).promise();

  const username = Parameters.find(p => p.Name === usernameSecretName)?.Value;
  const password = Parameters.find(p => p.Name === userPasswordSecretName)?.Value;

  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  params.append('referer', 'amplifyapp.com');
  const res = await axios.post('https://www.arcgis.com/sharing/rest/generateToken?f=json', params);

  console.log(res.data);

  return JSON.stringify({ body: 'done'});
};

const partitionImages = async (messages: SQSRecord[]) => {
  const [validMessages, invalidMessages] = _.partition(messages, message => {
    try {
      const body = JSON.parse(message.body);
      const { Bucket, Key } = body;
      return typeof Bucket === 'string' && typeof Key === 'string';
    } catch (err) {
      return false;
    }
  });

  // In future, function may analyze multiple images
  // It may throw an error but have some images succeed
  // Check if images are still there so we don't fail on retries
  const headRequests = validMessages.map(message => {
    const body = JSON.parse(message.body);
    return s3.headObject({
      Bucket: body.Bucket,
      Key: body.Key
    }).promise();
  });

  const settled = await Promise.allSettled(headRequests);

  const validImages = [];

  settled.forEach((response, index) => {
    if (response.status === 'rejected') {
      invalidMessages.push(validMessages[index]);
    } else {
      validImages.push(validMessages[index]);
    }
  });

  return { validMessages: validImages as SQSRecord[], invalidMessages };
};

const logInvalidMessages = (messages: SQSRecord[]) => {
  messages.forEach((message: SQSRecord) => {
    console.error(`Image Processor - Invalid Message - ${message.messageId}, Could Not Parse - ${message.body}`);
  });
};

const handleContentModerationAnalysis = async (records: SQSRecord[]): Promise<Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}>> => {
  const requests: Array<Promise<PromiseResult<Rekognition.Types.DetectModerationLabelsResponse, AWSError>>> = requestContentModerationAnalysis(records);

  const settled: Array<PromiseSettledResult<Rekognition.Types.DetectModerationLabelsResponse>> = await Promise.allSettled(requests);

  const responses = settled.reduce((map, response, index) => {
    if (response.status === 'rejected') {
      map.failed.push({ record: records[index], response });
    } else if (response.value.ModerationLabels?.length) {
      map.inappropriate.push({ record: records[index], response });
    } else {
      map.successful.push({ record: records[index], response });
    }
    return map;
  }, { failed: [], inappropriate: [], successful: [] });

  if (responses.failed.length) {
    await handleContentModerationRequestFailures(responses.failed);
  }

  if (responses.inappropriate.length) {
    await handleInappropriateContent(responses.inappropriate);
  }

  return responses.successful;
};

const handleImageLabelAnalysis = async (images:Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}>): Promise<Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>> => {
  const requests: Array<Promise<PromiseResult<Rekognition.DetectLabelsResponse, AWSError>>> = images.map(image => processImageContent(image.record));

  const settled: Array<PromiseSettledResult<Rekognition.DetectLabelsResponse>> = await Promise.allSettled(requests);

  const responses = settled.reduce((map, response, index) => {
    if (response.status === 'rejected') {
      map.failed.push({ record: images[index].record, response });
    } else if (!isAtLeastOneLabelLitterPresent(response.value.Labels)) {
      map.imagesWithoutLitter.push({ record: images[index].record, response });
    } else {
      map.imagesWithLitter.push({ record: images[index].record, response });
    }
    return map;
  }, { failed: [], imagesWithoutLitter: [], imagesWithLitter: [] });

  if (responses.failed.length) {
    await handleLabelDetectionRequestFailures(responses.failed);
  }

  if (responses.imagesWithoutLitter.length) {
    await handleLitterlessImages(responses.imagesWithoutLitter);
  }

  return responses.imagesWithLitter;
};

const requestContentModerationAnalysis = (
  records: SQSRecord[]
): Array<Promise<PromiseResult<Rekognition.Types.DetectModerationLabelsResponse, AWSError>>> => {
  return records.map(async (record: SQSRecord) => {   
    const { Bucket, Key } = JSON.parse(record.body);

    const image: Rekognition.Image = {
      S3Object: {
        Bucket,
        Name: Key
      }
    };

    return rekognition.detectModerationLabels({
      Image: image,
      MinConfidence: 50,
    }).promise();
  });
};

const handleContentModerationRequestFailures = async (failures: Array<{ record: SQSRecord, response: PromiseRejectedResult }>) => {
  const processedFailures = failures.map((failed) => processFailedRequest(failed.record, failed.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedFailures);
};

const handleInappropriateContent = async (content: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}>) => {
  const processedInappropriateContent = content.map((response) => processInappropriateImage(response.record, response.response));

  const responses = await Promise.allSettled(processedInappropriateContent);

  const failed = responses.filter(response => response.status === 'rejected');

  if (failed.length) {
    throw new Error('At least one inappropriate image could not be delivered to queue');
  }
};

const processFailedRequest = async (
  record: SQSRecord,
  failed: PromiseRejectedResult
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.warn(`Image Processor - Rekognition request failed for ${Bucket}/${Key} due to ${failed.reason}`);

  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    console.log(`Image Processor - Successfully deleted: ${Bucket}/${Key}`);
  } catch (err) {
    // No need to retry
    console.warn(`Image Processor - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
};

const processInappropriateImage = async (
  record: SQSRecord,
  inappropriate: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.warn(`Image Processor - Rekognition request reported the following inappropriate content for ${Bucket}/${Key} due to ${JSON.stringify(inappropriate.value.ModerationLabels)}`);

  try {
    await s3.copyObject({
      CopySource: `${Bucket}/${Key}`,
      Bucket: FLAGGED_SUBMISSIONS_BUCKET,
      Key
    }).promise();
    console.log(`Image Processor - Successfully copied: ${Bucket}/${Key} to ${FLAGGED_SUBMISSIONS_BUCKET}`);
  } catch (err) {
    console.error(`Image Processor - Copied object request failed for ${Bucket}/${Key} due to ${err}`);
    throw err;
  }

  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    console.log(`Image Processor - Successfully deleted: ${Bucket}/${Key}`);
  } catch (err) {
    // Not worth a retry
    console.warn(`Image Processor - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
};

const processImageContent = async (
  record: SQSRecord,
) => {
  const { Bucket, Key } = JSON.parse(record.body);

  return rekognition.detectLabels({
    Image: {
      S3Object: {
        Bucket,
        Name: Key
      }
    },
    MaxLabels: 20,
    MinConfidence: 35
  }).promise();
};

const isAtLeastOneLabelLitterPresent = (labels: Rekognition.Labels) => {
  return labels.filter((label: Rekognition.Label) => TRASH_RELATED_LABELS.includes(label.Name.toLowerCase())).length;
};

const handleLabelDetectionRequestFailures = async (failures: Array<{ record: SQSRecord, response: PromiseRejectedResult }>) => {
  const processedFailures = failures.map((failed) => processFailedRequest(failed.record, failed.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedFailures);
};

const handleLitterlessImages = async (literless: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>) => {
  const processedLiterlessImages = literless.map((image) => processLitterlessImage(image.record, image.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedLiterlessImages);
};

const processLitterlessImage = async (
  record: SQSRecord,
  literless: PromiseFulfilledResult<Rekognition.DetectLabelsResponse>
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.warn(`Image Processor - Rekognition reported that ${Bucket}/${Key} did not contain litter and instead contained ${JSON.stringify(literless.value.Labels)}`);

  try {
    await s3.copyObject({
      CopySource: `${Bucket}/${Key}`,
      Bucket: REJECTED_SUBMISSIONS_BUCKET,
      Key
    }).promise();
    console.log(`Image Processor - Successfully copied: ${Bucket}/${Key} to ${REJECTED_SUBMISSIONS_BUCKET}`);
  } catch (err) {
    console.error(`Image Processor - Copied object request failed for ${Bucket}/${Key} due to ${err}`);
    throw err;
  }

  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    console.log(`Image Processor - Successfully deleted: ${Bucket}/${Key}`);
  } catch (err) {
    // Not worth a retry
    console.warn(`Image Processor - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
};
