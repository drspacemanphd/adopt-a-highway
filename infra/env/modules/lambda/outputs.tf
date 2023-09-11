output "lambda_execution_role_name" {
  value = aws_iam_role.lambda_execution_role.name
}

output "lambda_function_name" {
  value = aws_lambda_function.lambda_function.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.lambda_function.arn
}