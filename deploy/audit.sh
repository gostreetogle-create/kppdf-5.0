#!/bin/bash
# Audit script for server
echo "=== NGINX TEST ==="
curl -sI -H "Host: sport-set.ru" http://127.0.0.1/ 2>&1 | head -15

echo "=== WHAT NGINX SERVES ==="
curl -s -H "Host: sport-set.ru" http://127.0.0.1/ 2>&1 | head -3

echo "=== PORTS ==="
ss -tlnp 2>/dev/null

echo "=== DOCKER NETWORK ==="
docker network inspect kppdf50-net --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}' 2>/dev/null

echo "=== OLD V4 CONTAINERS ==="
docker ps -a --filter "name=kppdf40" --format "{{.Names}} {{.Status}} {{.Image}}" 2>/dev/null

echo "=== ALL CONTAINERS ==="
docker ps -a --format "{{.Names}} {{.Status}} {{.Ports}} {{.Image}}" 2>/dev/null

echo "=== /opt contents ==="
ls -la /opt/ 2>/dev/null

echo "=== CLOUDFLARE TUNNEL ROUTES ==="
cloudflared tunnel route dns b6e27272-24c3-4551-a4f5-30031f0798cb sport-set.ru 2>&1 || true
