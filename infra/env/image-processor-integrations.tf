# ### S3 Access
# data "aws_iam_policy_document" "image_processor_s3_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       aws_s3_bucket.image_submissions_bucket.arn,
#       aws_s3_bucket.flagged_submissions_bucket.arn,
#       aws_s3_bucket.rejected_submissions_bucket.arn,
#       aws_s3_bucket.litter_images_bucket.arn
#     ]
#     actions = ["s3:ListBucket"]
#   }

#   statement {
#     effect = "Allow"
#     resources = [
#       "${aws_s3_bucket.image_submissions_bucket.arn}/*",
#     ]
#     actions = [
#       "s3:GetObject",
#       "s3:GetObjectTagging",
#       "s3:DeleteObject"
#     ]
#   }

#   statement {
#     effect = "Allow"
#     resources = [
#       "${aws_s3_bucket.flagged_submissions_bucket.arn}/*",
#       "${aws_s3_bucket.rejected_submissions_bucket.arn}/*",
#       "${aws_s3_bucket.litter_images_bucket.arn}/*"
#     ]
#     actions = [
#       "s3:PutObject",
#       "s3:PutObjectTagging",
#       "s3:PutObjectAcl"
#     ]
#   }
# }

# resource "aws_iam_policy" "image_processor_s3_policy" {
#   name   = "ImageProcessor-${var.env}-s3-access-policy-${var.env}"
#   policy = data.aws_iam_policy_document.image_processor_s3_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "image_processor_s3_policy_attachment" {
#   role       = aws_iam_role.image_processor_role.name
#   policy_arn = aws_iam_policy.image_processor_s3_policy.arn
# }



# ### SQS access
# data "aws_iam_policy_document" "image_processor_sqs_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       aws_sqs_queue.image_processing_queue.arn
#     ]
#     actions = [
#       "sqs:ReceiveMessage",
#       "sqs:DeleteMessage",
#       "sqs:GetQueueAttributes"
#     ]
#   }
# }

# resource "aws_iam_policy" "image_processor_sqs_policy" {
#   name   = "ImageProcessor-${var.env}-sqs-access-policy-${var.env}"
#   policy = data.aws_iam_policy_document.image_processor_sqs_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "image_processor_sqs_policy_attachment" {
#   role       = aws_iam_role.image_processor_role.name
#   policy_arn = aws_iam_policy.image_processor_sqs_policy.arn
# }



# ### Rekognition access
# data "aws_iam_policy_document" "image_processor_rekognition_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       "*"
#     ]
#     actions = [
#       "rekognition:DetectModerationLabels",
#       "rekognition:DetectLabels"
#     ]
#   }
# }

# resource "aws_iam_policy" "image_processor_rekognition_policy" {
#   name   = "ImageProcessor-${var.env}-rekognition-policy-${var.env}"
#   policy = data.aws_iam_policy_document.image_processor_rekognition_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "image_processor_rekognition_policy_attachment" {
#   role       = aws_iam_role.image_processor_role.name
#   policy_arn = aws_iam_policy.image_processor_rekognition_policy.arn
# }



# ### SSM access
# data "aws_iam_policy_document" "image_processor_ssm_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       "*"
#     ]
#     actions = [
#       "ssm:GetParameters",
#     ]
#   }
# }

# resource "aws_iam_policy" "image_processor_ssm_policy" {
#   name   = "ImageProcessor-${var.env}-ssm-policy-${var.env}"
#   policy = data.aws_iam_policy_document.image_processor_ssm_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "image_processor_ssm_policy_attachment" {
#   role       = aws_iam_role.image_processor_role.name
#   policy_arn = aws_iam_policy.image_processor_ssm_policy.arn
# }



# ### Event Source Mapping
# resource "aws_lambda_event_source_mapping" "image_submissions_event_source_mapping" {
#   event_source_arn                   = aws_sqs_queue.image_processing_queue.arn
#   function_name                      = aws_lambda_function.image_processor_function.function_name
#   batch_size                         = 1
#   maximum_batching_window_in_seconds = 3
# }
