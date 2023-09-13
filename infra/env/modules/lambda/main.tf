data "aws_iam_policy_document" "lambda_role_trust_policy_document" {
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

resource "aws_iam_role" "lambda_execution_role" {
  assume_role_policy = data.aws_iam_policy_document.lambda_role_trust_policy_document.json
  name               = "${var.lambda_name}-execution-role"
  inline_policy {}
}

data "aws_iam_policy_document" "lambda_execution_role_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "arn:aws:logs:us-east-1:${var.account_id}:log-group:/aws/lambda/${var.lambda_name}:log-stream:*"
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
  }
}

resource "aws_iam_policy" "lambda_execution_policy" {
  name   = "${var.lambda_name}-execution-role-policy"
  policy = data.aws_iam_policy_document.lambda_execution_role_policy_document.json
}

resource "aws_iam_role_policy_attachment" "lambda_execution_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_execution_policy.arn
}

resource "aws_lambda_function" "lambda_function" {
  function_name = var.lambda_name
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler" 
  runtime       = "nodejs14.x"
  timeout       = 25

  environment {
    variables = var.env_vars
  }

  s3_bucket = var.s3_bucket
  s3_key    = var.s3_key
}
