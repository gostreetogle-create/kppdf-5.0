# ============================================================
# KPPDF v5.0 — Dockerfile (Next.js 16 + Prisma + PostgreSQL)
# ============================================================
# Cycle v3.4 — FINAL migration to PostgreSQL.
# No SQLite. No file:. No dual-adapter.
# ============================================================
# Multi-stage сборка:
#   deps    — установка production-зависимостей
#   builder — полная сборка + Prisma Client + генерация клиента
#   runner  — минимальный образ для запуска
# ============================================================

ARG NPM_REGISTRY=https://registry.npmjs.org/

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --omit=dev

# ---- Stage 2: Build + Prisma Client generation ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

COPY . .

# Генерируем Prisma Client (без миграции — она выполняется в runtime через migrate deploy)
RUN npx prisma generate

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

# Копируем standalone Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Копируем Prisma: CLI + Client engine + миграции
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Entrypoint: применяем миграции, запускаем Next.js
# DATABASE_URL должен быть установлен в docker-compose или в окружении контейнера.
CMD ["sh", "-c", "\
  npx prisma migrate deploy 2>&1 | grep -v 'ready in' && \
  echo '🚀 starting Next.js production server (PostgreSQL)' && \
  node server.js \
"]
