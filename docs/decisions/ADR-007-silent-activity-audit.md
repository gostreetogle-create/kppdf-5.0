# ADR-007: Standardized Best-Effort Activity Logging

**Status**: Accepted
**Date**: 2026-06-22
**Cycle**: 57 (B.7)

## Context

Previously, audit-trail данных в проекте не было: пользователь менял статус КП,
создавал договор, конвертировал в производственный заказ — но **история действий**
нигде не сохранялась. Это усложняло:

- Диагностику спорных ситуаций: "кто перевёл контракт в `active`?"
- Аудит compliance для finance-блока (СФ → оплата).
- Удобство UI: пользователь не видит timeline своей работы.

UserActivity модель уже существовала в `prisma/schema.prisma` (создана в цикле 53 в рамках ADR-004 business-critical layer), но:

1. Schema использовалась только для login events.
2. Не было единого helper для записи.
3. Не было UI timeline.
4. Не было GET endpoint для просмотра.

Требовалось организовать **полный end-to-end audit trail** для 5 critical entities
(proposal, contract, production_order, supplier_order, incoming_invoice) + 6 supporting
entities (material, product, product_module, person, organization, category).

## Decisions

### Decision A: Synchronous `await recordActivity(...)` (NOT fire-and-forget)

**Почему**: в Next.js App Router (особенно при деплое на Vercel/serverless) response
stream может прервать pending promises без `waitUntil`. `await` гарантирует выполнение.
Latency penalty на локальной SQLite: ~1-3ms, приемлемо.

Helper `recordActivity()` сам best-effort (try/catch swallows errors), поэтому ADU-
integration остаётся safe: ошибка записи в `userActivity` не ломает основной user request.

### Decision B: Data Dictionary (entity + action namespace)

**Entity** (snake_case, совпадает с Prisma models концептуально):

| Entity string  | Prisma model       |
|----------------|--------------------|
| `proposal`     | Proposal           |
| `contract`     | Contract           |
| `production_order` | ProductionOrder |
| `supplier_order` | SupplierOrder    |
| `incoming_invoice` | IncomingInvoice |
| `material`     | Material           |
| `material_category` | MaterialCategory |
| `product`      | Product            |
| `product_category` | ProductCategory |
| `product_module` | ProductModule    |
| `person`       | Person             |
| `organization` | Organization       |
| `user`         | User (login events) |

**Action** (bare verbs, без entity в имени):

| Action string | Когда |
|---------------|-------|
| `login` / `logout` | auth-flow |
| `create`      | POST handler успешно создал entity |
| `update`      | PUT handler успешно обновил |
| `delete`      | DELETE handler успешно удалил |
| `update_status` | PATCH handler успешно сменил workflow status |
| `convert`     | POST handler успешно создал derived entity (KP → Contract) |
| `convert_to_production` | Contract → ProductionOrder |

Двойная namespace (entity + action) — потому что при `create` на разных entities нужна
одна и та же логика, но details разные.

### Decision C: Details Payload Shape (минимальные identifiers)

Helper `JSON.stringify(details)` сохраняет payload. Каждый action имеет свой
канонический shape:

- `create` → `{ number: 'КП-0001', title: 'Окна в школе' }` (или `name`, `sku` если нет number)
- `update_status` → `{ from: 'draft', to: 'active' }` + optional `{ signedAt: '...' }` для contract
- `convert` → `{ targetEntity: 'contract', targetId: '...', targetNumber: 'Д-0001' }`
- `convert_to_production` → `{ targetEntity: 'production_order', targetId: '...', targetNumber: 'ЗК-0001', tasksCount: 12 }`

Payload НЕ содержит весь обновлённый record — только ключевые identifiers для timeline.

### Decision D: `userName` Fallback Chain

`recordActivity()` принимает `userName?: string | null`. Helper ZUST auth-store возвращает
`CurrentUser = { id, username, displayName, email }`. Fallback chain в API routes:

```ts
userName: user.displayName || user.username || 'System'
```

Причины:
- `displayName` (e.g. "Иванов И.И.") — предпочтительно для UX (человекочитаемо).
- `username` (e.g. "admin") — fallback для пользователей без ФИО.
- `'System'` — для system-driven событий (cron, seed) — резерв для будущего.

### Decision E: UI Loading Pattern

`<ActivityLog>` компонент делает fetch **client-side** (SWR-style через `useEffect`).
Это сохраняет near-blazing fast initial page loads для viewer страниц (server-rendered HTML
не блокируется на DB query для UserActivity).

Pagination: 25 events/page, prev/next buttons (без jump-to-page для v1).

### Decision F: API Endpoint Access Control

`/api/activity-log` GET endpoint требует `requireAuth()` (любой authenticated viewer).
Не ограничено по role — это audit-trail, доступный всем. В будущем возможно
`requireRole(['admin', 'manager'])` для sensitive entities (contract.amount).

Сейчас: **read-only viewer** — каждый может посмотреть timeline для своих entities.

## Consequences

### Положительные

- ✅ **Полный audit trail** critical entities с минимальными changes (helper + 20 routes).
- ✅ **UI timeline** в viewer pages (proposals, contracts) — visual confirmation of who-did-what.
- ✅ **Best-effort safety**: ошибка логирования не ломает POST/PATCH handler response.
- ✅ **Indexed queries**: `@@index([entity, entityId])` для fast per-entity queries.

### Отрицательные / Trade-offs

- ⚠️ **+1 DB INSERT per мутация**: при high-throughput (100+ POSTs/sec) это лишний INSERT.
  Mitigation: helper is best-effort (SELECT id + INSERT в одной транзакции); latency +2ms.
- ⚠️ **Manual wiring required**: новый API route должен explicit вызвать `recordActivity()`.
  Не auto-instrumented через middleware (потому что middleware не знает semantic details).
- ⚠️ **Future migrations**: при массовом backfill старых данных — нужен separate script.

## Reversibility Matrix

| Decision | Reversibility | Cost to reverse |
|----------|---------------|-----------------|
| Decision A (await) | Easy (~5 min) | Заменить `await` на `void` или `Promise.resolve().then()` |
| Decision B (naming) | Medium (~30 min) | Update 20 routes + UI tests + audit-tasks docs |
| Decision C (payload) | Hard (~2h) | Если payload стал слишком бедным — нет исторических data |
| Decision D (userName) | Easy (~5 min) | Изменить fallback chain |
| Decision E (UI pattern) | Medium (~1h) | SSR-fetch + hydration → рефакторинг |

## Implementation Summary

**20 API routes wired (`recordActivity` вставляется после успешной мутации)**:

- POST: proposals, contracts, production-orders, supplier-orders, incoming-invoices,
  materials, materials/categories, products, products/categories, product-modules,
  persons, organizations (12 routes).
- PATCH status: proposals/[id], contracts/[id], supplier-orders/[id],
  incoming-invoices/[id], production-orders/[id]/status (5 routes).
- Convert: proposals/[id]/convert (KP → Contract), contracts/[id]/convert-to-production
  (Contract → ProductionOrder) (2 routes).
- Login: auth/login (1 route).

**UI components**:
- `/api/activity-log` GET endpoint с requireAuth + pagination.
- `<ActivityLog>` component с timeline-style events + pagination controls.
- Integrated в `proposals/[id]/page.tsx` + `contracts/[id]/page.tsx`.

**Tests**:
- `src/lib/__tests__/activity-log.test.ts` — 10 vitest tests (best-effort + JSON
  serialization + error swallowing + fallback chains).

## Future Work

- Phase 2: DELETE events для entities (требует auth: admin-only).
- Phase 3: Export to CSV/JSON для compliance audit (роль admin).
- Phase 4: TTL-based cleanup (`DELETE FROM UserActivity WHERE createdAt < now() - 1y`).
- Phase 5: UI "filter by action" dropdown для быстрого поиска событий.

## See Also

- ADR-004 (business-critical layer) — UserActivity schema создан.
- ADR-006 (silent refresh preempt) — auth events integration.
- docs/spec/SPEC.md § Audit Trail.
- docs/operations/audit-tasks-business.md (cycle 57 row).
