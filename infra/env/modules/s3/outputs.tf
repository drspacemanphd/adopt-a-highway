output "frontend_app_bucket_domain_name" {
  value = aws_s3_bucket.frontend_app.bucket_regional_domain_name
}

output "frontend_app_bucket_name" {
  value = aws_s3_bucket.frontend_app.bucket
}

output "flagged_submissions_bucket_name" {
  value = aws_s3_bucket.flagged_submissions_bucket.bucket
}

output "flagged_submissions_bucket_arn" {
  value = aws_s3_bucket.flagged_submissions_bucket.arn
}

output "image_submissions_bucket_name" {
  value = aws_s3_bucket.image_submissions_bucket.bucket
}

output "image_submissions_bucket_arn" {
  value = aws_s3_bucket.image_submissions_bucket.arn
}

output "rejected_submissions_bucket_name" {
  value = aws_s3_bucket.rejected_submissions_bucket.bucket
}

output "rejected_submissions_bucket_arn" {
  value = aws_s3_bucket.rejected_submissions_bucket.arn
}

output "litter_images_bucket_name" {
  value = aws_s3_bucket.litter_images_bucket.bucket
}

output "litter_images_bucket_arn" {
  value = aws_s3_bucket.litter_images_bucket.arn
}