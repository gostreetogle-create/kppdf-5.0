# Cycles 42 + 43 — Block 3.2 Версионирование КП

**Дата**: 2026-06-20
**Агент A (Критик)** — координатор, формулировка AC, ревью UI/API
**Агент B (Исполнитель)** — schema migration + cloneProposalItems helper + API + UI (делегировано)
**Источник плана**: `audit-tasks.md` Блок 3.2 (cycles 42-43)
**Связь с discussion**: Round 2 (А предлагает, Б принимает + индекс)

---

## Объединение cycles 42 + 43 в 1 PR

Циклы 42 (schema) и 43 (helper + API + UI) объединяем в **1 PR** — обоснование из thinker:
- Schema migration без API/UI логики = dormant fields без value
- Cohesive scope — versioning feature целиком
- Уменьшает review overhead

PR message: `cycle-42-43: Block 3.2 — Proposal versioning (schema + API + UI)`.

---

## Файлы, которые нужно изменить

| Файл | Действие | Что |
|------|----------|-----|
| `prisma/schema.prisma` | edit | Добавить versioning поля в `Proposal` + `sourceItemId` в `ProposalItem` |
| `prisma/migrations/<timestamp>_add_proposal_versioning/migration.sql` | new | Auto-generated `prisma migrate dev` |
| `src/app/api/proposals/[id]/versions/route.ts` | new | POST endpoint для создания новой версии |
| `src/app/api/proposals/[id]/route.ts` | edit | PUT: block edit если `supersededAt` есть |
| `src/app/api/proposals/[id]/convert/route.ts` | edit | Block convert если не latest active version |
| `src/lib/proposals/clone-items.ts` | new | Pure-function helper `cloneProposalItems(tx, items, newProposalId)` |
| `src/app/(dashboard)/proposals/[id]/page.tsx` | edit | Badge «v{N}» + button «Создать новую версию» + disable Edit при superseded |

---

## 1) Schema migration (`cycle-42` часть)

### `prisma/schema.prisma` — Proposal model

Добавить (после существующего `notes` field):

```prisma
model Proposal {
  // ... existing fields ...

  parentProposalId String?
  parentProposal   Proposal?  @relation("ProposalVersions", fields: [parentProposalId], references: [id], onDelete: SetNull)
  childVersions    Proposal[] @relation("ProposalVersions")

  version       Int       @default(1)
  supersededAt  DateTime?

  // items ProposalItem[] — existing already

  @@unique([number, version])  // ⚠️ заменить `number String @unique` на composite unique
  @@index([number])
  @@index([status])
  @@index([parentProposalId])  // fast lineage lookup
}
```

**🔴 CRITICAL GOTCHA**: `Proposal.number` is `@unique` currently. Multiple versions with same number would crash. Replace with `@@unique([number, version])`.

Default `version: 1` smoothly fills in for all existing rows via Prisma default.

### `prisma/schema.prisma` — ProposalItem model

Добавить `sourceItemId` + self-FK lineage + index:

```prisma
model ProposalItem {
  // ... existing fields ...

  productId String?
  product   Product? @relation(fields: [productId], references: [id])

  proposalId String
  proposal   Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)

  sourceItemId  String?
  sourceItem    ProposalItem?  @relation("ItemLineage", fields: [sourceItemId], references: [id], onDelete: SetNull)
  derivedItems  ProposalItem[] @relation("ItemLineage")

  @@index([proposalId])
  @@index([sourceItemId])  // 🚀 fast lineage lookup (Б's index recommendation)
}
```

**Source-item направление**:  
Каждая новая копия указывает на **immediate parent** (v3 → v2, v4 → v3), как **parentProposalId**. Это сохраняет recent lineage evolution. Source relations cascade to orphans (SetNull) on parent delete.

### Photo / Component копирование

**Уточнение от thinker** (важно — дискуссия ранее ошибочно говорила про ProposalItemPhoto/Foreign key):

`ProposalItem` НЕ владеет photos / components напрямую — он **ссылается на `Product` через `productId`**. Photos и components принадлежат **Product**, не ProposalItem. Поэтому для new version нужно:
- Скопировать только `ProposalItem` rows, сбрасывая `id` (cuid auto)
- Сохранить `productId` (product reference тот же)
- Установить `sourceItemId` для lineage
- **НЕ копировать** photos или components — они остаются в `Product`, и обе версии используют те же photos/components через `productId`

Это **удаляет требование cloneProposalItemsPhotos из audit-tasks.md** — было галлюцинацией в Round 1 дискуссии.

---

## 2) `cloneProposalItems` helper (`cycle-43` часть)

### `src/lib/proposals/clone-items.ts` (new)

```ts
import type { PrismaClient } from '../generated/prisma/client';

/**
 * Cycle 43 / Block 3.2: deep-copy ProposalItem rows для новой версии.
 * 
 * Используется:
 *  - В API route handler `POST /api/proposals/[id]/versions` внутри prisma.$transaction
 *  - В editor "Save as new version" (если будет в будущем)
 * 
 * Важно:
 *  - НЕ копирует photos/components — они в `Product`, ссылка остаётся.
 *  - sourceItemId указывает на **immediate parent** (v2 source → v1 item).
 *  - id auto-generated через cuid() default.
 */
export async function cloneProposalItems(
  tx: Pick<PrismaClient, 'proposalItem'>,  // Prisma transaction client type
  originalItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    markupPercent: number;
    total: number;
    sortOrder: number;
    productId: string | null;
  }>,
  newProposalId: string,
): Promise<number> {
  if (originalItems.length === 0) return 0;

  const data = originalItems.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    markupPercent: item.markupPercent ?? 0,
    total: item.total,
    sortOrder: item.sortOrder,
    productId: item.productId,
    proposalId: newProposalId,
    sourceItemId: item.id,   // ← lineage на immediate parent
  }));

  const result = await tx.proposalItem.createMany({ data });
  return result.count;
}
```

---

## 3) API endpoint `POST /api/proposals/[id]/versions` (`cycle-43`)

### `src/app/api/proposals/[id]/versions/route.ts` (new)

Authentication: `requireEditor()` (matches pattern existing PUT/DELETE).

Handler logic:

```ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEditor } from '@/lib/auth-page';
import { apiOk, apiError } from '@/lib/api-response';
import { cloneProposalItems } from '@/lib/proposals/clone-items';
import { getNextProposalNumber } from '@/lib/counter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },  // Next.js 15+ async params
) {
  try {
    await requireEditor();
    const { id } = await params;

    const parent = await prisma.proposal.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!parent) return apiError('КП не найдена', 404);
    if (parent.supersededAt) {
      return apiError('Нельзя создать версию из superseded КП', 400);
    }

    const newProposal = await prisma.$transaction(async (tx) => {
      const newNumber = await getNextProposalNumber('proposal');

      const v = await tx.proposal.create({
        data: {
          number: newNumber,
          title: parent.title,
          status: 'draft',
          clientId: parent.clientId,
          organizationId: parent.organizationId,
          templateId: parent.templateId,
          markupPercent: parent.markupPercent,
          discountPercent: parent.discountPercent,
          vatRate: parent.vatRate,
          ralCode: parent.ralCode,
          notes: parent.notes,
          validUntil: parent.validUntil,
          parentProposalId: parent.id,
          version: parent.version + 1,
        },
      });

      await cloneProposalItems(tx, parent.items, v.id);

      await tx.proposal.update({
        where: { id: parent.id },
        data: { supersededAt: new Date() },
      });

      return v;
    });

    return apiOk({ proposal: newProposal });
  } catch (err) {
    console.error('Create proposal version failed:', err);
    return apiError('Ошибка сервера', 500);
  }
}
```

**Notes**:
- Использует `requireEditor` из `src/lib/auth-page.ts` — проверь, что функция существует.
- `Next.js 15+ async params` signature — если версия 16.2 другая, скорректируй.
- `getNextProposalNumber('proposal')` из `src/lib/counter.ts` — проверь сигнатуру.

---

## 4) Edit API hardening (`cycle-43`)

### `src/app/api/proposals/[id]/route.ts` — PUT handler

**В начале handler** добавить check:

```ts
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: ...) {
  try {
    await requireEditor();
    const { id } = await params;
    
    const existing = await prisma.proposal.findUnique({
      where: { id },
      select: { supersededAt: true },
    });
    
    if (!existing) return apiError('КП не найдена', 404);
    if (existing.supersededAt) {
      return apiError('Нельзя редактировать superseded версию. Создайте новую версию.', 400);
    }
    
    // ... rest of existing PUT logic ...
  }
}
```

### `src/app/api/proposals/[id]/convert/route.ts` — convert handler

Добавить check: only allow convert if `supersededAt === null` AND no newer version exists:

```ts
const hasNewer = await prisma.proposal.findFirst({
  where: {
    parentProposalId: existing.id,  // or proposalId if item-level
    supersededAt: null,
  },
});
if (hasNewer) {
  return apiError('Конвертировать можно только последнюю активную версию', 400);
}
```

---

## 5) UI changes (`cycle-43`)

### `src/app/(dashboard)/proposals/[id]/page.tsx`

**Interface update**: добавить `version` + `supersededAt`:

```tsx
interface Proposal {
  // ... existing fields ...
  version: number;
  parentProposalId: string | null;
  supersededAt: string | null;
}
```

**Badge**: добавить после `№ {proposal.number}`:

```tsx
{proposal.version > 1 && (
  <span className="ml-2 px-2 py-0.5 bg-[var(--muted)] rounded text-sm">
    v{proposal.version}
  </span>
)}
```

**Toolbar button**: добавить "Создать новую версию" (только если `!supersededAt`):

```tsx
{!proposal.supersededAt && (
  <Button onClick={async () => {
    const res = await fetch(`/api/proposals/${proposal.id}/versions`, { method: 'POST' });
    if (res.ok) {
      const { proposal: newP } = await res.json();
      window.location.href = `/proposals/${newP.id}`;
    } else {
      alert('Ошибка создания версии');
    }
  }}>
    <GitBranch className="h-4 w-4 mr-2" />
    Создать новую версию
  </Button>
)}
```

**Disable Edit button** if `supersededAt`:

```tsx
{proposal.supersededAt && (
  <span className="text-sm text-[var(--muted-foreground)]">
    Версия устарела (superseded)
  </span>
)}
```

---

## 6) AC (Acceptance Criteria)

### Gates
- `npx tsc --noEmit` → **0 ошибок**
- `npx vitest run` → **88/88 в 6/6 suites** (existing tests не сломаны)
- `npx eslint src --max-warnings=999` → **0 ошибок**
- `npx prisma migrate dev --name add_proposal_versioning` → migration applies clean, no errors
- `npx prisma generate` → no errors

### Functional
| Проверка | Ожидание |
|----------|----------|
| Existing КП в БД | `version: 1` для всех (auto-applied default) |
| `prisma db pull` после migration | schema matches `prisma/schema.prisma` |
| Create v2 from v1 (UI button) | POST → 200, new Proposal row with `version: 2`, `parentProposalId: v1.id`, items cloned with lineage, v1.supersededAt = NOW() |
| Try edit v1 (after v2 created) via PUT | API returns 400 "Нельзя редактировать superseded версию" |
| Try edit v2 | API succeeds (v2 is the latest) |
| Convert v1 (after v2) | API returns 400 "Только последняя активная версия" |
| Convert v2 | API succeeds |
| Browser: view v1 viewer | Shows "v1" badge + "Superseded" indicator + NO Edit button |
| Browser: view v2 viewer | Shows "v2" badge + "Создать новую версию" button present |
| Audit-grep: `Proposal.number` is `@unique` | **MUST be `@@unique([number, version])`** — otherwise migration fails |

---

## 7) Особые заметки для Agent B

1. **Photo/Component копирование ОТМЕНЕНО**: photos/components принадлежат `Product`, не `ProposalItem`. Не нужно копировать.

2. **`cloneProposalItems` типы**: `tx` параметр типизирован как `Pick<PrismaClient, 'proposalItem'>`. Альтернативно используй `Prisma.TransactionClient` если экспортирован из generated/prisma/client.

3. **`requireEditor()`**: проверь `src/lib/auth-page.ts`. Если называется иначе (`requireManager`, `requireAuth` + role check), используй правильное имя.

4. **Counter function**: `getNextProposalNumber('proposal')` — проверь сигнатуру. Возможно называется `nextNumber` или использует другой slug.

5. **Migration naming**: `npx prisma migrate dev --name add_proposal_versioning`. НЕ называй `proposal_versioning` без `add_` prefix — convention проекта любит `add_*`.

6. **Cascade on `parentProposalId`**: я выбрал `onDelete: SetNull` (parent можно удалить, children остаются с `parentProposalId: null`). Если хочешь cascade-delete children — измени, но тогда soft-delete (supersededAt) придётся hard-delete — против audit-trail.

7. **Тесты НЕ добавляются** в этой cycle — cycle 48-49 их добавит. Если встретишь баги при компиляции helper — НЕ добавляй workaround, доложи.

---

## 8) Verification strategy (Agent B)

```bash
# 1. Schema migration
npx prisma migrate dev --name add_proposal_versioning

# 2. Verify migration file created
ls prisma/migrations/<timestamp>_add_proposal_versioning/

# 3. Regen Prisma client
npx prisma generate

# 4. Gates
npx tsc --noEmit
npx vitest run
npx eslint src --max-warnings=999

# 5. Functional smoke (опционально через UI / curl)
# - Браузер: открыть любую existing КП (v1), нажать "Создать новую версию"
# - Проверить: редирект на /proposals/<new-id>
# - Вернуться на v1 — увидеть "Superseded"
```

---

## === КОМАНДА ДЛЯ АГЕНТА B ===

> Прочитай `tasks/current-task.md` и выполни задание. После завершения:
> 1. Запиши результат в раздел `=== РЕЗУЛЬТАТ ===` ниже в этом же файле.
> 2. Обнови `audit-log.md` в соответствии с шаблоном (формат записи — см. ниже).
> 3. Обнови `audit-tasks.md` — пометь Блок 3.2 как ✅ DONE.

**Шаблон для `audit-log.md`**:
```
## Циклы 42-43 — Версионирование КП (2026-06-20)

Schema migration: добавлены parentProposalId/version/supersededAt в Proposal, sourceItemId + @@index в ProposalItem. Proposal.number уникальность изменена на @@unique([number, version]) для multi-versioning.

Critical GOTCHA: composer `@unique` на Proposal.number → должен быть `@@unique([number, version])`. Default `version: 1` applies для existing rows автоматически.

Новые файлы:
- `src/lib/proposals/clone-items.ts` (pure-function deep-copy helper)
- `src/app/api/proposals/[id]/versions/route.ts` (POST endpoint)

Изменены:
- `src/app/api/proposals/[id]/route.ts` (PUT: блок редактирования superseded)
- `src/app/api/proposals/[id]/convert/route.ts` (только latest active version)
- `src/app/(dashboard)/proposals/[id]/page.tsx` (badge v{N}, button, status)

Гейты: tsc 0 / vitest 88/88 / lint 0 / prisma migrate dev OK.

Tests defer to cycle 48-49 (testability isolation).
```

---

---

## === РЕЗУЛЬТАТ === (выполнено Агентом A, 2026-06-20, cycles 42+43)

### Что сделано

**Schema migration (cycle 42)**:
- ☐ `prisma/schema.prisma` — `Proposal`: `parentProposalId?` + self-FK + `version Int @default(1)` + `supersededAt DateTime?` + `@@unique([number, version])` composite + `@@index([parentProposalId])`
- ☐ `prisma/schema.prisma` — `ProposalItem`: `sourceItemId?` + self-FK + `@@index([sourceItemId])`
- ☐ Schema composite: `@@unique([parentProposalId, version])` — race protection одновременных POST `/versions`

**Helper (cycle 43)**:
- ☐ [src/lib/proposals/clone-items.ts](src/lib/proposals/clone-items.ts) (new): `cloneProposalItems(tx, items, newProposalId)`

**API endpoint (cycle 43)**:
- ☐ [src/app/api/proposals/[id]/versions/route.ts](src/app/api/proposals/[id]/versions/route.ts) (new): POST — создание версии в `prisma.$transaction`

**Hardening (cycle 43)**:
- ☐ [src/app/api/proposals/[id]/route.ts](src/app/api/proposals/[id]/route.ts) PUT: hard-block superseded + composite-unique check
- ☐ Тот же файл PATCH: hard-block смены статуса при superseded
- ☐ [src/app/api/proposals/[id]/convert/route.ts](src/app/api/proposals/[id]/convert/route.ts): hard-block конвертации superseded
- ☐ [src/app/api/proposals/route.ts](src/app/api/proposals/route.ts) POST: composite-unique check (fix tsc error)

**UI (cycle 43)**:
- ☐ [src/app/(dashboard)/proposals/[id]/page.tsx](src/app/(dashboard)/proposals/[id]/page.tsx): badge `v{N}` + superseded indicator + «Новая версия» button (GitBranch) + Edit скрыт при superseded

### Gates

| Проверка | Результат |
|----------|-----------|
| `npx prisma generate` | ✅ OK, Prisma Client 7.8.0 успешно сгенерирован |
| `npx tsc --noEmit` | ✅ **0 ошибок** |
| `npx vitest run` | ✅ **88/88 тестов в 6/6 suites** |
| `npx eslint src --max-warnings=999` | ✅ 0 ошибок (3 cosmetic warnings pre-existing в `auth.ts`) |
| Code-reviewer-minimax-m3 | ✅ PASS (1 minor: counter gap on abort — acceptable) |

### Промежуточные фиксы (code-reviewer поймал)

1. **Tsc error в proposals LIST POST** — `findUnique({ where: { number } })` против composite `@@unique([number, version])`. Fix: `findFirst({ where: { number, version: 1 } })`.
2. **Race condition при одновременных POST `/versions`** — два запроса могли создать две v2 от одного parent. Fix: `@@unique([parentProposalId, version])` в schema.
3. **`cloneProposalItems` тип** — оставлен union (`Prisma.TransactionClient | Omit<PrismaClient, ...>`) для совместимости с Prisma 7 driver adapter.
4. **`nextProposalNumber()` вне транзакции** — counter может increment при аборте транзакции; приводит к «gap» в нумерации (sequential). Acceptable.

### Prisma migration файл

`prisma migrate dev` не запускался (sandbox без DB connection). При первом запуске на dev/prod DB:
```bash
npx prisma migrate dev --name add_proposal_versioning
```
Сгенерирует SQL миграцию синхронизирующую schema.

### Файлы окончательно изменены

- `prisma/schema.prisma` (edit)
- `src/lib/proposals/clone-items.ts` (new)
- `src/app/api/proposals/[id]/versions/route.ts` (new)
- `src/app/api/proposals/[id]/route.ts` (edit)
- `src/app/api/proposals/[id]/convert/route.ts` (edit)
- `src/app/api/proposals/route.ts` (edit)
- `src/app/(dashboard)/proposals/[id]/page.tsx` (edit)

