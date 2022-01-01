import { S3, SQS } from 'aws-sdk';
import { S3EventRecord, S3Event } from 'aws-lambda';
import * as _ from 'lodash';

const s3 = new S3({ region: process.env.REGION });
const sqs = new SQS({ region: process.env.REGION });

export const handler = async (event: S3Event) => {
  const [validFiles, invalidFiles]: [S3EventRecord[], S3EventRecord[]] = _.partition(event.Records || [], (record: S3EventRecord) => {
    return record.s3.object.key.toLowerCase().endsWith('.jpg') || 
    record.s3.object.key.toLowerCase().endsWith('.jpeg') || 
    record.s3.object.key.toLowerCase().endsWith('.png');
  });

  if (invalidFiles.length) {
    await deleteFiles(invalidFiles);
  }

  if (validFiles.length) {
    await handleValidFiles(validFiles);
  }
}

const deleteFiles = async (files: S3EventRecord[]) => {
  if (!files.length) return;

  files.forEach((record: S3EventRecord) => {
    console.log(`Submission Handler - Attempting File Delete - ${record.s3.bucket.name}/${record.s3.object.key}`);
  });

  const deleteRequests = await s3.deleteObjects({
    // Get bucket from first record
    Bucket: files[0].s3.bucket.name,
    Delete: {
      Objects: files.map((record: S3EventRecord) => ({ Key: record.s3.object.key }))
    }
  }).promise();

  deleteRequests.Deleted.forEach((object: S3.DeletedObject) => {
    console.log(`Submission Handler - Successful File Delete - ${object.Key}`);
  });

  deleteRequests.Errors.forEach((err: S3.Error) => {
    console.warn(`Submission Handler - Failed File Delete - ${err.Key}, Error due to - ${err.Code}:${err.Message}`);
  });
}

const handleValidFiles = async (validFiles: S3EventRecord[]) => {
  const messages: SQS.SendMessageBatchRequestEntryList = validFiles.map((record: S3EventRecord) => ({
    Id: record.s3.object.key.replace(/\..*/g, ''),
    MessageBody: JSON.stringify({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key
    })
  }));

  const response = await sqs.sendMessageBatch({ Entries: messages, QueueUrl: process.env.SQS_QUEUE_URL }).promise();

  response.Successful.forEach((success: SQS.SendMessageBatchResultEntry) => {
    console.log(`Submission Handler - Successful Valid File Enqueue - ${success.Id}`)
  });

  if (response.Failed.length) {
    response.Failed.forEach((failed: SQS.BatchResultErrorEntry) => {
      console.error(`Submission Handler - Failed Valid File Enqueue - ${failed.Id}, Error due to - ${failed.Code}:${failed.Message}`)
    });
  
    const failedIds = response.Failed.map((failed: SQS.BatchResultErrorEntry) => failed.Id);
    const filesToDelete = validFiles.filter((file: S3EventRecord) => failedIds.includes(file.s3.object.key.replace(/\..*/g, '')));
    await deleteFiles(filesToDelete);
  }
}