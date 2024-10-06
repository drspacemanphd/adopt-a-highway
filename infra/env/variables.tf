variable "env" {
  type        = string
  description = "deployment environment"
}

variable "commit_hash" {
  type        = string
  description = "commit hash to use when deploying the lambda functions and UI"
}

