### Required
variable "bucket_regional_domain_name" {
  type        = string
  description = "The regional S3 bucket website domain name that should serve as the primary origin"
}

variable "viewer_certificate_arn" {
  type        = string
  description = "The ARN of the ACM certificate for the alternative domain names"
}

### Optional
variable "env" {
  type        = string
  description = "deployment environment"
  default     = "dev"
}
