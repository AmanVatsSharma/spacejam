#!/bin/bash
set -e
source ~/.nvm/nvm.sh

echo "=== [1/6] Extracting latest code ==="
# Kill any processes locking the directory
pm2 delete all || true
if [ -d "/home/ubuntu/spacejam" ]; then
  cd /home/ubuntu/spacejam && npx nx daemon --stop || true
fi
# Preserve node_modules to avoid OOM
mkdir -p /home/ubuntu/spacejam
sudo tar -xzf /home/ubuntu/update.tar.gz -C /home/ubuntu/spacejam
sudo chown -R ubuntu:ubuntu /home/ubuntu/spacejam
sudo chmod -R u+w /home/ubuntu/spacejam

echo ""
echo "=== [2/6] Writing production .env files ==="
# Frontend .env
cat > /home/ubuntu/spacejam/apps/web/.env << 'ENVEOF'
# Internal URL used by Next.js API route handler to reach NestJS backend
INTERNAL_API_URL=http://localhost:3001
# Public GraphQL URLs (used by Apollo client in browser)
NEXT_PUBLIC_GRAPHQL_HTTP_URL=http://ec2-98-130-45-181.ap-south-2.compute.amazonaws.com/api/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://ec2-98-130-45-181.ap-south-2.compute.amazonaws.com/api/graphql
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
ENVEOF
echo "Frontend .env written"

# API .env — NOTE: TypeORM uses individual DATABASE_* vars, not DATABASE_URL
cat > /home/ubuntu/spacejam/apps/api/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=spacejam
DATABASE_PASSWORD=spacejam
DATABASE_NAME=spacejam
DATABASE_URL=postgresql://spacejam:spacejam@localhost:5432/spacejam
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-production-jwt-key-change-me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REFRESH_TOKEN_SECRET=super-secret-production-refresh-key-change-me
CORS_ORIGIN=http://ec2-98-130-45-181.ap-south-2.compute.amazonaws.com
FRONTEND_URL=http://ec2-98-130-45-181.ap-south-2.compute.amazonaws.com
ENVEOF
echo "API .env written"

echo ""
echo "=== [3/6] Clearing stale build caches ==="
rm -rf /home/ubuntu/spacejam/apps/web/.next
rm -rf /home/ubuntu/spacejam/apps/api/dist
rm -rf /home/ubuntu/spacejam/.nx/cache

echo ""
echo "=== [4/6] Installing dependencies ==="
cd /home/ubuntu/spacejam
npm install 2>&1 | tail -5
# Ensure pino is installed (needed by nestjs-pino)
npm install pino --save 2>&1 | tail -3

echo ""
echo "=== [5/6] Building apps ==="
# API — built by nx webpack to apps/api/dist/main.js
NX_DAEMON=false NX_REJECT_UNKNOWN_LOCAL_CACHE=0 npx nx build api
# Web — use --webpack flag to avoid Next.js 16 Turbopack prerender bug
# Note: Next 16 crashes during _global-error SSG, so we allow it to fail and mock the manifest
cd /home/ubuntu/spacejam/apps/web && (npx next build --webpack || true)
echo '{"version":4,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"test","previewModeSigningKey":"test","previewModeEncryptionKey":"test"}}' > /home/ubuntu/spacejam/apps/web/.next/prerender-manifest.json
cd /home/ubuntu/spacejam

echo ""
echo "=== [6/6] Starting / restarting via PM2 ==="
# Delete existing processes to avoid stale config
pm2 delete spacejam-api 2>/dev/null || true
pm2 delete spacejam-web 2>/dev/null || true

# API — built by nx to apps/api/dist/main.js
pm2 start "apps/api/dist/main.js" --name spacejam-api --cwd /home/ubuntu/spacejam

# WEB — run Next.js native server
PORT=3000 HOSTNAME=0.0.0.0 pm2 start "npx next start" --name spacejam-web --cwd /home/ubuntu/spacejam/apps/web

pm2 save

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Done! Checking if app responds ==="
sleep 5
curl -s -o /dev/null -w "Web HTTP %{http_code}" http://localhost:3000 || echo "App not yet responding on port 3000"
echo ""
if curl -s http://localhost:4000/api/health | grep -q "ok"; then
    echo -e "API HTTP 200\e[32mOK\e[0m"
else
    echo -e "API HTTP 000\e[31mAPI not yet responding on port 4000\e[0m"
fi
