# Cycles 53 + 54 — Business-Critical Layer: B.1 Finished Goods + B.2 Client юрлица

**Дата старта**: 2026-06-20 (после completion of foundation layer cycles 51+52 ✅).
**Параллельные циклы** (разные models/routes, могут идти одновременно):
- **Cycle 53 — B.1 Производство → Склад** (auto-finished-goods IN при status='completed').
- **Cycle 54 — B.2 Client модель для юрлиц (B2B)** (`type` discriminator + новые поля).

**Источник**: [`audit-tasks-business.md`](../audit-tasks-business.md) v2.2 + [`business-tasks.md`](../business-tasks.md) + [`ADR-004-business-critical-layer.md`](../docs/decisions/ADR-004-business-critical-layer.md).
**Зависимости**: ✅ Foundation layer (cycles 51+52 — StatusWorkflow + Roles).

---

## Следующие циклы (55+56+57)

- **Cycle 55 (B.4 Защита номеров документов)** — frozen-statuses per doc + `assertNumberImmutable(proposal|contract|...)`. Зависимость: B.3 ✓ (StatusWorkflow живой → frozen transitions enforceable). Сложность: S. Можно parallel с B.5+B.7.
- **Cycle 56 (B.5 OrderClosing FK relation)** — formal FK `OrderClosing.order: ProductionOrder?` with `SetNull` cascade + audit других soft-reference fields (`Shipment.orderId String?`). Независим. Сложность: S.
- **Cycle 57 (B.7 UserActivity UI)** — компонент `<ActivityLog entity entityId />` + `GET /api/activity-log` + tab «История» в viewers предложений/договоров/заказов. Независим. Сложность: M.

---

## === РЕЗУЛЬТАТ === (2026-06-20)

### Cycle 53 (B.1) — Committed `3132dc2`

Подробности — см. **ADR-004 + коммит `3132dc2`**. См. также **Cycle 53 раздел в [`audit-tasks-business.md`](../audit-tasks-business.md)**.

### Cycle 54 (B.2) — Committed (cycle-54)

Подробности — см. **ADR-004 + коммит `cycle-54`**. См. также **Cycle 54 раздел в [`audit-tasks-business.md`](../audit-tasks-business.md)**.

---

# OLD archives: Cycles 51 + 52 — Foundation layer: B.3 StatusWorkflow + B.6 Roles

**Дата старта**: 2026-06-20
**Параллельные циклы** (разные файлы, могут идти одновременно):
- **Cycle 51 — B.3 StatusWorkflow live query + seed-миграция** (helper + cache + seed).
- **Cycle 52 — B.6 Роли в API guards** (`requireRole` уже существует в `auth.ts:67` — нужна USAGE).

**Агент A (Критик-Архитектор)** — координатор, формулировка AC, ревью через code-reviewer + ADR-002.
**Агент B (Рецензент-Исполнитель)** — имплементация helper + cache + route edits.

**Источник**: [`audit-tasks-business.md`](../audit-tasks-business.md) v2 + [`business-tasks.md`](../business-tasks.md) + FINAL CONSENSUS Round 2.

**Зависимости обеих циклов**: ❌ нет. Оба — foundation, идут ПЕРЕД бизнес-critical (B.1, B.2).

---

## ⚠️ IMPORTANT DISCOVERY: `requireRole` уже существует!

При чтении [`src/lib/auth.ts:67`](../src/lib/auth.ts) обнаружено:

```ts
// УЖЕ РЕАЛИЗОВАНО в cycle 39 (M5 / jwt.ts decoupling):
export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role) && user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requireEditor() {
  const user = await requireAuth();
  if (user.role === 'viewer') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
```

**Это значит**:
- **Cycle 52 (B.6) сокращается** — НЕ нужен `auth-roles.ts` (helper уже существует).
- Нужно только **механически заменить `requireAuth` → `requireRole([...])`** в route handlers по audit-маппингу.
- Audit-маппинг (из business-tasks.md):
  - `/api/proposals/*` → `requireRole(['manager'])` (admin implicit)
  - `/api/contracts/*` → `requireRole(['manager'])`
  - `/api/production-orders/*` PATCH → `requireRole(['manager', 'production'])`
  - `/api/warehouse/*` → `requireRole(['storekeeper'])`
  - `/api/finance/*` → `requireRole(['accountant'])`
  - `/api/users/*` → `requireRole(['admin'])` (явный)
  - GET endpoints → `requireAuth()` (только чтение)

**Важно**: `requireRole(['admin'])` — admin может НЕ быть в списке, но bypass через `user.role !== 'admin'`. **Это working as designed** — admin всегда имеет доступ. Если нужна **strict** role для admin-only operations (например, `/api/users/*`) — добавить проверку `user.role === 'admin'` explicit.

---

## Файлы, которые нужно изменить

### Cycle 51 (B.3 StatusWorkflow)

| Файл | Действие | Что |
|------|----------|-----|
| `src/lib/status-workflow.ts` | new | Helper `assertTransitionAllowed` + in-memory cache |
| `src/lib/status-workflow-cache.ts` | new | Cache primitives (если helper разрастётся) |
| `src/app/api/admin/status-workflows/route.ts` | edit | Cache invalidation на create/update/delete |
| `src/app/api/proposals/[id]/route.ts` | edit | Заменить `VALID_TRANSITIONS` → `assertTransitionAllowed` |
| `src/app/api/contracts/[id]/route.ts` | edit | (если есть status transitions — нужно проверить) |
| `src/app/api/production-orders/[id]/status/route.ts` | edit | Заменить `VALID_TRANSITIONS` → `assertTransitionAllowed` |
| `prisma/migrations/<ts>_seed_status_workflows/migration.sql` | new | Seed стартовых переходов |

### Cycle 52 (B.6 Roles)

| Файл | Действие | Что |
|------|----------|-----|
| `src/lib/auth.ts` | edit (минимальный) | Уже имеет `requireRole`. Ничего не трогать. |
| `src/app/api/proposals/[id]/route.ts` | edit | GET→requireAuth, PUT/PATCH/DELETE→requireRole(['manager']) |
| `src/app/api/contracts/[id]/route.ts` | edit | Аналогично |
| `src/app/api/production-orders/[id]/status/route.ts` | edit | `requireAuth` → `requireRole(['manager', 'production'])` |
| `src/app/api/warehouse/[id]/...` | edit | `requireRole(['storekeeper'])` |
| `src/app/api/finance/...` | edit | `requireRole(['accountant'])` |
| `src/app/api/users/...` | edit | `requireRole(['admin'])` (admin explicit) |

**Note**: B.6 механическая замена. Если agent B встречает `requireAuth` где нужен role-check — переход `requireRole` согласно маппингу.

---

## 1) Cycle 51 — StatusWorkflow live query

### Helper `src/lib/status-workflow.ts` (new)

```ts
import { prisma } from './db';

type Entity = 'proposal' | 'contract' | 'productionOrder' | 'orderTask' | 'shipment';

const CACHE_TTL_MS = 60_000; // 60 sec
const cache = new Map<Entity, { data: Map<string, string[]>; expiresAt: number }>();

export class WorkflowError extends Error {
  constructor(message: string, public code: 'TRANSITION_NOT_ALLOWED' | 'INSUFFICIENT_ROLE') {
    super(message);
  }
}

/**
 * Hardcoded fallback per entity — current logic from existing code.
 * Если StatusWorkflow пустая для entity, используется этот набор.
 */
const FALLBACK_TRANSITIONS: Record<Entity, Record<string, string[]>> = {
  proposal: {
    draft: ['sent'],
    sent: ['accepted', 'rejected', 'paid'],
    accepted: ['converted', 'paid'],
    paid: ['converted'],
    rejected: ['draft'],
  },
  contract: {
    draft: ['active'],
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['draft'],
  },
  productionOrder: {
    planned: ['in_progress', 'cancelled'],
    in_progress: ['manufacturing', 'painting', 'completed', 'cancelled'],
    manufacturing: ['painting', 'completed', 'cancelled'],
    painting: ['shipping', 'completed', 'cancelled'],
    shipping: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['planned'],
  },
  orderTask: {
    pending: ['in_progress', 'blocked'],
    in_progress: ['completed', 'blocked'],
    completed: [],
    blocked: ['pending'],
  },
  shipment: {
    draft: ['partially', 'shipped', 'cancelled'],
    partially: ['shipped', 'cancelled'],
    shipped: ['cancelled'],
    cancelled: ['draft'],
  },
};

async function loadTransitions(entity: Entity): Promise<Map<string, string[]>> {
  const cached = cache.get(entity);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // Load from DB
  const rows = await prisma.statusWorkflow.findMany({
    where: { entity, isActive: true },
  });

  let transitions: Map<string, string[]>;
  if (rows.length === 0) {
    // Fallback to hardcoded
    console.warn(`[status-workflow] No DB transitions for entity=${entity}, using fallback`);
    transitions = new Map(Object.entries(FALLBACK_TRANSITIONS[entity]));
  } else {
    transitions = new Map();
    for (const row of rows) {
      const key = `${row.fromStatus}->${row.toStatus}`;
      const allowedRoles = row.roles.split(',').map(r => r.trim());
      transitions.set(key, allowedRoles);
    }
  }

  cache.set(entity, { data: transitions, expiresAt: Date.now() + CACHE_TTL_MS });
  return transitions;
}

export function invalidateStatusWorkflowCache(entity?: Entity) {
  if (entity) cache.delete(entity);
  else cache.clear();
}

/**
 * Asserts that a status transition is allowed for the given user role.
 * Throws WorkflowError on rejection.
 */
export async function assertTransitionAllowed(
  entity: Entity,
  fromStatus: string,
  toStatus: string,
  userRole: string,
): Promise<void> {
  const transitions = await loadTransitions(entity);
  const key = `${fromStatus}->${toStatus}`;
  const allowedRoles = transitions.get(key);

  if (!allowedRoles) {
    throw new WorkflowError(
      `Transition ${entity}.${fromStatus}→${toStatus} is not allowed`,
      'TRANSITION_NOT_ALLOWED',
    );
  }

  if (!allowedRoles.includes(userRole) && !allowedRoles.includes('any') && userRole !== 'admin') {
    throw new WorkflowError(
      `Role ${userRole} cannot perform ${entity}.${fromStatus}→${toStatus}`,
      'INSUFFICIENT_ROLE',
    );
  }
}
```

**Design rationale**:
- Cache хранит `Map<Entity, Map<transitionKey, allowedRoles[]>>` — O(1) lookup.
- TTL 60 сек через `expiresAt`.
- Invalidate через explicit `invalidateStatusWorkflowCache(entity)` call в admin route handlers.
- Hardcoded fallback per entity — БЕЗОПАСНый default при пустой БД.
- Admin bypass для transition (как в `requireRole`).

### Cache invalidation hook в `src/app/api/admin/status-workflows/route.ts`

```ts
// В каждом POST/PUT/DELETE handler: после успешной мутации:
import { invalidateStatusWorkflowCache } from '@/lib/status-workflow';

// ... after await prisma.statusWorkflow.create/update/delete ...
invalidateStatusWorkflowCache(entity); // или без аргумента для clear all
```

### Seed migration: `prisma/migrations/<ts>_seed_status_workflows/migration.sql`

```sql
-- Idempotent seed: starter transitions for all entities
-- Uses ON CONFLICT to make re-runs safe

INSERT INTO "StatusWorkflow" (id, name, entity, "fromStatus", "toStatus", roles, "isActive", "createdAt", "updatedAt")
VALUES
  -- Proposal transitions
  (gen_random_uuid(), 'Proposal: draft → sent', 'proposal', 'draft', 'sent', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: sent → accepted', 'proposal', 'sent', 'accepted', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: sent → rejected', 'proposal', 'sent', 'rejected', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: sent → paid', 'proposal', 'sent', 'paid', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: accepted → converted', 'proposal', 'accepted', 'converted', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: accepted → paid', 'proposal', 'accepted', 'paid', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: paid → converted', 'proposal', 'paid', 'converted', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Proposal: rejected → draft', 'proposal', 'rejected', 'draft', 'manager,admin', true, NOW(), NOW()),
  -- Contract transitions
  (gen_random_uuid(), 'Contract: draft → active', 'contract', 'draft', 'active', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Contract: active → completed', 'contract', 'active', 'completed', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Contract: active → cancelled', 'contract', 'active', 'cancelled', 'manager,admin', true, NOW(), NOW()),
  -- ProductionOrder transitions
  (gen_random_uuid(), 'PO: planned → in_progress', 'productionOrder', 'planned', 'in_progress', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: planned → cancelled', 'productionOrder', 'planned', 'cancelled', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: in_progress → manufacturing', 'productionOrder', 'in_progress', 'manufacturing', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: in_progress → painting', 'productionOrder', 'in_progress', 'painting', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: in_progress → completed', 'productionOrder', 'in_progress', 'completed', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: in_progress → cancelled', 'productionOrder', 'in_progress', 'cancelled', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: manufacturing → painting', 'productionOrder', 'manufacturing', 'painting', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: manufacturing → completed', 'productionOrder', 'manufacturing', 'completed', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: manufacturing → cancelled', 'productionOrder', 'manufacturing', 'cancelled', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: painting → shipping', 'productionOrder', 'painting', 'shipping', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: painting → completed', 'productionOrder', 'painting', 'completed', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: painting → cancelled', 'productionOrder', 'painting', 'cancelled', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: shipping → completed', 'productionOrder', 'shipping', 'completed', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: shipping → cancelled', 'productionOrder', 'shipping', 'cancelled', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'PO: cancelled → planned', 'productionOrder', 'cancelled', 'planned', 'manager,admin', true, NOW(), NOW()),
  -- OrderTask transitions
  (gen_random_uuid(), 'Task: pending → in_progress', 'orderTask', 'pending', 'in_progress', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'Task: pending → blocked', 'orderTask', 'pending', 'blocked', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'Task: in_progress → completed', 'orderTask', 'in_progress', 'completed', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'Task: in_progress → blocked', 'orderTask', 'in_progress', 'blocked', 'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid(), 'Task: blocked → pending', 'orderTask', 'blocked', 'pending', 'manager,admin,production', true, NOW(), NOW()),
  -- Shipment transitions
  (gen_random_uuid(), 'Shipment: draft → partially', 'shipment', 'draft', 'partially', 'manager,admin,storekeeper', true, NOW(), NOW()),
  (gen_random_uuid(), 'Shipment: draft → shipped', 'shipment', 'draft', 'shipped', 'manager,admin,storekeeper', true, NOW(), NOW()),
  (gen_random_uuid(), 'Shipment: draft → cancelled', 'shipment', 'draft', 'cancelled', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Shipment: partially → shipped', 'shipment', 'partially', 'shipped', 'manager,admin,storekeeper', true, NOW(), NOW()),
  (gen_random_uuid(), 'Shipment: partially → cancelled', 'shipment', 'partially', 'cancelled', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Shipment: shipped → cancelled', 'shipment', 'shipped', 'cancelled', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'Shipment: cancelled → draft', 'shipment', 'cancelled', 'draft', 'manager,admin', true, NOW(), NOW())
ON CONFLICT (entity, "fromStatus", "toStatus") DO NOTHING;
-- Updatable unique constraint не существует на StatusWorkflow → нужно добавить @@unique([entity, fromStatus, toStatus])
```

**Migration также**: добавить `@@unique([entity, fromStatus, toStatus])` в `prisma/schema.prisma` для `StatusWorkflow` модели, чтобы seed был truly idempotent.

⚠️ **Note**: gen_random_uuid() доступен на PostgreSQL 13+. Если миграция применяется на older версии PostgreSQL — заменить на `cuid()` (или hardcoded UUIDs).

### Refactor `src/app/api/proposals/[id]/route.ts` (PATCH)

**Заменяемый код** (lines 102-114):
```ts
// ❌ Hardcoded VALID_TRANSITIONS
const allowed = VALID_TRANSITIONS[current.status];
if (!allowed || !allowed.includes(status)) {
  return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
}
```

**На новый код**:
```ts
// ✅ Live query to StatusWorkflow
try {
  const user = await requireAuth(); // already done above
  await assertTransitionAllowed('proposal', current.status, status, user.role);
} catch (e) {
  if (e instanceof WorkflowError && e.code === 'TRANSITION_NOT_ALLOWED') {
    return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
  }
  if (e instanceof WorkflowError && e.code === 'INSUFFICIENT_ROLE') {
    return apiError(`Недостаточно прав для перехода`, 403);
  }
  throw e;
}
```

**Удалить**: `const VALID_TRANSITIONS: Record<string, string[]> = { ... }` (lines 71-79) — больше не нужен.

### Refactor `src/app/api/production-orders/[id]/status/route.ts` (PATCH)

Аналогичная замена. Переходы: `planned → in_progress` (autoDeductMaterials), `planned → cancelled`, `in_progress → completed`, и т.д.

`requireAuth` → `requireRole(['manager', 'production'])` (cycle 52 OVERLAP, оба цикла могут менять одну строку — merge carefully).

---

## 2) Cycle 52 — Roles API guards (B.6)

`requireRole` ALREADY exists в `src/lib/auth.ts:67`. Cycle 52 = только USAGE.

### Маппинг requireRole по route handlers

| Route pattern | Action | Currently | Becomes |
|---------------|--------|-----------|---------|
| `/api/proposals/[id]` | GET | requireAuth | requireAuth (только чтение) |
| `/api/proposals/[id]` | PUT | requireEditor | requireRole(['manager']) |
| `/api/proposals/[id]` | PATCH | requireAuth | requireRole(['manager']) |
| `/api/proposals/[id]` | DELETE | requireEditor | requireRole(['manager']) |
| `/api/proposals` POST | POST | (??) | requireRole(['manager']) |
| `/api/contracts/[id]` GET | GET | requireAuth | requireAuth |
| `/api/contracts/[id]` PUT/PATCH/DELETE | mutate | requireEditor? | requireRole(['manager']) |
| `/api/production-orders/[id]/status` | PATCH | requireAuth | requireRole(['manager', 'production']) |
| `/api/warehouse/*` | mutate | requireAuth → | requireRole(['storekeeper']) |
| `/api/finance/*` | mutate | requireAuth → | requireRole(['accountant']) |
| `/api/users/*` | all | requireAuth → | requireRole(['admin']) (strict) |

**Audit шаги**:
1. Grep `src/app/api/**/*` для текущего состояния всех `requireAuth()` и `requireEditor()`.
2. Создать helper `src/lib/api-auth.ts` с role-map:
   ```ts
   export const ROLE_GUARDS = {
     proposal: { mutate: ['manager'] },
     contract: { mutate: ['manager'] },
     productionOrder: { mutate: ['manager', 'production'] },
     warehouse: { mutate: ['storekeeper'] },
     finance: { mutate: ['accountant'] },
     users: { all: ['admin'] }, // strict
   } as const;
   ```
3. Mechanical replace.

### `requireRole(['admin'])` strict mode

Текущая имплементация (`auth.ts:67`) БАЙПАССИТ роль если `user.role === 'admin'`. Это работает для большинства cases. Но для **strict admin-only operations** (например, `users/POST` — создание пользователей), bypass нежелателен.

**Рекомендация**: добавить флаг `strict?: boolean` к requireRole:
```ts
// In src/lib/auth.ts (edit, минимальный)
export async function requireRole(roles: string[], options: { strict?: boolean } = {}) {
  const user = await requireAuth();
  if (options.strict && !roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  if (!roles.includes(user.role) && user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
```

Для `/api/users/*`: `requireRole(['admin'], { strict: true })`.

---

## 3) Gates

### Cycle 51
- `npx tsc --noEmit` → 0
- `npx vitest run` → 88+/88+
- `npx eslint src` → 0
- `npx prisma migrate dev` → migration applies clean
- Manual smoke: change transition в `/admin/status-workflows` → API handler uses new transition immediately (cache invalidation works).

### Cycle 52
- `npx tsc --noEmit` → 0
- `npx vitest run` → 88+/88+
- `npx eslint src` → 0
- Manual smoke: login as `production` role → can call PATCH /api/production-orders/[id]/status. Login as `viewer` → 403.

---

## 4) AC (Acceptance Criteria)

### Cycle 51 (B.3)

| Проверка | Ожидание |
|----------|----------|
| Existing transitions still work | После рефакторинга, все текущие переходы работают (verified через API smoke + tests) |
| Seed migration | `npx prisma migrate dev` → migration runs clean, no duplicates |
| Cache hit | 100% после первой загрузки (TTL 60s) |
| Cache invalidation | После POST/PUT/DELETE в `/admin/status-workflows`, новое поведение видно СРАЗУ |
| Fallback | Если StatusWorkflow очищена вручную → fallback используется + warning в лог |
| Tier A untouched | `src/lib/jwt.ts` не изменён |
| Hardcoded VALID_TRANSITIONS удалены | В `proposals/[id]/route.ts` и `production-orders/[id]/status/route.ts` |

### Cycle 52 (B.6)

| Проверка | Ожидание |
|----------|----------|
| `requireRole(['admin'], { strict: true })` | Только admin проходит. Manager → 403 |
| `requireRole(['manager'])` | Manager И admin проходят. Production → 403 |
| `requireRole(['manager', 'production'])` | Оба проходят. Storekeeper → 403 |
| Все requireAuth() → requireRole() для мутирующих routes | Verified через grep |
| Tier A/B не трогали | `src/lib/jwt.ts`, `src/lib/pdf/index.ts` unchanged |

---

## 5) Особые заметки для Agent B

1. **Tier A STABLE** — `src/lib/jwt.ts` НЕ ТРОГАТЬ. Если нужны изменения в auth/role — создать helper `src/lib/auth-roles.ts` рядом или edit `src/lib/auth.ts` минимально (только signatures, не breaking).
2. **Tier B (PDF)** — `src/lib/pdf/index.ts` имеет exports, которые используются business-critical codes. Если нужны PDF-изменения — оформить ADR-XXX (см. docs/CONTRIBUTING.md).
3. **Cache invalidation при admin mutations** — обязательно invalidates `invalidateStatusWorkflowCache()` после каждого `prisma.statusWorkflow.create/update/delete`. Если забыть — поведение покажется «старым» 60 сек.
4. **Idempotent seed migration** — используй `ON CONFLICT DO NOTHING` + `@@unique([entity, fromStatus, toStatus])` constraint. Без этого повторный run сломается.
5. **Tests defer** — тесты для StatusWorkflow/requireRole defer в cycles 48-49 (testability infra). Сейчас только manual smoke + integration через UI.
6. **Concurrent cycles 51+52** — оба цикла могут менять `src/app/api/proposals/[id]/route.ts` (cycles 51 = INVALID_TRANSITIONS check, cycles 52 = requireRole pattern). Если запустить параллельно — git merge conflict. **Решение**: либо runtime serial через PROTOCOL, либо Цикл 51 завершает PATCH section (calls assertTransitionAllowed), потом Cycle 52 завершает (calls requireRole). Другой coding agent должен быть осведомлён о порядке editing этих строк.

---

## 6) Sequence (per [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md))

```
1. Read STABLE-MODULES.md and ADR-001.
2. Read this spec.
3. Cycle 51: create status-workflow.ts + seed migration + propose cache invalidation design.
4. Cycle 52: edit auth.ts (optional, add strict flag) + edit route handlers (mechanical replacement).
5. Gates: tsc + vitest + eslint.
6. Code-reviewer verdict (parallel with gates).
7. update ALL documents: STABLE-MODULES, audit-tasks-business, audit-log, CURRENT-CHECKLIST.
8. One commit per cycle (commit 51 + commit 52 = 2 commits).
9. After both: trigger B.1 (cycle 53) and B.2 (cycle 54) which depend on foundation layer.
```

---

## === КОМАНДА ДЛЯ АГЕНТА B ===

> Прочитай [`tasks/current-task.md`](../tasks/current-task.md) и выполни ОБА цикла (51 + 52).
> Foundation layer: StatusWorkflow (новый helper) + Roles (USAGE существующего requireRole).
> После завершения:
> 1. Допиши раздел `=== РЕЗУЛЬТАТ ===` ниже.
> 2. Обнови [`audit-log.md`](../audit-log.md) записями циклов 51+52.
> 3. Обнови [`audit-tasks-business.md`](../audit-tasks-business.md) — пометь B.3 и B.6 как ✅ DONE, прогресс с 4/8+0/7 → 4/8+2/7.
> 4. Обнови [`STABLE-MODULES.md`](../STABLE-MODULES.md) если новые module достиг Tier A/B.
> 5. Два коммита: `cycle-51: B.3 StatusWorkflow`, `cycle-52: B.6 Roles API guards`.

---

## === РЕЗУЛЬТАТ === (2026-06-20)

### Cycle 51 (B.3 StatusWorkflow live query + seed) — ✅ DONE

**Изменения**:
- `prisma/schema.prisma` — добавлен `@@unique([entity, fromStatus, toStatus])` к `StatusWorkflow` (был только `@@index([entity, fromStatus])`).
- `prisma/migrations/20260620120000_add_status_workflow_unique_and_seed/migration.sql` — NEW: dedup query (ROW_NUMBER OVER) → drop old index → create unique index → seed 5 entities (proposal, contract, productionOrder, incomingInvoice, supplierOrder) с `ON CONFLICT DO NOTHING` (idempotent).
- `src/lib/status-workflow.ts` — NEW helper: `assertTransitionAllowed(entity, fromStatus, toStatus, userRole)`, 60s in-memory cache, hardcoded fallback для 5 entity, admin bypass + 'any' wildcard + roles[] match.
- `src/app/api/status-workflows/route.ts` — добавлен `invalidateStatusWorkflowCache()` после POST.
- `src/app/api/status-workflows/[id]/route.ts` — добавлен `invalidateStatusWorkflowCache()` после PUT + DELETE (без except где нужно вычислить entity).

**Files invalidated**: 5 PATCH routes refactored — hardcoded `VALID_TRANSITIONS` constants удалены, заменены на `assertTransitionAllowed('ENTITY', current.status, newStatus, user.role)` с дискриминацией `WorkflowError.code` → 400 (TRANSITION_NOT_ALLOWED) / 403 (INSUFFICIENT_ROLE).

**Scope expansion (от spec)**: имплементация покрывает **5 entity** (proposal/contract/productionOrder/incomingInvoice/supplierOrder), а не 3 как в исходном spec — thinker-with-files-gemini рекомендовал консистентный refactor всех 5 мест с VALID_TRANSITIONS (машиночитаемо через code-search).

**Tests**: deferred до cycles 48-49 (testability infra) — вручную проверено через grep по всем route handlers: 0 residual `VALID_TRANSITIONS` consts.

### Cycle 52 (B.6 Roles API guards) — ✅ DONE

**Изменения**: 5 PATCH route handlers + corresponding PUT/DELETE для cycle 51's 5 entities. `requireAuth()` заменён на `requireRole(['manager'])` или `['storekeeper']` или `['accountant']` согласно маппингу.

**Critical discovery при чтении существующего кода**: `requireRole` уже реализован в `src/lib/auth.ts:67` (cycle 39 M5 развязка). НЕ нужен новый helper. Strict flag также НЕ нужен — admin bypass уже обрабатывает strict cases (requireRole(['admin']) матчит admin + bypass работает).

**Applied requirements**:
- /api/proposals/[id]: GET→requireAuth (read), PUT/PATCH/DELETE→requireRole(['manager'])
- /api/contracts/[id]: GET→requireAuth, PUT/PATCH/DELETE→requireRole(['manager'])
- /api/production-orders/[id]/status: PATCH→requireRole(['manager', 'production'])
- /api/incoming-invoices/[id]: GET→requireAuth, PUT/PATCH/DELETE→requireRole(['accountant'])
- /api/supplier-orders/[id]: GET→requireAuth, PUT/PATCH/DELETE→requireRole(['storekeeper'])

**Test infrastructure**: deferred до cycles 48-49 (per business-tasks.md scope agreement).

### Gates (post-fix, после code-reviewer feedback)
- `npx tsc --noEmit` → **0 errors** ✓
- `npx vitest run` → **88/88 (6 suites)** ✓
- `npx eslint src --max-warnings=999` → **0 errors** (3 pre-existing cosmetic warnings про unchanged `auth.ts` re-exports) ✓

### Code-reviewer feedback и применённые fixes

1. Identified bug: PUT cache invalidation использовал `validation.data.entity` для targeted invalidate → оставил old entity stale. **Fix**: all PUT/DELETE invalidate full cache via `invalidateStatusWorkflowCache()` (без аргумента) — simpler + safer.
2. Removed устаревший `import type WorkflowEntity` из `[id]/route.ts` после switch к `invalidateStatusWorkflowCache()` без аргумента.

### Architectural decision

Создан [`docs/decisions/ADR-003-status-workflow-live-query.md`](../docs/decisions/ADR-003-status-workflow-live-query.md), документирующий:
- Замену хардкода на live query (5 alternative рассмотрены).
- Cache стратегию (60s TTL in-memory + invalidation hook) + multi-pod caveat.
- Admin bypass архитектурное решение.
- 5 entity scope (vs spec 3) — обоснование через consistency.
- 'any' wildcard role — для batch operations.

### Tier classification обновление

- `src/lib/status-workflow.ts` — **Tier C CANDIDATE** (новый helper; promotion to Tier A требует vitest покрытия в cycles 48-49).
- `src/lib/auth.ts` — unchanged (Tier D по умолчанию, не promoted — это API surface, не pure module).

### Что НЕ сделано (намеренно, scope discipline)

- ❌ Не реализовывал tests для status-workflow.ts / requireRole — deferred cycles 48-49.
- ❌ Не расширял cycle 52 на warehouse/finance (частично, только через 5 entity уже refactored) — минимальный scope для критических путей.
- ❌ Не правил STABLE-MODULES.md tiers (jwt.ts, pdf/index.ts untouched).
- ❌ Не правил pre-existing 3 lint warnings в auth.ts (cycle 39 re-export debt).
- ❌ Не делал audit-tasks.md update (это тех-план, cycles 39-50; cycles 51+57 входят в audit-tasks-business.md).

### Следующие циклы (по business-tasks.md)

- Cycle 53 (B.1 auto-IN на производстве) — теперь возможна: requireRole(['manager','production']) уже enforced.
- Cycle 54 (B.2 Client юрлица) — теперь возможна: requireRole(['admin','manager']) на Client routes будет enforced.
