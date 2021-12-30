import { S3 } from 'aws-sdk';
import { S3EventRecord, S3Event } from 'aws-lambda';
import * as _ from 'lodash';

const s3 = new S3({ region: process.env.REGION });

export const handler = async (event: S3Event) => {
  const [validFiles, invalidFiles]: [S3EventRecord[], S3EventRecord[]] = _.partition(event.Records || [], (record: S3EventRecord) => {
    return record.s3.object.key.endsWith('.jpg') || record.s3.object.key.endsWith('.jpeg') || record.s3.object.key.endsWith('.png');
  });

  if (invalidFiles.length) {
    invalidFiles.forEach((record: S3EventRecord) => {
      console.log(`Submission Handler - INFO - Attempting Invalid File Delete - ${record.s3.bucket.name}/${record.s3.object.key}`);
    });

    const deleteRequests = await s3.deleteObjects({
      // Get bucket from first record
      Bucket: invalidFiles[0].s3.bucket.name,
      Delete: {
        Objects: invalidFiles.map((record: S3EventRecord) => ({ Key: record.s3.object.key }))
      }
    }).promise();

    deleteRequests.Deleted.forEach((object: S3.DeletedObject) => {
      console.log(`Submission Handler - INFO - Successful Invalid File Delete - ${object.Key}`);
    });

    deleteRequests.Errors.forEach((err: S3.Error) => {
      console.log(`Submission Handler - ERROR - Failed Invalid File Delete - ${err.Key}, Error due to - ${err.Code}:${err.Message}`);
    });
  }
}