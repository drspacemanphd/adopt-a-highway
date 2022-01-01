import * as _ from 'lodash';
import { S3, Rekognition, AWSError, Response } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const s3 = new S3({ region: process.env.REGION });
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

  const [validMessages, invalidMessages]: [SQSRecord[], SQSRecord[]] = partitionValidMessages(event.Records);
  
  handleInvalidMessages(invalidMessages);

  const requests = requestContentModerationAnalysis(validMessages);

  const settled = await Promise.allSettled(requests);

  const failedToAnalyzeForContentModeration: Array<{ record: SQSRecord, response: PromiseRejectedResult }> = [];
  const inappropriateContent: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse & {
    $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
  }>}> = [];
  const imagesForFurtherAnalysis: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse & {
    $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
  }>}> = [];

  settled.forEach((response: PromiseSettledResult<Rekognition.DetectModerationLabelsResponse & {
    $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
  }>, index: number) => {
    if (response.status === 'rejected') {
      failedToAnalyzeForContentModeration.push({ record: event.Records[index], response });
    } else if (response.value.ModerationLabels?.length) {
      inappropriateContent.push({ record: event.Records[index], response });
    } else {
      imagesForFurtherAnalysis.push({ record: event.Records[index], response });
    }
  });

  const processedContentModerationRequestFailures = failedToAnalyzeForContentModeration.map((failed) => processFailedRequest(failed.record, failed.response));
  const processedInappropriateContent = inappropriateContent.map((inappropriate) => processInappropriateImage(inappropriate.record, inappropriate.response));
  const processedAppropriateContent = imagesForFurtherAnalysis.map((image) => processSuccessfulContentModeration(image.record));

  await Promise.allSettled(processedContentModerationRequestFailures);
  await Promise.allSettled(processedInappropriateContent);

  const settledLabelRequests = await Promise.allSettled(processedAppropriateContent);

  const failedToAnalyzeForLitter: Array<{ record: SQSRecord, response: PromiseRejectedResult }> = [];
  const imagesWithoutLitter: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse & {
    $response: Response<Rekognition.DetectLabelsResponse, AWSError>
  }>}> = [];
  const imagesWithLitter: Array<{ record: SQSRecord, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse & {
    $response: Response<Rekognition.DetectLabelsResponse, AWSError>
  }>}> = [];

  settledLabelRequests.forEach((response: PromiseSettledResult<Rekognition.DetectLabelsResponse & {
    $response: Response<Rekognition.DetectLabelsResponse, AWSError>
  }>, index: number) => {
    if (response.status === 'rejected') {
      failedToAnalyzeForLitter.push({ record: event.Records[index], response });
    } else if (!isAtLeastOneLabelLitterPresent(response.value.Labels)) {
      imagesWithoutLitter.push({ record: event.Records[index], response });
    } else {
      imagesWithLitter.push({ record: event.Records[index], response });
    }
  });

  const processedDetectLabelsFailures = failedToAnalyzeForLitter.map((failed) => processFailedRequest(failed.record, failed.response));
  const processedLiterlessImages = imagesWithoutLitter.map((image) => processLiterlessImage(image.record, image.response))

  await Promise.allSettled(processedDetectLabelsFailures);
  await Promise.allSettled(processedLiterlessImages);

  imagesWithLitter.forEach((image) => console.log(JSON.stringify(image.response.value.Labels)))

  return JSON.stringify({ body: 'bloop'});
}

const partitionValidMessages = (messages: SQSRecord[]) => {
  return _.partition(messages, (message: SQSRecord) => {
    try {
      const body = JSON.parse(message.body);
      return typeof body.Bucket === 'string' && typeof body.Key === 'string';
    } catch (err) {
      return false;
    }
  });
}

const handleInvalidMessages = (messages: SQSRecord[]) => {
  messages.forEach((message: SQSRecord) => {
    console.error(`Image Processor - Invalid Message - ${message.messageId}, Could Not Parse - ${message.body}`);
  });
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
    await s3.deleteObject({ Bucket, Key }).promise();
    console.log(`Image Processor - Successfully deleted: ${Bucket}/${Key}`);
  } catch (err) {
    console.warn(`Image Processor - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
}

const processSuccessfulContentModeration = async (
  record: SQSRecord,
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.log(`Image Processor - Rekognition Content Moderation request succeeded for ${Bucket}/${Key}`);

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

const processLiterlessImage = async (
  record: SQSRecord,
  literless: PromiseFulfilledResult<Rekognition.DetectLabelsResponse>
) => {
  const { Bucket, Key } = JSON.parse(record.body);
  console.warn(`Image Processor - Rekognition reported that ${Bucket}/${Key} did not contain litter and instead contained ${JSON.stringify(literless.value.Labels)}`);

  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    console.log(`Image Processor - Successfully deleted: ${Bucket}/${Key}`);
  } catch (err) {
    console.warn(`Image Processor - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
}