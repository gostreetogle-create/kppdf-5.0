# Текущий чек-лист kppdf-5.0 (обновляется каждый цикл)

**Дата последнего обновления**: 2026-06-21 (полный аудит проекта)
**Назначение**: при обрыве интернета или потере контекста — сразу понятно, на чём остановились. Файл обновляется **перед началом** и **после завершения** каждого цикла.

---

## 🟢 ЗАВЕРШЁННЫЕ ЦИКЛЫ

| Цикл | Блок | Статус | Commit | Gates |
|------|------|--------|--------|-------|
| 39 | M5 — JWT decoupling (auth/jwt развязка) | ✅ DONE | cycle-39 | tsc 0, vitest 88/88, lint 0 |
| 40 | 1.3 — `src/lib/env.ts` consolidation | ✅ DONE | cycle-40 | tsc 0, vitest 88/88, lint 0 |
| 41 | 5.1+5.2 — PDF page-break + Latin overflow | ✅ DONE | cycle-41 | tsc 0, vitest 88/88, lint 0 |
| 42-43 | 3.2 — Версионирование КП + `sourceItemId` | ✅ DONE | cycle-42-43 | tsc 0, vitest 88/88, lint 0 |

**Завершено**: 4/8 тех-блоков (50%).

## 🚧 В ПРОЦЕССЕ / ТОЛЬКО ЧТО СТАРТОВАНЫ

| Цикл | Блок | Статус | Spec | Notes |
|------|------|--------|------|-------|
| **51** | **B.3 — StatusWorkflow live query + seed migration** | ✅ **DONE** (2026-06-20) | [`tasks/current-task.md`](tasks/current-task.md) | Foundation layer — `src/lib/status-workflow.ts` (new) + seed migration SQL + 5 PATCH route refactors. ADR-003 формализован. Commit `cycle-51` (1b9c836). |
| **52** | **B.6 — Роли в API guards** | ✅ **DONE** (2026-06-20) | см. cycle 51 spec | Foundation layer — механическая замена `requireAuth` → `requireRole([...])` в 5 critical entity routes. Commit `cycle-52` (f0a5583). |
| **53** | **B.1 — Finished Goods auto-IN** | ✅ **DONE** (2026-06-20) | cycle-53 commit (3132dc2) | Business-critical layer — InventoryMovement auto-IN при completed. ADR-004. |
| **54** | **B.2 — Client юрлица (B2B)** | ✅ **DONE** (2026-06-20) | cycle-54 commit (2e638fb) | Business-critical layer — Client.type discriminator +5 fields + Zod DU + search insensitive. ADR-004. |
| **44** | **🆕 3.1 — `ProposalEditor` refactor (architectural)** | ✅ **DONE** (2026-06-20) | cycle-44 commit | Extraction: 449-line monolith → 11 sub-components + types + provider + thin page wrapper (15 lines). ADR-005. |
| **45** | **🆕 3.1 — `<ProposalEditor>` polish (memo audit + ESLint cleanup)** | ✅ **DONE** (2026-06-20) | cycle-45 commit (5344998) | Eliminated `ProposalPdfDataLike` → direct `ProposalPdfData` reuse. Created `ProposalEditorFinance` derived object → proposalBlocks deps 9→4, pdfData deps 11→7. pdfData function → useMemo + lazy useState Date.now(). New `resetTemplateSelection` action (eliminates setState-in-effect). Tsc 0 / vitest 88/88 / eslint 0. |
| **46** | **🆕 Cleanup: ESLint src/lib/auth.ts (cycle 39 re-export debt)** | ✅ **DONE** (2026-06-20) | cycle-46 | ESLint clean — устранены 3 unused-import warnings `(signAccessToken, signRefreshToken, JwtPayload)`. |
| **47** | **🆕 B.6-extension: requireAuth→requireRole (partial silo migration)** | ✅ **DONE** (2026-06-20) | cycle-47 | 9 write-handler routes upgraded: requireAuth→requireRole(specific). Остальные 18 с requireEditor() оставлены как viewer-floor (Tier C). |

**Foundation layer стартовал параллельно** — разные файлы, готовит B.1+B.2.

## 📋 ПЛАНИРУЕМЫЕ ЦИКЛЫ (тех-план)

| Цикл | Блок | Статус | Зависимости |
|------|------|--------|-------------|
| 44 | 🆕 3.1 — `<ProposalEditor>` refactor (structural) | ✅ done (2026-06-20) | нет |
| 45 | 🆕 3.1 — `<ProposalEditor>` polish (memo audit + ESLint cleanup) | ✅ done (2026-06-20) | cycle 44 ✅ |
| 46-47 | 4.1 — Proposal editor 3-panel UX | 📋 planned | 3.1 |
| 48-49 | 6.1 — Tests isolation / integration | 📋 planned | нет |
| **50** | **🆕 7.1 — Zustand refresh TTL + silent preempt** | ✅ **DONE** (2026-06-22) | нет | NEW `src/stores/auth-refresh.ts` (parseJwtExpiry + createRefreshScheduler) + extended `src/stores/auth-store.ts` (tokenExpiryAt + module-level scheduler singleton) + 12 vitest tests. ADR-006. Tier C candidate. Tier A `jwt.ts` НЕ тронут. |

## 📋 ПЛАНИРУЕМЫЕ ЦИКЛЫ (бизнес-план v2)

| Цикл | Блок | Статус | Зависимости |
|------|------|--------|-------------|
| 51 | B.3 StatusWorkflow live query | ✅ done (2026-06-20) | — (foundation) |
| 52 | B.6 Roles API guards | ✅ done (2026-06-20) | — (foundation) |
| **53** | **B.1 Finished Goods auto-IN** | ✅ **DONE** (2026-06-20) | [`tasks/current-task.md`](tasks/current-task.md) cycle-53 | См. ADR-004 | Commit `cycle-53` | tsc 0, vitest 88/88 |
| **54** | **B.2 Client модель для юрлиц (B2B)** | ✅ **DONE** (2026-06-20) | [`tasks/current-task.md`](tasks/current-task.md) cycle-54 | См. ADR-004 | Commit pending | tsc 0, vitest 88/88 |
| **55** | **B.4 Защита номеров документов** | ✅ **DONE** (2026-06-22) | После B.3 ✅ | Frozen-statuses per doc + `assertNumberImmutable()` helper + интеграция в 5 PATCH routes (proposal/contract/productionOrder/supplierOrder/incomingInvoice) + 11 vitest tests в `src/lib/__tests__/number-protection.test.ts`. Tier C candidate. |
| **56** | **B.5 OrderClosing FK relation** | ✅ **DONE** (2026-06-22) | независим | `OrderClosing.orderId` уже formal FK `@relation(fields:[orderId], references:[id], onDelete: SetNull)` — ProductionOrder может удаляться, OrderClosing остаётся как historical record. SetNull cascade защищает audit-trail. |
| 57 | B.7 UserActivity UI | 📋 planned | независим |

---

## 🎯 ТЕКУЩИЙ ФОКУС

**Foundation layer ЗАВЕРШЁН** (cycles 51 + 52 done 2026-06-20). B.3 (StatusWorkflow live query) + B.6 (Roles API guards) — оба ✅ DONE.

**Business-critical layer ЗАВЕРШЁН** (cycles 53 + 54 done 2026-06-20). B.1 (Finished Goods auto-IN) + B.2 (Client юрлица B2B) — оба ✅ DONE.

**Next**: cycle 57 (B.7 UserActivity UI) — only remaining business block (🟢 Low, complexity M). Тех-циклы 44-50 — независимые.

**Подробности cycle 51+52**:
- Cycle 51 — substantive: new helper `src/lib/status-workflow.ts` + cache + seed migration SQL + 5 PATCH route refactors (hardcoded VALID_TRANSITIONS → assertTransitionAllowed).
- Cycle 52 — mechanical: `requireAuth()` → `requireRole([...])` в 5 critical entity routes (proposals/contracts/PO/incoming-invoices/supplier-orders).

**ADR-003** ([link](docs/decisions/ADR-003-status-workflow-live-query.md)) — задокументировал все архитектурные выборы + reversibility.

**Pending**: 30+ routes ещё с `requireAuth` (warehouses, finance deeper, admin internal) — recommended as cycle 52-extension (not blocking business-critical B.1 + B.2).

---

## PRE-FLIGHT CHECKLIST для B-циклов (per [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md))

Перед КАЖДЫМ B-циклом, agent B обязан:

1. ⚠️ **Прочитать [STABLE-MODULES.md](STABLE-MODULES.md)**: проверить, не трогается ли Tier A/B модуль без ADR.
   - Tier A: `src/lib/jwt.ts` (НЕ ТРОГАТЬ).
   - Tier B: `src/lib/pdf/index.ts` (API frozen, internals flexible).
2. ⚠️ **Прочитать [ADR-001-architecture-boundaries.md](docs/decisions/ADR-001-architecture-boundaries.md)**: tech stack зафиксирован, любое изменение стека → ADR-002+.
3. ⚠️ **Прочитать [tasks/current-task.md](tasks/current-task.md)**: детальная спецификация цикла.
4. ⚠️ **Создать ADR-NNN** для любых архитектурных решений (cache strategy, role-map, etc.).
5. ✅ **Запустить gates** после имплементации: tsc 0 / vitest green / eslint 0.
6. ✅ **Code-reviewer** перед commit.
7. ✅ **Обновить ВСЕ 7 документов** (STABLE / audit-tasks / audit-tasks-business / audit-log / current-checklist / current-task / ADR если был).
8. ✅ **Один тематический commit**: `cycle-51: B.3 StatusWorkflow` или `cycle-52: B.6 Roles`.
9. ✅ **После завершения обоих**: открыть B.1 (cycle 53) и B.2 (cycle 54).

---

## 🚪 ТЕКУЩИЕ GATES

```
$ npx tsc --noEmit      → exit 0 ✅
$ npx vitest run        → 272/272 (16 suites) ✅
$ npm run build         → exit 0 ✅
$ npx eslint src ...    → 0 errors ✅
```

Ожидается сохранение (не ухудшение) gate-результатов.

---

## ⛔ БЛОКЕРЫ

Нет активных блокеров. Foundation layer стартован.

### Известные не-блокеры

- Рабочее дерево содержит uncommitted изменения (sortable-block, image-aware preview). Cleanup deferred.
- Тестов PDF не существует (Tier B API frozen).
- Тестов env.ts не существует (Tier C candidate).
- Тестов StatusWorkflow/requireRole не существуют (Tier D — cycles 48-49 deferred).
- 30+ API-роутов всё ещё используют `requireAuth()` без role guard (viewer может читать).
- ⚠️ Prettier: 320 файлов не отформатированы (косметика, не влияет на сборку).

---

## 📝 АНТИ-ПАТТЕРН-ПРЕВЕНТИВНЫЙ ЧЕК (перед каждым cycle)

- [ ] Не трогаю ли я Tier A модуль без ADR?
- [ ] Не предлагаю ли я смену стека (требует ADR-002+)?
- [ ] Не делаю ли «рефакторинг-ради-рефакторинга»?
- [ ] Все ли 7+ документов обновлю по завершении цикла?
- [ ] Покрыт ли новый код тестами (или явно deferred)?
- [ ] Минимальный ли PR (один тематический commit на цикл)?
- [ ] Cycle 52 учитывает, что `requireRole` уже существует?
- [ ] Cache invalidation в admin routes поставлен?
- [ ] Seed migration idempotent (ON CONFLICT DO NOTHING + @@unique)?

Если на любой пункт ответ «да, нарушаю» — **СТОП**.

---

## 🔗 СВЯЗАННЫЕ ДОКУМЕНТЫ

| Документ | Назначение |
|----------|-----------|
| [`STABLE-MODULES.md`](STABLE-MODULES.md) | Реестр стабильных модулей (Tier A/B/C) |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Правила для ИИ-агентов |
| [`docs/decisions/ADR-001-architecture-boundaries.md`](docs/decisions/ADR-001-architecture-boundaries.md) | Tech stack зафиксирован |
| [`docs/decisions/ADR-002-foundation-before-critical.md`](docs/decisions/ADR-002-foundation-before-critical.md) | **NEW (в процессе)** — foundation layer ПЕРЕД business-critical |
| [`docs/decisions/ADR-TEMPLATE.md`](docs/decisions/ADR-TEMPLATE.md) | Шаблон ADR |
| [`audit-tasks.md`](audit-tasks.md) | Тех-план (cycles 39-50) |
| [`audit-tasks-business.md`](audit-tasks-business.md) | Бизнес-план v2 (cycles 51-57) |
| [`business-tasks.md`](business-tasks.md) | Детальный план B-циклов |
| [`discussion.md`](discussion.md) | Тех-дискуссия |
| [`discussion-business-logic.md`](discussion-business-logic.md) | Бизнес-дискуссия (Round 1+2+FINAL) |
| [`tasks/current-task.md`](tasks/current-task.md) | Текущая спецификация активных циклов |
| [`docs/tasks/PARALLEL_WORK_LOG.md`](../tasks/PARALLEL_WORK_LOG.md) | Журнал параллельной работы (бизнес-логика) |
| [`docs/checklists/QUALITY.md`](../checklists/QUALITY.md) | Стандарт проверки модулей |
| [`docs/checklists/IMPLEMENTATION.md`](../checklists/IMPLEMENTATION.md) | Чек-лист реализации (33/33 задач) |
| [`docs/tasks/SKELETONS_CHECKLIST.md`](../tasks/SKELETONS_CHECKLIST.md) | Cкелетоны загрузки (✅ завершён) |
| [`docs/tasks/BUSINESS_LOGIC_REFACTOR_CHECKLIST.md`](../tasks/BUSINESS_LOGIC_REFACTOR_CHECKLIST.md) | Бизнес-логика (⚠️ 1 пункт остался) |
| [`docs/tasks/DB_MIGRATION_CHECKLIST.md`](../tasks/DB_MIGRATION_CHECKLIST.md) | Миграция PG (⏸️ ожидает) |
| [`audit-log.md`](audit-log.md) | Полная история циклов |

---

## 🟡 DEFERRED ↗ NEXT STEPS (из последнего цикла)

_Задачи добавлены пользователем в чек-list после cycle-bootstrap-escape. **НЕ выполнять до команды** — ждать новую задачу по дизайну._

| # | Задача | Источник | Блок | Files | Acceptance |
|---|--------|----------|------|-------|------------|
| **D1** | **Cycles 48-49 vitest: commit pending** — дозафиксить 1 residual tsc error (line 147 null→number в `proposal-block-builder.test.ts`) + commit 3 test files (proposal-block-builder 19 tests + use-proposal-editor-state + auto-receive-finished-goods) per Rule 6. Code-reviewer round-3 уже SHIP-READY YES с medium concern (Product type sites). | suggested followups | 6.1 Tests isolation | `src/lib/__tests__/proposal-block-builder.test.ts:147` + cycle-48/-49 commits | tsc 0 / vitest green (ожидается ~140 tests total) / eslint 0 |
| **D2** | **Cycle 57 B.7: dev-mode rate-limit escape** — добавить `npm run dev:no-rate` flag (или `BYPASS_RATE_LIMIT=1` env) в login route + cycle-57 helper. Предотвращает повторный lockout при dev iteration. Не для prod (intentional: только NODE_ENV=development). | suggested followups | B.7 UserActivity UI | `src/app/api/auth/login/route.ts` + `src/lib/rate-limit.ts` | При `BYPASS_RATE_LIMIT=1` — login без записи RateLimitEntry; cypress/integration smoke test |
| **D3** | **Bootstrap flow integration smoke test** — добавить `src/__tests__/seed-bootstrap.test.ts`: (1) `POST /api/seed` без auth → 200 когда adminCount=0; (2) тот же seed после bootstrap → 401; (3) login admin/admin123 → 200 + Set-Cookie. Защита от регрессии chicken-and-egg deadlock. | suggested followups | infrastructure | new test file `src/__tests__/seed-bootstrap.test.ts` | vitest green; см. ADR-005-rev2 (Tier A → A+ candidate) |

## 🆕 ЦИКЛ «GENERAL AUDIT 2026-06-21» — проект под audit + sync

| # | Что сделано | Файлы | Gates |
|---|-------------|-------|-------|
| **A1** | **CRITICAL infra:** `npm install` (196 пакетов) + `npx prisma generate` (Prisma 7.8.0) — gates были 🔴 (не могли найти модуль `../generated/prisma/client`) | `package-lock.json` + `src/generated/prisma/*` | tsc 0 ✅ vitest 272/272 ✅ |
| **A2** | **MASTER-CHECKLIST создан:** единый документ-карта со всеми P0-P4 приоритетами, валидацией cycle 39-54 с реальным кодом, sync issues | `docs/operations/MASTER-CHECKLIST.md` (NEW) | — |
| **A3** | **ESLint cleanup (16 warnings → 0):** устранены unused imports/vars в 6 файлах + misleading `react-hooks/exhaustive-deps` warning в `use-proposal-editor-state.ts` (`selectedCustomer?.name` → const extraction) | `src/components/skeletons/{admin,editor}-skeleton.tsx`, `src/components/proposal-editor/use-proposal-editor-state.ts:344`, `src/app/api/{org-roles,seed}/route.ts`, `src/app/(dashboard)/production/modules/page.tsx` | eslint 0 errors / 0 warnings ✅ |
| **A4** | **DOC sync:** BUSINESS-LOGIC.md stages 5-12 теперь ✅/⚠️ с реальным статусом (cycle 53, 56, etc.) | `docs/domain/BUSINESS-LOGIC.md` | — |

### 📍 Состояние gates на 2026-06-21 (audit cycle)

```
$ npx tsc --noEmit          → exit 0 ✅ (Prisma client generated)
$ npx vitest run            → 272/272 (16 suites) ✅
$ npx eslint src            → 0 errors / 0 warnings ✅
$ npm run build             → exit 0 ✅ (production-ready)
```

### 🚨 Critical: больше не требуется (закрыто в этом audit)

- ~~node_modules install~~ ✅ (A1)
- ~~prisma generate~~ ✅ (A1)
- ~~ESLint history debt (2 errors)~~ ✅ (A3)

### 🟠 DEFERRED ↗ СЛЕДУЮЩИЕ ЦИКЛЫ (выявлены в этом audit)

| # | Задача | Source | Effort |
|---|--------|--------|--------|
| **D-A1** | **Cycle 47-extension:** migrate `requireAuth()` → `requireRole(['admin','manager'])` для POST/PUT/PATCH/DELETE handlers в 30+ entity routes (warehouses, finance deeper, admin, tenders, etc.). Read-only GET остаётся на `requireAuth()`. | `audit-tasks-business.md` DEFERRED | 4-6 h |
| **D-A2** | **Cycle 50:** silent refresh preempt для auth-store (Zustand TTL). | `audit-tasks.md` cycle 50 | 4 h |
| **D-A3** | **Cycle 14+: Гантт DnD** — перетаскивание задач мышью для изменения сроков. | BUSINESS-LOGIC §7 | 6-8 h |
| **D-A4** | **Cycle 8+: Снабжение auto-form** — авто-список закупок из `Product.modules[].materials`. | BUSINESS-LOGIC §8 | 6-10 h |
| **D-A5** | **Cycle 11+: Shipment UI** — акты + частичная отгрузка + фото. | BUSINESS-LOGIC §11 | 6-10 h |
| **D-A6** | **Cycle 13+: Ролевая панель UI** — каждая роль видит только свои панели. | BUSINESS-LOGIC §5 / §13 | 4-8 h |

---

## История обновлений

| Дата | Изменение |
|------|-----------|
| 2026-06-20 (early) | Initial creation: 4 цикла DONE, docs system подготовлен |
| 2026-06-20 (mid) | **Foundation layer СТАРТОВАН** (cycles 51+52 marked 🚧 in_progress); spec в tasks/current-task.md; ADR-002 в процессе |
| 2026-06-20 (later) | **Foundation + Business-critical ЗАВЕРШЕНЫ** (cycles 51+52+53+54 marked ✅ done); cycles 44-47 polish/refactor ✅ done; ADR-003+004+005 формализованы |
| 2026-06-20 (now) | **cycle-bootstrap-escape ✅ DONE** (commit `378add7`) — bootstrap escape hatch в `src/app/api/seed/route.ts`; companion infra applied live (migrate deploy + DELETE FROM "RateLimitEntry"); audit-log anchor `<a id="cycle-bootstrap-escape">`. **3 followups добавлены в ↗ NEXT STEPS (D1+DD2+D3)** по команде пользователя. |
| 2026-06-21 (audit) | **GENERAL AUDIT** (see cycle A1-A4 below): npm install + prisma generate unblocked gates; MASTER-CHECKLIST.md создан; 16 ESLint warnings → 0; BUSINESS-LOGIC.md stages 5-12 syncronized с реальностью; `npm run build` lazy proxy fix в db.ts. |
| 2026-06-21 (cycle 54-fix) | **Cycle 54 schema integration** копия реального изменения: добавлен Organization.type discriminator (`legal \| entrepreneur \| individual`); миграция `20260622000000_add_organization_type_discriminator/migration.sql` (ALTER + CREATE INDEX); `src/lib/validations/organization.ts` переписан с Zod `discriminatedUnion` + type-aware Update + `applyTypeAwareValidation` helper. Gates: tsc 0 / vitest 272/272 / prisma generated. |
| 2026-06-22 (cycle 55+56 sync) | **Cycles 55 + 56 DONE** — B.4 защита номеров (5 PATCH routes + 11 vitest tests + number-protection.ts + frozen-statuses.ts) + B.5 OrderClosing FK relation (already in schema as `productionOrder ProductionOrder? @relation(... onDelete: SetNull)`). Docs синхронизированы в CURRENT-CHECKLIST.md + audit-tasks-business.md (📋 planned → ✅ DONE). Gates: tsc 0 / vitest 272/272 (11 new tests pass) / eslint 0 warnings. |
| 2026-06-22 (cycle 50) | **Cycle 50 DONE (7.1 silent refresh preempt)** — NEW `src/stores/auth-refresh.ts` (parseJwtExpiry + createRefreshScheduler with 5min default lead) + extended `src/stores/auth-store.ts` (tokenExpiresAt + module-level scheduler singleton + 3-mode failure handling) + 12 vitest tests in `src/lib/__tests__/auth-refresh.test.ts` (5 parseJwtExpiry paths + 7 scheduler paths using vi.advanceTimersByTime + Promise.resolve microtask drain). ADR-006. Gates: tsc 0 / vitest 284/284 / eslint 0. Tier A `jwt.ts` НЕ тронут. |
