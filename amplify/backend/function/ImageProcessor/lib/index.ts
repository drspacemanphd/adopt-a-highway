import { S3, SSM, Rekognition, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import axios from 'axios';

const REGION = process.env.REGION;
const FLAGGED_SUBMISSIONS_BUCKET = process.env.FLAGGED_SUBMISSIONS_BUCKET;
const REJECTED_SUBMISSIONS_BUCKET = process.env.REJECTED_SUBMISSIONS_BUCKET;
const LITTER_FEATURE_LAYER_URL = process.env.LITTER_FEATURE_LAYER_URL;
const LITTERLESS_FEATURE_LAYER_URL = process.env.LITTERLESS_FEATURE_LAYER_URL;
const INAPPROPRIATE_FEATURE_LAYER_URL = process.env.INAPPROPRIATE_FEATURE_LAYER_URL;

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

let token;

// Design in case of multiple images, knowing max records length is 1 per Cloudformation config
export const handler = async (event: SQSEvent) => {
  console.log(`Handling ${event.Records?.length} records`);

  const { images, invalidMessages } = await partitionImages(event.Records);
  logInvalidMessages(invalidMessages);

  if (!images.length) {
    console.log('Image Processor - no valid images');
    return JSON.stringify({ body: 'done'});
  }

  token = await getArcgisToken();

  const unflaggedImages: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}> = await handleContentModerationAnalysis(images);
  
  if (!unflaggedImages.length) {
    console.log('Image Processor - no images pass content moderation');
    return JSON.stringify({ body: 'done'});
  }

  const imagesWithLitter: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }> = await handleImageLabelAnalysis(unflaggedImages);

  imagesWithLitter.forEach((image) => console.log(JSON.stringify(image.response.value.Labels)));

  if (!imagesWithLitter.length) {
    console.log('Image Processor - no images pass label analysis');
    return JSON.stringify({ body: 'done'});
  }

  const res = await saveLitterImageDataToLayer(imagesWithLitter, token);

  if (!res.data || !Array.isArray(res.data.addResults) || (res.data.addResults as any[]).filter(result => !result.success).length) {
    throw new Error(JSON.stringify(res.data));
  }
};

const partitionImages = async (messages: SQSRecord[]) => {
  const images: { bucket: string, key: string, metadata: any }[] = [];
  const invalidMessages: SQSRecord[] = [];
  
  const requests = messages.map(async (message: SQSRecord) => {
    const body = JSON.parse(message.body);
    const bucket = body.Bucket;
    const key = body.Key;

    // Do this for 2 reasons:
    // 1. Need metadata for use in layer
    // 2. In future, function may analyze multiple images
    // It may throw an error but have some images succeed
    // Check if images are still there so we don't fail on retries
    const head = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return { bucket, key, metadata: head.Metadata };
  });

  const settled = await Promise.allSettled(requests);

  settled.forEach((response, index) => {
    if (response.status === 'rejected') {
      invalidMessages.push(messages[index]);
    } else {
      images.push(response.value);
    }
  });

  return { images, invalidMessages };
};

const logInvalidMessages = (messages: SQSRecord[]) => {
  messages.forEach((message: SQSRecord) => {
    console.error(`Image Processor - Invalid Message - ${message.messageId}, Could Not Parse - ${message.body}`);
  });
};

const handleContentModerationAnalysis = async (records: { bucket: string, key: string, metadata: any }[]): Promise<Array<{ record:  { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}>> => {
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

const handleImageLabelAnalysis = async (images: Array<{ record:  { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}>): Promise<Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>> => {
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
  records: { bucket: string, key: string }[]
): Array<Promise<PromiseResult<Rekognition.Types.DetectModerationLabelsResponse, AWSError>>> => {
  return records.map(async (record) => {   
    const image: Rekognition.Image = {
      S3Object: {
        Bucket: record.bucket,
        Name: record.key
      }
    };

    return rekognition.detectModerationLabels({
      Image: image,
      MinConfidence: 50,
    }).promise();
  });
};

const handleContentModerationRequestFailures = async (failures: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseRejectedResult }>) => {
  const processedFailures = failures.map((failed) => processFailedRequest(failed.record, failed.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedFailures);
};

const handleInappropriateContent = async (content: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>}>) => {
  const processedInappropriateContent = content.map((response) => processInappropriateImage(response.record, response.response));

  const responses = await Promise.allSettled(processedInappropriateContent);

  const failed = responses.filter(response => response.status === 'rejected');

  if (failed.length) {
    throw new Error('Image Processor - At least one inappropriate image could not be delivered to queue');
  }
};

const processFailedRequest = async (
  record: { bucket: string, key: string, metadata: any },
  failed: PromiseRejectedResult
) => {
  console.warn(`Image Processor - Rekognition request failed for ${record.bucket}/${record.key} due to ${failed.reason}`);

  try {
    await s3.deleteObject({ Bucket: record.bucket, Key: record.key }).promise();
    console.log(`Image Processor - Successfully deleted: ${record.bucket}/${record.key}`);
  } catch (err) {
    // No need to retry
    console.warn(`Image Processor - Delete object request failed for ${record.bucket}/${record.key} due to ${err}`);
  }
};

const processInappropriateImage = async (
  record: { bucket: string, key: string, metadata: any },
  inappropriate: PromiseFulfilledResult<Rekognition.Types.DetectModerationLabelsResponse>
) => {
  console.warn(`Image Processor - Rekognition request reported the following inappropriate content for ${record.bucket}/${record.key} due to ${JSON.stringify(inappropriate.value.ModerationLabels)}`);

  try {
    await s3.copyObject({
      CopySource: `${record.bucket}/${record.key}`,
      Bucket: FLAGGED_SUBMISSIONS_BUCKET,
      Key: record.key
    }).promise();
    console.log(`Image Processor - Successfully copied: ${record.bucket}/${record.key} to ${FLAGGED_SUBMISSIONS_BUCKET}`);
  } catch (err) {
    console.error(`Image Processor - Copied object request failed for ${record.bucket}/${record.key} due to ${err}`);
    throw err;
  }

  try {
    const res = await saveFlaggedImageDataToLayer([
      {
        record: { bucket: FLAGGED_SUBMISSIONS_BUCKET, key: record.key, metadata: record.metadata },
        response: inappropriate
      },
    ], token);

    if (!res.data || !Array.isArray(res.data.addResults) || (res.data.addResults as any[]).filter(result => !result.success).length) {
      throw new Error(JSON.stringify(res.data));
    }

    console.log(`Image Processor - Successfully saved to inappropriate image to layer: ${FLAGGED_SUBMISSIONS_BUCKET}/${record.key}`);

  } catch (err) {
    console.error(`Image Processor - Saving inappropriate image to layer failed for ${record.bucket}/${record.key} due to ${err}`);
    throw err;
  }

  try {
    await s3.deleteObject({ Bucket: record.bucket, Key: record.key }).promise();
    console.log(`Image Processor - Successfully deleted: ${record.bucket}/${record.key}`);
  } catch (err) {
    // Not worth a retry
    console.warn(`Image Processor - Delete object request failed for ${record.bucket}/${record.key} due to ${err}`);
  }
};

const processImageContent = async (record: { bucket: string, key: string }) => {
  return rekognition.detectLabels({
    Image: {
      S3Object: {
        Bucket: record.bucket,
        Name: record.key
      }
    },
    MaxLabels: 30,
    MinConfidence: 35
  }).promise();
};

const isAtLeastOneLabelLitterPresent = (labels: Rekognition.Labels) => {
  return labels.filter((label: Rekognition.Label) => TRASH_RELATED_LABELS.includes(label.Name.toLowerCase())).length;
};

const handleLabelDetectionRequestFailures = async (failures: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseRejectedResult }>) => {
  const processedFailures = failures.map((failed) => processFailedRequest(failed.record, failed.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedFailures);
};

const handleLitterlessImages = async (literless: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>) => {
  const processedLiterlessImages = literless.map((image) => processLitterlessImage(image.record, image.response));

  // Simply log failures, no need for a retry
  await Promise.allSettled(processedLiterlessImages);
};

const processLitterlessImage = async (
  record: { bucket: string, key: string, metadata: any },
  literless: PromiseFulfilledResult<Rekognition.DetectLabelsResponse>
) => {
  console.warn(`Image Processor - Rekognition reported that ${record.bucket}/${record.key} did not contain litter and instead contained ${JSON.stringify(literless.value.Labels)}`);

  try {
    await s3.copyObject({
      CopySource: `${record.bucket}/${record.key}`,
      Bucket: REJECTED_SUBMISSIONS_BUCKET,
      Key: record.key
    }).promise();
    console.log(`Image Processor - Successfully copied: ${record.bucket}/${record.key} to ${REJECTED_SUBMISSIONS_BUCKET}`);
  } catch (err) {
    console.error(`Image Processor - Copied object request failed for ${record.bucket}/${record.key} due to ${err}`);
    throw err;
  }

  try {
    const res = await saveLitterlessImageDataToLayer([
      {
        record: { bucket: REJECTED_SUBMISSIONS_BUCKET, key: record.key, metadata: record.metadata },
        response: literless
      },
    ], token);

    if (!res.data || !Array.isArray(res.data.addResults) || (res.data.addResults as any[]).filter(result => !result.success).length) {
      throw new Error(JSON.stringify(res.data));
    }

    console.log(`Image Processor - Successfully saved literless image to layer: ${REJECTED_SUBMISSIONS_BUCKET}/${record.key}`);

  } catch (err) {
    console.error(`Image Processor - Saving literless image to layer failed for ${record.bucket}/${record.key} due to ${err}`);
    throw err;
  }

  try {
    await s3.deleteObject({ Bucket: record.bucket, Key: record.key }).promise();
    console.log(`Image Processor - Successfully deleted: ${record.bucket}/${record.key}`);
  } catch (err) {
    // Not worth a retry
    console.warn(`Image Processor - Delete object request failed for ${record.bucket}/${record.key} due to ${err}`);
  }
};

const getArcgisToken = async () => {
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

  if (!res?.data?.token) {
    throw new Error(`Image Processor - Could not obtain token`);
  }

  return res.data.token;
};

const saveLitterImageDataToLayer = async (imageData: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>, token: string) => {
  const features = imageData.map(image => {
    const litterLabels = image.response.value.Labels.filter(label => TRASH_RELATED_LABELS.includes(label.Name.toLowerCase()));
  
    return {
      attributes: {
        GUID: image.record.metadata?.guid || '{11111111-1111-1111-1111-111111111111}',
        USER_GUID: image.record.metadata?.userguid || '{11111111-1111-1111-1111-111111111111}',
        IMAGE_KEY: image.record.key,
        SUBMIT_DATE: new Date().toISOString(),
        RAW_ANALYSIS: JSON.stringify(image.response.value.Labels),
        CLASSIFICATION_FIRST: litterLabels[0]?.Name,
        MODEL_CONFIDENCE_FIRST: litterLabels[0]?.Confidence,
        CLASSIFICATION_SECOND: litterLabels[1]?.Name,
        MODEL_CONFIDENCE_SECOND: litterLabels[1]?.Confidence,
        CLASSIFICATION_THIRD: litterLabels[2]?.Name,
        MODEL_CONFIDENCE_THIRD: litterLabels[2]?.Confidence
      },
      geometry: {
        x: image.record.metadata?.longitude,
        y: image.record.metadata?.latitude,
      },
    };
  });

  const params = new URLSearchParams();
  params.append('features', JSON.stringify(features));
  params.append('rollbackOnFailure', true as any);
  params.append('f', 'json');

  const res = await axios.post(`${LITTER_FEATURE_LAYER_URL}/addFeatures?token=${token}&f=json`, params);

  console.log(`Image Processor - Received response when saving litter record: ${JSON.stringify(res.data)}`);

  return res;
};

const saveFlaggedImageDataToLayer = async (imageData: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.DetectModerationLabelsResponse> }>, token: string) => {
  const features = imageData.map(image => {
    return {
      attributes: {
        GUID: image.record.metadata?.guid || '{11111111-1111-1111-1111-111111111111}',
        USER_GUID: image.record.metadata?.userguid || '{11111111-1111-1111-1111-111111111111}',
        IMAGE_KEY: image.record.key,
        SUBMIT_DATE: new Date().toISOString(),
        RAW_ANALYSIS: JSON.stringify(image.response.value.ModerationLabels),
      },
      geometry: {
        x: image.record.metadata?.longitude,
        y: image.record.metadata?.latitude,
      },
    };
  });

  const params = new URLSearchParams();
  params.append('features', JSON.stringify(features));
  params.append('rollbackOnFailure', true as any);
  params.append('f', 'json');

  const res = await axios.post(`${INAPPROPRIATE_FEATURE_LAYER_URL}/addFeatures?token=${token}&f=json`, params);

  console.log(`Image Processor - Received response when saving inappropriate image record: ${JSON.stringify(res.data)}`);

  return res;
};

const saveLitterlessImageDataToLayer = async (imageData: Array<{ record: { bucket: string, key: string, metadata: any }, response: PromiseFulfilledResult<Rekognition.DetectLabelsResponse> }>, token: string) => {
  const features = imageData.map(image => {
    return {
      attributes: {
        GUID: image.record.metadata?.guid || '{11111111-1111-1111-1111-111111111111}',
        USER_GUID: image.record.metadata?.userguid || '{11111111-1111-1111-1111-111111111111}',
        IMAGE_KEY: image.record.key,
        SUBMIT_DATE: new Date().toISOString(),
        RAW_ANALYSIS: JSON.stringify(image.response.value.Labels),
      },
      geometry: {
        x: image.record.metadata?.longitude,
        y: image.record.metadata?.latitude,
      },
    };
  });

  const params = new URLSearchParams();
  params.append('features', JSON.stringify(features));
  params.append('rollbackOnFailure', true as any);
  params.append('f', 'json');

  const res = await axios.post(`${LITTERLESS_FEATURE_LAYER_URL}/addFeatures?token=${token}&f=json`, params);

  console.log(`Image Processor - Received response when saving litterless record: ${JSON.stringify(res.data)}`);

  return res;
};