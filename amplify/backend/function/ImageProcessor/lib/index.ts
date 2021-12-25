import { S3Event, S3EventRecord } from 'aws-lambda';

export const handler = async (event: S3Event ) => {
  console.log(`Handling ${event.Records?.length} records`);
  event.Records.forEach((record: S3EventRecord ) => {
    console.log(JSON.stringify(record));
  });
  return JSON.stringify({ body: 'bloop'});
}