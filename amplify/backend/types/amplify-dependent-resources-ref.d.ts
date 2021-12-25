export type AmplifyDependentResourcesAttributes = {
    "custom": {
        "ImageProcessingQueue": {
            "Url": "string",
            "Arn": "string",
            "Name": "string"
        }
    },
    "function": {
        "ImageProcessor": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        }
    }
}