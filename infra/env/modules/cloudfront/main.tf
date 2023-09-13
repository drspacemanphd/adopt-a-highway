data "aws_cloudfront_cache_policy" "cache_optimized_policy" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "s3cors_policy" {
  name = "Managed-UserAgentRefererHeaders"
}

data "aws_cloudfront_response_headers_policy" "response_headers_policy" {
  name = "Managed-CORS-with-preflight-and-SecurityHeadersPolicy"
}

resource "aws_cloudfront_origin_access_control" "frontend_app_oac" {
  name                              = "adopt-a-highway-${var.env}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend_app" {
  custom_error_response {
    error_caching_min_ttl = 86400
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html" 
  }

  custom_error_response {
    error_caching_min_ttl = 86400
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html" 
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods             = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id            = data.aws_cloudfront_cache_policy.cache_optimized_policy.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.s3cors_policy.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.response_headers_policy.id
    target_origin_id           = "adopt-a-highway-${var.env}"
    viewer_protocol_policy     = "redirect-to-https" 
  }

  origin {
    domain_name              = var.bucket_regional_domain_name
    origin_id                = "adopt-a-highway-${var.env}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_app_oac.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  default_root_object = "index.html"
  enabled             = true
  aliases             = var.env == "prod" ? [ "www.adopt-a-highway.drspacemanphd.com", "adopt-a-highway.drspacemanphd.com" ] : [ "dev-adopt-a-highway.drspacemanphd.com", "www.dev-adopt-a-highway.drspacemanphd.com" ]
  
  viewer_certificate {
    acm_certificate_arn      = var.viewer_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
