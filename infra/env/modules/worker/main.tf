resource "cloudflare_workers_script" "litter_api_script" {
  account_id  = var.cloudflare_account_id
  script_name = "litter-api-${var.env}"
  content     = file("${path.root}/../../workers/litter-api/dist/index.js")
  main_module = "index.js"
  bindings = [
    {
      type         = "d1",
      name         = "DB",
      id           = var.d1_litter_db_id,
      namespace_id = "adopt-a-highway-${var.env}"
    },
    {
      type         = "plain_text",
      name         = "ENV",
      text         = var.env,
      namespace_id = "adopt-a-highway-${var.env}",
      id           = "env"
    },
    {
      type         = "plain_text",
      name         = "RUNNING_LOCALLY",
      text         = "false",
      namespace_id = "adopt-a-highway-${var.env}",
      id           = "running_locally"
    },
    {
      type         = "plain_text",
      name         = "version",
      text         = var.commit_hash,
      namespace_id = "adopt-a-highway-${var.env}",
      id           = "version"
    },
    {
      type         = "secret_text",
      name         = "INITIALIZATION_KEY",
      text         = var.initialization_secret
      namespace_id = "adopt-a-highway-${var.env}",
    },
    {
      type         = "secret_text",
      name         = "SUBMIT_KEY",
      text         = var.initialization_secret
      namespace_id = "adopt-a-highway-${var.env}"
    }
  ]
  keep_assets = false
  logpush     = false
  observability = {
    enabled = false
  }
  placement = {
    mode = "smart"
  }
  usage_model = "standard"
}

resource "cloudflare_workers_script_subdomain" "litter_api_subdomain" {
  account_id  = var.cloudflare_account_id
  script_name = "litter-api-${var.env}"
  enabled     = true
  depends_on  = [cloudflare_workers_script.litter_api_script]
}