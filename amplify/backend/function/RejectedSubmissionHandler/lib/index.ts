import * as _ from 'lodash';
import { S3 } from 'aws-sdk';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const s3 = new S3({ region: process.env.REGION });

console.log(process.env.REGION);
console.log(process.env.REGION);

export const handler = async (event: SQSEvent) => {
  console.log(`Handling ${event.Records?.length} records`);

  const [validMessages, invalidMessages]: [SQSRecord[], SQSRecord[]] = partitionValidMessages(event.Records);
  
  handleInvalidMessages(invalidMessages);

  const copiedFlaggedContent = validMessages.map((message) => processRejectedImage(message));
  const settledCopyOps = await Promise.allSettled(copiedFlaggedContent);
  const rejectedCopyOps = settledCopyOps.filter(res => res.status === 'rejected');

  if (rejectedCopyOps.length) {
    throw new Error('At least one copy request was rejected');
  }

  const cleaned = validMessages.map((message) => cleanup(message));
  await Promise.allSettled(cleaned);

  return JSON.stringify({ body: 'reject content successfully handled'});
};

const partitionValidMessages = (messages: SQSRecord[]) => {
  return _.partition(messages, (message: SQSRecord) => {
    try {
      const body = JSON.parse(message.body);
      return typeof body.Bucket === 'string' && typeof body.Key === 'string' && body.Labels;
    } catch (err) {
      return false;
    }
  });
};

const handleInvalidMessages = (messages: SQSRecord[]) => {
  messages.forEach((message: SQSRecord) => {
    console.error(`Rejected Submission Handler - Invalid Message - ${message.messageId}, Could Not Parse - ${message.body}`);
  });
};

const processRejectedImage = async (
  record: SQSRecord,
) => {
  const { Bucket, Key, Labels } = JSON.parse(record.body);
  console.warn(`Rejected Submission Handler - Rekognition request reported the following labels for ${Bucket}/${Key}: ${JSON.stringify(Labels)}`);

  try {
    await s3.copyObject({
      CopySource: `${Bucket}/${Key}`,
      Bucket: process.env.REJECTED_SUBMISSIONS_BUCKET,
      Key
    }).promise();
    console.log(`Rejected Submission Handler - Successfully copied: ${Bucket}/${Key} to ${process.env.REJECTED_SUBMISSIONS_BUCKET}`);
  } catch (err) {
    console.error(`Rejected Submission Handler - Copied object request failed for ${Bucket}/${Key} due to ${err}`);
    throw err;
  }
};

const cleanup = async (
  record: SQSRecord,
) => {
  const { Bucket, Key } = JSON.parse(record.body);

  try {
    await s3.deleteObject({ Bucket, Key }).promise();
    console.log(`Rejected Submission Handler - Successfully deleted: ${Bucket}/${Key}`);
  } catch (err) {
    console.warn(`Rejected Submission Handler - Delete object request failed for ${Bucket}/${Key} due to ${err}`);
  }
};