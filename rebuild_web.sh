#!/bin/bash
set -e
source ~/.nvm/nvm.sh
cd /home/ubuntu/spacejam/apps/web
export NX_DAEMON=false
export NX_REJECT_UNKNOWN_LOCAL_CACHE=0
npm run build
pm2 delete spacejam-web 2>/dev/null || true
cd /home/ubuntu/spacejam
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static 2>/dev/null || true
cp -r apps/web/public apps/web/.next/standalone/apps/web/public 2>/dev/null || true
PORT=3000 HOSTNAME=0.0.0.0 pm2 start "apps/web/.next/standalone/apps/web/server.js" --name spacejam-web --cwd /home/ubuntu/spacejam
pm2 save
echo "Successfully rebuilt and restarted spacejam-web"
