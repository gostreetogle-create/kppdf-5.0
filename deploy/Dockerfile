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

# Копируем Prisma: schema + миграции + клиент + CLI + конфиг
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated
# Копируем node_modules целиком из builder (нужно для prisma CLI в runtime)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Entrypoint: запускаем Next.js (prisma db push запускается отдельно через docker run)
CMD ["node", "server.js"]
