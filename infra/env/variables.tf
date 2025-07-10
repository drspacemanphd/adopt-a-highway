variable "env" {
  type        = string
  description = "deployment environment"
}

variable "commit_hash" {
  type        = string
  description = "commit hash to use when deploying the lambda functions and UI"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudfront account id"
  sensitive   = true
}