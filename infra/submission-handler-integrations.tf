data "aws_iam_policy_document" "submission_handler_s3_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      "${aws_s3_bucket.image_submissions_bucket.arn}/*"
    ]
    actions = ["s3:DeleteObject"]
  }
}

resource "aws_iam_policy" "submission_handler_s3_policy" {
  name   = "SubmissionHandler-${var.env}-s3-access-policy-${var.env}"
  policy = data.aws_iam_policy_document.submission_handler_s3_policy_document.json
}

resource "aws_iam_role_policy_attachment" "submission_handler_s3_policy_attachment" {
  role       = aws_iam_role.submission_handler_role.name
  policy_arn = aws_iam_policy.submission_handler_s3_policy.arn
}

data "aws_iam_policy_document" "submission_handler_sqs_policy_document" {
  statement {
    effect = "Allow"
    resources = [
      aws_sqs_queue.image_processing_queue.arn
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
  role       = aws_iam_role.submission_handler_role.name
  policy_arn = aws_iam_policy.submission_handler_sqs_policy.arn
}

