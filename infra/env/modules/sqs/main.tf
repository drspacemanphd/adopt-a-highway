resource aws_sqs_queue image_processing_queue {
  name                       = "ImageProcessingQueue-${var.env}"
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 3600
  redrive_allow_policy = jsonencode({
    redrivePermission = "denyAll"
  })
}
