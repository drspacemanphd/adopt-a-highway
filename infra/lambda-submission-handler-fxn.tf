data "aws_iam_policy_document" "submission_handler_role_trust_policy" {
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

resource "aws_iam_role" "submission_handler_role" {
  assume_role_policy = data.aws_iam_policy_document.submission_handler_role_trust_policy.json
  name               = "SubmissionHandlerExecutionRole-${var.env}"
  inline_policy {}
}

data "aws_iam_policy_document" "submission_handler_execution_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/SubmissionHandler-${var.env}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "submission_handler_execution_policy" {
  name   = "SubmissionHandlerExecutionPolicy-${var.env}"
  policy = data.aws_iam_policy_document.submission_handler_execution_policy_document.json
}

resource "aws_iam_role_policy_attachment" "submission_handler_execution_policy_attachment" {
  role       = aws_iam_role.submission_handler_role.name
  policy_arn = aws_iam_policy.submission_handler_execution_policy.arn
}

resource "aws_lambda_function" "submission_handler_function" {
  function_name = "SubmissionHandler-${var.env}"
  role          = aws_iam_role.submission_handler_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs14.x"
  timeout       = 25

  environment {
    variables = {
      ENV           = var.env
      REGION        = "us-east-1"
      SQS_QUEUE_URL = aws_sqs_queue.image_processing_queue.url
    }
  }

  s3_bucket = var.env == "dev" ? "amplify-adoptahighway-dev-53135-deployment" : "amplify-adoptahighway-prod-34600-deployment"
  s3_key    = var.env == "dev" ? "amplify-builds/SubmissionHandler-55526c74577359477779-build.zip" : "amplify-builds/SubmissionHandler-55526c74577359477779-build.zip"
}
