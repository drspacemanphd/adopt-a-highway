output "cloudfront_frontend_distribution_domain_name" {
  value = aws_cloudfront_distribution.frontend_app.domain_name
}

output "cloudfront_frontend_distribution_id" {
  value = aws_cloudfront_distribution.frontend_app.id
}