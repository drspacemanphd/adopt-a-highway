variable "env" {
  type        = string
  description = "Environment of the infrastructure"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account id"
  sensitive   = true
}
