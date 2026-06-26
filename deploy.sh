#!/bin/bash
set -e
source ~/.nvm/nvm.sh

echo "=== [1/6] Extracting latest code ==="
# Kill any processes locking the directory
pm2 delete all || true
if [ -d "/home/ubuntu/spacejam" ]; then
  cd /home/ubuntu/spacejam && npx nx daemon --stop || true
fi
sudo rm -rf /home/ubuntu/spacejam
mkdir -p /home/ubuntu/spacejam
tar -xzf /home/ubuntu/update.tar.gz -C /home/ubuntu/spacejam

echo ""
echo "=== [2/6] Writing production .env files ==="
cat > /home/ubuntu/spacejam/apps/web/.env << 'EOF'
NEXT_PUBLIC_GRAPHQL_HTTP_URL=http://localhost:3001/api/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/api/graphql
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
EOF
echo "Frontend .env written"

cat > /home/ubuntu/spacejam/apps/api/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://spacejam:spacejam@localhost:5432/spacejam
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-production-jwt-key-change-me
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=super-secret-production-refresh-key-change-me
CORS_ORIGIN=http://localhost:3000
EOF
echo "API .env written"

echo ""
echo "=== [3/6] Clearing stale build caches ==="
rm -rf /home/ubuntu/spacejam/apps/web/.next
rm -rf /home/ubuntu/spacejam/dist/apps/api

echo ""
echo "=== [4/6] Installing dependencies ==="
cd /home/ubuntu/spacejam
npm install --prefer-offline 2>&1 | tail -5

echo ""
echo "=== [5/6] Building apps ==="
npx nx build api
npx nx build web

echo ""
echo "=== [6/6] Starting / restarting via PM2 ==="
# Try restart first; if not found, start fresh

# API
if pm2 describe spacejam-api > /dev/null 2>&1; then
  pm2 restart spacejam-api
else
  pm2 start "node dist/apps/api/main.js" --name spacejam-api --cwd /home/ubuntu/spacejam
fi

# WEB
if pm2 describe spacejam-web > /dev/null 2>&1; then
  pm2 restart spacejam-web
else
  pm2 start "npx nx start web" --name spacejam-web --cwd /home/ubuntu/spacejam
fi

pm2 save

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Done! Checking if app responds ==="
sleep 3
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000 || echo "App not yet responding on port 3000"
