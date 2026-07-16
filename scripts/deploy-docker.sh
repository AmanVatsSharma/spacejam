#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# SpaceJam — Docker Deploy Script
# Builds and deploys the web app on the production server.
#
# Usage:  ./scripts/deploy-docker.sh
#
# What it does:
#   1. Syncs source code to server via git archive
#   2. Builds the Docker image ON THE SERVER (Linux — no Windows paths)
#   3. Starts the container, replacing the old one
#   4. Stops PM2 web process (API stays on PM2)
# ════════════════════════════════════════════════════════════════
set -euo pipefail

SSH_KEY="${SSH_KEY:-C:\\Users\\ASUS TUF A15\\Desktop\\DevOPS\\AWS_Key_Pairs\\Ap-south-2.pem}"
HOST="ubuntu@ec2-98-130-45-181.ap-south-2.compute.amazonaws.com"
REMOTE_DIR="/home/ubuntu/spacejam"

echo "▶ 1/5  Creating source archive..."
git archive --format=tar.gz -o /tmp/spacejam-src.tar.gz HEAD

echo "▶ 2/5  Uploading to server..."
scp -i "$SSH_KEY" -o ConnectTimeout=30 /tmp/spacejam-src.tar.gz "$HOST:/tmp/spacejam-src.tar.gz"

echo "▶ 3/5  Building Docker image on server..."
ssh -i "$SSH_KEY" -o ConnectTimeout=60 "$HOST" bash -s << 'REMOTE'
set -euo pipefail
cd /home/ubuntu/spacejam

echo "  Extracting source..."
tar -xzf /tmp/spacejam-src.tar.gz -C /home/ubuntu/spacejam-src 2>/dev/null || {
  mkdir -p /home/ubuntu/spacejam-src
  tar -xzf /tmp/spacejam-src.tar.gz -C /home/ubuntu/spacejam-src
}
rm -f /tmp/spacejam-src.tar.gz

echo "  Stopping PM2 web process (API stays running)..."
. ~/.nvm/nvm.sh 2>/dev/null
pm2 stop spacejam-web 2>/dev/null || true

echo "  Building Docker image..."
cd /home/ubuntu/spacejam-src
docker compose -f apps/web/docker-compose.yml build --no-cache

echo "▶ 4/5  Starting container..."
docker compose -f apps/web/docker-compose.yml up -d

echo "  Waiting for health check..."
sleep 5
for i in $(seq 1 12); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' spacejam-web 2>/dev/null || echo "none")
  if [ "$STATUS" = "healthy" ]; then
    echo "  ✓ Container is healthy"
    break
  fi
  echo "  Waiting... ($i/12, status: $STATUS)"
  sleep 5
done

echo "▶ 5/5  Verifying..."
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/signin 2>/dev/null)
echo "  /signin → HTTP $HTTP_CODE"

# Clean up old images
docker image prune -f 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════"
echo "✓ Deploy complete!"
echo "  Container: spacejam-web"
echo "  URL: https://spacejam.vedpragya.com"
echo "  Logs: docker logs -f spacejam-web"
echo "  Stop: docker stop spacejam-web && pm2 restart spacejam-web"
echo "═══════════════════════════════════════════"
REMOTE

echo "Done."
