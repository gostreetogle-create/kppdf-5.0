# KPPDF CRM v5.0

> **Миссия:** Приложение ПОМОГАЕТ человеку быстро делать свои задачи — от коммерческого предложения до отгрузки. Подсказывает на каком этапе он остановился. Не рутина, не хлам данных. Максимальная автоматизация.

---

## 🧱 Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 16 (App Router) + React 19 |
| Язык | TypeScript |
| Стили | Tailwind CSS 4 + CSS-переменные (светлая/тёмная темы) |
| UI | Radix UI + Lucide иконки |
| DnD | @dnd-kit (core + sortable) |
| PDF | jsPDF + html2canvas |
| БД | SQLite + Prisma ORM |
| Аутентификация | JWT (собственная) |

---

## 🚀 Быстрый старт

## Требования

- Node.js 20+
- JWT_SECRET в переменных окружения для production сборки

```bash
# Копировать .env.example
cp .env.example .env

# Установка
npm install

# База данных (создание и миграции)
npx prisma generate
npx prisma db push

# Запуск dev-сервера
npm run dev
# → http://localhost:3000

# Продакшн сборка
export JWT_SECRET=your-secret-key && npm run build
```

**Логин по умолчанию:** `admin` / `admin123`

**Seed-данные:** POST /api/seed (требует роль admin)

---

## 🏗 Архитектура

### Workflow (12 этапов)

```
Товары → Витрина КП → КП → Договор → Производство → Гантт → Снабжение → Изготовление → Покраска → Отгрузка → Закрытие → Аналитика
```

### Структура проекта

```
src/
├── app/
│   ├── (auth)/          # Логин
│   ├── (dashboard)/     # Все страницы
│   │   ├── admin/       # Шаблоны, тендеры, сертификаты
│   │   ├── clients/     # Клиенты
│   │   ├── contracts/   # Договоры
│   │   ├── dashboard/   # Главная
│   │   ├── finance/     # Финансы, сверки
│   │   ├── organizations/
│   │   ├── production/  # Заказы, Гантт, работники
│   │   ├── products/    # Товары, категории
│   │   ├── proposals/   # КП, витрина
│   │   └── warehouse/   # Склад, закупки
│   ├── api/             # REST API (Route Handlers)
│   └── globals.css      # Дизайн-система
├── components/ui/       # UI Kit (кнопки, Gantt, A4 Canvas...)
├── lib/                 # Утилиты, counter, auth
├── hooks/               # useUndoRedo, useDraftAutosave
├── types/               # TypeScript типы
└── prisma/              # Схема БД + миграции
```

### Ключевые модули

| Модуль | Где | Что делает |
|--------|-----|-----------|
| **Шаблоны документов** | `admin/templates` | Drag-and-drop A4 редактор с WYSIWYG |
| **Шаблоны таблиц** | `admin/table-templates` | DnD колонок, drag-resize, авто-источники данных |
| **Витрина КП** | `proposals/new` | Корзина → живой A4 → PDF |
| **Гантт** | `production/gantt` | Day/Week/Month, plan vs actual, загрузка |
| **Авто-номера** | `lib/counter.ts` | КП, Д, ЗК, Т, С, РПП, ЗР, АС, ЗП, СФ |

### Дизайн-система

- **Primary:** медный `#b87333` / `#c8963e` (тёмная)
- **Background:** крем `#fefaf2` / `#1a1510` (тёмная)
- **Кнопки:** `active:scale-[0.97]` — тактильный отклик
- **Анимации:** fadeIn, slideIn, scaleIn

---

## 📋 План развития

Полный чек-лист из 24 задач в [BUSINESS-LOGIC.md](./BUSINESS-LOGIC.md):

1. 🔴 Критические разрывы (Contract→Production API)
2. 🟡 Авто-номера + блокировки ✅
3. 🟠 Модули товара + Снабжение
4. 🔵 Гантт DnD + Панель рабочего
5. 🟣 Роли + Отгрузка
6. ⚪ Интеграции + Аналитика

---

## 🚢 Деплой на Synology NAS

Подробное руководство по развёртыванию на Synology через Docker:

👉 [DEPLOY-SYNO.md](./DEPLOY-SYNO.md)

**Быстрый старт:**
```bash
export SYNO_HOST="192.168.1.100"
export SYNO_USER="admin"
export JWT_SECRET="$(openssl rand -base64 32)"
bash deploy/deploy.sh
```

Конфигурация:
- `deploy/Dockerfile` — multi-stage сборка Next.js
- `deploy/docker-compose.prod.yml` — production compose
- `deploy/deploy.sh` — скрипт деплоя (remote сборка на NAS)
- `deploy/nginx-kppdf50.conf` — reverse proxy для Synology

---

## 🤝 Разработка

Проект использует систему AI-агентов Codebuff:
- **Buffy** — стратегический ассистент
- **MiMo** — инженерный агент

Координация через сигналы (`agent-cli.js buffy signal mimo "..."`).
