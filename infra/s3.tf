### Flagged Submissions
resource "aws_s3_bucket" "flagged_submissions_bucket" {
  bucket = "ada-flagged-submissions-${var.env}"
}

resource "aws_s3_bucket_public_access_block" "flagged_submissions_public_access_block" {
  bucket                  = aws_s3_bucket.flagged_submissions_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flagged_submissions_lifecycle" {
  bucket = aws_s3_bucket.flagged_submissions_bucket.id
  rule {
    id     = "flagged-${var.env}-transition"
    status = "Enabled"
    expiration {
      days = 180
    }
    transition {
      storage_class = "ONEZONE_IA"
      days          = 30 
    }
  }
}


### Image Submissions
resource "aws_s3_bucket" "image_submissions_bucket" {
  bucket = "ada-image-submissions-${var.env}"
}

resource "aws_s3_bucket_public_access_block" "image_submissions_public_access_block" {
  bucket                  = aws_s3_bucket.image_submissions_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "image_submissions_lifecycle" {
  bucket = aws_s3_bucket.image_submissions_bucket.id
  rule {
    id     = "image-${var.env}-transition"
    status = "Enabled"
    expiration {
      days = 180
    }
    transition {
      storage_class = "ONEZONE_IA"
      days          = 30 
    }
  }
}


### Litter Images
resource "aws_s3_bucket" "litter_images_bucket" {
  bucket = "ada-litter-images-${var.env}"
}

resource "aws_s3_bucket_public_access_block" "litter_images_public_access_block" {
  bucket                  = aws_s3_bucket.litter_images_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "litter_images_bucket_policy" {
  statement {
    sid    = "PublicRead"
    effect = "Allow"
    actions = [
      "s3:Get*",
      "s3:List*"
    ]
    resources = [
      aws_s3_bucket.litter_images_bucket.arn,
      "${aws_s3_bucket.litter_images_bucket.arn}/*"
    ]
    principals {
      type        = "*"
      identifiers = [ "*" ]
    }
  }
}

resource "aws_s3_bucket_policy" "litter-images-bucket-policy" {
  bucket = aws_s3_bucket.litter_images_bucket.id
  policy = data.aws_iam_policy_document.litter_images_bucket_policy.json
  depends_on = [ aws_s3_bucket_public_access_block.litter_images_public_access_block ]
}

resource "aws_s3_bucket_acl" "litter-images-bucket-acl" {
  bucket = aws_s3_bucket.litter_images_bucket.id
  acl    = "private"
  depends_on = [ aws_s3_bucket_public_access_block.litter_images_public_access_block ]
}

resource "aws_s3_bucket_lifecycle_configuration" "litter_lifecycle" {
  bucket = aws_s3_bucket.litter_images_bucket.id
  rule {
    id     = "litter-${var.env}-transition"
    status = "Enabled"
    expiration {
      days = 3650
    }
    transition {
      storage_class = "ONEZONE_IA"
      days          = 365
    }
  }
}


### Rejected Submissions
resource "aws_s3_bucket" "rejected_submissions_bucket" {
  bucket = "ada-rejected-submissions-${var.env}"
}

resource "aws_s3_bucket_public_access_block" "rejected_submissions_public_access_block" {
  bucket                  = aws_s3_bucket.rejected_submissions_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "rejected_submissions_lifecycle" {
  bucket = aws_s3_bucket.rejected_submissions_bucket.id
  rule {
    id     = "rejected-${var.env}-transition"
    status = "Enabled"
    expiration {
      days = 180
    }
    transition {
      storage_class = "ONEZONE_IA"
      days          = 30 
    }
  }
}

