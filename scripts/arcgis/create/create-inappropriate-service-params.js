const params = {
  getCreateServiceParams: ({ env }) => (
    {
      name: `adopt-a-highway-de-inappropriate-${env}`,
      serviceDescription: `The feature service for storing links to malicious user submissions (environment ${env})`,
      hasStaticData: false,
      supportedQueryFormats: 'JSON',
      capabilities: 'Create,Query,Update,Delete,Extract,Sync',
      description: `The feature service for storing links to malicious user submissions (environment ${env})`,
      copyrightText: '',
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
      units: 'esriMeters',
      xssPreventionInfo: {
        xssPreventionEnabled: true,
        xssPreventionRule: 'input',
        xssInputRule: 'rejectInvalid',
      },
    }
  ),
  getCreateLayerParams: ({ env }) => ({
    layers: [
      {
        id: 0,
        name: `Inappropriate-Image-Submissions-${env}`,
        type: 'Feature Layer',
        displayField: '',
        description: 'inappropriate submitted images',
        copyrightText: '',
        defaultVisibility: true,
        ownershipBasedAccessControlForFeatures: {
          allowOthersToQuery: true,
          allowOthersToDelete: false,
          allowOthersToUpdate: false,
        },
        relationships: [],
        isDataVersioned: false,
        supportsCalculate: true,
        supportsAttachmentsByUploadId: true,
        supportsStatistics: true,
        supportsAdvancedQueries: true,
        supportsValidateSql: true,
        supportsCoordinatesQuantization: true,
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
        geometryType: 'esriGeometryPoint',
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
        allowGeometryUpdates: true,
        hasAttachments: true,
        hasM: false,
        hasZ: false,
        objectIdField: 'OBJECTID',
        fields: [
          {
            name: 'OBJECTID',
            type: 'esriFieldTypeOID',
            alias: 'OBJECTID',
            domain: null,
            editable: false,
            nullable: false,
            defaultValue: null,
            modelName: 'OBJECTID',
          },
          {
            name: 'GUID',
            type: 'esriFieldTypeGUID',
            alias: 'GUID',
            domain: null,
            length: 50,
            editable: true,
            nullable: false,
            defaultValue: null,
            modelName: 'GUID',
          },
          {
            name: 'USER_GUID',
            type: 'esriFieldTypeGUID',
            alias: 'USER_GUID',
            domain: null,
            length: 50,
            editable: true,
            nullable: false,
            defaultValue: null,
            modelName: 'USER_GUID',
          },
          {
            name: 'IMAGE_KEY',
            type: 'esriFieldTypeString',
            length: 50,
            alias: 'IMAGE_KEY',
            domain: null,
            editable: true,
            nullable: false,
            defaultValue: null,
            modelName: 'IMAGEURL',
          },
          {
            name: 'SUBMIT_DATE',
            type: 'esriFieldTypeDate',
            alias: 'SUBMIT_DATE',
            length: 25,
            nullable: false,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: 'SUBMIT_DATE',
          },
          {
            name: 'RAW_ANALYSIS',
            type: 'esriFieldTypeString',
            alias: 'RAW_ANALYSIS',
            nullable: false,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: 'RAW_ANALYSIS',
          },
        ],
        indexes: [
          {
            name: 'PK_Litter_Reports_ObjectId',
            fields: 'OBJECTID',
            isAscending: true,
            isUnique: true,
            description: 'clustered, unique, primary key',
          },
          {
            name: 'Litter_Reports_UserGuid',
            fields: 'USER_GUID',
            isAscending: false,
            isUnique: false,
            description: 'user guid index',
          },
          {
            name: 'Litter_Reports_SubmitDate',
            fields: 'SUBMIT_DATE',
            isAscending: true,
            isUnique: false,
            description: 'submit date index',
          },
        ],
        supportedQueryFormats: 'JSON',
        hasStaticData: false,
        maxRecordCount: 4000,
        standardMaxRecordCount: 4000,
        tileMaxRecordCount: 4000,
        maxRecordCountFactor: 1,
        capabilities: 'Create,Delete,Query,Update,Editing,Extract,Sync',
        exceedsLimitFactor: 1,
      },
    ],
  })
};

export default params;