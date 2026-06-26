#!/bin/bash
sudo -u postgres psql -c "ALTER ROLE spacejam WITH PASSWORD 'spacejam';"
source ~/.nvm/nvm.sh
pm2 restart spacejam-api
