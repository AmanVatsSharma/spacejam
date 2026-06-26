#!/bin/bash
set -e
source ~/.nvm/nvm.sh

echo "=== [1/6] Extracting latest code ==="
sudo rm -rf /home/ubuntu/spacejam
mkdir -p /home/ubuntu/spacejam
tar -xzf /home/ubuntu/update.tar.gz -C /home/ubuntu/spacejam

echo ""
echo "=== [2/6] Writing production .env for frontend ==="
cat > /home/ubuntu/spacejam/apps/web/.env << 'EOF'
NEXT_PUBLIC_GRAPHQL_HTTP_URL=http://localhost:3001/api/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/api/graphql
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
EOF
echo "Frontend .env written:"
cat /home/ubuntu/spacejam/apps/web/.env

echo ""
echo "=== [3/6] Clearing stale Next.js build cache ==="
rm -rf /home/ubuntu/spacejam/apps/web/.next

echo ""
echo "=== [4/6] Installing dependencies ==="
cd /home/ubuntu/spacejam
npm install --prefer-offline 2>&1 | tail -5

echo ""
echo "=== [5/6] Building frontend ==="
npx nx build web

echo ""
echo "=== [6/6] Starting / restarting via PM2 ==="
# Try restart first; if not found, start fresh
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
