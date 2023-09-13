resource "aws_cognito_user_pool" "user_pool" {
  name = "adoptahighway-userpool-${var.env}"

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
    invite_message_template {
      email_subject = "Thanks for trying out Adopt-A-Highway!"
      email_message = "Hi There! Thanks for helping keep Delaware clean! Your username is {username} and your temporary password is {####}."
      sms_message   = "Your username is {username} and temporary password is {####}." 
    }
  }

  auto_verified_attributes = [ "email" ]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true
    string_attribute_constraints {
      max_length = 2048
      min_length = 0
    }
  }

  username_attributes = [ "email" ]
  username_configuration {
    case_sensitive = false
  }

  verification_message_template {
    email_subject = "Your verification code"
    email_message = "Hi There! Thanks for helping keep Delaware clean! Your verification code is {####}."
    sms_message   = "Your verification code is {####}."
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name                    = "adoptahighway-userpoolclient-${var.env}"
  user_pool_id            = aws_cognito_user_pool.user_pool.id
  auth_session_validity   = 3
  enable_token_revocation = true
  refresh_token_validity  = 30
}

resource "aws_cognito_user_pool_client" "user_pool_web_client" {
  name                    = "adoptahighway-userpoolwebclient-${var.env}"
  user_pool_id            = aws_cognito_user_pool.user_pool.id
  auth_session_validity   = 3
  enable_token_revocation = true
  refresh_token_validity  = 30
}

resource "aws_cognito_identity_pool" "identity_pool" {
  identity_pool_name               = "adoptahighway-identitypool-${var.env}"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.user_pool_client.id
    provider_name           = aws_cognito_user_pool.user_pool.endpoint
    server_side_token_check = false
  }

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.user_pool_web_client.id
    provider_name           = aws_cognito_user_pool.user_pool.endpoint
    server_side_token_check = false
  }
}