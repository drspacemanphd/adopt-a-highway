import { S3, Rekognition, Request, Response, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { S3Event, S3EventRecord } from 'aws-lambda';

export const handler = async (event: S3Event ) => {
  console.log(`Handling ${event.Records?.length} records`);

  const rekognition = new Rekognition({ region: 'us-east-1' });
  const s3 = new S3({ region: 'us-east-1' });

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

  failedToAnalyze.forEach(async (failed) => {
    await processFailedRequest(s3, failed.record, failed.response);
  });

  return JSON.stringify({ body: 'bloop'});
}

const requestContentModerationAnalysis = (
  records: S3EventRecord[], service: Rekognition
): Array<Promise<PromiseResult<Rekognition.Types.DetectModerationLabelsResponse, AWSError>>> => {
  return records.map(async (record: S3EventRecord) => {
    const image: Rekognition.Image = {
      S3Object: {
        Bucket: record.s3.bucket.name,
        Name: record.s3.object.key,
      }
    }
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
  console.log(`Rekognition request failed for ${record.s3.bucket}/${record.s3.object.key} due to ${failed.reason}`);

  try {
    await service.deleteObject({ Bucket: record.s3.bucket.name, Key: record.s3.object.key }).promise();
  } catch (err) {
    console.log(`Delete object request failed for ${record.s3.bucket.name}/${record.s3.object.key} due to ${err}`);
  }
}