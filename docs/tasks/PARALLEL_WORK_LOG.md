# Parallel Work Log — Бизнес-логика: модули, материалы, организации, роли

## Сессия 1: Аудит + архитектура

**Дата:** 2026-06-21

**Выполнено:**
- Изучена Prisma-схема, API-роуты, страницы для модулей, организаций, видов работ
- Составлен чек-лист `BUSINESS_LOGIC_REFACTOR_CHECKLIST.md`
- Согласованы архитектурные решения с пользователем:
  - Organization — единая модель с ролями (Client будет удалён в будущем)
  - Person — новая модель контактных лиц (многие-ко-многим с Organization)
  - Material — глобальный справочник с привязкой к поставщику
  - ProductModule.productId — опциональный
  - Загрузка файлов через API upload

## Сессия 2: Реализация

**Дата:** 2026-06-21

**Выполнено:**
1. **Prisma-схема** — добавлены Person, Material, MaterialCategory, OrganizationContact; ProductModule.productId → optional
2. **Валидации** — person.ts, material.ts; organization.ts (roleIds)
3. **API роуты**:
   - `/api/persons` — CRUD с кэшированием
   - `/api/materials` — CRUD с кэшированием
   - `/api/materials/categories` — список + создание категорий
   - `/api/upload` — загрузка файлов (requireEditor)
   - `/api/org-roles` — список ролей
   - `/api/organizations` — добавлен `?role=` для фильтрации по роли
4. **Страницы**:
   - `materials/page.tsx` + `client.tsx` — CRUD-таблица материалов
   - `persons/page.tsx` — CRUD-таблица контактных лиц
5. **Формы**:
   - `organizations/client.tsx` — пилюльки выбора ролей, сохранение roleIds
   - `production/modules/page.tsx` — компактные карточки материалов, загрузка файлов, тултипы
6. **Sidebar** — добавлены «Материалы» и «Контактные лица»
7. **Seed** — `scripts/seed-roles.ts` для OrgRole

**Тесты:** 287/287 passed
**TypeScript:** 0 новых ошибок

## Сессия 3: Финальные исправления

**Дата:** 2026-06-21

**Выполнено:**
- Исправлен `import { useState }` в persons/page.tsx (перенесён наверх)
- PUT /api/organizations/[id]: добавлена обработка `roleIds` (set + connect)
- GET /api/organizations: добавлен query-параметр `?role=slug` для фильтрации по роли
- Materials form: `/api/organizations?role=supplier&limit=500` — фильтрация поставщиков
- `price: form.price !== '' ? Number(form.price) : null` — исправлена обработка price=0
- `requireAuth()` → `requireEditor()` в upload route
- Seed-скрипт `scripts/seed-roles.ts` для OrgRole (4 роли)
- Кнопка «Создать вид работ» + модальное окно в форме модуля
- `loadWorkTypes()` возвращает промис для корректного `await`
- Авто-выбор созданного вида работ (сразу добавляется строка)
- `public/uploads/.gitkeep` — директория отслеживается git
- `docs/tasks/PARALLEL_WORK_LOG.md` создан

**Тесты:** 287/287 passed
**TypeScript:** 0 новых ошибок

## Сессия 4: Client→Organization migration + DaData

**Дата:** 2026-06-21

**Выполнено:**
1. **Client → Organization migration**:
   - Prisma-схема: добавлен customerId в Proposal/Contract, удалена модель Client + clientId поля
   - Миграционный скрипт `scripts/migrate-clients-to-orgs.ts` (5 клиентов перенесены в Organization с ролью «Клиент»)
   - Удалены: валидации client.ts, API /api/clients/*, страница /clients/*
   - Обновлены: Proposal/Contract API (client→customer), dashboard, seed, editor
   - Типы: ProposalEditorState (clients→customers, Client→Customer=Organization)
   - Компоненты: config-panel, preview-area — переименованы все ссылки
   - Тесты: server-pages, use-proposal-editor-state — обновлены

2. **DaData (автозаполнение по ИНН)**:
   - API-прокси `/api/dadata/find-by-inn` (требует авторизацию, API-ключ на сервере)
   - Кнопка «Заполнить по ИНН» в форме организации
   - Подтягиваются: name, shortName, kpp, ogrn, legalAddress, signerName, signerPosition
   - .env.local + .env.example обновлены

**Тесты:** 272/272 passed
**TypeScript:** 0 ошибок

## Осталось (последующие шаги):
- Замена `contactPerson` на выпадающий список Person в форме организации
- Запустить `npx tsx scripts/seed-roles.ts` на работающей БД
