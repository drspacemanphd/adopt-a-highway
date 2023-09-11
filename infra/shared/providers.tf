terraform {
  required_version = "~> 1.5"
  required_providers {
    aws = {
      version = "~> 5.10"
    }
  }
  backend "s3" {
    region = "us-east-1"
    bucket = "ada-terraform-bucket"
    key    = "terraform.tfstate"
  }
}

provider aws {
  region = "us-east-1"
}
