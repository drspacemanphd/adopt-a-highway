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
            "Arn": "string"
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
        }
    }
}