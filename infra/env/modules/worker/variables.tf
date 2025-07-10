variable "env" {
  type        = string
  description = "Environment of the infrastructure"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account id"
  sensitive   = true
}

variable "d1_litter_db_id" {
  type        = string
  description = "Id of the D1 Litter DB"
}

variable "initialization_secret" {
  type        = string
  description = "secret used as an API key for litter db initialization"
  sensitive   = true
}

variable "commit_hash" {
  type        = string
  description = "Commit hash"
}

