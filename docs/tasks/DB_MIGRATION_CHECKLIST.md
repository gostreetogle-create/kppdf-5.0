# DB Migration Checklist — SQLite → PostgreSQL

**Ответственный:** ИИ-1
**Дата начала:** 2026-06-20
**Статус:** В работе (параллельно с другим ИИ)

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

- [x] Изменить `prisma/schema.prisma`: `provider = "sqlite"` → `provider = "postgresql"` — ✅ уже было
- [x] Переписать `src/lib/db.ts`: заменить `PrismaBetterSqlite3` на `PrismaPg` + `pg.Pool` — ✅ уже было
- [x] Удалить зависимость `better-sqlite3` из `package.json` — ✅ уже было
- [x] Установить `@prisma/adapter-pg` и `pg` в `package.json` — ✅ уже было
- [x] Создать `prisma/migrations/migration_lock.toml` с `provider = "postgresql"` — ✅ создан
- [x] Создать `prisma/migrations/0_init_postgresql/migration.sql` (заглушка) — ✅ создан
- [x] Создать `scripts/migrate-from-sqlite.ts` — скрипт переноса данных из SQLite в PostgreSQL
- [ ] **Запустить** `npx prisma migrate dev --name init_postgresql` — требуется сеть + работающий PostgreSQL
- [ ] Перенести данные: `npx tsx scripts/migrate-from-sqlite.ts` — если есть dev.db
- [ ] Обновить `.env`: `DATABASE_URL="postgresql://..."` — если ещё не
- [ ] Протестировать логин: `POST /api/auth/login` → 200
- [ ] Протестировать seed: `POST /api/seed` → 200
- [ ] Проверить `npx prisma db push` — 0 ошибок
- [ ] Проверить `npx tsc --noEmit` — 0 ошибок
- [ ] Проверить `npx vitest run` — все тесты зелёные
