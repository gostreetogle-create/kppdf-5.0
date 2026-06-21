# KPPDF v5.0 — Документация деплоя

> **Обновлено:** 21 июня 2026
> **Версия:** v5.0 (Next.js 16 + React 19 + Prisma 7 + PostgreSQL)
> **Домен:** sport-set.ru (Cloudflare Tunnel) + crm.kppdf.crazedns.ru (KeenDNS)

---

## Содержание

1. [Схема инфраструктуры](#1-схема-инфраструктуры)
2. [Серверы](#2-серверы)
3. [SSH доступ](#3-ssh-доступ)
4. [Docker](#4-docker)
5. [Nginx](#5-nginx)
6. [PostgreSQL](#6-postgresql)
7. [Cloudflare](#7-cloudflare)
8. [Сетевые интерфейсы](#8-сетевые-интерфейсы)
9. [Переменные окружения](#9-переменные-окружения)
10. [Деплой](#10-деплой)
11. [Мониторинг и логи](#11-мониторинг-и-логи)
12. [Траблшутинг](#12-траблшутинг)
13. [История миграции v4 → v5](#13-история-миграции-v4--v5)

---

## 1. Схема инфраструктуры

```
┌──────────────┐
│  Браузер     │
│  (пользователь)│
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│  Cloudflare  │  DNS: sport-set.ru
│  (proxy+SSL) │  Account: a0a6d038de56cbdb0e93914d86c938f5
│              │  Tunnel: b6e27272-24c3-4551-a4f5-30031f0798cb
└──────┬───────┘
       │
       ├─── [Cloudflare Tunnel] ──► localhost:80 (nginx) ──► :3000 (kppdf50)
       │
       └─── [A-запись DNS] ──► 5.138.218.200:80 (nginx) ──► :3000 (kppdf50)
                              (публичный IP Ubuntu-сервера)

┌─────────────────────────────────────────────────────────┐
│  Ubuntu Server (192.168.1.46)                           │
│  Публичный IP: 5.138.218.200                            │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │  Nginx :80  │───►│  kppdf50    │ Next.js :3000     │
│  │  reverse    │    │  Docker     │                    │
│  │  proxy      │    └──────┬──────┘                    │
│  └─────────────┘           │ kppdf50-net               │
│                            ▼                           │
│                    ┌──────────────┐                    │
│                    │ kppdf50-     │ PostgreSQL :5432   │
│                    │ postgres     │                    │
│                    └──────────────┘                    │
│                                                         │
│  Интерфейсы:                                           │
│    ens3:     192.168.1.46/24  (основной)              │
│    wg0:      10.0.0.2/24      (WireGuard VPN)         │
│    tailscale0: 100.83.239.51  (Tailscale mesh)        │
│    docker0:  172.17.0.1/16    (Docker bridge)         │
│    br-...:   172.19.0.1/16    (kppdf50-net)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Synology NAS                                           │
│  Публичный IP: 130.49.129.240                           │
│  nginx/1.18.0                                           │
│  СТАРЫЙ v4 (Angular) — больше не используется            │
└─────────────────────────────────────────────────────────┘
```

### Маршрутизация запроса

**Канал A — Cloudflare Tunnel (для пользователей вне РФ):**
1. Пользователь открывает `https://sport-set.ru`
2. **Cloudflare** → DNS CNAME → Tunnel → localhost:80 (nginx) → :3000 (kppdf50)
3. **Nginx** на порту 80 проверяет `server_name`, проксирует на Next.js
4. **Docker-контейнер `kppdf50`** обрабатывает запрос
5. Prisma → PostgreSQL (`kppdf50-postgres`)

**Канал B — KeenDNS (для пользователей в РФ, без VPN):**
1. Пользователь открывает `https://crm.kppdf.crazedns.ru/`
2. **KeenDNS Cloud** проксирует через облако Keenetic
3. **Keenetic Router** принимает трафик, направляет на `192.168.1.46:443` (nginx)
4. **Nginx** (с SSL-сертификатом Cloudflare Origin CA) на порту 443 принимает HTTPS
5. Nginx проксирует на `127.0.0.1:3000` → Next.js → Prisma → PostgreSQL

---

## 2. Серверы

### Ubuntu Server (основной, v5)

| Параметр | Значение |
|----------|----------|
| Хостнейм | `ubuntuserver` |
| ОС | Ubuntu 24.04.4 LTS (ядро 6.8.0-124-generic) |
| Локальный IP | `192.168.1.46` (интерфейс `ens3`) |
| Публичный IP | `5.138.218.200` |
| Шлюз | `192.168.1.1` |
| Директория проекта | `/home/tiit/kppdf-5.0/` |
| Disk | 1.92 TB, использование 2% |
| RAM | 30% |

### Synology NAS (исторический, v4)

| Параметр | Значение |
|----------|----------|
| Публичный IP | `130.49.129.240` |
| nginx | 1.18.0 |
| Содержимое | Старый v4 (Angular) — **больше не используется** |

### Keenetic Router

| Параметр | Значение |
|----------|----------|
| Модель | Keenetic (KeeneticOS) |
| Локальный IP | `192.168.1.1` |
| KeenDNS домен | `kppdf.crazedns.ru` |
| Режим | Авто (через облако, т.к. серый IP) |
| Прокси-сервисы | `crm.kppdf.crazedns.ru` → `192.168.1.46:443` (HTTPS) |
| Admin роутера | `admin` / `Tg30121986` |

---

## 3. SSH доступ

### Ubuntu Server

```
Хост:     192.168.1.46
Пользователь: tiit
Пароль:   Tg30121986
```

Подключение:
```bash
ssh tiit@192.168.1.46
# Пароль: Tg30121986
```

Для sudo:
```bash
echo 'Tg30121986' | sudo -S <команда>
```

### Через MobaXterm

- Тип: Direct SSH
- Хост: `192.168.1.46`
- Пользователь: `tiit`
- SSH compression: включена
- SSH-browser: включена

---

## 4. Docker

### Контейнеры

| Контейнер | Образ | Статус | Порты |
|-----------|-------|--------|-------|
| `kppdf50` | `deploy-kppdf50` (сборка из Dockerfile) | Up (healthy) | `3000:3000` |
| `kppdf50-postgres` | `postgres:16-alpine` | Up | `5432:5432` |

Статус:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
```

### Docker-сеть: `kppdf50-net`

```bash
# Создание (если нет)
docker network create kppdf50-net

# Проверка участников
docker network inspect kppdf50-net --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}'
```

Текущие участники:
- `kppdf50` → `172.19.0.3/16`
- `kppdf50-postgres` → `172.19.0.2/16`

### Файлы Docker

| Файл | Назначение |
|------|------------|
| `deploy/Dockerfile` | Многостадийная сборка Next.js standalone |
| `deploy/docker-compose.prod.yml` | Docker Compose production |

---

## 5. Nginx

### Конфиг (только HTTP, без редиректа на HTTPS)

**Файл:** `/etc/nginx/sites-enabled/kppdf`

> **Важно:** Nginx НЕ делает редирект с HTTP на HTTPS, т.к. Cloudflare Tunnel приходит на порт 80 и не умеет следовать редиректам. SSL-терминация происходит на стороне Cloudflare (для sport-set.ru) и на стороне KeenDNS Cloud/роутера (для crm.kppdf.crazedns.ru).

```nginx
server {
    listen 80;
    server_name sport-set.ru www.sport-set.ru;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection '1; mode=block' always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 256;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    access_log /var/log/nginx/kppdf50_access.log;
    error_log  /var/log/nginx/kppdf50_error.log warn;
}
```

### SSL-сертификат (Cloudflare Origin CA)

Для KeenDNS роутер проксирует HTTPS на порт 443 сервера, поэтому на сервере установлен SSL-сертификат:

| Параметр | Значение |
|----------|----------|
| Тип | Cloudflare Origin CA (RSA 2048) |
| Срок действия | 15 лет (до 17.06.2041) |
| Сертификат | `/etc/nginx/ssl/sport-set.ru.pem` |
| Приватный ключ | `/etc/nginx/ssl/sport-set.ru.key` |
| Домены | `sport-set.ru`, `www.sport-set.ru`, `*.sport-set.ru` |

Создан в Cloudflare Dashboard: SSL/TLS → Origin Server → Create Certificate.
**Не требует продления!** (в отличие от Let's Encrypt)

### Управление Nginx

```bash
# Проверка конфига (нужен sudo)
echo 'Tg30121986' | sudo -S nginx -t

# Перезагрузка
echo 'Tg30121986' | sudo -S nginx -s reload

# Логи
tail -f /var/log/nginx/kppdf50_access.log
tail -f /var/log/nginx/kppdf50_error.log
```

---

## 6. PostgreSQL

| Параметр | Значение |
|----------|----------|
| Контейнер | `kppdf50-postgres` |
| Образ | `postgres:16-alpine` |
| Хост (Docker-сеть) | `kppdf50-postgres` |
| Хост (внешний) | `localhost:5432` |
| База данных | `kppdf` |
| Пользователь | `kppdf` |
| Пароль | `kppdf123` |
| URL | `postgresql://kppdf:kppdf123@kppdf50-postgres:5432/kppdf` |

### Команды

```bash
# Подключение
docker exec -it kppdf50-postgres psql -U kppdf -d kppdf

# Бэкап
docker exec kppdf50-postgres pg_dump -U kppdf kppdf > /home/tiit/backup_$(date +%Y%m%d).sql

# Восстановление
cat /home/tiit/backup_20260621.sql | docker exec -i kppdf50-postgres psql -U kppdf -d kppdf

# Сброс схемы (ОСТОРОЖНО — потеря данных)
docker exec -it kppdf50-postgres psql -U kppdf -d kppdf -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose --env-file .env -f deploy/docker-compose.prod.yml run --rm --entrypoint sh kppdf50 \
  -c "./node_modules/.bin/prisma db push --accept-data-loss"
```

---

## 7. Cloudflare

### DNS-записи

| Запись | Тип | Значение | Прокси | Статус |
|--------|-----|----------|--------|--------|
| `sport-set.ru` | Tunnel | `kppdf-tunnel` | Вкл (оранжевое облако) | ✅ Активен (через Cloudflare Tunnel) |
| `www.sport-set.ru` | Tunnel | `kppdf-tunnel` | Вкл (оранжевое облако) | ✅ Активен (через Cloudflare Tunnel) |

> **Текущий статус:** DNS переведён на **Cloudflare Tunnel** (CNAME на `b6e27272-...cfargotunnel.com`). A-записи на `5.138.218.200` удалены.

### Cloudflare Tunnel

| Параметр | Значение |
|----------|----------|
| Tunnel ID | `b6e27272-24c3-4551-a4f5-30031f0798cb` |
| Имя | `kppdf-tunnel` |
| Account ID | `a0a6d038de56cbdb0e93914d86c938f5` |
| Создан | 2026-05-27 |
| Протокол | QUIC |
| Конфиг | `/etc/cloudflared/config.yml` |
| Учётные данные | `/etc/cloudflared/b6e27272-24c3-4551-a4f5-30031f0798cb.json` |

**Ingress rules:**
```yaml
ingress:
  - hostname: sport-set.ru
    service: http://localhost:80
  - hostname: www.sport-set.ru
    service: http://localhost:80
  - service: http_status:404
```

### Управление Tunnel

```bash
# Статус
systemctl status cloudflared

# Перезапуск (нужен sudo)
echo 'Tg30121986' | sudo -S systemctl restart cloudflared

# Логи
journalctl -u cloudflared --no-pager -n 30

# Метрики
curl -s http://127.0.0.1:20241/metrics | grep -i 'tcp_active\|total'
```

### Очистка кеша

```bash
# Вручную
https://dash.cloudflare.com → sport-set.ru → Caching → Purge Everything

# Через API (требует API Token)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### DNS-настройки для работы

**Текущий вариант (активен): Cloudflare Tunnel**
- DNS-записи типа `Tunnel` → `kppdf-tunnel`
- Прокси: включён (оранжевое облако)
- A-записи удалены (трафик идёт через туннель)

### SSL/TLS настройки

- **Режим:** Full (Strict)
- **Origin-сертификат:** Cloudflare Origin CA (15 лет, RSA 2048)
- **Расположение:** `/etc/nginx/ssl/sport-set.ru.pem` + `.key` на Ubuntu-сервере

**Вариант A: A-запись (альтернативный, не используется)**
- A-запись `sport-set.ru` → `5.138.218.200` (публичный IP Ubuntu-сервера)
- Прокси: включён (оранжевое облако)

---

## 8. Сетевые интерфейсы

| Интерфейс | IP | Назначение |
|-----------|-----|------------|
| `ens3` | `192.168.1.46/24` | Основной Ethernet |
| `wg0` | `10.0.0.2/24` | WireGuard VPN |
| `tailscale0` | `100.83.239.51/32` | Tailscale mesh-сеть |
| `docker0` | `172.17.0.1/16` | Docker bridge |
| `br-c9d71f7e9994` | `172.19.0.1/16` | Docker: kppdf50-net |

### Tailscale

```
100.83.239.51  ubuntuserver  go.street.ogle@  linux
100.107.232.15 go            go.street.ogle@  linux
```

### Порты на прослушивании

| Порт | Сервис | Интерфейс |
|------|--------|-----------|
| 22 | SSH | 0.0.0.0 |
| 80 | Nginx | 0.0.0.0 |
| 3000 | kppdf50 (Next.js) | 0.0.0.0 |
| 5432 | PostgreSQL | 0.0.0.0 |
| 20241 | cloudflared metrics | 127.0.0.1 |
| 6010 | X11 forwarding | 127.0.0.1 |

---

## 9. Переменные окружения

### Файл `.env` на сервере

**Путь:** `/home/tiit/kppdf-5.0/.env`

```bash
DATABASE_URL=postgresql://kppdf:kppdf123@kppdf50-postgres:5432/kppdf
JWT_SECRET=kppdf50-production-secret-2026
DADATA_API_KEY=c001ab73a29920b829f7712b7f4f5b3c809f1461
```

**Важно:** Права `600` (только владелец). Не коммитить в git!

### Как подхватываются

1. **Docker Compose** — через `--env-file .env` (указан в `deploy-v5.sh`)
2. **Prisma 7** — через `prisma.config.ts` (читает `process.env.DATABASE_URL`)

---

## 10. Деплой

### Первый деплой

```bash
# 1. Подключиться к серверу
ssh tiit@192.168.1.46

# 2. Клонировать проект (если ещё нет)
git clone <repo-url> /home/tiit/kppdf-5.0

# 3. Создать .env
nano /home/tiit/kppdf-5.0/.env

# 4. Создать Docker-сеть
docker network create kppdf50-net

# 5. Запустить PostgreSQL
docker run -d \
  --name kppdf50-postgres \
  --network kppdf50-net \
  -e POSTGRES_USER=kppdf \
  -e POSTGRES_PASSWORD=kppdf123 \
  -e POSTGRES_DB=kppdf \
  -p 5432:5432 \
  postgres:16-alpine

# 6. Запустить деплой
cd /home/tiit/kppdf-5.0
bash deploy/deploy-v5.sh
```

### Обновление приложения

```bash
cd /home/tiit/kppdf-5.0
bash deploy/deploy-v5.sh
```

Скрипт автоматически:
1. Пересобирает Docker-образ (с кешем)
2. Обновляет схему БД (prisma db push)
3. Перезапускает контейнер
4. Обновляет Nginx

### Что делает deploy-v5.sh

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant Script as deploy-v5.sh
    participant Docker as Docker
    participant NGINX as Nginx
    participant DB as PostgreSQL

    User->>Script: bash deploy-v5.sh
    Script->>Script: Проверить .env
    Script->>Script: source .env
    Script->>Docker: docker compose build
    Docker->>Docker: npm ci + prisma generate + next build
    Docker-->>Script: Образ готов
    Script->>Docker: docker compose run prisma db push
    Docker->>DB: Создать/обновить схему
    DB-->>Docker: Схема синхронизирована
    Script->>Docker: docker compose up -d
    Docker->>Docker: Запустить kppdf50
    Docker-->>Script: Контейнер запущен
    Script->>NGINX: sudo tee /etc/nginx/sites-enabled/kppdf
    Script->>NGINX: sudo nginx -s reload
    NGINX-->>Script: Nginx обновлён
    Script->>Script: Проверить curl localhost:3000
    Script-->>User: Готово!
```

---

## 11. Мониторинг и логи

### Быстрая проверка

```bash
# Статус контейнеров
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# v5 работает локально
curl -sI http://localhost:3000/

# Через nginx (как пользователь)
curl -sI -H 'Host: sport-set.ru' http://127.0.0.1/

# Healthcheck
curl -s http://localhost:3000/api/health

# Через Cloudflare (проверка доступности извне)
curl -sI https://sport-set.ru/
```

### Логи

```bash
# Next.js контейнер
docker logs kppdf50 --tail 50
docker logs kppdf50 -f

# PostgreSQL
docker logs kppdf50-postgres --tail 50

# Nginx
tail -f /var/log/nginx/kppdf50_access.log
tail -f /var/log/nginx/kppdf50_error.log

# Cloudflare Tunnel
journalctl -u cloudflared --no-pager -n 30
```

### Перезапуск

```bash
# Все контейнеры
docker compose --env-file .env -f deploy/docker-compose.prod.yml down
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d

# Только Next.js
docker restart kppdf50

# Nginx
echo 'Tg30121986' | sudo -S nginx -s reload

# Cloudflare Tunnel
echo 'Tg30121986' | sudo -S systemctl restart cloudflared
```

---

## 12. Траблшутинг

### "Сайт показывает старую версию (Angular v4)"

**Причина:** Cloudflare DNS указывает на `130.49.129.240` (Synology, старый v4).

**Диагностика:**
```bash
# Проверить DNS с сервера
dig sport-set.ru +short
# Должно быть: 5.138.218.200 или Cloudflare proxy IPs

# Проверить что nginx отдаёт v5
curl -s -H 'Host: sport-set.ru' http://127.0.0.1/ | head -3
# Должно быть: Next.js HTML с "KP CRM"

# Проверить через Cloudflare
curl -sI https://sport-set.ru/ | grep -i "last-modified\|cf-cache"
```

**Решение:**
1. Cloudflare Dashboard → sport-set.ru → DNS → Records
2. Изменить A-запись: `130.49.129.240` → `5.138.218.200`
3. Caching → Purge Everything
4. Подождать 1-2 минуты

### "Cloudflare Tunnel не подключается"

**Симптомы:** `journalctl -u cloudflared` показывает ошибки QUIC.

**Решение:**
```bash
echo 'Tg30121986' | sudo -S systemctl restart cloudflared
sleep 5
journalctl -u cloudflared --no-pager -n 10
# Должно быть: "Registered tunnel connection"
```

### "DATABASE_URL is not set" / "prisma db push fails"

```bash
cat /home/tiit/kppdf-5.0/.env
docker compose --env-file .env -f deploy/docker-compose.prod.yml config | grep DATABASE_URL
```

### "Can't reach PostgreSQL"

```bash
docker ps | grep postgres
docker network inspect kppdf50-net | grep postgres
```

### "sudo: a terminal is required"

```bash
echo 'Tg30121986' | sudo -S <команда>
```

### "npm ERR! ETIMEDOUT" при сборке

Проблемы с сетью. Повторить позже — Docker кеширует слои.

---

## 13. История миграции v4 → v5

### Стек v4 (Synology, 130.49.129.240)

- **Frontend:** Angular 21
- **Backend:** Node.js + Express + tsx
- **БД:** MongoDB (kppdf40-mongodb) + ChromaDB (kppdf40-chromadb)
- **Порты:** Backend :4000, MongoDB :27018, ChromaDB :8000
- **Контейнеры:** kppdf40-backend, kppdf40-mongodb, kppdf40-chromadb
- **Директория:** `/opt/kppdf-4.0/` (на Ubuntu — удалена)

### Стек v5 (Ubuntu, 192.168.1.46)

- **Frontend:** Next.js 16 + React 19 (в одном контейнере)
- **Backend:** Next.js API routes (в том же контейнере)
- **БД:** PostgreSQL 16 (kppdf50-postgres)
- **Порт:** 3000
- **Контейнеры:** kppdf50, kppdf50-postgres
- **Директория:** `/home/tiit/kppdf-5.0/`

### Что изменилось

| Аспект | v4 | v5 |
|--------|----|----|
| Платформа | Synology NAS | Ubuntu 24.04 |
| Frontend framework | Angular 21 | Next.js 16 + React 19 |
| Backend | Express (отдельный) | Next.js API routes |
| БД | MongoDB + ChromaDB | PostgreSQL |
| ORM | Mongoose | Prisma 7 |
| Docker образов | 3 | 2 |
| SSL | Cloudflare | Cloudflare |
| Tunnel | Не использовался | Cloudflare Tunnel |

### Что удалено

- `/opt/kppdf-4.0/` — директория v4 (удалена с Ubuntu)
- Контейнеры `kppdf40-*` — остановлены и удалены
- Synology (130.49.129.240) — nginx/1.18.0 с Angular v4, больше не используется

---

## Приложение A: Быстрые команды

```bash
# ==== Подключение ====
ssh tiit@192.168.1.46

# ==== Деплой ====
cd /home/tiit/kppdf-5.0
bash deploy/deploy-v5.sh

# ==== PostgreSQL ====
docker exec -it kppdf50-postgres psql -U kppdf -d kppdf

# ==== Логи ====
docker logs kppdf50 --tail 20 -f
tail -f /var/log/nginx/kppdf50_access.log

# ==== Перезапуск ====
docker compose --env-file .env -f deploy/docker-compose.prod.yml down
docker compose --env-file .env -f deploy/docker-compose.prod.yml up -d

# ==== Проверка ====
curl -sI http://localhost:3000/                     # v5 напрямую
curl -sI -H 'Host: sport-set.ru' http://127.0.0.1/  # через nginx
curl -s http://localhost:3000/api/health              # healthcheck
curl -sI https://sport-set.ru/                       # через Cloudflare
curl -sI https://crm.kppdf.crazedns.ru/                # через KeenDNS
```

---

## Приложение B: Ключевые файлы на сервере

```
/home/tiit/kppdf-5.0/
├── .env                          # Переменные окружения
├── next.config.ts                # Next.js конфиг (output: standalone)
├── prisma.config.ts              # Prisma 7 конфиг
├── prisma/schema.prisma          # Схема БД
├── deploy/
│   ├── DEPLOYMENT.md             # Эта документация
│   ├── Dockerfile                # Сборка Next.js standalone
│   ├── docker-compose.prod.yml   # Docker Compose
│   ├── deploy-v5.sh              # Скрипт деплоя
│   └── nginx-kppdf50.conf        # Nginx конфиг (исторический)
└── src/                          # Исходный код

/etc/nginx/sites-enabled/kppdf       # Активный Nginx конфиг (HTTP)
/etc/nginx/ssl/sport-set.ru.pem     # SSL-сертификат Cloudflare Origin CA
/etc/nginx/ssl/sport-set.ru.key     # Приватный ключ SSL (права 600)
/etc/cloudflared/
├── config.yml                    # Конфиг Cloudflare Tunnel
└── b6e27272-...json              # Учётные данные Tunnel
```

---

## Приложение C: История изменений

| Дата | Версия | Изменения |
|------|--------|-----------|
| 21.06.2026 | v5.0 | Полная документация. Два сервера: Ubuntu (v5) + Synology (v4, не используется). Cloudflare Tunnel настроен. DNS нужно переключить с 130.49.129.240 на 5.138.218.200. |
| 21.06.2026 | v5.0 | Начальная миграция v4 → v5. PostgreSQL вместо MongoDB. Docker-деплой на Ubuntu. |
| 21.06.2026 | v5.1 | **Двойной канал доступа:** Cloudflare Tunnel + KeenDNS. SSL-сертификат Cloudflare Origin CA установлен на Nginx (https :443). KeenDNS домен `kppdf.crazedns.ru` зарегистрирован на роутере Keenetic. Веб-приложение `crm.kppdf.crazedns.ru` → `192.168.1.46:443`. DNS Cloudflare переведён на Tunnel (CNAME), A-записи удалены. Исправлен `?sslmode=disable` в DATABASE_URL. Создан пользователь admin в PostgreSQL. |
