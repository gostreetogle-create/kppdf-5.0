#!/usr/bin/env bash
# deploy-v5.sh — Complete deployment script for KPPDF v5.0 on Ubuntu server
# Run: bash deploy-v5.sh
# Requires: .env file in $PROJECT_DIR with DATABASE_URL, JWT_SECRET, DADATA_API_KEY
set -euo pipefail

PROJECT_DIR="/home/tiit/kppdf-5.0"
PG_CONTAINER="kppdf50-postgres"
NETWORK="kppdf50-net"
V4_COMPOSE="/opt/kppdf-4.0/docker-compose.prod.yml"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd "$PROJECT_DIR"

# ─── 1. Load .env ──────────────────────────────────────────
if [ ! -f .env ]; then
  error ".env file not found at $PROJECT_DIR/.env"
  error "Create it with three variables: DATABASE_URL, JWT_SECRET, DADATA_API_KEY"
  error "See deploy/README or ask admin for values"
  exit 1
fi
info "Loading .env..."
set -a; source .env; set +a
echo "  DATABASE_URL loaded: ${DATABASE_URL:0:30}..."
echo "  JWT_SECRET loaded:   ${JWT_SECRET:0:10}..."
echo "  DADATA_API_KEY loaded: ${DADATA_API_KEY:0:10}..."

# ─── 2. Build + deploy v5 ─────────────────────────────────
info "Building Docker image..."
docker compose --env-file .env -f deploy/docker-compose.prod.yml build 2>&1
echo "  Build complete"

info "Running Prisma db push..."
docker compose --env-file .env -f deploy/docker-compose.prod.yml run --rm --entrypoint sh kppdf50 \
  -c "./node_modules/.bin/prisma db push --accept-data-loss" 2>&1
echo "  Schema synced"

info "Starting v5..."
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d 2>&1
echo "  v5 started"

# ─── 3. Stop v4 (if exists) ────────────────────────────────
info "Stopping v4 containers (if running)..."
docker stop kppdf40-backend kppdf40-mongodb kppdf40-chromadb 2>/dev/null && docker rm kppdf40-backend kppdf40-mongodb kppdf40-chromadb 2>/dev/null || true
echo "  Done"

# ─── 4. Update Nginx ───────────────────────────────────────
info "Updating Nginx config..."
sudo tee /etc/nginx/sites-enabled/kppdf > /dev/null << 'NGINX'
server {
    listen 80;
    server_name sport-set.ru www.sport-set.ru;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    120s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 302 365d;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    location /uploads {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    access_log /var/log/nginx/kppdf50_access.log;
    error_log  /var/log/nginx/kppdf50_error.log warn;
}
NGINX
sudo nginx -s reload 2>&1
echo "  Nginx updated and reloaded"

# ─── 5. Check status ───────────────────────────────────────
info "=== Container status ==="
docker ps --filter "network=$NETWORK" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1

info "=== Testing app ==="
sleep 3
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/ 2>&1 || echo "Retrying..."
sleep 2
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/ 2>&1 || echo "Not ready yet"

echo ""
info "✅ DONE! Check http://sport-set.ru"
