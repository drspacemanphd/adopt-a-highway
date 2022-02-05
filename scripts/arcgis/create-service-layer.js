import fetch from "node-fetch";

const env = process.env.ENV;
const username = process.env.USERNAME;
const token = process.env.TOKEN;

// Feature Service Params
const createServerParameters = {
  name: `adopt-a-highway-de-${env}`,
  serviceDescription: `The feature service for storing images and location data for Adopt a Highway app (environment ${env})`,
  hasStaticData: false,
  supportedQueryFormats: "JSON",
  capabilities: "Create,Delete,Query,Update,Extract,Sync",
  description: `The feature service for storing images and location data for Adopt a Highway app (environment ${env})`,
  copyrightText: "",
  spatialReference: {
    wkid: 4326,
    latestWkid: 4326
  },
  initialExtent: {
    min: -76.4592863,
    ymin: 37.6812292,
    xmax: -74.4891919,
    ymax: 40.1962863,
    spatialReference: {
      wkid: 4326,
      latestWkid: 4326
    },
  },
  allowGeometryUpdates: true,
  units: "esriMeters",
  xssPreventionInfo: {
    xssPreventionEnabled: true,
    xssPreventionRule: "input",
    xssInputRule: "rejectInvalid",
  },
};

const f = "json";

const outputType = "featureService";

// Feature Layer Params
const createLayerParameters = {
  layers: [
    {
      // adminLayerInfo: {
      //   tableName: "db_10.user_10.LOADTESTSOIL_LOADTESTSOIL",
      //   geometryField: { name: "Shape" },
      //   xssTrustedFields: "",
      // },
      id: 0,
      name: "Litter Reports",
      type: "Feature Layer",
      displayField: "",
      description: "Submissions of litter",
      copyrightText: "",
      defaultVisibility: true,
      ownershipBasedAccessControlForFeatures: {
        allowOthersToQuery: true,
        allowOthersToDelete: false,
        allowOthersToUpdate: false,
      },
      // editFieldsInfo: {
      //   creationDateField: "CreationDate",
      //   creatorField: "Creator",
      //   editDateField: "EditDate",
      //   editorField: "Editor",
      // },
      // editingInfo: {
      //   lastEditDate: 1455126059440,
      // },
      relationships: [],
      isDataVersioned: false,
      supportsCalculate: true,
      supportsAttachmentsByUploadId: true,
      // supportsRollbackOnFailureParameter: true,
      supportsStatistics: true,
      supportsAdvancedQueries: true,
      supportsValidateSql: true,
      supportsCoordinatesQuantization: true,
      // supportsApplyEditsWithGlobalIds: true,
      advancedQueryCapabilities: {
        supportsPagination: true,
        supportsQueryWithDistance: true,
        supportsReturningQueryExtent: true,
        supportsStatistics: true,
        supportsOrderBy: true,
        supportsDistinct: true,
        supportsQueryWithResultType: true,
        supportsSqlExpression: true,
        supportsReturningGeometryCentroid: false,
      },
      useStandardizedQueries: false,
      geometryType: "esriGeometryPoint",
      minScale: 0,
      maxScale: 0,
      extent: {
        xmin: -75.769633,
        ymin: 38.4493882,
        xmax: -75.0514783,
        ymax: 39.832812,
        spatialReference: {
          wkid: 4326,
          latestWkid: 4326
        },
      },
      drawingInfo: {
        renderer: {
          type: "simple",
          symbol: {
            type: "esriSMS",
            style: "esriSMSCircle",
            color: [255, 0, 0, 255],
            size: 4,
            outline: {
              type: "esriSLS",
              style: "esriSLSSolid",
              color: [0, 0, 0, 255],
              width: 1,
            },
          },
        },
        transparency: 0,
        labelingInfo: null, // EXPAND HERE!!
      },
      allowGeometryUpdates: true,
      hasAttachments: true,
      // htmlPopupType: "esriServerHTMLPopupTypeNone",
      hasM: false,
      hasZ: false,
      objectIdField: "FIOBJECTIDD",
      // globalIdField: "GLOBALID",
      // typeIdField: "",
      fields: [
        {
          name: "OBJECTID",
          type: "esriFieldTypeOID",
          alias: "OBJECTID",
          domain: null,
          editable: false,
          nullable: false,
          defaultValue: null,
          modelName: "OBJECTID",
        },
        {
          name: "GUID",
          type: "esriFieldTypeGUID",
          alias: "GUID",
          domain: null,
          editable: false,
          nullable: false,
          defaultValue: null,
          modelName: "GUID",
        },
        {
          name: "USER_GUID",
          type: "esriFieldTypeGUID",
          alias: "USER_GUID",
          domain: null,
          editable: false,
          nullable: true,
          defaultValue: null,
          modelName: "USER_GUID",
        },
        {
          name: "IMAGE_URL",
          type: "esriFieldTypeString",
          length: 125,
          alias: "IMAGEURL",
          domain: null,
          editable: false,
          nullable: true,
          defaultValue: null,
          modelName: "IMAGEURL",
        },
        {
          name: "SUBMIT_DATE",
          type: "esriFieldTypeDate",
          alias: "SUBMIT_DATE",
          length: 8,
          nullable: false,
          editable: false,
          domain: null,
          defaultValue: null,
          modelName: "SUBMIT_DATE",
        },
        {
          name: "CLASSIFICATION",
          type: "esriFieldTypeString",
          alias: "CLASSIFICATION",
          length: 25,
          nullable: false,
          editable: true,
          domain: null,
          defaultValue: null,
          modelName: "CLASSIFICATION",
        },
        {
          name: "MODEL_CONFIDENCE",
          type: "esriFieldTypeDouble",
          alias: "MODEL_CONFIDENCE",
          nullable: false,
          editable: true,
          domain: null,
          defaultValue: null,
          modelName: "MODEL_CONFIDENCE",
        },
      ],
      indexes: [
        {
          name: "PK_Litter_Reports_ObjectId",
          fields: "OBJECTID",
          isAscending: true,
          isUnique: true,
          description: "clustered, unique, primary key",
        },
        {
          name: "Litter_Reports_UserGuid",
          fields: "USER_GUID",
          isAscending: false,
          isUnique: false,
          description: "user guid index",
        },
        {
          name: "Litter_Reports_SubmitDate",
          fields: "SUBMIT_DATE",
          isAscending: true,
          isUnique: false,
          description: "submit date index",
        },
      ],
      // types: [],
      // templates: [
      //   {
      //     name: "New Feature",
      //     description: "",
      //     drawingTool: "esriFeatureEditToolPolygon",
      //     prototype: {
      //       attributes: {
      //         AREA: null,
      //         PERIMETER: null,
      //         MUSYM: null,
      //         MUKEY: null,
      //         DESCRIPTIO: null,
      //         CATEGORY: null,
      //         OBJECTID_1: null,
      //         SHP_ID_ARE: null,
      //         SHP_ID_LEN: null,
      //       },
      //     },
      //   },
      // ],
      supportedQueryFormats: "JSON",
      hasStaticData: false,
      maxRecordCount: 4000,
      standardMaxRecordCount: 4000,
      tileMaxRecordCount: 4000,
      maxRecordCountFactor: 1,
      capabilities: "Create,Delete,Query,Update,Editing,Extract,Sync",
      exceedsLimitFactor: 1,
    },
  ],
};

async function createService(url) {
  const params = new URLSearchParams();
  params.append("createParameters", JSON.stringify(createServerParameters));
  params.append("f", f);
  params.append("outputType", outputType);
  params.append("isView", false);

  return await fetch(url, {
    method: "POST",
    body: params,
  });
}

async function createLayer(url) {
  const params = new URLSearchParams();
  params.append("addToDefinition", JSON.stringify(createLayerParameters));
  params.append("f", f);
  return await fetch(url, {
    method: "POST",
    body: params,
  });
}

const url = new URL(
  `https://www.arcgis.com/sharing/rest/content/users/${username}/createService?token=${token}&f=json`
);

createService(url)
  .then(res => {
    return res.json();
  })
  .then(res => {
    const serviceUrl = res.serviceurl;
    const adminUrl = serviceUrl.replace(/\/arcgis\/rest\/services/, /\/arcgis\/rest\/admin\/services/);
    const addToDefinitionUrl = new URL(`${adminUrl}/addToDefinition?token=${token}`);
    return createLayer(addToDefinitionUrl);
  })
  .then(res => {
    return res.json();
  })
  .then(res => console.log(res))
  .catch((err) => {
    console.log(err);
  });
