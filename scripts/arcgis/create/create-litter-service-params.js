const params = {
  getCreateServiceParams: ({ env }) => (
    {
      name: `adopt-a-highway-de-${env}`,
      serviceDescription: `The feature service for storing images and location data for Adopt a Highway app (environment ${env})`,
      hasStaticData: false,
      supportedQueryFormats: "JSON",
      capabilities: "Create,Query,Extract,Sync",
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
    }
  ),
  getCreateLayerParams: ({ env }) => ({
    layers: [
      {
        // adminLayerInfo: {
        //   tableName: "db_10.user_10.LOADTESTSOIL_LOADTESTSOIL",
        //   geometryField: { name: "Shape" },
        //   xssTrustedFields: "",
        // },
        id: 0,
        name: `Litter-Reports-${env}`,
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
        objectIdField: "OBJECTID",
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
            length: 50,
            editable: true,
            nullable: false,
            defaultValue: null,
            modelName: "GUID",
          },
          {
            name: "USER_GUID",
            type: "esriFieldTypeGUID",
            alias: "USER_GUID",
            domain: null,
            length: 50,
            editable: true,
            nullable: false,
            defaultValue: null,
            modelName: "USER_GUID",
          },
          {
            name: "IMAGE_KEY",
            type: "esriFieldTypeString",
            length: 50,
            alias: "IMAGE_KEY",
            domain: null,
            editable: true,
            nullable: false,
            defaultValue: null,
            modelName: "IMAGEURL",
          },
          {
            name: "SUBMIT_DATE",
            type: "esriFieldTypeDate",
            alias: "SUBMIT_DATE",
            length: 25,
            nullable: false,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "SUBMIT_DATE",
          },
          {
            name: "RAW_ANALYSIS",
            type: "esriFieldTypeString",
            alias: "RAW_ANALYSIS",
            nullable: false,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "RAW_ANALYSIS",
          },
          {
            name: "CLASSIFICATION_FIRST",
            type: "esriFieldTypeString",
            alias: "CLASSIFICATION_FIRST",
            length: 25,
            nullable: true,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "CLASSIFICATION_FIRST",
          },
          {
            name: "MODEL_CONFIDENCE_FIRST",
            type: "esriFieldTypeDouble",
            alias: "MODEL_CONFIDENCE_FIRST",
            nullable: true,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "MODEL_CONFIDENCE_FIRST",
          },
          {
            name: "CLASSIFICATION_SECOND",
            type: "esriFieldTypeString",
            alias: "CLASSIFICATION_SECOND",
            length: 25,
            nullable: true,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "CLASSIFICATION_SECOND",
          },
          {
            name: "MODEL_CONFIDENCE_SECOND",
            type: "esriFieldTypeDouble",
            alias: "MODEL_CONFIDENCE_SECOND",
            nullable: true,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "MODEL_CONFIDENCE_SECOND",
          },
          {
            name: "CLASSIFICATION_THIRD",
            type: "esriFieldTypeString",
            alias: "CLASSIFICATION_THIRD",
            length: 25,
            nullable: true,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "CLASSIFICATION_THIRD",
          },
          {
            name: "MODEL_CONFIDENCE_THIRD",
            type: "esriFieldTypeDouble",
            alias: "MODEL_CONFIDENCE_THIRD",
            nullable: true,
            editable: true,
            domain: null,
            defaultValue: null,
            modelName: "MODEL_CONFIDENCE_THIRD",
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
  })
};

export default params;