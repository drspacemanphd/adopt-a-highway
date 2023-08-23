resource "aws_cloudwatch_event_rule" "road_scraper_cron" {
  name                = "road-scraper-event-cron-${var.env}"
  schedule_expression = "cron(0 12 * * ? *)"
  description         = "Cron trigger for Road Scraper Lambda"
}

resource "aws_cloudwatch_event_target" "road_scraper_target" {
  rule = aws_cloudwatch_event_rule.road_scraper_cron.name
  arn  = aws_lambda_function.road_scraper_function.arn 
}

resource "aws_lambda_permission" "road_scraper_cron_permissions" {
  statement_id  = "AllowCloudwatchEventBridge" 
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.road_scraper_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.road_scraper_cron.arn
}