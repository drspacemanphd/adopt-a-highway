import * as _ from 'lodash';
import { S3, SQS, Rekognition, AWSError, Response } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const s3 = new S3({ region: process.env.REGION });
const sqs = new SQS({ region: process.env.REGION });
const rekognition = new Rekognition({ region: process.env.REGION });

const TRASH_RELATED_LABELS = [
  'trash',
  'plastic bag',
  'bottle',
  'can',
  'tin'
];

export const handler = async (event: SQSEvent) => {
  console.log(`Handling ${event.Records?.length} records`);

  const { validMessages, invalidMessages } = await partitionValidImages(event.Records);
  handleInvalidMessages(invalidMessages);

  const unflaggedImages = await handleContentModerationAnalysis(validMessages);
  const imagesWithLitter = await handleImageLabelAnalysis(unflaggedImages);

  imagesWithLitter.forEach((image) => console.log(JSON.stringify(image.response.value.Labels)))

  return JSON.stringify({ body: 'bloop'});
}

const partitionValidImages = async (messages: SQSRecord[]) => {
  const [validMessages, invalidMessages] = _.partition(messages, message => {
    try {
      const body = JSON.parse(message.body);
      const { Bucket, Key } = body;
      return typeof Bucket === 'string' && typeof Key === 'string';
    } catch (err) {
      return false;
    }
  });

  // Lambda may process multiple images. As a result, it may throw an error but have some images succeed
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
      validImages.push(validMessages[index])
    }
  })

  return { validMessages: validImages as SQSRecord[], invalidMessages }
}

const handleInvalidMessages = (messages: SQSRecord[]) => {
  messages.forEach((message: SQSRecord) => {
    console.error(`Image Processor - Invalid Message - ${message.messageId}, Could Not Parse - ${message.body}`);
  });
}

const handleContentModerationAnalysis = async (records: SQSRecord[]) => {
  const requests = requestContentModerationAnalysis(records);

  const settled = await Promise.allSettled(requests);

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

  await handleContentModerationRequestFailures(responses.failed);
  await handleInappropriateContent(responses.inappropriate)
  return responses.successful;
}

const handleImageLabelAnalysis = async (images: Array<{ record: SQSRecord, response: any }>) => {
  const requests = images.map(image => processImageContent(image.record));

  const settled = await Promise.allSettled(requests);

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

  await handleLabelDetectionRequestFailures(responses.failed);
  await handleLiterlessImages(responses.imagesWithoutLitter)
  return responses.imagesWithLitter;
}

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
}

const handleContentModerationRequestFailures = async (failures: Array<{ record: SQSRecord, response: PromiseRejectedResult }>) => {
  const processedFailures = failures.map((failed) => processFailedRequest(failed.record, failed.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedFailures);
}

const handleInappropriateContent = async (content: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse & {
  $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
}>}>) => {
  const processedInappropriateContent = content.map((response) => processInappropriateImage(response.record, response.response));

  const responses = await Promise.allSettled(processedInappropriateContent);

  const failed = responses.filter(response => response.status === 'rejected');

  if (failed.length) {
    throw new Error('At least one inappropriate image could not be delivered to queue');
  }
}

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
    console.warn(`Image Processor - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
}

const processInappropriateImage = async (
  record: SQSRecord,
  inappropriate: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse>
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.warn(`Image Processor - Rekognition request reported the following inappropriate content for ${Bucket}/${Key} due to ${JSON.stringify(inappropriate.value.ModerationLabels)}`);

  try {
    await sqs.sendMessage({
      QueueUrl: process.env.FLAGGED_SUBMISSIONS_QUEUE_URL,
      MessageBody: JSON.stringify({
        Bucket,
        Key,
        ModerationLabels: inappropriate.value.ModerationLabels
      })
    }).promise();
    console.log(`Image Processor - Successfully sent: ${Bucket}/${Key} to flagged submissions queue`);
  } catch (err) {
    console.error(`Image Processor - Send message request failed for ${Bucket}/${Key} due to ${JSON.stringify(err)}`);
    throw err;
  }
}

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
}

const isAtLeastOneLabelLitterPresent = (labels: Rekognition.Labels) => {
  return labels.filter((label: Rekognition.Label) => TRASH_RELATED_LABELS.includes(label.Name.toLowerCase())).length
}

const handleLabelDetectionRequestFailures = async (failures: Array<{ record: SQSRecord, response: PromiseRejectedResult }>) => {
  const processedFailures = failures.map((failed) => processFailedRequest(failed.record, failed.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedFailures);
}

const handleLiterlessImages = async (literless: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>) => {
  const processedLiterlessImages = literless.map((image) => processLiterlessImage(image.record, image.response))

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedLiterlessImages);
}

const processLiterlessImage = async (
  record: SQSRecord,
  literless: PromiseFulfilledResult<Rekognition.DetectLabelsResponse>
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.warn(`Image Processor - Rekognition reported that ${Bucket}/${Key} did not contain litter and instead contained ${JSON.stringify(literless.value.Labels)}`);

  try {
    await sqs.sendMessage({
      QueueUrl: process.env.REJECTED_SUBMISSIONS_QUEUE_URL,
      MessageBody: JSON.stringify({
        Bucket,
        Key,
        Labels: literless.value.Labels
      })
    }).promise();
    console.log(`Image Processor - Successfully sent: ${Bucket}/${Key} to rejected submissions queue`);
  } catch (err) {
    console.warn(`Image Processor - Send message request failed for ${Bucket}/${Key} due to ${err}`);
  }
}
