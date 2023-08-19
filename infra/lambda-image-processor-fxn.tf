data "aws_iam_policy_document" "image_processor_role_trust_policy" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "image_processor_role" {
  assume_role_policy = data.aws_iam_policy_document.image_processor_role_trust_policy.json
  name               = "ImageProcessorExecutionRole-${var.env}"
  inline_policy {}
}

data "aws_iam_policy_document" "image_processor_execution_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/ImageProcessor-${var.env}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "image_processor_execution_policy" {
  name   = "ImageProcessorExecutionPolicy-${var.env}"
  policy = data.aws_iam_policy_document.image_processor_execution_policy_document.json
}

resource "aws_iam_role_policy_attachment" "image_processor_execution_policy_attachment" {
  role       = aws_iam_role.image_processor_role.name
  policy_arn = aws_iam_policy.image_processor_execution_policy.arn
}

resource "aws_lambda_function" "image_processor_function" {
  function_name = "ImageProcessor-${var.env}"
  role          = aws_iam_role.image_processor_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs14.x"
  timeout       = 25

  environment {
    variables = {
      ENV                             = var.env
      REGION                          = "us-east-1"
      FLAGGED_SUBMISSIONS_BUCKET      = aws_s3_bucket.flagged_submissions_bucket.bucket
      REJECTED_SUBMISSIONS_BUCKET     = aws_s3_bucket.rejected_submissions_bucket.bucket
      LITTER_IMAGES_BUCKET            = aws_s3_bucket.litter_images_bucket.bucket
      ArcgisUsername                  = data.aws_ssm_parameter.arcgis_username.value
      ArcgisPassword                  = data.aws_ssm_parameter.arcgis_password.value
      LITTER_FEATURE_LAYER_URL        = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-${var.env}/FeatureServer/0"
      LITTERLESS_FEATURE_LAYER_URL    = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-literless-${var.env}/FeatureServer/0"
      INAPPROPRIATE_FEATURE_LAYER_URL = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-inappropriate-${var.env}/FeatureServer/0"
    }
  }

  s3_bucket = var.env == "dev" ? "amplify-adoptahighway-dev-53135-deployment" : "amplify-adoptahighway-prod-34600-deployment"
  s3_key    = var.env == "dev" ? "amplify-builds/ImageProcessor-6f59587052703038506c-build.zip" : "amplify-builds/ImageProcessor-6f59587052703038506c-build.zip"
}
