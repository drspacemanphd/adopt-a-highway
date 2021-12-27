import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { S3Event, S3EventRecord } from 'aws-lambda';

export const handler = async (event: S3Event ) => {
  console.log(`Handling ${event.Records?.length} records`);

  const service = new AWS.Rekognition({ region: 'us-east-1' });
  const requests = requestContentModerationAnalysis(event.Records, service);

  const settled = await Promise.allSettled(requests);

  const failedToAnalyze: { [key: number]: any } = {};
  const inappropriateContent: { [key: number]: any } = {};
  const imagesForFurtherAnalysis: { [key: number]: any } = {};

  settled.forEach((response: PromiseSettledResult<AWS.Rekognition.DetectModerationLabelsResponse & {
    $response: AWS.Response<AWS.Rekognition.DetectModerationLabelsResponse, AWS.AWSError>
  }>, index: number) => {
    if (response.status === 'rejected') {
      failedToAnalyze[index] = response
    } else if (response.value.ModerationLabels?.length) {
      inappropriateContent[index] = response
    } else {
      imagesForFurtherAnalysis[index] = response;
    }
  });



  return JSON.stringify({ body: 'bloop'});
}

const requestContentModerationAnalysis = (
  records: S3EventRecord[], service: AWS.Rekognition
): Array<Promise<PromiseResult<AWS.Rekognition.Types.DetectModerationLabelsResponse, AWS.AWSError>>> => {
  return records.map(async (record: S3EventRecord) => {
    const image: AWS.Rekognition.Image = {
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