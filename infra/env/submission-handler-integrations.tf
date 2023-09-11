# ### S3 Access
# data "aws_iam_policy_document" "submission_handler_s3_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       "${aws_s3_bucket.image_submissions_bucket.arn}/*"
#     ]
#     actions = ["s3:DeleteObject"]
#   }
# }

# resource "aws_iam_policy" "submission_handler_s3_policy" {
#   name   = "SubmissionHandler-${var.env}-s3-access-policy-${var.env}"
#   policy = data.aws_iam_policy_document.submission_handler_s3_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "submission_handler_s3_policy_attachment" {
#   role       = aws_iam_role.submission_handler_role.name
#   policy_arn = aws_iam_policy.submission_handler_s3_policy.arn
# }



# ### SQS access
# data "aws_iam_policy_document" "submission_handler_sqs_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       aws_sqs_queue.image_processing_queue.arn
#     ]
#     actions = [
#       "sqs:SendMessage"
#     ]
#   }
# }

# resource "aws_iam_policy" "submission_handler_sqs_policy" {
#   name   = "SubmissionHandler-${var.env}-sqs-access-policy-${var.env}"
#   policy = data.aws_iam_policy_document.submission_handler_sqs_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "submission_handler_sqs_policy_attachment" {
#   role       = aws_iam_role.submission_handler_role.name
#   policy_arn = aws_iam_policy.submission_handler_sqs_policy.arn
# }



# ### Lambda Trigger
# resource "aws_lambda_permission" "image_submissions_bucket_notification_permission" {
#   statement_id  = var.env == "dev" ? "amplify-adoptahighway-dev-53135-functionSubmissionHandler-1PXXT28C-S3TriggerPermission-10N7PY82AB3A7" : "amplify-adoptahighway-prod-34600-functionSubmissionHandler-G7QTZE0-S3TriggerPermission-1RHZULB54L7RO" 
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.submission_handler_function.function_name
#   principal     = "s3.amazonaws.com" 
#   source_arn    = aws_s3_bucket.image_submissions_bucket.arn 
# }

# resource "aws_s3_bucket_notification" "image_submissions_bucket_notification" {
#   bucket = aws_s3_bucket.image_submissions_bucket.id

#   lambda_function {
#     events              = [ "s3:ObjectCreated:*" ]
#     lambda_function_arn = aws_lambda_function.submission_handler_function.arn
#   }

#   depends_on = [ aws_lambda_permission.image_submissions_bucket_notification_permission ]
# }
