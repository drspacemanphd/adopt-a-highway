terraform {
  required_version = "~> 1.5"
  required_providers {
    aws = {
      version = "~> 5.10"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
}
