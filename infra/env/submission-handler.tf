locals {
  submission_handler_lambda_name = "SubmissionHandler-${var.env}"
}

data "aws_iam_policy_document" "submission_handler_lambda_role_trust_policy_document" {
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

resource "aws_iam_role" "submission_handler_lambda_execution_role" {
  assume_role_policy = data.aws_iam_policy_document.submission_handler_lambda_role_trust_policy_document.json
  name               = "${local.submission_handler_lambda_name}-execution-role"
  inline_policy {}
}

data "aws_iam_policy_document" "submission_handler_lambda_execution_role_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.submission_handler_lambda_name}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "submission_handler_lambda_execution_policy" {
  name   = "${local.submission_handler_lambda_name}-execution-role-policy"
  policy = data.aws_iam_policy_document.submission_handler_lambda_execution_role_policy_document.json
}

resource "aws_iam_role_policy_attachment" "submission_handler_lambda_execution_policy_attachment" {
  role       = aws_iam_role.submission_handler_lambda_execution_role.name
  policy_arn = aws_iam_policy.submission_handler_lambda_execution_policy.arn
}

resource "aws_lambda_function" "submission_handler_lambda" {
  function_name = local.submission_handler_lambda_name
  role          = aws_iam_role.submission_handler_lambda_execution_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs16.x"
  timeout       = 25

  environment {
    variables = {
      ENV           = var.env
      REGION        = "us-east-1"
      SQS_QUEUE_URL = module.image_sqs_queue.image_processing_queue_url
    }
  }

  s3_bucket = module.s3_buckets.lambda_bucket_name
  s3_key    = "submission-handler-${var.commit_hash}.zip"
}
