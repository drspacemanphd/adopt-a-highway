output "image_processing_queue_url" {
  value = aws_sqs_queue.image_processing_queue.url
}

output "image_processing_queue_arn" {
  value = aws_sqs_queue.image_processing_queue.arn
}