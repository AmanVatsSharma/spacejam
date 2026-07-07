#!/bin/bash
set -e
source ~/.nvm/nvm.sh
pm2 status
pm2 logs spacejam-api --lines 20 --nostream
curl -s -o /dev/null -w "API HTTP %{http_code}\n" http://localhost:3001/graphql
