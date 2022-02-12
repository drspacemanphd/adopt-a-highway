import fetch from "node-fetch";
import litterParams from "./create-litter-service-params.js";
import nonlitterParams from "./create-nonlitter-service-params.js";
import inappropriateImageParams from "./create-inappropriate-service-params.js";

const env = process.env.ENV;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const sharePublicly = process.env.SHARE;
const domainType = process.env.DOMAIN;

// Feature Service Params
const outputType = "featureService";

async function generateToken() {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  params.append("referer", "awsamplify.com");

  const url = 'https://www.arcgis.com/sharing/rest/generateToken?f=json';

  return await fetch(url, {
    method: "POST",
    body: params,
  });
}

async function createService(token) {
  const url = new URL(
    `https://www.arcgis.com/sharing/rest/content/users/${username}/createService?token=${token}&f=json`
  );

  let createServerParameters;

  if (domainType.toLowerCase() === "litter") {
    createServerParameters = litterParams.getCreateServiceParams({ env });
  } else if (domainType.toLowerCase() === "nonlitter") {
    createServerParameters = nonlitterParams.getCreateServiceParams({ env });
  } else if (domainType.toLowerCase() === "inappropriate") {
    createServerParameters = inappropriateImageParams.getCreateServiceParams({ env });
  }

  const params = new URLSearchParams();
  params.append("createParameters", JSON.stringify(createServerParameters));
  params.append("outputType", outputType);
  params.append("isView", false);

  return await fetch(url, {
    method: "POST",
    body: params,
  });
}

async function createLayer(url) {
  let createLayerParameters;

  if (domainType.toLowerCase() === 'litter') {
    createLayerParameters = litterParams.getCreateLayerParams({ env });
  } else if (domainType.toLowerCase() === 'nonlitter') {
    createLayerParameters = nonlitterParams.getCreateLayerParams({ env });
  } else if (domainType.toLowerCase() === 'inappropriate') {
    createLayerParameters = inappropriateImageParams.getCreateLayerParams({ env });
  }  

  const params = new URLSearchParams();
  params.append("addToDefinition", JSON.stringify(createLayerParameters));
  return await fetch(url, {
    method: "POST",
    body: params,
  });
}

async function makePublic(url) {
  const params = new URLSearchParams();
  params.append("everyone", true);
  return await fetch(url, {
    method: "POST",
    body: params,
  });
}

let token;
let itemId;

generateToken()
  .then(res => {
    return res.json();
  })
  .then(json => {
    if (!json.token) throw new Error(JSON.stringify(json));
    token = json.token;
    return createService(token);
  })
  .then(res => {
    return res.json();
  })
  .then(json => {
    if (!json.serviceurl) throw new Error(JSON.stringify(json));
    console.log('SERVICE SUCCESSFULLY CREATED');

    const serviceUrl = json.serviceurl;
    itemId = json.itemId;

    const adminUrl = serviceUrl.replace(/\/arcgis\/rest\/services/, /\/arcgis\/rest\/admin\/services/);
    const addToDefinitionUrl = new URL(`${adminUrl}/addToDefinition?token=${token}&f=json`);
    return createLayer(addToDefinitionUrl);
  })
  .then(res => {
    return res.json();
  })
  .then(json => {
    if (!json.success) throw new Error(JSON.stringify(json));
    console.log('LAYER SUCCESSFULLY CREATED');

    const updateUrl = `https://www.arcgis.com/sharing/rest/content/users/${username}/items/${itemId}/share?f=json&token=${token}`;
    if (!sharePublicly) return;
    return makePublic(updateUrl)
      .then(res => {
        return res.json();
      })
      .then(json => {
        if (!Array.isArray(json.notSharedWith) || json.notSharedWith.length) throw new Error(JSON.stringify(json));
        console.log('LAYER SUCCESSFULLY SHARED');
      });
  })
  .catch((err) => {
    console.log(err);
  });
