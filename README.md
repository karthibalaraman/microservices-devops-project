# Three-Microservice Demo Application

A small, working demonstration application created for the DevOps assignment. It contains:
- User Service
- Product Service
- Order Service
- Nginx reverse proxy
- Docker Compose
- Persistent JSON-file storage using named Docker volumes

The application is intentionally simple so the DevOps work (GitHub, Docker, Jenkins, Terraform, ECR, EC2, Prometheus and Grafana) remains the main assignment.

## Requirements

- Docker Engine
- Docker Compose v2
- Git (optional)

## Run locally

From this project directory:

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Open `http://localhost` in a browser.

Run health checks:

```bash
bash scripts/smoke-test.sh
```

## API endpoints

Nginx routes requests to the individual services:

| Service | Public URL | Internal API |
|---|---|---|
| User | `/users/api/users` | `http://user-service:3000/api/users` |
| Product | `/products/api/products` | `http://product-service:3000/api/products` |
| Order | `/orders/api/orders` | `http://order-service:3000/api/orders` |

Health:
- `/users/health`
- `/products/health`
- `/orders/health`
- `/health` (Nginx)

### Create a user

```bash
curl -X POST http://localhost/users/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com"}'
```

### List users

```bash
curl http://localhost/users/api/users
```

### Create a product

```bash
curl -X POST http://localhost/products/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Keyboard","price":799,"description":"USB keyboard"}'
```

### Create an order

Use actual IDs returned by the User and Product APIs:

```bash
curl -X POST http://localhost/orders/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","productId":"PRODUCT_ID","quantity":2}'
```

### Delete a record

```bash
curl -X DELETE http://localhost/users/api/users/USER_ID
```

Equivalent endpoints are available for products and orders.

## Data persistence

Each service stores its records in a separate JSON file under `/app/data`, mounted to a named Docker volume:
- `user-data`
- `product-data`
- `order-data`

`docker compose down` preserves named volumes. To delete all demo records permanently:

```bash
docker compose down -v
```

**Warning:** `-v` deletes the named data volumes and all records stored in them.

## Useful commands

```bash
docker compose ps
docker compose logs -f
docker compose logs -f user-service
docker compose restart
docker compose down
```

## Build images separately for ECR

Replace `AWS_ACCOUNT_ID` and `AWS_REGION` with your own values:

```bash
docker build -t user-service:1 ./user-service
docker build -t product-service:1 ./product-service
docker build -t order-service:1 ./order-service
```

Tag and push to the three ECR repositories using the registry login and image URIs from your AWS account. Use immutable, versioned tags.

## EC2 deployment

Use `docker-compose.ecr.yml` as the EC2 deployment Compose file. Copy the Nginx configuration to `nginx.conf` and the static site to `html/index.html` on EC2. Set the three image variables to their full ECR image URIs, authenticate with the EC2 instance role, then run:

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
```

The EC2 instance role needs ECR pull permissions. Do not put AWS access keys in the Compose file or repository.

## Limitations

This is an educational demo, not a production business application:
- The services are independent and do not call one another.
- Order creation does not validate that the referenced user or product exists.
- Data is stored in JSON files, not a managed database.
- There is no authentication or authorization.
- The three services use separate persistent volumes.
- Add application-specific tests and production security controls before real-world use.

## Suggested repository contents

Keep the service folders, `nginx/`, `docker-compose.yml`, `docker-compose.ecr.yml`, `Jenkinsfile`, `terraform/`, `scripts/` and this README in your GitHub repository. Never commit `.env` files, private keys, AWS credentials or Terraform state.
