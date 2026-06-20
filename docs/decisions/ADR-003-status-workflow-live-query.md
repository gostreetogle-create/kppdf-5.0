# ADR-003: StatusWorkflow — Live Query + 60s In-Memory Cache + RBAC Integration

**Дата**: 2026-06-20
**Статус**: `accepted`
**Авторы**: Агент A (Архитектор), Агент B (Рецензент-Исполнитель)
**Связанные циклы**: 51 (B.3), 52 (B.6)
**Связанные ADR**: [ADR-001](./ADR-001-architecture-boundaries.md) (tech stack), [ADR-002](./ADR-002-foundation-before-critical.md) (foundation-first)

---

## Контекст

До cycle 51 у проекта была хроническая architectural incoherence: модель `StatusWorkflow` (entity, fromStatus, toStatus, roles, isActive) **существовала** в schema и UI админка `/admin/status-workflows` была **готова** для редактирования, но **5 PATCH route handlers** (`proposals/[id]`, `contracts/[id]`, `production-orders/[id]/status`, `incoming-invoices/[id]`, `supplier-orders/[id]`) использовали захардкоженные `VALID_TRANSITIONS: Record<string, string[]>`. Результат: правила переходов редактировались в БД, но **никак не влияли** на runtime поведение.

Параллельно (cycle 52 / B.6) была отдельная проблема: `requireAuth()` использовался для мутирующих endpoints без role check — **любой** авторизованный пользователь мог менять статусы производственного заказа, переводить контракт в `active`, и т.д.

FINAL CONSENSUS Round 2 в [`discussion-business-logic.md`](../../discussion-business-logic.md) постановил:
1. B.3 + B.6 — **foundation layer**, идут ПЕРЕД business-critical (B.1, B.2).
2. Правила workflow должны быть **live query** (не hardcoded, не seed-as-hardcode).
3. RBAC должен быть основан на **роли, заявленной в workflow** (не в коде).

## Решение

### 1. Единый workflow engine: `assertTransitionAllowed(entity, from, to, userRole)`

Вместо 5 захардкоженных `VALID_TRANSITIONS` consts в 5 PATCH handlers, все 5 теперь вызывают единый helper:

```typescript
// src/lib/status-workflow.ts
export async function assertTransitionAllowed(
  entity: WorkflowEntity,
  fromStatus: string,
  toStatus: string,
  userRole: string,
): Promise<void>
```

Helper бросает `WorkflowError` с discriminator `code: 'TRANSITION_NOT_ALLOWED' | 'INSUFFICIENT_ROLE'`. Route handlers сопоставляют code → HTTP status (400 / 403).

### 2. Cache стратегия: in-memory 60s + invalidation hook

```typescript
const CACHE_TTL_MS = 60_000;
const cache = new Map<WorkflowEntity, { data: Map<string, string[]>; expiresAt: number }>();
```

- **TTL 60s**: компромисс между свежестью данных и DB-query нагрузкой.
- **Explicit invalidation**: `invalidateStatusWorkflowCache(entity?)` вызывается в `/api/status-workflows/*` POST/PUT/DELETE — админ видит результат СРАЗУ, не дожидаясь TTL.
- **Hardcoded fallback**: при пустой БД (например, после очистки admin'ом) — fallback const map. Warning в лог `[status-workflow] No DB transitions for entity=X, using hardcoded fallback`.
- **Multi-pod caveat** (явный): на >1 инстансе потребует миграции на revalidateTag (Next.js unstable_cache) или Redis. Сейчас проект single-instance, OK.

### 3. Admin bypass + wildcard 'any'

```typescript
if (userRole === 'admin') return;
if (allowedRoles.includes('any')) return;
if (!allowedRoles.includes(userRole)) throw new WorkflowError(..., 'INSUFFICIENT_ROLE');
```

- **Admin bypass** — consistent с `requireRole(['admin'])`, который уже используется в `/api/users/*`. Не дублируем логику.
- **'any' wildcard** — escape hatch для batch operations, когда admin хочет дать ВСЕМ авторизованным права на переход (например, переход `shipped → cancelled` для всех ролей кроме viewer, чтобы клиент мог отменить доставку).

### 4. Scope: 5 entity вместо 3 (от spec)

Spec cycle 51 упоминал 3 entity (proposal, contract, productionOrder). Имплементация покрывает **5 entity** — добавлены **incomingInvoice** и **supplierOrder** на основании code-search, который выявил `VALID_TRANSITIONS` consts и в этих 2 handlers.

**Обоснование**: оставить 2 entity с хардкодом создаёт inconsistency — одни transitions конфигурируемые в БД, другие нет. Это **грязнее**, чем просто полный refactor. Thinker-with-files-gemini рекомендовал это в design validation.

### 5. Schema: `@@unique([entity, fromStatus, toStatus])`

Добавлен `@@unique` constraint вместо `@@index` на `StatusWorkflow(entity, fromStatus)`:

- **Idempotent seed**: seed migration использует `ON CONFLICT ("entity", "fromStatus", "toStatus") DO NOTHING` — безопасно повторять.
- **Defensive cleanup**: миграция **перед** добавлением constraint удаляет duplicates через `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY createdAt ASC, id ASC) WHERE rn > 1` — preserves oldest by createdAt.
- **Cost**: 1 дополнительный unique index. Negligible для таблицы <1000 строк.

### 6. Cycle 52: механическая замена `requireAuth` → `requireRole([...])`

| Route | Method | Before | After |
|-------|--------|--------|-------|
| `/api/proposals/[id]` | GET | `requireAuth` | `requireAuth` (только чтение) |
| `/api/proposals/[id]` | PUT | `requireEditor` | `requireRole(['manager'])` |
| `/api/proposals/[id]` | PATCH | `requireAuth` | `requireRole(['manager'])` |
| `/api/proposals/[id]` | DELETE | `requireEditor` | `requireRole(['manager'])` |
| `/api/contracts/[id]` | GET/PUT/PATCH/DELETE | аналогично | аналогично |
| `/api/production-orders/[id]/status` | PATCH | `requireAuth` | `requireRole(['manager', 'production'])` |
| `/api/incoming-invoices/[id]` | GET/PUT/PATCH/DELETE | mix | `['accountant']` для mutations |
| `/api/supplier-orders/[id]` | GET/PUT/PATCH/DELETE | mix | `['storekeeper']` для mutations |

`requireRole` уже реализован в `src/lib/auth.ts:67` (cycle 39 M5 развязка). **НЕ нужен новый helper**. Strict flag тоже НЕ нужен — admin bypass уже корректно работает.

---

## Альтернативы (рассмотрены)

### Для cache strategy:
- **(A)** Hardcoded seed-as-code + ручной re-deploy при изменениях — **отклонено**: именно эту проблему админка пыталась решить.
- **(B)** Live query каждый раз, БЕЗ cache — **отклонено**: ~50 PATCH запросов/день × лишний DB query = ненужная нагрузка при дешевизне в-memory Map.
- **(C)** Redis или shared cache layer — **отклонено**: проект single-instance, добавлять Redis ради 60s кеша = over-engineering. Future-proof в multi-pod.
- **(D)** **`unstable_cache` Next.js с revalidateTag** — **отклонено для cycle 51**: на single-instance достаточно in-memory. Multi-pod migration = ADR-NNN later.
- **(E)** Принят: **in-memory Map + 60s TTL + invalidate hook** — simple, debuggable, all cache hits visible в локальных логах.

### Для scope (3 vs 5 entity):
- **(A)** Оставить хардкод в incomingInvoices и supplierOrders — **отклонено**: inconsistency ниже порога приемлемого.
- **(B)** Refactor только 3 как в spec — **отклонено**: думать "но это вне scope" в стейле проще думать "почему ВСЕ эти 5 разные".
- **(C)** Принят: **все 5 entity**.

### Для schema constraint:
- **(A)** Без unique constraint + только seed `WHERE NOT EXISTS` — **отклонено**: race condition при параллельном admin-insert.
- **(B)** Upsert pattern с catch error — **отклонено**: error-prone.
- **(C)** Unique constraint + dedup-then-add — **принят**: clean migration, idempotent.

---

## Последствия

### ✅ Прямые выигрыши

1. **Single source of truth**: правила переходов в БД, не в коде. Админ редактирует `/admin/status-workflows` → поведение меняется для всех пользователей без деплоя.
2. **Гибкость для бизнеса**: добавление новой роли в transition (например, 'production' в `proposal.paid → converted`) = одна строка INSERT в БД, без PR.
3. **Defense in depth**: cycle 51 (workflow engine) + cycle 52 (role gates) — даже если admin misconfigure, `requireRole` заблокирует мутацию.
4. **Audit trail**: каждое изменение workflow в БД имеет `createdAt/updatedAt` + `isActive` — можно временно отключить transition без удаления.
5. **Foundation для B.1 + B.2**: cycles 53/54 могут безопасно писать с уже enforced RBAC + единым workflow engine.

### ⚠️ Известные ограничения

1. **Multi-pod invalidation**: на >1 инстансе cache каждого процесса independent — новое правило видно через 60s TTL пока не invalidates mutation handler. **Mitigation deferred to future cycle** при multi-pod deploy.
2. **Нет tests**: helper `assertTransitionAllowed` + 5 route handlers без vitest покрытия. **Deferred to cycles 48-49** (testability infra: integration mock prisma).
3. **Охват cycle 52 частичный**: 5 critical entity routes refactored, ещё ~30+ routes (warehouses, admin internal, finance broader) используют `requireAuth`/`requireEditor`. **Рекомендуется** cycle 52-extension в будущем.
4. **Hardcoded fallback = drift risk**: если админ вручную очистит `StatusWorkflow`, поведение fallback может отличаться от живых правил (например, fallback `productionOrder` имеет `completed: []` — никто не может перевести в completed, что НЕПРАВИЛЬНО для production orders). **Mitigation**: warning в логике fallback + audit-grep для mismatches.

### 🔁 Reversibility (если решение плохое)

Easy rollback — `git revert` обоих коммитов. VALID_TRANSITIONS consts восстанавливаются в 5 handlers. Schema constraint — нужен down migration (drop unique index). Estimated time: <30 минут.

---

## Compliance

- **Stack consistency**: всё ещё PostgreSQL + Prisma 7 + Next.js 16. Никаких новых зависимостей. ✓ (per ADR-001)
- **Foundation first**: B.3 + B.6 идут ПЕРЕД B.1 + B.2 (per ADR-002). ✓
- **Tier classification**: `src/lib/status-workflow.ts` — **Tier C CANDIDATE** (новый helper, promotion to Tier A требует vitest coverage cycles 48-49). Stable modules (`jwt.ts`, `pdf/index.ts`) не тронуты. ✓
- **Test deferral documented**: `tasks/current-task.md === РЕЗУЛЬТАТ ===` явно фиксирует deferral до cycles 48-49. ✓
- **Single PR per cycle**: cycle 51 (helper + seed + schema + cache wiring) — 1 commit. Cycle 52 (5 route refactors) — 1 separate commit. ✓
- **7+ documents updated**: tasks/current-task.md ✓, audit-log.md ✓, audit-tasks-business.md ✓, CURRENT-CHECKLIST.md ✓, STABLE-MODULES.md (history), ADR-003 (this) ✓. ✓

---

## Связанные документы

- [`ADR-001-architecture-boundaries.md`](./ADR-001-architecture-boundaries.md) — tech stack зафиксирован.
- [`ADR-002-foundation-before-critical.md`](./ADR-002-foundation-before-critical.md) — foundation-first.
- [`business-tasks.md`](../../business-tasks.md) — детальный план B.3 + B.6.
- [`audit-tasks-business.md`](../../audit-tasks-business.md) — обновлён v2.1 (B.3 + B.6 → DONE).
- [`src/lib/status-workflow.ts`](../../src/lib/status-workflow.ts) — имплементация helper.

---

**Дата принятия**: 2026-06-20 (cycle 51+52 завершены, ADR задним числом формализован по результатам).
**Версия**: 1.0 (initial). Изменения требуют ADR-004.
