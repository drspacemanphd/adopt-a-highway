### Required
variable "zone_id" {
  type        = string
  description = "Zone ID of the Hosted Zone for which DNS verification records should be created"
}

### Optional
variable "env" {
  type        = string
  description = "deployment environment"
  default     = "dev"
}
