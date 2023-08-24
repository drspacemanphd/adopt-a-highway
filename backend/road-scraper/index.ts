import axios from 'axios';
import * as _ from 'lodash';
import { SSM } from 'aws-sdk';
import { RoadFeature } from './road-feature';

const REGION = process.env.REGION;
const ROADS_SOURCE_LAYER_QUERY_URL = process.env.ROADS_SOURCE_LAYER_QUERY_URL;
const GROUPS_SOURCE_LAYER_QUERY_URL = process.env.GROUPS_SOURCE_LAYER_QUERY_URL;
const JOIN_SOURCE_LAYER_QUERY_URL = process.env.JOIN_SOURCE_LAYER_QUERY_URL;
const APP_SOURCE_LAYER_URL = process.env.APP_SOURCE_LAYER_URL;

const ssm = new SSM({ region: REGION });

export const handler = async () => {
  const token = await getArcgisToken();

  const features = await Promise.allSettled([
    pageAllFeatures(`${ROADS_SOURCE_LAYER_QUERY_URL}/query`, { pageSize: 500, offset: 0 }),
    pageAllFeatures(`${GROUPS_SOURCE_LAYER_QUERY_URL}/query`, { pageSize: 500, offset: 0 }),
    pageAllFeatures(`${JOIN_SOURCE_LAYER_QUERY_URL}/query`, { pageSize: 500, offset: 0 }),
    pageAllFeatures(`${APP_SOURCE_LAYER_URL}/query`, { pageSize: 500, offset: 0, token })
  ]);

  const rejected = features.filter(f => f.status === 'rejected');

  if (rejected.length) {
    console.error(`Road Scraper - Error when scraping features: ${JSON.stringify(rejected)}`);
  }

  // Generate Map of Source Road Features key'd to the RoadID
  const sourceRoadsFeatureMap = ((features[0] as PromiseFulfilledResult<any>).value as any[]).reduce((acc, feature) => {
    if (feature.attributes?.RoadID && !acc[feature.attributes.RoadID]) {
      acc[feature.attributes.RoadID] = feature;
    }
    return acc;
  }, {});

  // Generate Map of Source Group Features key'd to the RoadID
  const sourceGroupsFeatureMap = ((features[1] as PromiseFulfilledResult<any>).value as any[]).reduce((acc, feature) => {
    if (feature.attributes?.GlobalID && !acc[feature.attributes.GlobalID]) {
      acc[feature.attributes.GlobalID] = feature;
    }
    return acc;
  }, {});

  // Append the UUIDs of adoptees for a given road from the join layer
  ((features[2] as PromiseFulfilledResult<any>).value as any[]).forEach(feature => {
    try {
      if (!feature.attributes.RoadID || !sourceRoadsFeatureMap[feature.attributes.RoadID]) {
        return;
      } else if (sourceRoadsFeatureMap[feature.attributes.RoadID].attributes._Groups) {
        sourceRoadsFeatureMap[feature.attributes.RoadID].attributes._Groups.push(feature.attributes.GlobalID);
      } else {
        sourceRoadsFeatureMap[feature.attributes.RoadID].attributes._Groups = [feature.attributes.GlobalID];
      }
    } catch (err) {
      console.error(`FAILED APPENDING UUIDS FOR: ${JSON.stringify(feature)}`);
      console.error(`FAILED DUE TO ${err.message}`);
      throw err;
    }
  });

  // Sub in UUIDs of adoptees for groups from group layer
  Object.values(sourceRoadsFeatureMap).forEach((feature: Record<string, any>) => {
    try {
      if (!feature.attributes?._Groups) {
        feature.attributes._Groups = [];
      } else {
        feature.attributes._Groups = feature.attributes._Groups.map(group => sourceGroupsFeatureMap[group]);
      }
    } catch (err) {
      console.error(`FAILED SUBBING UUIDS FOR: ${JSON.stringify(feature)}`);
      console.error(`FAILED DUE TO ${err.message}`);
      throw err;
    }
  });
  
  // Prep currently saved roads features for diff'ing
  const savedRoadsFeatureMap = ((features[3] as PromiseFulfilledResult<any>).value as any[]).reduce((acc, feature) => {
    if (feature?.attributes?.RoadID) {
      acc[feature.attributes.RoadID] = feature;
    }
    return acc;
  }, {});

  const featuresToAdd = getAdds(sourceRoadsFeatureMap, savedRoadsFeatureMap);
  const featuresToUpdate = getUpdates(sourceRoadsFeatureMap, savedRoadsFeatureMap);
  const objectIdsToDelete = getDeletes(sourceRoadsFeatureMap, savedRoadsFeatureMap);

  await applyEdits(featuresToAdd, featuresToUpdate, objectIdsToDelete, token);

  console.log(`FEATURES ADDED: ${featuresToAdd.length}`);
  console.log(`FEATURES UPDATED: ${featuresToUpdate.length}`);
  console.log(`FEATURES DELETED: ${objectIdsToDelete.length}`);

  return 'success';
};

const pageAllFeatures = async (featureLayerUrl, { pageSize = 500, offset = 0, token = undefined }, features = []) => {
  const params: Record<string, any> = {
    where: '1=1',
    outFields: '*',
    resultOffset: offset,
    resultRecordCount: pageSize,
    returnGeometry: true,
    f: 'json'
  };

  if (token) {
    params.token = token;
  }

  try {
    const res = await axios.get(featureLayerUrl, { params });

    if (!Array.isArray(res.data?.features) || res.data.features.length === 0) {
      return features;
    }

    features = features.concat(res.data.features);

    return pageAllFeatures(featureLayerUrl, { pageSize, offset: offset + res.data.features.length, token }, features);
  } catch (err) {
    console.error(`Road Scraper - Error when scraping ${featureLayerUrl} with params ${JSON.stringify(params)}: ${JSON.stringify(err)}`);
  }
};

const createFeatureFromSource = (
  sourceFeature,
  { keepObjectIds = false } = {}
) => {
  try {
    const geometry = sourceFeature.geometry;
    const attributes: Record<string, any> = {};

    if (keepObjectIds) {
      attributes.OBJECTID = sourceFeature.attributes.OBJECTID;
    }
  
    attributes.RoadID = sourceFeature.attributes.RoadID;
    attributes.Adoptable = sourceFeature.attributes.Adoptable;
    attributes.StateRoadID = sourceFeature.attributes.StateRoadID;
    attributes.RdwayName = sourceFeature.attributes.RdwayName;
    attributes.Shape__Length = sourceFeature.attributes.Shape__Length;
    attributes.TextCounty = sourceFeature.attributes.TextCounty;
    attributes.Miles = sourceFeature.attributes.Miles;
    attributes.CountyFull = sourceFeature.attributes.CountyFull;

    attributes.GroupIdOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.GlobalID', null);
    attributes.GroupNameOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.GroupName', null);
    attributes.SignDisplayGroupNameOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.SignDisplayGroupName', null);
    attributes.GroupAddressOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.GroupAddress', null);
    attributes.ContactNameOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.ContactName', null);
    attributes.AltContactNameOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.AltContactName', null);
    attributes.ContactEmailOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.ContactEmail', null);
    attributes.AltContactEmailOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.AltContactEmail', null);
    attributes.FromRoadOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.FromRoad', null);
    attributes.ToRoadOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.ToRoad', null);
    attributes.RoadLengthOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.RoadLength', null);
    attributes.LastCleanupOne = _.get(sourceFeature.attributes, '_Groups[0].attributes.LastCleanup', null);

    attributes.GroupIdTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.GlobalID', null);
    attributes.GroupNameTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.GroupName', null);
    attributes.SignDisplayGroupNameTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.SignDisplayGroupName', null);
    attributes.GroupAddressTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.GroupAddress', null);
    attributes.ContactNameTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.ContactName', null);
    attributes.AltContactNameTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.AltContactName', null);
    attributes.ContactEmailTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.ContactEmail', null);
    attributes.AltContactEmailTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.AltContactEmail', null);
    attributes.FromRoadTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.FromRoad', null);
    attributes.ToRoadTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.ToRoad', null);
    attributes.RoadLengthTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.RoadLength', null);
    attributes.LastCleanupTwo = _.get(sourceFeature.attributes, '_Groups[1].attributes.LastCleanup', null);

    attributes.GroupIdThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.GlobalID', null);
    attributes.GroupNameThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.GroupName', null);
    attributes.SignDisplayGroupNameThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.SignDisplayGroupName', null);
    attributes.GroupAddressThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.GroupAddress', null);
    attributes.ContactNameThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.ContactName', null);
    attributes.AltContactNameThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.AltContactName', null);
    attributes.ContactEmailThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.ContactEmail', null);
    attributes.AltContactEmailThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.AltContactEmail', null);
    attributes.FromRoadThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.FromRoad', null);
    attributes.ToRoadThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.ToRoad', null);
    attributes.RoadLengthThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.RoadLength', null);
    attributes.LastCleanupThree = _.get(sourceFeature.attributes, '_Groups[2].attributes.LastCleanup', null);
  
    if (attributes._Groups) {
      delete attributes._Groups;
    }
  
    return RoadFeature.builder().geometry(geometry).attributes(attributes).build();
  } catch (err) {
    console.error(`FAILED UPDATING DEST FEATURE FROM SOURCE ${JSON.stringify(sourceFeature)}`);
    console.error(`FAILED DUE TO ${err.message}`);
    throw err;
  }
};

const getAdds = (sourceMap, currentMap) => {
  const roadIdsToAdd = Object.keys(sourceMap).filter(roadId => !currentMap[roadId]);
  return roadIdsToAdd.map(roadId => createFeatureFromSource(sourceMap[roadId]));
};

const getUpdates = (sourceMap, currentMap) => {
  const potentialRoadIdsToUpdate = Object.keys(sourceMap).filter(roadId => !!currentMap[roadId]);
  const potentialUpdates = potentialRoadIdsToUpdate.map(roadId => createFeatureFromSource(sourceMap[roadId]));

  const actualUpdates = potentialUpdates.filter(feature => {
    const savedFeature = currentMap[feature.attributes.RoadID];

    // Temporarily delete OBJECTID, as we are comparing entries from source layer and target layer
    const OBJECTID = savedFeature.attributes.OBJECTID;
    delete savedFeature.attributes.OBJECTID;

    // Temporarily delete autogenerated GlobalID, as we are comparing entries from source layer and target layer
    const GlobalID = savedFeature.attributes.GlobalID;
    delete savedFeature.attributes.GlobalID;

    // Temporarily set Shape__Length, as it can differ very slightly on different query executions
    const Shape__Length = savedFeature.attributes.Shape__Length;
    savedFeature.attributes.Shape__Length = feature.attributes.Shape__Length;

    const isEqual = _.isEqual(feature, savedFeature);

    // Reset
    savedFeature.attributes.OBJECTID = OBJECTID;
    savedFeature.attributes.GlobalID = GlobalID;
    savedFeature.attributes.Shape__Length = Shape__Length;

    return !isEqual;
  });

  // Reset OBJECTIDs so that proper updates occur
  actualUpdates.forEach(feature => {
    feature.attributes.OBJECTID = currentMap[feature.attributes.RoadID].OBJECTID;
  });

  return actualUpdates;
};

const getDeletes = (sourceMap, currentMap) => {
  const roadIdsToDelete = Object.keys(currentMap).filter(roadId => !sourceMap[roadId]);
  return roadIdsToDelete.map(roadId => currentMap[roadId].OBJECTID);
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

const applyEdits = async (adds, updates, deletes, token) => {
  const chunkedAdds = _.chunk(adds, 1000);
  const chunkedUpdates = _.chunk(updates, 1000);
  const chunkedDeletes = _.chunk(deletes, 1000);

  for (let i = 0; i < chunkedAdds.length; i++) {
    const applyEditsParams = new URLSearchParams();
    applyEditsParams.append('adds', JSON.stringify(chunkedAdds[i]));
    applyEditsParams.append('token', token);
    applyEditsParams.append('f', 'json');

    const res = await axios.post(
      `${APP_SOURCE_LAYER_URL}/applyEdits`,
      applyEditsParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  
    if (!res.status.toString().startsWith('2') || res.data.error) {
      throw new Error(JSON.stringify(res.data));
    }

    const addErrors = (res.data.addResults || []).filter(a => !a.success);
    if (addErrors.length) {
      console.error(JSON.stringify(addErrors));
      throw new Error(`SOME ADD RESULTS OPERATIONS WERE NOT SUCCESSFUL`);
    }
  }

  for (let i = 0; i < chunkedUpdates.length; i++) {
    const applyEditsParams = new URLSearchParams();
    applyEditsParams.append('updates', JSON.stringify(chunkedUpdates[i]));
    applyEditsParams.append('token', token);
    applyEditsParams.append('f', 'json');

    const res = await axios.post(
      `${APP_SOURCE_LAYER_URL}/applyEdits`,
      applyEditsParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  
    if (!res.status.toString().startsWith('2') || res.data.error) {
      throw new Error(JSON.stringify(res.data));
    }

    const updateErrors = (res.data.updateResults || []).filter(a => !a.success);
    if (updateErrors.length) {
      console.error(JSON.stringify(updateErrors));
      throw new Error(`SOME UPDATE RESULTS OPERATIONS WERE NOT SUCCESSFUL`);
    }
  }

  for (let i = 0; i < chunkedDeletes.length; i++) {
    const applyEditsParams = new URLSearchParams();
    applyEditsParams.append('deletes', JSON.stringify(chunkedDeletes[i]));
    applyEditsParams.append('token', token);
    applyEditsParams.append('f', 'json');

    const res = await axios.post(
      `${APP_SOURCE_LAYER_URL}/applyEdits`,
      applyEditsParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  
    if (!res.status.toString().startsWith('2') || res.data.error) {
      throw new Error(JSON.stringify(res.data));
    }

    const deleteErrors = (res.data.deleteResults || []).filter(a => !a.success);
    if (deleteErrors.length) {
      console.error(JSON.stringify(deleteErrors));
      throw new Error(`SOME DELETE RESULTS OPERATIONS WERE NOT SUCCESSFUL`);
    }
  }
};
