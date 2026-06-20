# Стабильные модули kppdf-5.0

**Дата**: 2026-06-20 (cycle 41 завершён)
**Назначение**: Этот файл фиксирует список разделов приложения, которые прошли все проверки и **больше не подлежат произвольной переделке**. Цель — остановить практику «бесконечного рефакторинга работающего кода» и перевести разработку в режим «добавление нового функционала + исправление только реальных багов».

---

## Определение стабильности

Модуль считается **СТАБИЛЬНЫМ и ЗАМОРОЖЕННЫМ** для рефакторинга, если ВСЕ следующие критерии выполнены:

1. **`tsc --noEmit`** — проходит без ошибок ✅
2. **Все связанные vitest-тесты зелёные** (N/N) ✅ — модуль покрыт тестами
3. **Прошёл ручной smoke-тест в браузере** (если применимо) ✅
4. **Имеет ADR** с зафиксированными архитектурными решениями (если применимо) ✅
5. **Явно указан** в этом файле как стабильный ✅

### Что ЗАПРЕЩЕНО со стабильным модулем

- Произвольный рефакторинг (переименование, перемещение, изменение интерфейсов).
- Замена реализации на «более новую/правильную» без явного bug-репорта.
- Любые изменения, кроме случаев:
  - **Реальный баг** (broken behavior, security issue, data corruption) — фиксится через patch.
  - **Необходимый feature** — расширение **через новые export'ы**, а не переписывание существующих.

### Что ТРЕБУЕТСЯ для изменения стабильного модуля

- Новый **ADR**, объясняющий, почему изменение НЕОБХОДИМО (не «желательно», а «необходимо»).
- Как минимум один **bug-репорт или issue**, описывающий проблему пользователя.
- **Явное одобрение архитектора** (Агента A) — соответствующая запись в этом файле.

---

## Текущий список стабильных модулей

### Tier A: ✅ ПОЛНОСТЬЮ СТАБИЛЬНЫЕ

| Модуль | Цикл | tsc | vitest | ADR | Smoke | Вердикт |
|--------|------|-----|--------|-----|-------|---------|
| `src/lib/jwt.ts` | 39 | ✅ 0 | ✅ 88/88 (через auth.test.ts) | implicit (M5) | ✅ | **STABLE** |

**Что зафиксировано в этом модуле**:
- Pure JWT helper: `signAccessToken`, `signRefreshToken`, `verifyToken`.
- Нет зависимостей от `db.ts` (decoupling разорвал side-effect chain), от `auth.ts` ui concerns.
- Lazy secret resolution через `getJwtSecret()` — не throws at import time.
- `verbatimModuleSyntax: true` workaround: импорты через type-only там, где нужен только тип.

**Что НЕ подлежит изменению**:
- Сигнатуры экспортируемых функций (breaking changes запрещены).
- Lazy-throw pattern (env throws в функциях, а не на module-level).
- Decoupling от `db.ts` (нельзя «для удобства» снова импортировать `prisma`).

### Tier B: 🧊 API ЗАМОРОЖЕН (внутренняя реализация ещё гибкая)

| Модуль | Цикл | tsc | vitest | ADR | Smoke | Вердикт |
|--------|------|-----|--------|-----|-------|---------|
| `src/lib/pdf/index.ts` | 41 | ✅ 0 | ⚠️ НЕТ PDF тестов (deferred to cycles 48-49) | ADR-002 pending | ✅ (manual) | **API FROZEN** |

**Что зафиксировано — публичный API (НЕ подлежит изменению)**:
- `generateProposalPdf(data: ProposalPdfData): Promise<jsPDFType>`
- `generateContractPdf(data: ContractPdfData): Promise<jsPDFType>`
- `generateInvoicePdf(data: InvoicePdfData): Promise<jsPDFType>`
- `generatePdfFromHtml(elementId: string): Promise<jsPDFType>`
- `downloadPdf(doc: jsPDFType, filename: string): void`
- `openPdfInline(doc: jsPDFType): void`
- `getPdfBlob(doc: jsPDFType): Blob`
- `formatPrice(amount: number): string`
- `formatDate(dateStr: string | Date): string`
- `formatDateShort(dateStr: string \| Date): string`
- Interfaces: `ProposalPdfData`, `ContractPdfData`, `InvoicePdfData`

**Что МОЖЕТ изменяться (внутренняя реализация)**:
- Алгоритмы отрисовки таблиц (`autoTable` config), banner logic, overflow handling — можно менять пока публичные сигнатуры остаются.
- Константы (`PAGE_W`, `PAGE_H`, `MARGIN`) — можно оптимизировать, но не менять публичные значения интерфейсов.

**Что НЕ подлежит изменению** (внешне):
- PDF generation behavior (пользователь получает корректный документ).
- Cyrillic font render (Roboto + `addFileToVFS`).
- Динамический import паттерн через `getPdfLibs()` (не раздувать основной bundle).

### Tier C: 🆕 CANDIDATES (готовятся к стабилизации)

| Модуль | Цикл | tsc | vitest | ADR | Smoke | Вердикт |
|--------|------|-----|--------|-----|-------|---------|
| `src/lib/env.ts` | 40 | ✅ 0 | ❌ нет тестов | implicit (Block 1.3) | ✅ manual | **CANDIDATE** — требует тестов из cycle 48-49 |
| `src/lib/proposals/clone-items.ts` | 43 | ✅ 0 | ❌ нет тестов | pending (Round 3 discussion) | ✅ manual | **CANDIDATE** — требует тестов из cycle 48-49 |
| `src/lib/status-workflow.ts` | 51 | ✅ 0 | ❌ нет тестов | ADR-003 (accepted) | ✅ manual | **CANDIDATE** — требует тестов из cycle 48-49 (cache + 5 PATCH routes integration) |
| `src/lib/warehouse/auto-receive-finished-goods.ts` | 53 | ✅ 0 | ❌ нет тестов | ADR-004 (accepted) | ✅ manual | **CANDIDATE** — требует тестов из cycle 48-49 (race conditions + $transaction integrity + UNIQUE violation swallow) |

**Promotion criterion (Tier C → Tier A)**:
- Должны появиться vitest тесты с покрытием всех экспортируемых функций.
- tsc/vitest snapshot запускается в CI pipeline.

---

## Что НЕ является стабильным (по умолчанию)

- **`src/app/(dashboard)/proposals/new/page.tsx`** (607 строк editor) — это **архитектурный долг**. Block 3.1 (cycles 44-45) рефакторит в `<ProposalEditor>`. Пока НЕ стабилен — наоборот, целевой объект рефакторинга.
- Все **API route handlers** (`/api/*`) — бизнес-логика меняется по мере развития. Конкретные **signal-payload форматы** (Zod schemas в `src/lib/validations/`), однако, стабилизируются при достижении зрелости.
- **Prisma schema** (`prisma/schema.prisma`) — может мигрировать при добавлении полей. Отдельные completions schema migrations записываются в `audit-log.md`.
- **`src/stores/auth-store.ts`** (Zustand) — refresh TTL + silent preempt будет в cycle 50. До этого меняется.

---

## Процесс freeze (как модуль попадает в Tier A)

```
Этап 1: Разработка (CICLES 0..N) — модуль развивается, может меняться API.
   ↓
Этап 2: Зрелость — модуль использовался в production достаточно долго, чтобы
         убедиться: working behavior, нет регулярных bug-репортов.
   ↓
Этап 3: Tests coverage — vitest suite покрывает публичный API.
   ↓
Этап 4: ADR — архитектурное решение зафиксировано в docs/decisions/.
   ↓
Этап 5: PR добавляет модуль в STABLE-MODULES.md (Tier A).
   ↓
Этап 6: STABLE — никаких изменений без ADR + bug-репорт + одобрение архитектора.
```

---

## Связанные документы

- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — правила для агентов (что они могут/не могут).
- [`docs/decisions/`](docs/decisions/) — ADR реестр (Architecture Decision Records).
- [`discussion.md`](discussion.md) — техническая дискуссия.
- [`discussion-business-logic.md`](discussion-business-logic.md) — бизнес-дискуссия.
- [`audit-tasks.md`](audit-tasks.md) — технический план (cycles 39-50).
- [`audit-tasks-business.md`](audit-tasks-business.md) — бизнес-план (cycles 51-58).

---

## История изменений

| Дата | Изменение | Цикл |
|------|-----------|------|
| 2026-06-20 | Initial creation: STABLE-MODULES.md создан, Tier A: jwt.ts, Tier B: pdf/index.ts API frozen, Tier C: env.ts + clone-items.ts candidates | 41 |
| 2026-06-20 | Tier C expansion: status-workflow.ts (NEW helper, cycle 51) — lib for B.3 workflow engine. Tier A/B unchanged (jwt.ts, pdf/index.ts NOT touched). | 51+52 |
| 2026-06-20 | Tier C expansion: warehouse/auto-receive-finished-goods.ts (NEW lib, cycle 53) — B.1 finished goods IN helper. Tier A/B/C unchanged (jwt.ts, pdf/index.ts, status-workflow.ts NOT touched). | 53+54 |
| 2026-06-20 | Tier D expansion: 11 new files in `src/components/proposal-editor/` + `src/types/proposal-editor.ts` (cycle 44) — Block 3.1 refactor. Tier A/B/C unchanged. | 44 |
| 2026-06-20 | Tier D polish (cycle 45) — Eliminated `ProposalPdfDataLike` (direct `ProposalPdfData` reuse); `ProposalEditorFinance` derived object → proposalBlocks deps 9→4 + pdfData deps 11→7; pdfData converted function → useMemo + lazy `useState(() => ({number, createdAt}))` Date.now() pattern; new `resetTemplateSelection` action replaces setState-in-effect. tsc 0 / vitest 88/88 / eslint 0. Tier A/B/C unchanged. | 45 |
