## This file contains resources that should be manually created first
## then imported into terraform. As of right now they should only include the
## deployment buckets for lambda code. This is because the lambda deployments
## (updating the zip file the lambda refers to) happen via terraform but the
## code itself needs to be PUT into its corresponding bucket prior to that.

resource "aws_s3_bucket_public_access_block" "lambda_function_code_public_access_block" {
  bucket = aws_s3_bucket.lambda_function_code.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket" "lambda_function_code" {
  bucket = var.env == "dev" ? "amplify-adoptahighway-dev-53135-deployment" : "amplify-adoptahighway-prod-34600-deployment"
  
  force_destroy = true
}