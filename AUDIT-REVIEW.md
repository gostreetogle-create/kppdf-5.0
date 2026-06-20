# AUDIT-REVIEW.md

> **Подготовлено для независимого аудита человеком-экспертом.**
> Репозиторий: `kppdf-5.0` (branch: `main`).
> Покрытие: cycles 39–40 завершены и закоммичены; cycles 41–50 задокументированы в `audit-tasks.md`, но **ещё не выполнены** (это честное отражение состояния на момент создания файла).

---

## 📌 Краткое описание проекта

**KPPDF CRM v5.0** — коммерческая CRM/ERP для производственной компании. Полный цикл:
Товары → Витрина КП → КП (с автогенерацией PDF) → Договор → Производственный заказ → Gantt/WorkCenters → Склад → Финансы.

**Стек** (актуальный, см. ERRATA в [`audit-tasks.md`](audit-tasks.md)):
- Next.js 16.2.9 (App Router) + React 19 + TypeScript strict
- Tailwind CSS 4 + CSS-переменные (light/dark themes)
- **Prisma 7.8.0 + PostgreSQL** (через `@prisma/adapter-pg` / `PrismaPg` driver adapter); альтернативно `@prisma/adapter-better-sqlite3` установлен, но НЕ используется в `src/lib/db.ts`
- Zustand + native `useState` для state management
- jsPDF + jspdf-autotable (динамический импорт через `getPdfLibs()`)
- dnd-kit (блоки + Gantt)
- Vitest 4 (88 unit-тестов) + Playwright (e2e smoke)
- Docker + nginx для деплоя на Synology DSM

---

## 📊 Завершённые циклы (cycles 39–40)

| Цикл | Дата | Задача | Ключевые изменения | Коммит | Гейты |
|------|------|--------|---------------------|--------|-------|
| 39 | 2026-06-20 | M5 — JWT decoupling (auth.test.ts fix) | Создан pure [`src/lib/jwt.ts`](src/lib/jwt.ts) без `import './db'`. JWT-код удалён из [`src/lib/auth.ts`](src/lib/auth.ts) — теперь `import + explicit export` workaround под `verbatimModuleSyntax: true` Next.js 16. Тест [`src/lib/__tests__/auth.test.ts`](src/lib/__tests__/auth.test.ts) переключён на `'../jwt'`. | `cycle-39: M5 — JWT decoupling...` | tsc 0 / vitest **88/88 (6/6 suites)** / lint 0 (3 cosmetic warnings pre-existing в auth.ts) |
| 40 | 2026-06-20 | Block 1.3 — `env.ts` consolidation | Создан [`src/lib/env.ts`](src/lib/env.ts) с экспортами `isProd`/`isDev`/`baseUrl`. Заменено 4 файла: `src/lib/db.ts`, `src/proxy.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/refresh/route.ts`. ESLint rule `no-restricted-syntax` блокирует прямые обращения к `process.env.NODE_ENV` / `process.env.NEXT_PUBLIC_BASE_URL` в `src/` (4 selector + override для env.ts). | `cycle-40: Block 1.3 — env.ts consolidation` | tsc 0 / vitest 88/88 / lint 0 |

> Полные записи циклов с деталями промежуточных фиксов — в [`audit-log.md`](audit-log.md).

---

## ⏭ Планируемые циклы (cycles 41–50, пока **НЕ выполнены**)

Полный план с AC-критериями — в [`audit-tasks.md`](audit-tasks.md). Сводка:

| Цикл | Блок | Приоритет | Сложность |
|------|------|-----------|-----------|
| 41 | 5.1 — PDF table page-break + footnote header (`didDrawCell` / `willDrawCell` + manual row loop fallback) | **High** | M |
| 41 | 5.2 — Latin overflow в `legalAddress` (defensive `addPage()`) | Low | S |
| 42-43 | 3.2 — Версионирование КП + `parentProposalId?` / `version` / `supersededAt` / `sourceItemId` + `@@index([sourceItemId])` + `cloneProposalItems` helper | Medium | L |
| 44-45 | 🆕 3.1 — `ProposalEditor` refactor (architectural, НЕ DRY — clarification после ERRATA) | Medium | M |
| 46-47 | 4.1 — Proposal editor 3-panel UX (dev-прототип в `playground/` сначала) | Medium | M |
| 48-49 | 6.1 — Tests isolation / in-memory mock prisma (driver adapter API) | Low | M |
| 50 | 7.1 — Zustand refresh TTL + silent refresh preempt (60 сек до `expiresAt`, через access token `payload.exp`) | Low | S |

**Завершено: 2/9 пунктов** (M5 + env.ts). **Осталось: 7 пунктов.**

---

## ✅ Состояние гейтов (все green после cycle 40)

| Gate | Команда | Статус |
|------|---------|--------|
| TypeScript | `npx tsc --noEmit` | ✅ **0 ошибок** |
| Unit-тесты | `npx vitest run` | ✅ **88/88 в 6/6 suites** |
| Lint | `npx eslint src --max-warnings=999` | ✅ 0 ошибок (3 cosmetic warnings pre-existing в `auth.ts:11`) |
| E2E Playwright | `npx playwright test` | См. [`playwright.config.ts`](playwright.config.ts) — login smoke |
| Audit-grep NODE_ENV | `grep -rn "process\.env\.NODE_ENV" src/` | ✅ только [`src/lib/env.ts`](src/lib/env.ts) (allowed source) |
| Audit-grep NX_PUB_BASE_URL | `grep -rn "process\.env\.NEXT_PUBLIC_BASE_URL" src/` | ✅ только [`src/lib/env.ts`](src/lib/env.ts) |

> **ESLint rule теперь запрещает** появление новых `process.env.NODE_ENV` / `process.env.NEXT_PUBLIC_BASE_URL` в `src/`. Override только для source-of-truth файла.

---

## 🗺 Карта ключевых файлов

### Новые (cycles 39–40)

| Путь | Цикл | Назначение |
|------|------|-----------|
| [`src/lib/jwt.ts`](src/lib/jwt.ts) | 39 | Pure JWT helper: `signAccessToken`/`signRefreshToken`/`verifyToken` + `JwtPayload`. Без prisma. Lazy secret через `ensureSecret()`. |
| [`src/lib/env.ts`](src/lib/env.ts) | 40 | Single source of truth для env-derived constants. JSDoc уточняет семантику `isDev` (covers dev AND test). |
| [`tasks/current-task.md`](tasks/current-task.md) | 40 | Протокол Agent A↔Agent B для каждого цикла. |

### Изменены (cycles 39–40)

| Путь | Цикл | Что изменилось |
|------|------|----------------|
| [`src/lib/auth.ts`](src/lib/auth.ts) | 39 | JWT-код удалён; `import` из `./jwt` для local scope + explicit `export` (workaround под `verbatimModuleSyntax: true`). |
| [`src/lib/__tests__/auth.test.ts`](src/lib/__tests__/auth.test.ts) | 39 | Тесты импортируют `'../jwt'` (разрыв side-effect chain). |
| [`src/lib/db.ts`](src/lib/db.ts) | 40 | Относительный `'./env'` import; `if (!isProd)` вместо NODE_ENV check. |
| [`src/proxy.ts`](src/proxy.ts) | 40 | Удалён локальный `const isProd` (импорт `@/lib/env` поднят выше функции). |
| `src/app/api/auth/login/route.ts` | 40 | `secure: isProd` (2 occurrences). |
| `src/app/api/auth/refresh/route.ts` | 40 | Same (2 occurrences). |
| [`eslint.config.mjs`](eslint.config.mjs) | 40 | `no-restricted-syntax` (4 selector для прямого + computed member) + override `files: ['src/lib/env.ts']`. |
| [`audit-log.md`](audit-log.md) | 39, 40 | Хронологические записи с гейтами. |
| [`audit-tasks.md`](audit-tasks.md) | 40 | Progress-индикатор (2/9 done); Block 1.3 помечен ✅ COMPLETED. |

### НЕ трогались в cycles 39–40 (важно для понимания контекста)

- `prisma/schema.prisma` — без изменений (provider = postgresql, 19 моделей). Планируется в cycle 42 (parentProposalId, version, supersededAt, sourceItemId + index).
- `src/lib/pdf/index.ts` — без изменений. Планируется в cycle 41 (page-break hooks + manual row loop fallback + address overflow check).
- `src/components/proposal-editor.tsx` — **не существует** ещё. Планируется в cycle 44-45.
- `src/stores/auth-store.ts` — без изменений. Планируется в cycle 50 (refresh TTL).
- `src/app/api/*` (кроме login/refresh) — без изменений.

---

## 📋 Инструкция для внешнего аудитора

### Как запустить проект локально

```bash
# Требования: Node.js 20+
cp .env.example .env
npm install

# Prisma: PostgreSQL (текущий) или SQLite (через @prisma/adapter-better-sqlite3)
npx prisma generate
npx prisma db push

npm run dev
# → http://localhost:3000
# Логин по умолчанию: admin / admin123
# Seed: POST /api/seed (требует роль admin)
```

### Какие коммиты смотреть

```bash
# Последние 5 коммитов (cycle 39, cycle 40, audit prep + предыдущие)
git log --oneline -10

# Только циклы 39-40 и audit prep
git log --oneline | grep -E "cycle-39|cycle-40|audit prep"

# Diff конкретного цикла
git show <commit-hash>
git show <commit-hash> --stat   # только список файлов
```

### На что обратить внимание

**Подтвердите, что сделано в cycles 39–40**:
- `src/lib/jwt.ts` — действительно чистый, без `import './db'`.
- `src/lib/db.ts` — использует ли PrismaPg (НЕ deprecated `datasourceUrl`).
- `src/lib/env.ts` — все 4 файла импортируют `isProd` (НЕ прямой `process.env.NODE_ENV`).
- `eslint.config.mjs` — `no-restricted-syntax` действительно работает (попробуйте добавить `process.env.NODE_ENV` в любой файл `src/` кроме env.ts — lint ошибка).
- `audit-log.md` — записи соответствуют реальным коммитам.

**Подтвердите, что НЕ сделано**:
- `prisma/schema.prisma` — НЕТ полей `parentProposalId` / `version` / `supersededAt` / `sourceItemId` (cycle 42 ещё не выполнен).
- `src/components/proposal-editor.tsx` — НЕ существует (cycle 44-45 ещё не выполнен).
- `src/lib/pdf/index.ts` — НЕТ `didDrawCell` хука (cycle 41 ещё не выполнен).
- Все 7 блоков кроме cycles 39-40 — задокументированы в `audit-tasks.md`, но НЕ реализованы.

**Известные предупреждения**:
- 3 cosmetic warnings в `src/lib/auth.ts:11` — re-exported types. Pre-existing, не блокеры.
- `README.md` устарел: говорит «SQLite + Prisma ORM» — реально Prisma 7 + PostgreSQL (см. ERRATA в `audit-tasks.md`). READme **планируется исправить в одном из следующих циклов**.

### Known limitations (честно)

1. **Cycles 41–50 не выполнены** — это план, не обещание завершения. Если аудитор проверяет именно эти блоки, скажите прямо — будет реализовано в следующих сессиях.
2. **История коммитов не идеальна по циклам** — `audit-log.md` aggregate изменения, и он включён в один commit (cycle 40) вместе с code, потому что байтово разделить 2040-строчный markdown-файл сложно. Code каждого цикла — в отдельном коммите.
3. **Pre-cycle-39 work** (cycles 1-38: большой объём из v3.5/v3.6/v3.7 + unreleased блоки: 1.2b/c image-aware preview, 2.1 object-contain, 2.2 button visibility, 2.3 sortable-block drag) **есть в working tree, но НЕ закоммичены отдельными коммитами**. Это вне scope audit prep. Если важно — отдельный cleanup-цикл.
4. **Тесты**: vitest 88/88 проходят, но `auth.test.ts` и `counter.test.ts` тестируют JWT helper (после cycle 39) и counter соответственно. Integration-тесты API endpoints — **планируется** в cycle 48-49. Сейчас coverage ограничен unit-уровнем.

---

## 📂 Документация

| Файл | Назначение |
|------|-----------|
| [`discussion.md`](discussion.md) | Раунды дискуссии двух агентов (Агент A = Критик-Архитектор, Агент B = Рецензент-Исполнитель). Включает **ERRATA** (исправление неточностей в описании стека после верификации реального `db.ts`/`schema.prisma`). |
| [`audit-log.md`](audit-log.md) | Хронологический лог изменений с гейтами (~2040 строк после cycle 40). |
| [`audit-tasks.md`](audit-tasks.md) | Согласованный план из 9 блоков + progress-индикатор. |
| [`agent-queue.json`](agent-queue.json) | Очередь задач (машиночитаемый формат). |
| [`AGENTS.md`](AGENTS.md), [`AGENT-PROTOCOL.md`](AGENT-PROTOCOL.md) | Протоколы взаимодействия агентов. |
| [`AI_COLLABORATION.md`](AI_COLLABORATION.md) | Доска задач и история диалогов. |
| [`BUSINESS-LOGIC.md`](BUSINESS-LOGIC.md) | Бизнес-логика от продуктового владельца. |
| [`DEPLOY-SYNO.md`](DEPLOY-SYNO.md) | Руководство по деплою на Synology NAS. |
| [`КРИТИЧЕСКИЙ-АНАЛИЗ.md`](КРИТИЧЕСКИЙ-АНАЛИЗ.md) | Анализ проблем проекта (с TODO-списком улучшений). |

---

## 🎯 Финальная рекомендация аудитору

Если доступно **только несколько часов** для аудита — сфокусируйтесь на:
1. **Cycle 39/40 code changes** (3 коммита cycle + 1 audit prep) — проверьте корректность, нет ли regressions в логике JWT, нет ли подозрительных путей в env.ts.
2. **Состояние `src/lib/db.ts` + `prisma/schema.prisma`** — действительно ли PrismaPg корректен (а не устаревший код).
3. **ESLint rule correctness** — попробуйте добавить нарушение, убедиться, что правило срабатывает.
4. **Реалистичность циклов 41-50** в `audit-tasks.md` — соответствуют ли AC-критерии стандартам production-grade кода.

Если есть время на глубокий аудит — пройдитесь по всему `BUSINESS-LOGIC.md` + `КРИТИЧЕСКИЙ-АНАЛИЗ.md` и сопоставте с фактическим кодом. Есть заметные расхождения README vs реальный стек (исправить планируется).

---

**Проект прошёл совместный AI-аудит (cycles 39–40 — DONE, cycles 41–50 — planned).**
**Документ создан в рамках audit prep 2026-06-20.**
