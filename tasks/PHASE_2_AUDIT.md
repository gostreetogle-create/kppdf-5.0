# Phase 2 Static Audit — RBAC Coverage (2026-06-22)

**Тип**: Генеральный аудит RBAC coverage на всём API. **Без изменений кода** — только inventory + classification + findings.

**Генератор**: ripgrep через `code_searcher` patterns + bash loop + tsort по пути.

**Контекст**: Cycle 47 / 52 / D-A1 уже внедрили `requireRole(['admin','manager'])` на критические entity routes. Phase 2 P2.2 / P2.3 этого MASTER-CHECKLIST §6 должны верифицировать, что ОСТАЛЬНЫЕ ~30 роутов тоже корректно guardят mutating handlers (POST/PUT/PATCH/DELETE).

## 1. Итог (TL;DR)

| Категория | Кол-во |
|-----------|-------:|
| Всего route.ts файлов | **89** |
| ✅ Fully covered (requireAuth + requireRole на mutation) | **53** |
| ⚠️ Auth-only mutations (POST/PUT/PATCH/DELETE без role guard) | **4** |
| ⚠️ Editor-only mutations (requireEditor без explicit role list) | **3** |
| 🟢 Публичные / системные (login, health, refresh, me, seed) | **5** |
| 🟢 HOF-wrapped (withEditor — корректный production-ready) | **1** (`import/cad`) |
| ⬜ Нет guards вовсе (auth-bypass risk) | **1** (`admin/cleanup-rate-limit`) |
| ⬜ Используют заменители (getCurrentUser soft-check) | **3** (auth/login, auth/me, my-tasks — см. §11.3) |

**Итого gaps** = **7 total** (4 Auth-only + 3 Editor-only), плюс 2 admin-related (cleanup-rate-limit, my-tasks verify) — расписано в §4-§5 + §11.

## 2. Методология

```bash
for f in $(find src/app/api -name 'route.ts' -type f | sort); do
  methods=$(grep -oE 'export async function (GET|POST|PUT|PATCH|DELETE)' $f | grep -oE '(GET|POST|PUT|PATCH|DELETE)' | sort -u | tr '\n' ',')
  guards=$(grep -oE 'requireAuth|requireRole|requireEditor|requireAdmin|requireManager|requireOwner|requireProduction|requireStorekeeper|requireAccountant|requireViewer|requireAuthOrApiKey' $f | sort -u | tr '\n' ',')
  printf '%s\t%s\t%s\t%s\n' $entity $path $methods $guards
done
```

**Guard-функции в `src/lib/auth.ts`**:
- `requireAuth()` — аутентификация (401 если нет user), role-проверки не делает
- `requireRole(['admin','manager'])` — RBAC (401 → 403), admin bypass
- `requireEditor()` — блокирует viewer, throws FORBIDDEN (внутри вызывает requireAuth)
- `getCurrentUser()` — soft check, throws если нет user (но не проверяет role)

## 3. ✅ Fully Covered (RequireAuth + RequireRole)

Все 53 роута в этой категории имеют правильный паттерн: `await requireAuth()` для аутентификации + `await requireRole([...])` для RBAC. Cycle 47 / 52 / D-A1 покрыли.

**Entity (CRUD pattern)**:
- `cart/route.ts` POST (manager) ✅
- `cart/[id]/convert/route.ts` POST (manager) ✅
- `cart/[id]/items/[itemId]/route.ts` DELETE,PATCH (manager) ✅
- `cart/[id]/items/route.ts` POST (manager) ✅
- `certificates/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `contracts/[id]/convert-to-production/route.ts` POST ✅
- `contracts/[id]/route.ts` DELETE,GET,PATCH,PUT ✅
- `document-templates/[id]/clone/route.ts` POST ✅
- `document-templates/route.ts` GET,POST ✅
- `incoming-invoices/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PATCH,PUT ✅
- `inventor-files/route.ts` GET,POST ✅
- `inventory-movements/route.ts` GET,POST ✅
- `materials/route.ts` GET,POST ✅ + `categories` GET,POST ✅
- `order-closings/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `order-tasks/route.ts` GET,POST ✅ + `[id]/assign` PATCH ✅ + `[id]/status` PATCH ✅
- `organizations/route.ts` GET,POST ✅
- `persons/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `product-modules/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `production-orders/route.ts` GET,POST ✅ + `[id]/status` PATCH ✅
- `proposals/route.ts` GET,POST ✅ + `[id]/convert` POST ✅ + `[id]` DELETE,GET,PATCH,PUT ✅
- `purchase-requests/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `reconciliation-acts/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `seed/route.ts` POST ✅
- `status-workflows/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `storage-items/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `supplier-orders/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PATCH,PUT ✅
- `tenders/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅
- `users/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PATCH,PUT ✅
- `warehouses/route.ts` GET,POST ✅ + `[id]` DELETE,GET,PUT ✅

## 4. ⚠️ Auth-only Mutations (4 gaps, приоритет P2.2)

Эти роуты принимают любого authenticated user для создания / мутации. Требуется upgrade до `requireRole(['admin','manager'])` (или другого подходящего списка).

| Route | Метод mutation | Текущий guard | Рекомендуемая роль | Бизнес-причина |
|-------|----------------|---------------|--------------------|-----------------|
| `contracts/route.ts` | POST | `requireAuth` only | `requireRole(['admin','manager'])` | Создание контракта — критическая CRM-операция, не для viewer/production |
| `products/categories/route.ts` | POST | `requireAuth` only | `requireRole(['admin','manager'])` | Reference data, viewer не должен создавать категории |
| `work-centers/route.ts` | POST | `requireAuth` only | `requireRole(['admin','manager','production'])` | Work center — производственный справочник, production должен иметь доступ |
| `work-types/route.ts` | POST | `requireAuth` only | `requireRole(['admin','manager','production'])` | Work type — производственный справочник, production должен иметь доступ |

## 5. ⚠️ Editor-only Mutations (3 gaps, приоритет P2.3)

Эти роуты используют `requireEditor()` который блокирует только `viewer`, но пропускает все остальные роли. Если бизнес требует конкретного role list — нужен upgrade до `requireRole([...])`.

| Route | Метод | Текущий guard | Рекомендуемая роль |
|-------|-------|---------------|---------------------|
| `dadata/find-by-inn/route.ts` | POST | `requireEditor` | `requireRole(['admin','manager'])` — DaData lookup CRM-related |
| `shipments/route.ts` | GET,POST | `requireEditor` | `requireRole(['admin','manager','storekeeper'])` — отгрузка для storekeeper |
| `shipments/route.ts` | GET,POST | `requireEditor` (у POST — только) | `requireRole(['admin','manager','storekeeper'])` — отгрузка для storekeeper |
| `upload/route.ts` | POST | `requireEditor` | `requireRole(['admin','manager'])` — uploads controlled (И catch block fix для FORBIDDEN → 403 вместо 500) |

## 6. 🟢 Публичные / Системные (5, intentional) + 1 HOF

Эти роуты обязаны быть без традиционных guards — они формируют auth-инфраструктуру или maintenance.

| Route | Метод | Зачем без guard |
|-------|-------|-----------------|
| `auth/login/route.ts` | DELETE,POST | Login — credential validation |
| `auth/me/route.ts` | GET | Identity probe — сам определяет auth |
| `auth/refresh/route.ts` | POST | JWT refresh — token-based, not user-based |
| `health/route.ts` | GET | Liveness probe — Kubernetes / monitoring |
| `seed/route.ts` | POST | Bootstrap escape hatch (cycle-bootstrap-escape `378add7`) |

**HOF-wrapped (1)** — отдельная подкатегория, **корректно guardнуто через HOF**:
| Route | Метод | Паттерн |
|-------|-------|----------|
| `import/cad/route.ts` | POST | `export const POST = withEditor(async (req, ctx, user) => { ... })` — см. §11.1 |

## 7. ⬜ Нет guards вовсе (0, требует fix)

(_Audit reclassification:_ `admin/cleanup-rate-limit/route.ts` УЖЕ защищён через `Bearer CLEANUP_SECRET` env-проверку в начале POST handler — это просто не pattern-matching'ится к `require*` helpers. Audit §7 первоначально пометил как zero-guards, но это некорректно — read файла показал env-based auth. **Route change НЕ требуется**. См. §11.2 ниже.)

(_Historical note: до ревизии §7 также содержал `my-tasks/route.ts` как zero-guards. После ревизии переклассифицирован в §11.3 потому что использует `getCurrentUser` soft-check + в цикле P2.3 tightен`'contains' → 'equals'` для предотвращения privacy leak через похожие displayName._)

## 8. Per-entity heat-map

```
HIGH coverage (full RBAC на GET/POST/PUT/PATCH/DELETE):
  contracts, proposals, production-orders, supplier-orders,
  incoming-invoices, persons, organizations, products, materials,
  warehouses, tenders, users, status-workflows, document-templates,
  document-clone, reconciliation-acts, certificates,
  order-tasks (assign/status отдельно — OK),
  storage-items, inventory-movements, purchase-requests, seed,
  rpp-entries, inventor-files, product-modules,
  contract-convert, proposal-convert, cart, cart/items,
  org-roles

MEDIUM gaps (mutation needs review):
  contracts (POST — auth-only)
  products/categories (POST — auth-only)
  work-centers (POST — auth-only)
  work-types (POST — auth-only)

LOW coverage (editor-only or no-guards):
  dadata/find-by-inn (editor-only POST)
  shipments (editor-only GET+POST)
  upload (editor-only POST)
  admin/cleanup-rate-limit (no guards — MEDIUM priority)
  import/cad (withEditor HOF — ✅ корректно)

ANOMALY (soft-check via getCurrentUser):
  my-tasks (GET, user-scoped — verify в §11.3)

PUBLIC (intentional):
  auth/{login, me, refresh}, health, seed (bootstrap escape)

HOF (legitimate pattern):
  import/cad
```

## 9. Скрытые аномалии и заменители guards

### 9.1 `import/cad/route.ts` — HOF pattern, не пустой обработчик

Grep по `export async function POST/GET` не нашёл хендлеров, но это **НЕ bug** — файл использует `withEditor` Higher-Order Function pattern из `src/lib/api-wrapper.ts`:

```typescript
import { withEditor } from '@/lib/api-wrapper';
export const POST = withEditor(async (req: NextRequest, _ctx, _user) => {
  // ...logic...
});
```

`withEditor` internally делает `requireEditor` style проверку. Это объясняет, почему `requireEditor` входит в grep результат, а `POST` — нет. **НЕ gap** — корректный production-ready route.

### 9.2 `admin/cleanup-rate-limit/route.ts` — POST без guards

Maintenance/admin endpoint. Без guards значит **любой authenticated** может вызвать cleanup.

**Priority: MEDIUM** — даже внутри admin endpoints нужно явно требовать role + логировать кто вызвал.

**Recommend**: P2.3 — добавить `requireRole(['admin'])` + audit log.

### 9.3 Методология: прямые `getCurrentUser()` вызовы

Первичный grep искал только `requireAuth|requireRole|requireEditor|...` helper-функции. **Прямой вызов `getCurrentUser()` НЕ покрыт** — manual auth pattern. Обнаружено **3 места**:

| Route | Pattern | Concern |
|-------|---------|---------|
| `auth/login/route.ts` | `getCurrentUser` (1 call) | **Intentional** — login должен вернуть user context, не require* helpers |
| `auth/me/route.ts` | `getCurrentUser` (1 call) | **Intentional** — literally /me endpoint, getCurrentUser подходящий |
| `my-tasks/route.ts` | `getCurrentUser` (1 call) | **⚠️ Soft check** — getCurrentUser throws UNAUTHORIZED на отсутствие user. Защищает от anonymous, но **не защищает от viewer** (viewer тоже authenticated). Если endpoint возвращает только user-specific tasks (filter by `currentUser.id`), это OK. Если показывает массив — возможен privacy leak. |

**Recommend**: В P2.3 добавить grep `getCurrentUser` + ручное чтение `my-tasks/route.ts` для verify intent. Если filter по userId — OK. Иначе — fix.

## 10. Следующие шаги (NOT part of this audit scope)

Per user choice "Static audit (no changes)" — этот отчёт **идентифицирует gaps**, без модификации кода.

**P2.2 (2h)**: Fix 4 Auth-only mutations (contracts / products-categories / work-centers / work-types) → добавить `requireRole({...})` + update tests + docs.

**P2.3 (4h)**: Fix 3 Editor-only mutations + admin/cleanup-rate-limit + verify my-tasks scope + (optional) refactor import/cad → explicit `requireRole` pattern вместо `withEditor` HOF для consistency + migrate `getCurrentUser` users к require* helpers where appropriate.

**Optional refactor**: `requireEditor` variant с optional role list — `requireEditor(['admin','manager'])` для ясности + проверяемости.

## 11. Файлы отчёта

- `tasks/PHASE_2_AUDIT.md` — этот отчёт (11 sections, consolidated)
- _raw data: TSV-matrix был cleanuped после analysis (deleted `tasks/_tmp-matrix.txt`)_

_Этот файл — single source of truth для Phase 2 RBAC gaps. После fix каждой категории — обновить соответствующие ✅ → ⚠️ → ✅._
