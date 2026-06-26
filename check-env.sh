#!/bin/bash
set -e
source ~/.nvm/nvm.sh 2>/dev/null || true

echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "pm2 not found or no processes"

echo ""
echo "=== Docker containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "docker not available"

echo ""
echo "=== Checking .env file ==="
cat /home/ubuntu/spacejam/apps/web/.env 2>/dev/null || echo ".env not found"

echo ""
echo "=== Checking DB users via docker ==="
POSTGRES_CONTAINER=$(docker ps --filter name=postgres -q 2>/dev/null | head -1)
if [ -n "$POSTGRES_CONTAINER" ]; then
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "SELECT email, name, role, \"emailVerified\", \"isActive\" FROM users;" 2>/dev/null || \
  docker exec "$POSTGRES_CONTAINER" psql -U spacejam -d spacejam -c "SELECT email, name, role FROM users;" 2>/dev/null || \
  echo "Could not query users table"
else
  echo "No postgres docker container found"
  sudo -u postgres psql -c "SELECT email, name, role FROM users;" 2>/dev/null || echo "Could not query via local postgres"
fi

echo ""
echo "=== NestJS API env ==="
cat /home/ubuntu/spacejam/apps/api/.env 2>/dev/null || echo "No API .env found"
