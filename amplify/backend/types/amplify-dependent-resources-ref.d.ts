export type AmplifyDependentResourcesAttributes = {
    "custom": {
        "ImageSubmissions": {
            "Name": "string",
            "Arn": "string"
        },
        "SubmissionHandlerS3AccessPolicy": {
            "Arn": "string"
        },
        "ImageProcessingQueue": {
            "Arn": "string",
            "Url": "string"
        },
        "SubmissionHandlerSQSAccessPolicy": {
            "Arn": "string"
        },
        "ImageProcessorS3AccessPolicy": {
            "Arn": "string"
        },
        "FlaggedSubmissions": {
            "Name": "string",
            "Arn": "string"
        },
        "ImageProcessorSQSAccessPolicy": {
            "Arn": "string"
        },
        "LitterImages": {
            "Name": "string",
            "Arn": "string"
        },
        "FlaggedSubmissionHandlerS3AccessPolicy": {
            "Arn": "string"
        },
        "FlaggedSubmissionsQueue": {
            "Arn": "string",
            "Url": "string"
        },
        "FlaggedSubmissionHandlerSQSAccessPolicy": {
            "Arn": "string"
        },
        "RejectedSubmissionsQueue": {
            "Arn": "string",
            "Url": "string"
        },
        "RejectedSubmissions": {
            "Name": "string",
            "Arn": "string"
        },
        "RejectedSubmissionHandlerS3AccessPolicy": {
            "Arn": "string"
        },
        "RejectedSubmissionHandlerSQSAccessPolicy": {
            "Arn": "string"
        },
        "CognitoIdentityPoolSubmitAccess": {
            "Arn": "string"
        }
    },
    "function": {
        "SubmissionHandler": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string",
            "LambdaTriggerPermission": "string"
        },
        "ImageProcessor": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "FlaggedSubmissionHandler": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "RejectedSubmissionHandler": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        }
    },
    "auth": {
        "adoptahighwayef719878": {
            "IdentityPoolId": "string",
            "IdentityPoolName": "string",
            "UserPoolId": "string",
            "UserPoolArn": "string",
            "UserPoolName": "string",
            "AppClientIDWeb": "string",
            "AppClientID": "string"
        }
    }
}