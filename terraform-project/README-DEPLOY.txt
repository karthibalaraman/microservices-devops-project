MICROSERVICES DEVOPS - FIXED TERRAFORM CONFIGURATION

1. Keep all .tf files and terraform.tfvars in the same terraform folder.
2. Confirm that the EC2 key pair named "Ubuntu" exists in ap-south-1.
3. Confirm the IP in ssh_allowed_cidrs is your current public IPv4 address.
   If Jenkins must SSH to this EC2 instance from a different public IP,
   add its public IPv4 CIDR as another list item.
4. This configuration uses the DEFAULT VPC in the selected AWS region.
   If the default VPC was deleted, Terraform will fail to find it. Restore
   or create a VPC/subnet and update the configuration before applying.
5. Run from this folder:

   terraform init
   terraform fmt -recursive
   terraform validate
   terraform plan
   terraform apply

6. Review the plan carefully. Type yes only when the resources and region
   are correct.
7. After deployment, run:

   terraform output

8. To delete resources created by this configuration when finished:

   terraform destroy

IMPORTANT:
- Never commit terraform.tfvars, AWS access keys, or private .pem files to Git.
- HTTP port 80 is public. SSH port 22 is restricted to ssh_allowed_cidrs.
- EC2 receives ECR read-only permissions. Jenkins needs separate ECR push
  permissions on the Jenkins execution identity.
- This Terraform creates ECR repositories, an EC2 IAM role/profile,
  a security group, and one EC2 instance. It does not create a Jenkins server.
