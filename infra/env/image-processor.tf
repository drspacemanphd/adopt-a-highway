locals {
  image_processor_lambda_name = "ImageProcessor-${var.env}"
}

data "aws_iam_policy_document" "image_processor_lambda_role_trust_policy_document" {
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

resource "aws_iam_role" "image_processor_lambda_execution_role" {
  assume_role_policy = data.aws_iam_policy_document.image_processor_lambda_role_trust_policy_document.json
  name               = "${local.image_processor_lambda_name}-execution-role"
  inline_policy {}
}

data "aws_iam_policy_document" "image_processor_lambda_execution_role_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.image_processor_lambda_name}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "image_processor_lambda_execution_policy" {
  name   = "${local.image_processor_lambda_name}-execution-role-policy"
  policy = data.aws_iam_policy_document.image_processor_lambda_execution_role_policy_document.json
}

resource "aws_iam_role_policy_attachment" "image_processor_lambda_execution_policy_attachment" {
  role       = aws_iam_role.image_processor_lambda_execution_role.name
  policy_arn = aws_iam_policy.image_processor_lambda_execution_policy.arn
}

resource "aws_lambda_function" "image_processor_lambda" {
  function_name = local.image_processor_lambda_name
  role          = aws_iam_role.image_processor_lambda_execution_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs16.x"
  timeout       = 25

  environment {
    variables = {
      ENV                             = var.env
      REGION                          = "us-east-1"
      FLAGGED_SUBMISSIONS_BUCKET      = module.s3_buckets.flagged_submissions_bucket_name
      REJECTED_SUBMISSIONS_BUCKET     = module.s3_buckets.rejected_submissions_bucket_name
      LITTER_IMAGES_BUCKET            = module.s3_buckets.litter_images_bucket_name
      ArcgisUsername                  = "/adopt-a-highway-${var.env}/ArcgisUsername"
      ArcgisPassword                  = "/adopt-a-highway-${var.env}/ArcgisPassword"
      LITTER_FEATURE_LAYER_URL        = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-${var.env}/FeatureServer/0"
      LITTERLESS_FEATURE_LAYER_URL    = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-literless-${var.env}/FeatureServer/0"
      INAPPROPRIATE_FEATURE_LAYER_URL = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-inappropriate-${var.env}/FeatureServer/0"
    }
  }

  s3_bucket = module.s3_buckets.lambda_bucket_name
  s3_key    = "image-processor-${var.commit_hash}.zip"
}
