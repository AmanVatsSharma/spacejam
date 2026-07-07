#!/bin/bash
set -e
source ~/.nvm/nvm.sh
cd /home/ubuntu/spacejam
npm install --legacy-peer-deps
export NX_DAEMON=false
export NX_REJECT_UNKNOWN_LOCAL_CACHE=0
npx nx build api
pm2 delete spacejam-api || true
pm2 start "apps/api/dist/main.js" --name spacejam-api --cwd /home/ubuntu/spacejam
pm2 save
pm2 logs spacejam-api --lines 20 --nostream
curl -s -o /dev/null -w "API HTTP %{http_code}\n" http://localhost:3001/graphql
