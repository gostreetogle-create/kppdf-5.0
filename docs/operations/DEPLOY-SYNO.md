# Деплой KPPDF v5.0 на Synology NAS

> **ВНИМАНИЕ:** Эта документация является **исторической**. Текущий деплой v5.0 выполняется на **Ubuntu 24.04** (`192.168.1.46`), а не на Synology. Основная документация — в `deploy/DEPLOYMENT.md`.

> Полное руководство по развёртыванию Next.js + SQLite приложения на Synology DiskStation через Docker.

---

## 📋 Содержание

- [Архитектура](#архитектура)
- [Требования](#требования)
- [Подготовка Synology](#подготовка-synology)
- [Быстрый старт (автоматический деплой)](#быстрый-старт-автоматический-деплой)
- [Ручная установка на Synology](#ручная-установка-на-synology)
- [Настройка Nginx (обратный прокси)](#настройка-nginx-обратный-прокси)
- [Переменные окружения](#переменные-окружения)
- [Обновление приложения](#обновление-приложения)
- [Бэкап данных](#бэкап-данных)
- [Решение проблем](#решение-проблем)

---

## Архитектура

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Браузер     │────▶│  Nginx       │────▶│  Next.js     │
│  HTTP/HTTPS  │     │  (обратный   │     │  :3000       │
│              │     │   прокси)    │     │  (Docker)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │  SQLite      │
                                          │  dev.db      │
                                          │  (volume)    │
                                          └──────────────┘
```

**Ключевые отличия от kppdf-4.0:**
- **Единый сервис** — Next.js 16 объединяет фронтенд и API в одном Docker-контейнере
- **SQLite вместо MongoDB** — файловая БД, не требует отдельного сервиса
- **Минимум зависимостей** — только Node.js + SQLite в образе (18 MB alpine)

---

## Требования

| Компонент | Версия | Примечание |
|-----------|--------|-----------|
| Synology DSM | 7.0+ | Рекомендуется DSM 7.2+ |
| Docker | 20.10+ | Пакет из Synology Package Center |
| docker-compose | 2.x+ | Встроен в Synology Docker (DSM 7.2+) |
| SSH-доступ | Включён | Панель управления → Терминал и SNMP |

---

## Подготовка Synology

### 1. Установите Docker

**Package Center** → Поиск "Docker" → Установить.

### 2. Включите SSH

**Панель управления** → **Терминал и SNMP** → Включить SSH (порт 22).

### 3. Создайте директорию для проекта

```bash
ssh admin@192.168.1.100
sudo mkdir -p /volume1/docker/kppdf50
sudo chown -R admin:users /volume1/docker/kppdf50
```

### 4. Настройте JWT_SECRET

```bash
# Сгенерировать надёжный секрет (на локальной машине)
openssl rand -base64 32

# Установить как переменную окружения
export JWT_SECRET="сюда_вставить_ключ"
```

---

## Быстрый старт (автоматический деплой)

Из корня проекта kppdf-5.0 на вашей машине:

```bash
# Установите переменные
export SYNO_HOST="192.168.1.100"
export SYNO_USER="admin"
export JWT_SECRET="$(openssl rand -base64 32)"

# Запустите деплой
bash deploy/deploy.sh
```

Скрипт сделает всё автоматически:
1. Скопирует проект на Synology по SSH
2. Соберёт Docker-образ на NAS
3. Запустит контейнер через docker-compose

---

## Ручная установка на Synology

### Локальная сборка образа (на вашей машине)

```bash
# Клонируем проект
git clone <ваш-репозиторий> kppdf-5.0
cd kppdf-5.0

# Собираем образ
docker build -f deploy/Dockerfile -t kppdf50:latest .

# Сохраняем образ в архив
docker save kppdf50:latest | gzip > kppdf50.tar.gz

# Копируем на Synology
scp kppdf50.tar.gz admin@192.168.1.100:/volume1/docker/kppdf50/
```

### Развёртывание на Synology

```bash
ssh admin@192.168.1.100

# Загружаем образ
cd /volume1/docker/kppdf50
docker load < kppdf50.tar.gz

# Создаём docker-compose файл
cat > docker-compose.yml << 'EOF'
services:
  kppdf50:
    image: kppdf50:latest
    container_name: kppdf50
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=ваш_секретный_ключ
      - DATABASE_URL=file:/data/dev.db
    volumes:
      - kppdf50_data:/data
      - kppdf50_uploads:/app/public/uploads

volumes:
  kppdf50_data:
  kppdf50_uploads:
EOF

# Запускаем
export JWT_SECRET="ваш_секретный_ключ"
docker compose up -d

# Проверяем
docker compose ps
docker compose logs -f
```

### Через Synology Docker UI

1. Откройте **Docker** → **Контейнеры** → **Добавить**
2. Вкладка **Изображения** → **Добавить** → **Из файла** → выберите `kppdf50.tar.gz`
3. **Запустить** → настройте порты (локальный 3000 → контейнер 3000)
4. **Тома** → Добавить тома:
   - `kppdf50_data` → `/data` (SQLite БД)
   - `kppdf50_uploads` → `/app/public/uploads` (загрузки)
5. **Переменные окружения**:
   - `JWT_SECRET` = ваш секретный ключ
   - `NODE_ENV` = production
6. Запустите контейнер

---

## Настройка Nginx (обратный прокси)

### Вариант 1: Встроенный обратный прокси DSM

1. **Панель управления** → **Приложения** → **Обратный прокси**
2. **Добавить**:
   - **Источник**: протокол HTTPS, порт 443, имя хоста `kppdf.local` (или ваш домен)
   - **Назначение**: протокол HTTP, порт 3000, `localhost`
   - **Включить HSTS** (рекомендуется)
3. Настройте сертификат **Let's Encrypt** в **Панель управления** → **Безопасность** → **Сертификат**

### Вариант 2: Ручной nginx конфиг (продвинутый)

Файл `deploy/nginx-kppdf50.conf` уже готов. Установка на Synology:

```bash
# SSH на Synology
ssh admin@192.168.1.100

# Скопировать конфиг
sudo cp deploy/nginx-kppdf50.conf /etc/nginx/sites-enabled/kppdf50

# Проверить и перезагрузить
sudo nginx -t
sudo nginx -s reload
```

---

## Переменные окружения

| Переменная | Обязательная | По умолчанию | Описание |
|-----------|-------------|-------------|---------|
| `JWT_SECRET` | ✅ Да | — | Секретный ключ для JWT-токенов |
| `DATABASE_URL` | ❌ Нет | `file:/data/dev.db` | Путь к SQLite БД (в томе) |
| `NODE_ENV` | ❌ Нет | `production` | Режим приложения |
| `HOSTNAME` | ❌ Нет | `0.0.0.0` | Хост для Next.js |
| `PORT` | ❌ Нет | `3000` | Порт для Next.js |

### JWT_SECRET (важно)

```bash
# Сгенерировать безопасный ключ
openssl rand -base64 32
# Пример: x7YkL9mQ3pR5vN2wB8cD4fG6hJ1sK0aU

# Установить перед запуском docker-compose
export JWT_SECRET="x7YkL9mQ3pR5vN2wB8cD4fG6hJ1sK0aU"
```

> ⚠️ **Никогда не храните JWT_SECRET в Git!** Используйте переменные окружения.

---

## Обновление приложения

```bash
# Из корня проекта kppdf-5.0
export JWT_SECRET="ваш_ключ"
bash deploy/deploy.sh
```

Или вручную:

```bash
ssh admin@192.168.1.100 "cd /volume1/docker/kppdf50 && \
  git pull && \
  docker compose -f docker-compose.yml build --no-cache && \
  docker compose -f docker-compose.yml up -d"
```

---

## Бэкап данных

### SQLite база данных

```bash
# Ручной бэкап
ssh admin@192.168.1.100
docker exec kppdf50 sh -c "cp /data/dev.db /data/dev.db.backup"

# Или через volume напрямую
sudo cp /volume1/docker/kppdf50_data/_data/dev.db /volume1/homes/admin/backups/
```

### Автоматический бэкап (Task Scheduler)

1. **Панель управления** → **Планировщик заданий** → **Создать** → **Запланированная задача** → **Пользовательский скрипт**
2. Настройте расписание (например, ежедневно в 03:00)
3. Скрипт:

```bash
#!/bin/bash
BACKUP_DIR="/volume1/homes/admin/backups/kppdf50"
mkdir -p "$BACKUP_DIR"

docker exec kppdf50 sh -c "cp /data/dev.db /tmp/dev.db.backup" 2>/dev/null || true
docker cp kppdf50:/data/dev.db "$BACKUP_DIR/kppdf50-$(date +%Y%m%d-%H%M%S).db"
gzip "$BACKUP_DIR"/kppdf50-*.db

# Оставить только последние 30 бэкапов
ls -t "$BACKUP_DIR"/*.gz | tail -n +31 | xargs rm -f
```

---

## Решение проблем

### Контейнер не стартует

```bash
# Проверить логи
docker compose -f deploy/docker-compose.prod.yml logs kppdf50

# Типичные ошибки:
# 1. "JWT_SECRET is required" — не установлена переменная
# 2. "Permission denied" — проблема с правами на volume
# 3. Port 3000 already in use — порт занят
```

### SQLite ошибка "disk I/O error"

```bash
# Проверить права на volume
ssh admin@synology
sudo ls -la /volume1/docker/kppdf50_data/
sudo chown -R 1001:1001 /volume1/docker/kppdf50_data/
```

### База данных повреждена

```bash
# Восстановить из последнего бэкапа
docker exec kppdf50 sh -c "cp /data/dev.db.backup /data/dev.db"
docker restart kppdf50
```

### Медленная загрузка страниц

```bash
# Проверить healthcheck
docker inspect kppdf50 --format '{{json .State.Health}}'

# Перезапустить контейнер
docker compose -f deploy/docker-compose.prod.yml restart kppdf50
```

---

## ❗ Важные замечания

- **SQLite — не для кластеризации.** Synology — single-node, поэтому SQLite подходит идеально
- **Не используйте NAS для сборки.** Docker-образ собирается легче на мощной машине разработчика
- **Регулярно делайте бэкапы.** SQLite база — один файл, легко бэкапить
- **Обновляйте образ при изменении схемы Prisma.** `docker compose build` пересоздаёт образ с новыми миграциями
