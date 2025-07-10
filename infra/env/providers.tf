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
  backend "s3" {
    region = "us-east-1"
    bucket = "ada-terraform-bucket"
    key    = "terraform.tfstate"
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "cloudflare" {
  api_token = "9OZmbQddO1n5bKuN-xf7nDg-5VdjfD3DR8s1n6XR"
}
