source ~/.nvm/nvm.sh
npm install -g pnpm
sed -i 's/npm install/pnpm install/g' /home/ubuntu/deploy.sh
bash /home/ubuntu/deploy.sh
