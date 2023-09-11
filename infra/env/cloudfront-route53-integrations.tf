# resource "aws_route53_record" "frontend_app_main" {
#   zone_id = aws_route53_zone.frontend_domain.zone_id
#   name    = var.env == "prod" ? "adopt-a-highway.drspacemanphd.com" : "dev-adopt-a-highway.drspacemanphd.com"
#   type    = "A"
#   alias {
#     name                   = aws_cloudfront_distribution.frontend_app.domain_name
#     # Cloudfront Distribution Zone Id
#     zone_id                = "Z2FDTNDATAQYW2"
#     evaluate_target_health = false
#   }
# }

# resource "aws_route53_record" "frontend_app_main_www" {
#   zone_id = aws_route53_zone.frontend_domain.zone_id
#   name    = var.env == "prod" ? "www.adopt-a-highway.drspacemanphd.com" : "www.dev-adopt-a-highway.drspacemanphd.com"
#   type    = "A"
#   alias {
#     name                   = aws_cloudfront_distribution.frontend_app.domain_name
#     # Cloudfront Distribution Zone Id
#     zone_id                = "Z2FDTNDATAQYW2"
#     evaluate_target_health = false
#   }
# }