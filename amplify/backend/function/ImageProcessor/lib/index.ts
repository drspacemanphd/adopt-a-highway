import { S3, Rekognition, Response, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { S3Event, S3EventRecord } from 'aws-lambda';

const rekognition = new Rekognition({ region: 'us-east-1' });
const s3 = new S3({ region: 'us-east-1' });

export const handler = async (event: S3Event ) => {
  console.log(`Handling ${event.Records?.length} records`);

  const requests = requestContentModerationAnalysis(event.Records, rekognition);

  const settled = await Promise.allSettled(requests);

  const failedToAnalyze: Array<{ record: S3EventRecord, response: PromiseRejectedResult }> = [];
  const inappropriateContent: Array<{ record: S3EventRecord, response: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse & {
    $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
  }>}> = [];
  const imagesForFurtherAnalysis: Array<{ record: S3EventRecord, response: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse & {
    $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
  }>}> = [];

  settled.forEach((response: PromiseSettledResult<Rekognition.DetectModerationLabelsResponse & {
    $response: Response<Rekognition.DetectModerationLabelsResponse, AWSError>
  }>, index: number) => {
    if (response.status === 'rejected') {
      failedToAnalyze.push({ record: event.Records[index], response });
    } else if (response.value.ModerationLabels?.length) {
      inappropriateContent.push({ record: event.Records[index], response });
    } else {
      imagesForFurtherAnalysis.push({ record: event.Records[index], response });
    }
  });

  const processedFailures = failedToAnalyze.map((failed) => processFailedRequest(s3, failed.record, failed.response));
  const processedInappropriate = inappropriateContent.map((inappropriate) => processInappropriateRequest(s3, inappropriate.record, inappropriate.response));
  const processedSuccessful = imagesForFurtherAnalysis.map((image) => processSuccessfulRequest(image.record, image.response));

  await Promise.allSettled(processedFailures);
  await Promise.allSettled(processedInappropriate);

  return JSON.stringify({ body: 'bloop'});
}

const requestContentModerationAnalysis = (
  records: S3EventRecord[], service: Rekognition
): Array<Promise<PromiseResult<Rekognition.Types.DetectModerationLabelsResponse, AWSError>>> => {
  return records.map(async (record: S3EventRecord) => {   
    const isFileProperExt = record.s3.object.key.endsWith('.jpg') || record.s3.object.key.endsWith('.jpeg') || record.s3.object.key.endsWith('.png');

    if (!isFileProperExt) {
      return Promise.reject(`Invalid file type: ${record.s3.object.key}`);
    }

    const image: Rekognition.Image = {
      S3Object: {
        Bucket: record.s3.bucket.name,
        Name: record.s3.object.key,
      }
    };

    return service.detectModerationLabels({
      Image: image,
      MinConfidence: 50,
    }).promise();
  });
}

const processFailedRequest = async (
  service: S3,
  record: S3EventRecord,
  failed: PromiseRejectedResult
) => {
  console.log(`Rekognition request failed for ${record.s3.bucket.name}/${record.s3.object.key} due to ${failed.reason}`);

  try {
    await service.deleteObject({ Bucket: record.s3.bucket.name, Key: record.s3.object.key }).promise();
    console.log(`Successfully deleted: ${record.s3.bucket.name}/${record.s3.object.key}`);
  } catch (err) {
    console.log(`Delete object request failed for ${record.s3.bucket.name}/${record.s3.object.key} due to ${err}`);
  }
}

const processInappropriateRequest = async (
  service: S3,
  record: S3EventRecord,
  inappropriate: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse>
) => {
  console.log(`Rekognition request reported the following inappropriate content for ${record.s3.bucket.name}/${record.s3.object.key} due to ${JSON.stringify(inappropriate.value.ModerationLabels)}`);

  try {
    await service.deleteObject({ Bucket: record.s3.bucket.name, Key: record.s3.object.key }).promise();
    console.log(`Successfully deleted: ${record.s3.bucket.name}/${record.s3.object.key}`);
  } catch (err) {
    console.log(`Delete object request failed for ${record.s3.bucket.name}/${record.s3.object.key} due to ${err}`);
  }
}

const processSuccessfulRequest = async (
  record: S3EventRecord,
  inappropriate: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse>
) => {
  console.log(`Rekognition request suceeded for ${record.s3.bucket.name}/${record.s3.object.key} with ${JSON.stringify(inappropriate.value)}`);
}