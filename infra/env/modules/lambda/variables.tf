### Required
variable "lambda_name" {
  type        = string
  description = "Name for the lambda function"
}

variable "account_id" {
  type        = string
  description = "Account for which to create permissions policy document allowing the function to create and write to log group"
}

variable "s3_bucket" {
  type        = string
  description = "S3 bucket to which to deploy lambda code"
}

variable "s3_key" {
  type        = string
  description = "S3 key used when deploying lambda code"
}

### Optional
variable "env_vars" {
  type        = object({})
  description = "Lambda function environment variables"
}