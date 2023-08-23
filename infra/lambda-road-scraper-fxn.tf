data "aws_iam_policy_document" "road_scraper_role_trust_policy" {
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

resource "aws_iam_role" "road_scraper_role" {
  assume_role_policy = data.aws_iam_policy_document.road_scraper_role_trust_policy.json
  name               = "RoadScraperExecutionRole-${var.env}"
  inline_policy {}
}

data "aws_iam_policy_document" "road_scraper_execution_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/RoadScraper-${var.env}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "road_scraper_execution_policy" {
  name   = "RoadScraperExecutionPolicy-${var.env}"
  policy = data.aws_iam_policy_document.road_scraper_execution_policy_document.json
}

resource "aws_iam_role_policy_attachment" "road_scraper_execution_policy_attachment" {
  role       = aws_iam_role.road_scraper_role.name
  policy_arn = aws_iam_policy.road_scraper_execution_policy.arn
}

resource "aws_lambda_function" "road_scraper_function" {
  function_name = "RoadScraper-${var.env}"
  role          = aws_iam_role.road_scraper_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs14.x"
  timeout       = 15*60

  environment {
    variables = {
      APP_SOURCE_LAYER_URL          = "https://services3.arcgis.com/5qxU4mTbYVURqQBF/ArcGIS/rest/services/adopt-a-highway-de-roads-${var.env}/FeatureServer/0"
      ArcgisUsername                = data.aws_ssm_parameter.arcgis_username.value
      ArcgisPassword                = data.aws_ssm_parameter.arcgis_password.value
      ENV	                          = var.env
      REGION                        =	"us-east-1"
      GROUPS_SOURCE_LAYER_QUERY_URL	= "https://services1.arcgis.com/bQ68YUVG6MKPIQ8f/ArcGIS/rest/services/AAH_Roads_View/FeatureServer/1"
      JOIN_SOURCE_LAYER_QUERY_URL	  = "https://services1.arcgis.com/bQ68YUVG6MKPIQ8f/ArcGIS/rest/services/AAH_Roads_View/FeatureServer/2"
      ROADS_SOURCE_LAYER_QUERY_URL	= "https://services1.arcgis.com/bQ68YUVG6MKPIQ8f/arcgis/rest/services/AAH_Roads_View/FeatureServer/0"
    }
  }

  s3_bucket = var.env == "dev" ? "amplify-adoptahighway-dev-53135-deployment" : "amplify-adoptahighway-prod-34600-deployment"
  s3_key    = var.env == "dev" ? "amplify-builds/RoadScraper-4e635648646a2b31634b-build.zip" : "amplify-builds/RoadScraper-4e635648646a2b31634b-build.zip"
}
