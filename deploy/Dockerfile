# ============================================================
# KPPDF v5.0 — Dockerfile (Next.js 16 + Prisma + SQLite)
# ============================================================
# Multi-stage сборка:
#   deps    — установка production-зависимостей
#   builder — полная сборка + Prisma Client + миграции + seed
#   runner  — минимальный образ для запуска
# ============================================================

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Build + Prisma migrations ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Генерируем Prisma Client
RUN npx prisma generate && \
    echo '--- generated files ---' && \
    find src/generated -type f 2>&1 | head -30 && \
    echo '--- end ---'

# Создаём БД со схемой (миграция) — seed-файл для runtime
ENV DATABASE_URL=file:/app/prisma/dev.db
RUN npx prisma db push --accept-data-loss

# Продакшн сборка Next.js
ENV NODE_ENV=production
RUN npm run build

# ---- Stage 3: Production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем standalone Next.js (Next.js 16 output)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Копируем Prisma: CLI + Client engine + миграции + seed DB
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Entrypoint: если нет БД — копируем seed (схема уже применена),
# применяем миграции (на случай обновления схемы), запускаем Next.js
CMD ["sh", "-c", "\
  if [ ! -f /data/dev.db ]; then \
    cp /app/prisma/dev.db /data/dev.db 2>/dev/null && \
    echo '📦 seeded fresh database from build'; \
  fi && \
  npx prisma db push --accept-data-loss 2>&1 | grep -v 'ready in' && \
  echo '🚀 starting Next.js production server' && \
  node server.js \
"]
