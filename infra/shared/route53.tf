resource "aws_route53_zone" "frontend_domain" {
  name = "drspacemanphd.com"
}

resource "aws_route53_record" "frontend_domain_ns" {
  allow_overwrite = true
  zone_id         = aws_route53_zone.frontend_domain.zone_id
  name            = "drspacemanphd.com"
  type            = "NS"
  ttl             = "172800"
  records         = aws_route53_zone.frontend_domain.name_servers
}

resource "aws_route53_record" "frontend_domain_soa" {
  allow_overwrite = true
  zone_id         = aws_route53_zone.frontend_domain.zone_id
  name            = "drspacemanphd.com"
  type            = "SOA"
  ttl             = "900"
  records         = [
    "ns-1288.awsdns-33.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
  ]
}
