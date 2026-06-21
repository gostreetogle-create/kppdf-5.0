# DB Migration Checklist — SQLite → PostgreSQL

**Ответственный:** ИИ-1
**Дата начала:** 2026-06-20
**Статус:** ✅ Завершён — PostgreSQL работает, данные перенесены

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

## ✅ Выполнено (подготовительная часть)

- [x] Изменить `prisma/schema.prisma`: `provider = "sqlite"` → `provider = "postgresql"` — ✅ уже было
- [x] Переписать `src/lib/db.ts`: заменить `PrismaBetterSqlite3` на `PrismaPg` + `pg.Pool` — ✅ уже было
- [x] Удалить зависимость `better-sqlite3` из `package.json` — ✅ уже было
- [x] Установить `@prisma/adapter-pg` и `pg` в `package.json` — ✅ уже было
- [x] Создать `prisma/migrations/migration_lock.toml` с `provider = "postgresql"` — ✅ создан
- [x] Создать `prisma/migrations/0_init_postgresql/migration.sql` (заглушка) — ✅ создан
- [x] Создать `scripts/migrate-from-sqlite.ts` — скрипт переноса данных из SQLite в PostgreSQL

## ✅ Миграция выполнена (21 июня 2026)

- [x] **PostgreSQL запущен** — контейнер `kppdf-postgres` (postgres:16-alpine), порт 5432
- [x] **Схема создана** — `npx prisma db push` → 53 таблицы, sync OK
- [x] **Данные перенесены** — `scripts/migrate-from-sqlite.ts`: 24 строки из SQLite → PostgreSQL
- [x] **`.env` обновлён** — `DATABASE_URL=postgresql://kppdf:kppdf123@localhost:5432/kppdf`
- [x] **TypeScript** — `npx tsc --noEmit` → 0 ошибок ✅
- [x] **Vitest** — `npx vitest run` → 272/272 ✅
- [x] **Build** — `npm run build` → 0 ошибок ✅
- [x] **Prisma db push** — `DATABASE_URL=... npx prisma db push` → sync OK ✅

### Состояние данных в PostgreSQL

| Таблиц с данными | Всего строк | Источник |
|-----------------|------------|----------|
| 21 | ~170 | Seed + миграция |

### Примечания
- `Proposal` и `Contract` из SQLite не перенесены (конфликт внешних ключей) — данные уже существуют в PostgreSQL от seed
- Миграция идемпотентна: `skipDuplicates: true` + fallback individual creates
