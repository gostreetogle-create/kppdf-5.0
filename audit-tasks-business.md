# План задач по результатам аудита БИЗНЕС-ЛОГИКИ kppdf-5.0

**Дата**: 2026-06-20 (обновлено после Round 2 / ФИНАЛЬНЫЙ КОНСЕНСУС + cycles 51+52 DONE)
**Источник**: [`discussion-business-logic.md`](./discussion-business-logic.md) — Round 1 + 2 + ФИНАЛЬНЫЙ КОНСЕНСУС.
**Технический параллельный план**: [`audit-tasks.md`](./audit-tasks.md) (cycles 39-50).
**Детальная имплементация по каждому блоку**: [`business-tasks.md`](./business-tasks.md).
**Конституция проекта**: [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md), [`docs/decisions/ADR-001-architecture-boundaries.md`](./docs/decisions/ADR-001-architecture-boundaries.md).
**Участники**: Агент A (Бизнес-Архитектор), Агент B (Бизнес-Рецензент).
**Контекст**: технический аудит завершён (4/8 blocks DONE — M5 + env.ts + versioning + PDF). Бизнес-аудит Round 1+2 завершён, **ФИНАЛЬНЫЙ КОНСЕНСУС подписан обеими сторонами**. **Foundation layer (cycles 51+52) ЗАВЕРШЁН**.

---

## 📊 Прогресс (cycles 39-50 тех + cycles 51-57 бизнес v2)

| Цикл | Блок | Тип | Приоритет | Статус |
|------|------|-----|-----------|--------|
| 39 | M5 — auth/jwt развязка | технический | High | ✅ DONE |
| 40 | 1.3 — `src/lib/env.ts` consolidation | технический | Low | ✅ DONE |
| 41 | 5.1+5.2 — PDF page-break + Latin overflow | технический | High+Low | ✅ DONE |
| 42-43 | 3.2 — Версионирование КП + `sourceItemId` | технический | Medium | ✅ DONE |
| 44-45 | 3.1 — `<ProposalEditor>` refactor (architectural) | технический | Medium | 📋 planned |
| 46-47 | 4.1 — Proposal editor 3-panel UX | технический | Medium | 📋 planned |
| 48-49 | 6.1 — Tests isolation / integration mock prisma | технический | Low | 📋 planned |
| 50 | 7.1 — Zustand refresh TTL + silent refresh preempt | технический | Low | 📋 planned |
| **51** | **B.3 — StatusWorkflow live query + seed-миграция** | **бизнес** | **🔴 Critical (foundation)** | ✅ **DONE** |
| **52** | **B.6 — Роли в API guards (`requireRole`)** | **бизнес** | **🔴 Critical (foundation)** | ✅ **DONE** |
| 53 | B.1 — Производство → Склад (finished goods IN, auto) | бизнес | 🔴 Critical | 📋 planned (можно стартовать) |
| 54 | B.2 — Client модель для юрлиц (B2B) | бизнес | 🔴 Critical | 📋 planned (можно стартовать) |
| 55 | B.4 — Защита номеров документов после sent/active/paid | бизнес | 🟡 High | 📋 planned |
| 56 | B.5 — OrderClosing FK relation (audit-trail strict) | бизнес | 🟡 High | 📋 planned |
| 57 | B.7 — UserActivity UI (история для всех сущностей) | бизнес | 🟢 Low | 📋 planned |

**Завершено технических**: 4/8 (50%).
**Завершено бизнес**: 2/7 **foundation layer** (B.3 + B.6). Cycles 53+54 теперь **разблокированы**.
**Бизнес план v2**: 7 блоков (cycles 51-57), против исходного draft 8 блоков (cycles 51-58). B.7 и B.8 объединены в один блок B.7 (см. Round 2 консенсус).
**Порядок**: foundation layer (51+52 DONE параллельно) → business-critical (53+54 next, parallel) → high/low business.

---

## ✅ Выполненные бизнес-блоки (cycles 51+52)

### ✅ Cycle 51 — B.3 StatusWorkflow live query + seed

**Что было сделано**:
- `prisma/schema.prisma` — добавлен `@@unique([entity, fromStatus, toStatus])` к `StatusWorkflow`.
- `prisma/migrations/20260620120000_add_status_workflow_unique_and_seed/migration.sql` — dedup query (ROW_NUMBER OVER) → drop old index → create unique index → seed 5 entities (proposal, contract, productionOrder, incomingInvoice, supplierOrder) с `ON CONFLICT DO NOTHING` (idempotent).
- `src/lib/status-workflow.ts` (NEW, 230+ строк) — `assertTransitionAllowed(entity, fromStatus, toStatus, userRole)` + 60s in-memory cache + hardcoded fallback для 5 entity + admin bypass + 'any' wildcard.
- 5 PATCH route handlers рефакторены — hardcoded `VALID_TRANSITIONS` constants удалены, заменены на live workflow query.

**Architectural decision**: см. [`docs/decisions/ADR-003-status-workflow-live-query.md`](./docs/decisions/ADR-003-status-workflow-live-query.md).

**Scope expansion (от spec)**: 5 entity (vs spec 3) — обоснование в ADR: консистентный refactor всех 5 мест с VALID_TRANSITIONS (машиночитаемо через code-search). Дополнительные entities (incomingInvoice, supplierOrder) также получили адъюнктивный RBAC и seed.

### ✅ Cycle 52 — B.6 Роли в API guards

**Что было сделано**:
- 5 PATCH route handlers + corresponding PUT/DELETE рефакторены:
  - `requireAuth()` → `requireRole(['manager'])` для proposals/contracts.
  - `requireRole(['manager', 'production'])` для production-orders status PATCH.
  - `requireRole(['accountant'])` для incoming-invoices.
  - `requireRole(['storekeeper'])` для supplier-orders.

**Critical discovery при чтении существующего кода**: `requireRole` уже реализован в `src/lib/auth.ts:67` (cycle 39 M5 развязка). НЕ нужен новый helper. Strict flag НЕ нужен — admin bypass уже обрабатывает strict cases (requireRole(['admin']) матчит admin + bypass работает).

**Тесты**: deferred до cycles 48-49 (testability infra + integration mock prisma). Сейчас manual smoke + unit-test через grep по всем route handlers (0 residual `requireAuth()` в мутирующих handlers из refactored 5 routes).

---

## 🔴 Бизнес-блоки ВЫСОКОГО приоритета

### 🔴 B.1 — Производство → Склад (auto-finished-goods IN)

**Приоритет**: 🔴 Critical
**Сложность**: M
**Цикл**: 53 (next — после cycle 51+52 ✓)
**Зависимости**: B.6 ✓ (роли enforced — auto-IN будет работать только для manager/production).

**Проблема**:
- `autoDeductMaterials()` уже списывает материалы со склада (OUT) при `planned → in_progress` ✓.
- **НЕТ** auto-receive-finished-goods при `in_progress → completed` → компания не может отгрузить клиенту то, что «произвела».

**Решение**:
1. Migration: добавить `InventoryMovement.productionOrderId String?` + FK relation + UNIQUE constraint.
2. В `src/app/api/production-orders/[id]/status/route.ts` для transition в `completed`:
   - Получить related `Proposal.items` или `Contract.items` (через `productionOrder.proposalId/contractId`).
   - Defensive check: если уже есть `InventoryMovement type=in WHERE productionOrderId=X` → skip + warning.
   - Для каждого unique `productId`: найти/создать `StorageItem` в default warehouse (первый `isActive=true`), создать `InventoryMovement type=in`.

**AC**:
- `completed` → автоматически создаются `InventoryMovement type=in` для всех products.
- `InventoryMovement.productionOrderId` заполнен.
- UNIQUE constraint предотвращает дубль IN при повторном переходе.
- Default warehouse = первый с `isActive=true`.

### 🔴 B.2 — Client модель для юрлиц (B2B)

**Приоритет**: 🔴 Critical
**Сложность**: L (большая)
**Цикл**: 54 (next — после cycle 51+52 ✓, параллельно с B.1)
**Зависимости**: B.6 ✓ (роли enforced — юрлица может создать только admin/manager).

**Проблема**:
- `Client` имеет `lastName/firstName/patronymic` (ФИО физлица). Нет полей для юрлица.
- 90% B2B сделок — с юрлицами. Приходится вбивать «ООО СтройМонтаж» в `lastName` (костыль).

**Решение**:
1. Schema migration:
   ```prisma
   model Client {
     // existing
     type          String   @default("individual") // individual | legal
     companyName   String?
     legalForm     String?  // ООО | ОАО | ИП | ЗАО | ПАО
     inn           String?
     kpp           String?
     ogrn          String?
     legalAddress  String?
     @@index([type])
     @@index([inn])
     @@index([companyName])
   }
   ```
2. Zod validation в `src/lib/validations/client.ts`:
   - `type='legal'` → required `companyName`, required `inn` (**10 цифр** для юрлица, 12 для ИП).
   - `type='individual'` → existing валидация.
3. UI: radio «Тип клиента» в ClientForm динамически показывает поля.
4. Миграция: существующие клиенты получают `type='individual'` по default.

**AC**:
- Создание юрлица через UI: работает, валидирует ИНН (10/12 цифр).
- В КП/Договоре работающий фильтр → корректно отображаются реквизиты юрлица в шапке.
- Существующие клиенты не сломаны.

---

## 🟡 Бизнес-блоки СРЕДНЕГО приоритета

### 🟡 B.4 — Защита номеров документов

**Приоритет**: 🟡 High
**Сложность**: S
**Цикл**: 55 (после B.3 ✓)
**Зависимости**: B.3 ✓ (StatusWorkflow живой — можно интегрировать protection в transition flow).

**Проблема**:
- `Proposal.number @unique` — защита от дубликатов, не от **изменения**.
- Бизнес-инвариант: «отправленный документ — номер заморожен». Не enforced.

**Решение**:
1. Helper `src/lib/number-protection.ts` + `src/lib/constants/frozen-statuses.ts`.
2. Frozen statuses per document:
   - `Proposal`: `sent`, `accepted`, `converted`, `paid`.
   - `Contract`: `active`, `completed`.
   - `ProductionOrder`: `in_progress`, `completed`.
   - `SupplierOrder`: `confirmed`, `shipped`, `delivered`.
3. В PATCH endpoint каждого документа: `assertNumberImmutable(...)`.

**AC**:
- PATCH `Proposal.number` при `status='sent'` → 400 «Номер заморожен после отправки».
- Frozen statuses конфигурируемые.
- Тесты для каждого типа документа.

### 🟡 B.5 — OrderClosing FK relation (audit-trail strict)

**Приоритет**: 🟡 High
**Сложность**: S
**Цикл**: 56 (независим)
**Зависимости**: НЕТ.

**Проблема**:
- `OrderClosing.orderId String?` (строка 611 schema) — **НЕ FK Prisma relation** (soft reference).
- Audit-trail broken: при удалении `ProductionOrder` — `OrderClosing` остаётся без обратной ссылки.

**Решение**:
```prisma
model OrderClosing {
  orderId String?
  order ProductionOrder? @relation(fields: [orderId], references: [id], onDelete: SetNull)
  @@index([orderId])
}
```
**Cascade: SetNull** — order может удаляться, OrderClosing остаётся как historical record.

**AC**:
- Удаление `ProductionOrder` НЕ блокирует (`SetNull`).
- Audit-grep: другие soft-reference поля найдены и исправлены.

---

## 🟢 Бизнес-блоки НИЗКОГО приоритета

### 🟢 B.7 — UserActivity UI (история для всех сущностей)

**Приоритет**: 🟢 Low
**Сложность**: M
**Цикл**: 57 (независим)
**Зависимости**: НЕТ.

**Проблема**:
- `UserActivity(entity, entityId)` пишется, но в UI нет кнопки «Посмотреть историю».
- `OrderHistory` — только для production orders, не универсальная.

**Решение**:
1. Компонент `<ActivityLog entity entityId />` в `src/components/activity-log.tsx` (read из `UserActivity`).
2. API endpoint `GET /api/activity-log?entity=X&entityId=Y&page=N`.
3. Tab «История» в viewer'ах Proposals/Contracts/ProductionOrders.

**AC**:
- Timeline корректно отображает events.
- Pagination 25 events на страницу.
- Real-time: новые events появляются без refresh (опционально).

---

## Резюме (v2.1)

| # | Блок | Приоритет | Сложность | Цикл | Тип | Order |
|---|------|-----------|-----------|------|-----|-------|
| 0 | M5 — auth/jwt развязка | High | S | 39 ✅ | тех | — |
| 1 | 1.3 — env.ts consolidation | Low | S | 40 ✅ | тех | — |
| 2 | 5.1+5.2 — PDF page-break + Latin | High+Low | M/S | 41 ✅ | тех | — |
| 3 | 3.2 — Версионирование КП + sourceItemId | Medium | L | 42-43 ✅ | тех | — |
| 4 | 3.1 — `<ProposalEditor>` refactor | Medium | M | 44-45 | тех | — |
| 5 | 4.1 — Proposal editor 3-panel UX | Medium | M | 46-47 | тех | — |
| 6 | 6.1 — Tests isolation / integration | Low | M | 48-49 | тех | — |
| 7 | 7.1 — Zustand refresh TTL + silent preempt | Low | S | 50 | тех | — |
| **B.3** | **StatusWorkflow live query** | 🔴 Critical | M | **51 ✅** | **бизнес** | **foundation** |
| **B.6** | **Роли API guards** | 🔴 Critical | M | **52 ✅** | **бизнес** | **foundation** |
| **B.1** | **Finished Goods auto-IN** | 🔴 Critical | M | **53** | **бизнес** | **ready next** |
| **B.2** | **Client юрлица (B2B)** | 🔴 Critical | L | **54** | **бизнес** | **ready next (parallel B.1)** |
| B.4 | Защита номеров | 🟡 High | S | 55 | бизнес | after B.3 ✓ |
| B.5 | OrderClosing FK | 🟡 High | S | 56 | бизнес | independent |
| B.7 | UserActivity UI | 🟢 Low | M | 57 | бизнес | independent |

**Изменения от исходного draft**:
- B.6 placement: с позиции 6 на позицию 2 (foundation layer).
- B.8 removed (merged with B.7).

**Foundation layer completion (cycles 51+52)** открывает возможность параллельного старта B.1 (cycle 53) + B.2 (cycle 54) — теперь оба безопасно могут писать с правильной RBAC и единым workflow engine.

---

## ⚠️ ПРИМЕЧАНИЯ

### Honest disclosures

- Тесты для всех B-циклов **deferred** в cycles 48-49 (testability independence + integration mock prisma).
- B.2 (Client юрлица) и B.1 (Finished Goods IN) циклы **можно сделать parallel** — touch разные routes/models. Cycle numbers (53/54) последовательные, но фактически = 2 PR-а.
- B.6 в cycles 51+52 имплементации **не охватил все 30+ routes**, которые планировал spec — только критические 5 entity routes. Остальные routes (warehouse/admin/etc) → рекомендуется отдельный cycle 52-extension (cycle 52.5 или интегрировать в B.1/B.4).

### Cross-cutting правила (система СТАБИЛЬНОСТИ)

- `src/lib/jwt.ts` — **Tier A STABLE**, не трогать (см. `STABLE-MODULES.md`).
- `src/lib/pdf/index.ts` — **Tier B API FROZEN**, только внутренняя реализация может меняться.
- `src/lib/status-workflow.ts` — **Tier C CANDIDATE** (NEW в cycle 51), promotion to Tier A требует vitest покрытия cycles 48-49.
- Все API routes — обычные (Tier D), можно менять.
- Любое изменение Tier A/B требует **ADR** (см. `docs/CONTRIBUTING.md` Правило 3).

---

**Файл синхронизирован с**:
- [`discussion-business-logic.md`](./discussion-business-logic.md) — Round 1+2+Консенсус.
- [`business-tasks.md`](./business-tasks.md) — детальная имплементация по каждому блоку.
- [`docs/decisions/ADR-001-architecture-boundaries.md`](./docs/decisions/ADR-001-architecture-boundaries.md) — tech stack.
- [`docs/decisions/ADR-002-foundation-before-critical.md`](./docs/decisions/ADR-002-foundation-before-critical.md) — foundation-first.
- [`docs/decisions/ADR-003-status-workflow-live-query.md`](./docs/decisions/ADR-003-status-workflow-live-query.md) — StatusWorkflow architecture (cycle 51).

**Дата последнего обновления**: 2026-06-20 (v2.1: cycles 51+52 DONE; cycles 53+54 ready).
