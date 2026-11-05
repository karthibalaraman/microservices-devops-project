EC2 deployment files:
1. Copy docker-compose.ecr.yml to /opt/microservices/docker-compose.yml
2. Copy nginx/nginx.conf to /opt/microservices/nginx.conf
3. Copy nginx/html/index.html to /opt/microservices/html/index.html
4. Set USER_IMAGE, PRODUCT_IMAGE and ORDER_IMAGE to full ECR image URIs.
5. Authenticate to ECR with the EC2 instance role.
6. Run: docker compose up -d
Keep these files and persistent named volumes between releases.
