# Бизнес-задачи kppdf-5.0 (B-циклы)

**Дата создания**: 2026-06-20
**Источник**: [`discussion-business-logic.md`](./discussion-business-logic.md) — ФИНАЛЬНЫЙ КОНСЕНСУС от 2026-06-20
**Связанные документы**:
- [`audit-tasks.md`](./audit-tasks.md) — технический план (cycles 39-50)
- [`audit-tasks-business.md`](./audit-tasks-business.md) — расширенный бизнес-план (cycles 51-58)
- [`STABLE-MODULES.md`](./STABLE-MODULES.md) — стабильные модули (Tier A/B/C) — НЕ трогать в B-циклах
- [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) — правила для агентов

---

## Порядок выполнения

| # | Цикл | Задача | Приоритет | Статус | Зависимости |
|---|------|--------|-----------|--------|-------------|
| 1 | **B3** | StatusWorkflow → live query + seed-миграция | 🔴 Critical | pending | — (параллельно с B6) |
| 2 | **B6** | Роли в API guards (`requireRole`) | 🔴 Critical | pending | — (параллельно с B3) |
| 3 | **B1** | Finished Goods auto-IN при `completed` | 🔴 Critical | pending | После B6 |
| 4 | **B2** | Client модель для юрлиц (type + поля + Zod) | 🔴 Critical | pending | После B6 (параллельно с B1) |
| 5 | **B4** | Защита номеров (`numberLockedAt` или статус-check) | 🟡 High | pending | После B3 |
| 6 | **B5** | OrderClosing FK вместо `String?` | 🟡 High | pending | Независим |
| 7 | **B7** | UserActivity UI (история для всех сущностей) | 🟢 Low | pending | Независим |

**Примечание**: B3 и B6 (cycles 1+2) идут параллельно как **foundation** для последующих Critical-блоков. B1 и B2 (cycles 3+4) идут после B6 (потому что каждый требует корректной авторизации) и могут выполняться параллельно (разные файлы).

---

## Детализация по циклам

### B3 — StatusWorkflow live query

**Цель**: заменить хардкод `VALID_TRANSITIONS` в API handlers на live query к таблице `StatusWorkflow`.

**Задачи**:
- Создать helper `src/lib/status-workflow.ts`:
  ```ts
  export async function assertTransitionAllowed(
    entity: 'proposal' | 'contract' | 'productionOrder' | 'orderTask' | 'shipment',
    fromStatus: string,
    toStatus: string,
    userRole: string,
  ): Promise<void>
  ```
  helper бросает `WorkflowError` 403 если переход не разрешён или роль не подходит.
- In-memory cache (TTL = 60 сек) для `prisma.statusWorkflow.findMany`.
- Если для entity нет записей в StatusWorkflow → fallback hardcoded default + warning в логи.
- Refresh cache: при изменении через `/admin/status-workflows` cache invalidates.
- Seed-миграция: добавляет стандартные переходы для всех entities в `prisma/migrations/<ts>_seed_status_workflows/`.
- Refactor `src/app/api/proposals/[id]/route.ts` — заменить `VALID_TRANSITIONS` const на вызов helper.
- Refactor `src/app/api/production-orders/[id]/status/route.ts` — аналогично.
- (Опционально) Refactor всех остальных API handlers со статусами.

**Файлы**:
- `src/lib/status-workflow.ts` (new)
- `prisma/migrations/<ts>_seed_status_workflows/migration.sql` (new)
- `src/app/api/proposals/[id]/route.ts` (edit)
- `src/app/api/production-orders/[id]/status/route.ts` (edit)

**AC**:
- Helper покрывает все 5 entity types.
- Cache hit rate > 90% для типичных сценариев.
- API handlers pass role + status → helper validates → throws/accepts.
- Test: unit test для helper (mock prisma) — в cycle 48-49.

---

### B6 — Роли API guards

**Цель**: enforce role-based access control во всех критических API endpoints.

**Задачи**:
- Создать helper `src/lib/auth-roles.ts`:
  ```ts
  export async function requireRole(roles: string[]): Promise<User>
  ```
  helper бросает `ForbiddenError` 403 если `user.role` не в списке.
- Audit всех `/api/*` routes и замена `requireAuth` → `requireRole([...])` где нужно.
- Role mapping (centralized):
  | Endpoint pattern | Allowed roles |
  |-----------------|---------------|
  | `/api/proposals/*` | admin, manager |
  | `/api/contracts/*` | admin, manager |
  | `/api/production-orders/*` PATCH | admin, manager, production |
  | `/api/warehouse/*` | admin, storekeeper |
  | `/api/finance/*` | admin, accountant |
  | `/api/users/*` | admin |
  | `/api/admin/*` | admin |

**Файлы**:
- `src/lib/auth-roles.ts` (new)
- `src/lib/auth.ts` (edit, add role support)
- `src/app/api/proposals/[id]/route.ts` (edit)
- `src/app/api/contracts/[id]/route.ts` (edit)
- `src/app/api/production-orders/[id]/status/route.ts` (edit)
- ... все остальные route handlers по audit

**AC**:
- `requireRole(['admin'])` выбрасывает 403 для non-admin пользователей.
- Controlled integration: нельзя менять production order status из viewer-роли.
- Test: integration тест для каждого role/endpoint (cycle 48-49).
- Audit-log: переход с `requireAuth` на `requireRole` для каждого route.

---

### B1 — Finished Goods auto-IN

**Цель**: при завершении `ProductionOrder.status → completed` создать `InventoryMovement type=in` для каждого `productId` из связанного `Proposal.items` или `Contract.items`.

**Задачи**:
- Добавить поле `InventoryMovement.productionOrderId String?` + FK relation `ProductionOrder` с `onDelete: SetNull` + unique constraint.
- В `src/app/api/production-orders/[id]/status/route.ts` (после `autoDeductMaterials` для completed):
  - Получить related proposal или contract (через `productionOrder.proposalId` или `productionOrder.contractId`).
  - Получить все items.
  - Defensive check: если уже есть `InventoryMovement type=in WHERE productionOrderId=X` → skip silently + warning.
  - Для каждого unique `productId`: найти/создать `StorageItem` в default warehouse (первый `isActive=true`), создать `InventoryMovement type=in` с quantity из item.
- Migration: добавить `InventoryMovement.productionOrderId` FK.

**Файлы**:
- `prisma/schema.prisma` (edit)
- `prisma/migrations/<ts>_add_inventory_movement_production_order_id/migration.sql` (new)
- `src/app/api/production-orders/[id]/status/route.ts` (edit)

**AC**:
- `completed` → автоматически создаются `InventoryMovement type=in` для всех products.
- `InventoryMovement.productionOrderId` заполнен.
- UNIQUE constraint предотвращает дубль IN при повторном переходе.
- Default warehouse = первый с `isActive=true`.
- Edge case: productionOrder без proposal/contract → manual через UI.

---

### B2 — Client модель для юрлиц

**Цель**: расширить `Client` для поддержки юрлиц + UI переключатель «Тип клиента».

**Задачи**:
- Schema migration:
  ```prisma
  model Client {
    // existing
    type          String   @default("individual") // individual | legal
    // individual fields (existing optional)
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
- Zod validation в `src/lib/validations/client.ts`:
  - `type='individual'` → валидация: optional `inn` (если задан, **12 цифр** для ИП).
  - `type='legal'` → валидация: required `companyName`, required `inn` (**10 цифр** для юрлица или 12 для ИП), optional `kpp`, optional `ogrn`, optional `legalAddress`.
- UI: radio button «Тип клиента: Физическое лицо / Юридическое лицо» в ClientForm. Динамически показывает поля.
- Migration: существующие клиенты получают `type='individual'` по default.
- Update views: card client viewer показывает реквизиты в зависимости от типа.

**Файлы**:
- `prisma/schema.prisma` (edit)
- `prisma/migrations/<ts>_add_client_legal_entity/migration.sql` (new)
- `src/lib/validations/client.ts` (edit, Zod refinements)
- `src/app/(dashboard)/clients/[id]/page.tsx` (edit, form)
- `src/components/client-form.tsx` (edit/new, type radio)

**AC**:
- Создание юрлица через UI: работает, валидирует ИНН.
- В КП/Договоре работающий фильтр client (любой тип) — корректно отображается шапка документа.
- Существующие клиенты не сломаны.
- Audit-grep: `findUnique({ where: { inn } })` теперь работает для найденных юрлиц.

---

### B4 — Защита номеров

**Цель**: запретить изменение `number` документов после перехода в frozen-статусы.

**Задачи**:
- Добавить поле `Proposal.numberLockedAt DateTime?` (или использовать существующий `supersededAt` / другие markers).
- Alternative (preferred): helper с frozen-statuses map:
  ```ts
  const FROZEN_STATUSES = {
    proposal: ['sent', 'accepted', 'converted', 'paid'],
    contract: ['active', 'completed'],
    productionOrder: ['in_progress', 'completed'],
    supplierOrder: ['confirmed', 'shipped', 'delivered'],
    incomingInvoice: ['paid'],
  };
  ```
- Helper `src/lib/number-protection.ts`:
  ```ts
  export function assertNumberImmutable(
    entity: 'proposal' | 'contract' | ...,
    currentStatus: string,
    newNumber: string | undefined,
    currentNumber: string,
  ): void
  ```
- В PATCH endpoint каждого документа: `assertNumberImmutable(...)`.

**Файлы**:
- `src/lib/number-protection.ts` (new)
- `src/lib/constants/frozen-statuses.ts` (new, config)
- `src/app/api/proposals/[id]/route.ts` (edit)
- `src/app/api/contracts/[id]/route.ts` (edit)
- `src/app/api/production-orders/[id]/route.ts` (edit)
- `src/app/api/supplier-orders/[id]/route.ts` (edit)
- `src/app/api/incoming-invoices/[id]/route.ts` (edit)

**AC**:
- PATCH `Proposal.number` при `status='sent'` → 400 «Номер заморожен».
- Frozen statuses list в конфиге (легко изменить).
- Тесты для каждого типа документа.

---

### B5 — OrderClosing FK

**Цель**: заменить `OrderClosing.orderId: String?` на proper FK Prisma relation к `ProductionOrder`.

**Задачи**:
- Schema migration:
  ```prisma
  model OrderClosing {
    ...
    orderId String?
    order   ProductionOrder? @relation(fields: [orderId], references: [id], onDelete: SetNull)
    ...
    @@index([orderId])
  }
  ```
- Миграция данных: prodcutorder IDs остаются string → FK миграция работает (если records exist).
- Audit-grep: найти другие soft-reference поля (`String?` без relation) и тоже исправить.

**Файлы**:
- `prisma/schema.prisma` (edit)
- `prisma/migrations/<ts>_add_order_closing_fk/migration.sql` (new)

**AC**:
- ProductionOrder можно удалить → OrderClosing остаётся (`orderId=NULL`).
- Другие soft-refs найдены и исправлены audit-grep'ом.
- Миграция работает на existing data.

---

### B7 — UserActivity UI

**Цель**: компонент истории изменений для всех entity в viewer'ах.

**Задачи**:
- Создать компонент `<ActivityLog entity="proposal" entityId={id} />` в `src/components/activity-log.tsx`.
- Читает `UserActivity` events, фильтрует по `entity+entityId`.
- Timeline-style UI: дата, userName, action, details (JSON preview).
- Добавить tab/раздел «История» в viewer'ах: Proposals/[id], Contracts/[id], ProductionOrders/[id].
- API endpoint `GET /api/activity-log?entity=X&entityId=Y` с пагинацией.

**Файлы**:
- `src/components/activity-log.tsx` (new)
- `src/app/api/activity-log/route.ts` (new)
- `src/app/(dashboard)/proposals/[id]/page.tsx` (edit, add tab)
- `src/app/(dashboard)/contracts/[id]/page.tsx` (edit, add tab)
- `src/app/(dashboard)/production/[orders]/[id]/page.tsx` (edit, add tab)

**AC**:
- Timeline корректно отображает все events для entity.
- Pagination: 25 events на страницу.
- Real-time: новые events появляются без refresh (опционально).

---

## Обозначения

| Marker | Значение |
|--------|----------|
| 🔴 Critical | Блокирует бизнес-смысл CRM/ERP — нельзя отгружать клиенту, нельзя оформить 90% клиентов, workflow не гибкий |
| 🟡 High | Юридический/бухгалтерский риск, audit-trail проблема |
| 🟢 Low | UX-улучшение, но не критично |
| 📋 pending | Не начат |
| 🚧 in-progress | Активный цикл |
| ✅ DONE | Завершён, gates green, commit создан |

## Связи с техническими циклами

| Бизнес-блок | Параллельный тех-цикл |
|-------------|----------------------|
| B3 StatusWorkflow | cycles 48-49 (tests infra позволит unit-тест для helper) |
| B6 Роли API guards | cycles 48-49 (integration tests) |
| B1 Finished Goods IN | cycles 50 (silent refresh — нет связи, может идти параллельно) |
| B2 Client юрлица | cycles 44-45 (ProposalEditor refactor — компонент может переиспользовать ClientType UI) |
| B4 Защита номеров | нет |
| B5 OrderClosing FK | cycles 49 (tests migration) |
| B7 UserActivity UI | cycles 46-47 (3-panel UX — history может быть отдельной панелью) |

## Honest disclosure

- Документ создан на основе Round 1 + Round 2 ФИНАЛЬНЫЙ КОНСЕНСУС бизнес-дискуссии.
- Implementation details уточнятся в `tasks/current-task.md` для каждого B-цикла.
- Тесты для всех B-циклов deferred в cycles 48-49 (testability independence + integration mock prisma), за исключением простых smoke проверок.

---

**Дата последнего обновления**: 2026-06-20 (initial creation).
