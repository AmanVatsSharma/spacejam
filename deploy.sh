#!/bin/bash
set -e
source ~/.nvm/nvm.sh

echo "=== [1/5] Extracting latest code ==="
sudo rm -rf /home/ubuntu/spacejam
mkdir -p /home/ubuntu/spacejam
tar -xzf /home/ubuntu/update.tar.gz -C /home/ubuntu/spacejam

echo ""
echo "=== [2/5] Writing production .env for frontend ==="
cat > /home/ubuntu/spacejam/apps/web/.env << 'EOF'
NEXT_PUBLIC_GRAPHQL_HTTP_URL=http://localhost:3001/api/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/api/graphql
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
EOF
echo "Frontend .env written:"
cat /home/ubuntu/spacejam/apps/web/.env

echo ""
echo "=== [3/5] Installing dependencies ==="
cd /home/ubuntu/spacejam
npm install

echo ""
echo "=== [4/5] Building frontend ==="
npx nx build web

echo ""
echo "=== [5/5] Restarting PM2 ==="
pm2 restart spacejam-web 2>/dev/null || pm2 start "npx nx start web" --name spacejam-web --cwd /home/ubuntu/spacejam
pm2 save

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Done! App should be live on port 3000 ==="
