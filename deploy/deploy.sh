#!/usr/bin/env bash
# ============================================================
# KPPDF v5.0 — deploy.sh (Synology)
# ============================================================
# Деплой на Synology NAS:
#   1. Сборка Docker-образа (локально или на NAS)
#   2. Копирование архива на NAS (если сборка локально)
#   3. Разворачивание через docker-compose
# ============================================================

set -euo pipefail

# ─── Конфигурация ───────────────────────────────────────────
SYNO_HOST="${SYNO_HOST:-192.168.1.100}"        # IP Synology
SYNO_USER="${SYNO_USER:-admin}"                 # SSH-пользователь
SYNO_PORT="${SYNO_PORT:-22}"                    # SSH-порт
SYNO_PATH="${SYNO_PATH:-/volume1/docker/kppdf50}" # Путь на NAS
BUILD_MODE="${BUILD_MODE:-remote}"              # local | remote
COMPOSE_FILE="deploy/docker-compose.prod.yml"

# ─── Цветной вывод ────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Проверки ──────────────────────────────────────────────
if [ -z "${JWT_SECRET:-}" ]; then
  error "JWT_SECRET не установлен."
  echo "  export JWT_SECRET=your-secret-key"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  error "Файл $COMPOSE_FILE не найден. Запускайте из корня проекта."
  exit 1
fi

# ─── Сборка ────────────────────────────────────────────────
if [ "$BUILD_MODE" = "remote" ]; then
  info "Режим: удалённая сборка на Synology ($SYNO_HOST)"
  info "Создаём директорию на NAS..."
  ssh -p "$SYNO_PORT" "$SYNO_USER@$SYNO_HOST" "mkdir -p $SYNO_PATH"

  info "Копируем проект на NAS (исключая node_modules, .next)..."
  rsync -avz --delete -e "ssh -p $SYNO_PORT" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.db' \
    --exclude='*.db-journal' \
    ./ "$SYNO_USER@$SYNO_HOST:$SYNO_PATH/"

  info "Сборка Docker-образа на NAS..."
  ssh -p "$SYNO_PORT" "$SYNO_USER@$SYNO_HOST" \
    "cd $SYNO_PATH && \
     JWT_SECRET=$JWT_SECRET docker compose -f $COMPOSE_FILE build --no-cache"

elif [ "$BUILD_MODE" = "local" ]; then
  info "Режим: локальная сборка, затем SCP на NAS"
  warn "Локальная сборка не рекомендована — образ будет большим."

  docker build -f deploy/Dockerfile -t kppdf50:latest .

  info "Сохранение образа в архив..."
  docker save kppdf50:latest | gzip > /tmp/kppdf50.tar.gz

  info "Копирование архива на NAS..."
  scp -P "$SYNO_PORT" /tmp/kppdf50.tar.gz "$SYNO_USER@$SYNO_HOST:$SYNO_PATH/image.tar.gz"

  info "Загрузка образа на NAS..."
  ssh -p "$SYNO_PORT" "$SYNO_USER@$SYNO_HOST" \
    "cd $SYNO_PATH && docker load < image.tar.gz && rm image.tar.gz"
else
  error "BUILD_MODE может быть 'local' или 'remote'. Текущее: $BUILD_MODE"
  exit 1
fi

# ─── Деплой ────────────────────────────────────────────────
info "Запуск контейнера на Synology..."
ssh -p "$SYNO_PORT" "$SYNO_USER@$SYNO_HOST" \
  "cd $SYNO_PATH && \
   JWT_SECRET=${JWT_SECRET} docker compose -f $COMPOSE_FILE up -d"

info "Проверка статуса..."
ssh -p "$SYNO_PORT" "$SYNO_USER@$SYNO_HOST" \
  "cd $SYNO_PATH && docker compose -f $COMPOSE_FILE ps"

info "✅ Деплой завершён!"
echo ""
echo "   Приложение: http://$SYNO_HOST:3000"
echo "   Логи:      docker compose -f $COMPOSE_FILE logs -f"
echo "   Остановка: docker compose -f $COMPOSE_FILE down"
