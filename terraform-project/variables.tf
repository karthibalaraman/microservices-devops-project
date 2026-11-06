variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix used for project resources"
  type        = string
  default     = "microservices-devops"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "c7i-flex.large"
}

variable "key_pair_name" {
  description = "Name of an existing EC2 key pair in the selected AWS region"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "Public IPv4 CIDR ranges allowed to SSH to the EC2 instance"
  type        = list(string)
}
