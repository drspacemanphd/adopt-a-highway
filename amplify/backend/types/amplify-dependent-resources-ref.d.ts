export type AmplifyDependentResourcesAttributes = {
    "custom": {
        "LitterImageSubmissions": {
            "Name": "string",
            "Arn": "string"
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