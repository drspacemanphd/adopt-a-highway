# Data
data "aws_caller_identity" "current" {}

data "aws_route53_zone" "frontend_domain" {
  name = "drspacemanphd.com"
}

# Modules
module "cognito_pools" {
  source  = "./modules/cognito"
  env     = var.env
}

module "s3_buckets" {
  source = "./modules/s3"
  env    = var.env
}

module "image_sqs_queue" {
  source = "./modules/sqs"
  env    = var.env
}

module "domain_certs" {
  source  = "./modules/acm"
  env     = var.env
  zone_id = data.aws_route53_zone.frontend_domain.zone_id
}

module "cloudfront" {
  source                      = "./modules/cloudfront"
  env                         = var.env
  bucket_regional_domain_name = module.s3_buckets.frontend_app_bucket_domain_name
  viewer_certificate_arn      = module.domain_certs.frontend_app_cert_arn
}

# Module Integration Points
## Cognito Pool Integrations
data "aws_iam_policy_document" "authenticated_user_role_trust_policy" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [ module.cognito_pools.identity_pool_id ]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values = [ "authenticated" ]
    }
  }
}

resource "aws_iam_role" "authenticated_user_role" {
  name               = "adoptahighway-${var.env}-authRole"
  assume_role_policy = data.aws_iam_policy_document.authenticated_user_role_trust_policy.json

  inline_policy {}
}

data "aws_iam_policy_document" "authenticated_user_role_s3_access_policy_document" {
  statement {
    actions   = [ "s3:ListBucket", "s3:GetBucketCORS" ]
    effect    = "Allow"
    resources = [ module.s3_buckets.image_submissions_bucket_arn ]
  }

  statement {
    actions   = [ "s3:PutObject", "s3:PutObjectTagging" ]
    effect    = "Allow"
    resources = [ "${module.s3_buckets.image_submissions_bucket_arn}/*" ]
  }
}

resource "aws_iam_policy" "authenticated_user_role_s3_access_policy" {
  name   = "cognito-identity-pool-s3-access-policy-${var.env}"
  policy = data.aws_iam_policy_document.authenticated_user_role_s3_access_policy_document.json
}

resource "aws_iam_role_policy_attachment" "authenticated_user_role_s3_access_policy_attachment" {
  role       = aws_iam_role.authenticated_user_role.name
  policy_arn = aws_iam_policy.authenticated_user_role_s3_access_policy.arn
}

data "aws_iam_policy_document" "unauthenticated_user_role_trust_policy" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [ module.cognito_pools.identity_pool_id ]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values = [ "unauthenticated" ]
    }
  }
}

resource "aws_iam_role" "unauthenticated_user_role" {
  name               = "adoptahighway-${var.env}-unauthRole"
  assume_role_policy = data.aws_iam_policy_document.unauthenticated_user_role_trust_policy.json

  inline_policy {}
}

resource "aws_cognito_identity_pool_roles_attachment" "identity_pool_roles" {
  identity_pool_id = module.cognito_pools.identity_pool_id
  roles = {
    "authenticated"   = aws_iam_role.authenticated_user_role.arn
    "unauthenticated" = aws_iam_role.unauthenticated_user_role.arn
  }
}


## Cloudfront integrations
resource "aws_route53_record" "frontend_app_main" {
  zone_id = data.aws_route53_zone.frontend_domain.zone_id
  name    = var.env == "prod" ? "adopt-a-highway.drspacemanphd.com" : "dev-adopt-a-highway.drspacemanphd.com"
  type    = "A"
  alias {
    name                   = module.cloudfront.cloudfront_frontend_distribution_domain_name
    # Cloudfront Distribution Zone Id
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_app_main_www" {
  zone_id = data.aws_route53_zone.frontend_domain.zone_id
  name    = var.env == "prod" ? "www.adopt-a-highway.drspacemanphd.com" : "www.dev-adopt-a-highway.drspacemanphd.com"
  type    = "A"
  alias {
    name                   = module.cloudfront.cloudfront_frontend_distribution_domain_name
    # Cloudfront Distribution Zone Id
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}


## Image Processor Lambda Integrations
### S3 Access
data "aws_iam_policy_document" "image_processor_s3_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      module.s3_buckets.image_submissions_bucket_arn,
      module.s3_buckets.flagged_submissions_bucket_arn,
      module.s3_buckets.rejected_submissions_bucket_arn,
      module.s3_buckets.litter_images_bucket_arn,
    ]
    actions = ["s3:ListBucket"]
  }

  statement {
    effect = "Allow"
    resources = [
      "${module.s3_buckets.image_submissions_bucket_arn}/*",
    ]
    actions = [
      "s3:GetObject",
      "s3:GetObjectTagging",
      "s3:DeleteObject"
    ]
  }

  statement {
    effect = "Allow"
    resources = [
      "${module.s3_buckets.flagged_submissions_bucket_arn}/*",
      "${module.s3_buckets.rejected_submissions_bucket_arn}/*",
      "${module.s3_buckets.litter_images_bucket_arn}/*"
    ]
    actions = [
      "s3:PutObject",
      "s3:PutObjectTagging",
      "s3:PutObjectAcl"
    ]
  }
}

resource "aws_iam_policy" "image_processor_s3_policy" {
  name   = "ImageProcessor-${var.env}-s3-access-policy-${var.env}"
  policy = data.aws_iam_policy_document.image_processor_s3_policy_document.json
}

resource "aws_iam_role_policy_attachment" "image_processor_s3_policy_attachment" {
  role       = aws_iam_role.image_processor_lambda_execution_role.name
  policy_arn = aws_iam_policy.image_processor_s3_policy.arn
}

### SQS Access
data "aws_iam_policy_document" "image_processor_sqs_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      module.image_sqs_queue.image_processing_queue_arn
    ]
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
  }
}

resource "aws_iam_policy" "image_processor_sqs_policy" {
  name   = "ImageProcessor-${var.env}-sqs-access-policy-${var.env}"
  policy = data.aws_iam_policy_document.image_processor_sqs_policy_document.json
}

resource "aws_iam_role_policy_attachment" "image_processor_sqs_policy_attachment" {
  role       = aws_iam_role.image_processor_lambda_execution_role.name
  policy_arn = aws_iam_policy.image_processor_sqs_policy.arn
}

### Rekognition Access
data "aws_iam_policy_document" "image_processor_rekognition_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "*"
    ]
    actions = [
      "rekognition:DetectModerationLabels",
      "rekognition:DetectLabels"
    ]
  }
}

resource "aws_iam_policy" "image_processor_rekognition_policy" {
  name   = "ImageProcessor-${var.env}-rekognition-policy-${var.env}"
  policy = data.aws_iam_policy_document.image_processor_rekognition_policy_document.json
}

resource "aws_iam_role_policy_attachment" "image_processor_rekognition_policy_attachment" {
  role       = aws_iam_role.image_processor_lambda_execution_role.name
  policy_arn = aws_iam_policy.image_processor_rekognition_policy.arn
}

### SSM Access
data "aws_iam_policy_document" "image_processor_ssm_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "*"
    ]
    actions = [
      "ssm:GetParameters",
    ]
  }
}

resource "aws_iam_policy" "image_processor_ssm_policy" {
  name   = "ImageProcessor-${var.env}-ssm-policy-${var.env}"
  policy = data.aws_iam_policy_document.image_processor_ssm_policy_document.json
}

resource "aws_iam_role_policy_attachment" "image_processor_ssm_policy_attachment" {
  role       = aws_iam_role.image_processor_lambda_execution_role.name
  policy_arn = aws_iam_policy.image_processor_ssm_policy.arn
}

### Event Source Mapping
resource "aws_lambda_event_source_mapping" "image_submissions_event_source_mapping" {
  event_source_arn                   = module.image_sqs_queue.image_processing_queue_arn
  function_name                      = aws_lambda_function.image_processor_lambda.function_name
  batch_size                         = 1
  maximum_batching_window_in_seconds = 3
}


## Road Scraper Lambda Integrations
### SSM access
data "aws_iam_policy_document" "road_scraper_ssm_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "*"
    ]
    actions = [
      "ssm:GetParameters",
    ]
  }
}

resource "aws_iam_policy" "road_scraper_ssm_policy" {
  name   = "RoadScraper-${var.env}-ssm-policy-${var.env}"
  policy = data.aws_iam_policy_document.road_scraper_ssm_policy_document.json
}

resource "aws_iam_role_policy_attachment" "road_scraper_ssm_policy_attachment" {
  role       = aws_iam_role.road_scraper_lambda_execution_role.name
  policy_arn = aws_iam_policy.road_scraper_ssm_policy.arn
}

### CRON Schedule
resource "aws_cloudwatch_event_rule" "road_scraper_cron" {
  name                = "road-scraper-event-cron-${var.env}"
  schedule_expression = "cron(0 12 * * ? *)"
  description         = "Cron trigger for Road Scraper Lambda"
}

resource "aws_cloudwatch_event_target" "road_scraper_target" {
  rule = aws_cloudwatch_event_rule.road_scraper_cron.name
  arn  = aws_lambda_function.road_scraper_lambda.arn
}

resource "aws_lambda_permission" "road_scraper_cron_permissions" {
  statement_id  = "AllowCloudwatchEventBridge" 
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.road_scraper_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.road_scraper_cron.arn
}


## Submission Handler Lambda Integrations
### S3 Access
data "aws_iam_policy_document" "submission_handler_s3_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "${module.s3_buckets.image_submissions_bucket_arn}/*"
    ]
    actions = ["s3:DeleteObject"]
  }
}

resource "aws_iam_policy" "submission_handler_s3_policy" {
  name   = "SubmissionHandler-${var.env}-s3-access-policy-${var.env}"
  policy = data.aws_iam_policy_document.submission_handler_s3_policy_document.json
}

resource "aws_iam_role_policy_attachment" "submission_handler_s3_policy_attachment" {
  role       = aws_iam_role.submission_handler_lambda_execution_role.name
  policy_arn = aws_iam_policy.submission_handler_s3_policy.arn
}

### SQS access
data "aws_iam_policy_document" "submission_handler_sqs_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      module.image_sqs_queue.image_processing_queue_arn
    ]
    actions = [
      "sqs:SendMessage"
    ]
  }
}

resource "aws_iam_policy" "submission_handler_sqs_policy" {
  name   = "SubmissionHandler-${var.env}-sqs-access-policy-${var.env}"
  policy = data.aws_iam_policy_document.submission_handler_sqs_policy_document.json
}

resource "aws_iam_role_policy_attachment" "submission_handler_sqs_policy_attachment" {
  role       = aws_iam_role.submission_handler_lambda_execution_role.name
  policy_arn = aws_iam_policy.submission_handler_sqs_policy.arn
}

### Lambda Trigger
resource "aws_lambda_permission" "image_submissions_bucket_notification_permission" {
  statement_id  = "adopt-a-highway-${var.env}-image-processor-invocation-permission"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submission_handler_lambda.function_name
  principal     = "s3.amazonaws.com" 
  source_arn    = module.s3_buckets.image_submissions_bucket_arn
}

resource "aws_s3_bucket_notification" "image_submissions_bucket_notification" {
  bucket = module.s3_buckets.image_submissions_bucket_name

  lambda_function {
    events              = [ "s3:ObjectCreated:*" ]
    lambda_function_arn = aws_lambda_function.submission_handler_lambda.arn
  }

  depends_on = [ aws_lambda_permission.image_submissions_bucket_notification_permission ]
}


## Frontend Activation
# This command "activates" the frontend build, such that "activation" is done
# in terraform, along with a lambda code deployment/activation
resource "null_resource" "frontend_app_deployment" {
  triggers = {
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = "aws s3 cp s3://${module.s3_buckets.frontend_app_bucket_name}/index-${var.commit_hash}.html s3://${module.s3_buckets.frontend_app_bucket_name}/index.html && aws cloudfront create-invalidation --distribution-id ${module.cloudfront.cloudfront_frontend_distribution_id} --paths /"
  }
}
