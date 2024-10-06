locals {
  road_scraper_lambda_name = "RoadScraper-${var.env}"
}

data "aws_iam_policy_document" "road_scraper_lambda_role_trust_policy_document" {
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

resource "aws_iam_role" "road_scraper_lambda_execution_role" {
  assume_role_policy = data.aws_iam_policy_document.road_scraper_lambda_role_trust_policy_document.json
  name               = "${local.road_scraper_lambda_name}-execution-role"
  inline_policy {}
}

data "aws_iam_policy_document" "road_scraper_lambda_execution_role_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.road_scraper_lambda_name}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "road_scraper_lambda_execution_policy" {
  name   = "${local.road_scraper_lambda_name}-execution-role-policy"
  policy = data.aws_iam_policy_document.road_scraper_lambda_execution_role_policy_document.json
}

resource "aws_iam_role_policy_attachment" "road_scraper_lambda_execution_policy_attachment" {
  role       = aws_iam_role.road_scraper_lambda_execution_role.name
  policy_arn = aws_iam_policy.road_scraper_lambda_execution_policy.arn
}

resource "aws_lambda_function" "road_scraper_lambda" {
  function_name = local.road_scraper_lambda_name
  role          = aws_iam_role.road_scraper_lambda_execution_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs16.x"
  timeout       = 25

  # environment {
  #   variables = {
  #     APP_SOURCE_LAYER_URL          = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-roads-${var.env}/FeatureServer/0"
  #     ArcgisUsername                = "/adopt-a-highway-${var.env}/ArcgisUsername"
  #     ArcgisPassword                = "/adopt-a-highway-${var.env}/ArcgisPassword"
  #     ENV	                          = var.env
  #     REGION                        =	"us-east-1"
  #     GROUPS_SOURCE_LAYER_QUERY_URL	= "https://services1.arcgis.com/bQ68YUVG6MKPIQ8f/ArcGIS/rest/services/AAH_Roads_View/FeatureServer/1"
  #     JOIN_SOURCE_LAYER_QUERY_URL	  = "https://services1.arcgis.com/bQ68YUVG6MKPIQ8f/ArcGIS/rest/services/AAH_Roads_View/FeatureServer/2"
  #     ROADS_SOURCE_LAYER_QUERY_URL	= "https://services1.arcgis.com/bQ68YUVG6MKPIQ8f/arcgis/rest/services/AAH_Roads_View/FeatureServer/0"
  #   }
  # }

  s3_bucket = module.s3_buckets.lambda_bucket_name
  s3_key    = "road-scraper-${var.commit_hash}.zip"
}
