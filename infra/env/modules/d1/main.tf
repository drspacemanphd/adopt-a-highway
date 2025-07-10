resource "cloudflare_d1_database" "adopt_a_highway" {
  account_id            = var.cloudflare_account_id
  name                  = "adopt-a-highway-${var.env}"
  primary_location_hint = "enam"
  provider              = cloudflare
  read_replication = {
    mode = "disabled"
  }
}
