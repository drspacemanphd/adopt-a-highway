# ### SSM access
# data "aws_iam_policy_document" "road_scraper_ssm_policy_document" {
#   statement {
#     effect = "Allow"
#     resources = [
#       "*"
#     ]
#     actions = [
#       "ssm:GetParameters",
#     ]
#   }
# }

# resource "aws_iam_policy" "road_scraper_ssm_policy" {
#   name   = "RoadScraper-${var.env}-ssm-policy-${var.env}"
#   policy = data.aws_iam_policy_document.road_scraper_ssm_policy_document.json
# }

# resource "aws_iam_role_policy_attachment" "road_scraper_ssm_policy_attachment" {
#   role       = aws_iam_role.road_scraper_role.name
#   policy_arn = aws_iam_policy.road_scraper_ssm_policy.arn
# }



# ### CRON Schedule
# resource "aws_cloudwatch_event_rule" "road_scraper_cron" {
#   name                = "road-scraper-event-cron-${var.env}"
#   schedule_expression = "cron(0 12 * * ? *)"
#   description         = "Cron trigger for Road Scraper Lambda"
# }

# resource "aws_cloudwatch_event_target" "road_scraper_target" {
#   rule = aws_cloudwatch_event_rule.road_scraper_cron.name
#   arn  = aws_lambda_function.road_scraper_function.arn 
# }

# resource "aws_lambda_permission" "road_scraper_cron_permissions" {
#   statement_id  = "AllowCloudwatchEventBridge" 
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.road_scraper_function.function_name
#   principal     = "events.amazonaws.com"
#   source_arn    = aws_cloudwatch_event_rule.road_scraper_cron.arn
# }