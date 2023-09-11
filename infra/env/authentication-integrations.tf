# data "aws_iam_policy_document" "authenticated_user_role_trust_policy" {
#   statement {
#     effect = "Allow"
#     actions = [
#       "sts:AssumeRoleWithWebIdentity"
#     ]
#     principals {
#       type        = "Federated"
#       identifiers = ["cognito-identity.amazonaws.com"]
#     }
#     condition {
#       test     = "StringEquals"
#       variable = "cognito-identity.amazonaws.com:aud"
#       values   = [ aws_cognito_identity_pool.identity_pool.id ]
#     }
#     condition {
#       test     = "ForAnyValue:StringLike"
#       variable = "cognito-identity.amazonaws.com:amr"
#       values = [ "authenticated" ]
#     }
#   }
# }

# resource "aws_iam_role" "authenticated_user_role" {
#   name               = "amplify-adoptahighway-${var.env}-authRole"
#   assume_role_policy = data.aws_iam_policy_document.authenticated_user_role_trust_policy.json

#   inline_policy {}
# }

# data "aws_iam_policy_document" "authenticated_user_role_s3_access_policy_document" {
#   statement {
#     actions   = [ "s3:ListBucket", "s3:GetBucketCORS" ]
#     effect    = "Allow"
#     resources = [ aws_s3_bucket.image_submissions_bucket.arn ]
#   }

#   statement {
#     actions   = [ "s3:PutObject", "s3:PutObjectTagging" ]
#     effect    = "Allow"
#     resources = [ "${aws_s3_bucket.image_submissions_bucket.arn}/*" ]
#   }
# }

# resource "aws_iam_policy" "authenticated_user_role_s3_access_policy" {
#   name   = "cognito-identity-pool-s3-access-policy-${var.env}"
#   policy = data.aws_iam_policy_document.authenticated_user_role_s3_access_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "authenticated_user_role_s3_access_policy_attachment" {
#   role       = aws_iam_role.authenticated_user_role.name
#   policy_arn = aws_iam_policy.authenticated_user_role_s3_access_policy.arn
# }

# data "aws_iam_policy_document" "unauthenticated_user_role_trust_policy" {
#   statement {
#     effect = "Allow"
#     actions = [
#       "sts:AssumeRoleWithWebIdentity"
#     ]
#     principals {
#       type        = "Federated"
#       identifiers = ["cognito-identity.amazonaws.com"]
#     }
#     condition {
#       test     = "StringEquals"
#       variable = "cognito-identity.amazonaws.com:aud"
#       values   = [ aws_cognito_identity_pool.identity_pool.id ]
#     }
#     condition {
#       test     = "ForAnyValue:StringLike"
#       variable = "cognito-identity.amazonaws.com:amr"
#       values = [ "unauthenticated" ]
#     }
#   }
# }

# resource "aws_iam_role" "unauthenticated_user_role" {
#   name               = "amplify-adoptahighway-${var.env}-unauthRole"
#   assume_role_policy = data.aws_iam_policy_document.unauthenticated_user_role_trust_policy.json

#   inline_policy {}
# }

# resource "aws_cognito_identity_pool_roles_attachment" "identity_pool_roles" {
#   identity_pool_id = aws_cognito_identity_pool.identity_pool.id
#   roles = {
#     "authenticated"   = aws_iam_role.authenticated_user_role.arn
#     "unauthenticated" = aws_iam_role.unauthenticated_user_role.arn
#   }
# }