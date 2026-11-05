#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost}"

echo "Checking Nginx..."
curl --fail --silent "$BASE_URL/health"
echo

echo "Checking User Service..."
curl --fail --silent "$BASE_URL/users/health"
echo

echo "Checking Product Service..."
curl --fail --silent "$BASE_URL/products/health"
echo

echo "Checking Order Service..."
curl --fail --silent "$BASE_URL/orders/health"
echo

echo "All service health checks passed."
