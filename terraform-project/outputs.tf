output "ec2_instance_id" {
  description = "ID of the application EC2 instance"
  value       = aws_instance.app.id
}

output "ec2_public_ip" {
  description = "Public IPv4 address of the application EC2 instance"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the application EC2 instance"
  value       = aws_instance.app.public_dns
}

output "aws_account_id" {
  description = "AWS account ID used by this deployment"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS region used by this deployment"
  value       = var.aws_region
}

output "ecr_repository_urls" {
  description = "ECR repository URLs for the three microservices"
  value = {
    for service, repository in aws_ecr_repository.services :
    service => repository.repository_url
  }
}
