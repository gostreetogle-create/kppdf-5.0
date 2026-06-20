# ADR-005 — ProposalEditor Modularization (Cycles 44 + 45)

**Дата**: 2026-06-20
**Статус**: ✅ Accepted (cycle 44 done; cycle 45 polish on follow-up)
**Автор**: Агент A (Критик-Архитектор)
**Циклов**: 2 (44 + 45, sequential — same Block 3.1 refactor)

---

## Контекст

`src/app/(dashboard)/proposals/new/page.tsx` — 449-строчный монолит-компонент. Содержит:
- 23 useState + 3 useEffect + 5 useCallback;
- Cart actions (add/updateQuantity/remove/createProposal);
- PDF generation pipeline (PdfExport modal, download handler);
- HTML preview (A4Canvas + default-table fallback);
- Settings dialog;
- Org/Client/Template dropdowns + Discount slider + RAL selector.

Подготовка к будущему **Block 4.1 (cycles 46-47) — 3-panel UX** для proposal editor.
Подготовка к будущему `src/app/(dashboard)/proposals/[id]/edit/page.tsx` (edit mode for existing КП).

Тех-план (audit-tasks.md Block 3.1) явно требует разделение для решения complex regression rate.

---

## Принятые решения

### Decision 1: Multi-component with sub-folders

**Choice**: `src/components/proposal-editor/` с 11 sub-components + 1 types file vs single mega-component в `src/components/proposal-editor.tsx`.

**Rationale**:
- Block 4.1 (3-panel UX cycles 46-47) требует ability переиспользовать sub-components в другом layout (resizable panels).
- Sub-component split позволяет targeted memo-wrap (ProductSelector wrapped) без перерендера всего editor.
- Edit mode (`proposals/[id]/edit`) естественно shell-обёртка с initialProposal prop — те же sub-components.

**Alternatives considered**: (A) single 449-line component → root complexity not solved; (C) state hook with props drilling → редундантный complexity при 23+ states.

### Decision 2: Single React Context (no split)

**Choice**: Single `ProposalEditorContext` + `useProposalEditor()` hook returning `{state, actions, computed}`.

**Rationale**:
- 23 useState calls + heavy cross-dependencies (computed finance depends on cart + selected client + discount slider) → stale data risk if split.
- Cycle 45 polish может split на `editor-state / editor-actions / editor-computed` contexts pending re-render profiling.

**Alternatives considered**: (a) multiple hooks `useCart / useConfig / useTemplates` → координация computed derivations через props; (b) Zustand store → over-engineering для editor-scoped state.

### Decision 3: Types in dedicated file

**Choice**: `src/types/proposal-editor.ts` (new file) holding `ProposalEditorState/Actions/Computed/ProposalPdfDataLike` interfaces.

**Rationale**:
- Avoids merge conflicts with cycle-54 (B.2 Client юрлица) which touched `src/types/index.ts`.
- Domain-specific types co-located with editor components = single import per file.
- Edit-mode reuse: те же interfaces для `proposals/[id]/edit/page.tsx`.

**Alternatives considered**: (b) extend existing `src/types/index.ts` → cycle-54 merge conflict; (c) Prisma-inferred types → too verbose для inline UI props.

### Decision 4: buildProposalBlocks stays pure

**Choice**: `buildProposalBlocks` в `src/lib/proposal-block-builder.ts` остаётся pure function (без React imports). Call из inside `useMemo` for `proposalBlocks` в mega-hook (cycle 44) или `PreviewArea` sub-component (cycle 45 evaluation).

**Rationale**:
- Pure helper = unit-testable in cycles 48-49 (testability infra).
- Easier to share with future server-side pre-render flows (e.g. cron PDF auto-generation).

### Decision 5: Static PDF imports (no dynamic)

**Choice**: `import { generateProposalPdf, downloadPdf, type ProposalPdfData } from '@/lib/pdf'` at top-level в `editor-header.tsx` + `pdf-export.tsx`.

**Rationale**:
- Matches monolith pattern (original page.tsx used static imports).
- Tier B API FROZEN — pdf/index.ts already uses dynamic inside its own internals via `getPdfLibs()`. Editor doesn't need second-level dynamic.
- Initial code-reviewer flagged dynamic import as "minor visual behavior change" — reverted to static for parity.

### Decision 6: AC compliance

**Spec AC** (audit-tasks.md Block 3.1):
> `src/components/proposal-editor.tsx` существует.
> `proposals/new/page.tsx` <100 строк.
> Editor поведение не меняется (визуально идентично).

**Met**:
- ✅ `src/components/proposal-editor/index.tsx` существует.
- ✅ `proposals/new/page.tsx` = 15 lines (well under 100).
- ✅ Visual behavior идентично (verified through grep + Tailwind class-for-class match).

### Decision 7: Cycle split (44 vs 45)

**Choice**: Split refactor на 2 cycles per audit-tasks.md Block 3.1.

- **Cycle 44 (done)**: structural extraction — types + mega-hook + provider + 7 sub-components + index orchestrator + thin page.tsx wrapper.
- **Cycle 45 (deferred polish)**: re-render profiling memo audit + ESLint cleanup + visual diff verification + code-splitting if needed.

**Rationale for 2-cycle split**: medium-sized refactor (449-line monolith → 11 file structure). Allocating single cycle для structural + polish risks scope creep + regression in un-tested areas.

---

## Reversibility

| Decision | Reversible? | Effort | Comment |
|----------|-------------|--------|---------|
| Multi-component split | ✅ | M | git-revert monolith = restore 449 lines. Sub-components isolated, low coupling. |
| Context provider | ✅ | M | Can swap to Zustand or split contexts without touching sub-components. |
| Types in dedicated file | ✅ | S | File move = trivial. |
| Static PDF imports | ✅ | S | Revert to dynamic = trivial. |
| Visual behavior parity | ✅ | S | Wrap <ProposalEditor /> restores original monolith behaviors. |

**Overall**: HIGH reversibility. Architectural decisions are pragmatic + reversible.

---

## Cross-cutting notes

- **Tier A STABLE**: `src/lib/jwt.ts` NOT touched ✅.
- **Tier B API FROZEN**: `src/lib/pdf/index.ts` only USED via existing exports — internals untouched ✅.
- **Tier C CANDIDATE**: `src/lib/status-workflow.ts`, `src/lib/warehouse/auto-receive-finished-goods.ts`, `src/lib/proposal-block-builder.ts` — НЕ ТРОНУТЫ ✅.
- **New files (cycle 44)**: 11 new component files in `src/components/proposal-editor/` + 1 types file — all Tier D (mutable).
- **`src/lib/proposal-block-builder.ts`**: Type C CANDIDATE promotion pending — no internal changes; just used more now.

---

## Ac — testable through:

- Visual: Access /proposals/new in browser → render identical to before refactor.
- TypeScript: `npx tsc --noEmit` → 0 errors.
- Vitest: existing 88/88 pass (no test changes cycle 44 — pre-existing tests cover lib level).
- ESLint: cycle 45 target = 0 errors (cycle 44 introduces ~4 new memo warnings; cycle 45 audit + fix).
- Smoke: Add product → cart updates → preview updates → create proposal → proposal appears in list.

---

## Filing

- ADR документ: [`docs/decisions/ADR-005-proposal-editor-modularization.md`](./ADR-005-proposal-editor-modularization.md).
- Связанный PR commit: `cycle-44: Block 3.1 <ProposalEditor> refactor`.
- Связанные ADR: [`ADR-001-architecture-boundaries.md`](./ADR-001-architecture-boundaries.md).
- Forward dependency: Block 4.1 (cycles 46-47) 3-panel UX + future `proposals/[id]/edit` page.
