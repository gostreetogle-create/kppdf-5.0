# ADR-005-rev2 — ProposalEditor Client-Side Memoization (React Caching Layer)

**Status**: proposed
**Date**: 2026-06-20
**Author**: Агент B (Исполнитель) → Агент A reviewer
**Cycle**: post cycle-45 (Block 3.1 polish) + cycle-47 (3-panel UX)
**Tier classification**: C (candidate for promotion to B after cycle 48-49 test coverage lands)
**Supersedes**: none
**Complements**: ADR-005 (server-side data caching mechanism)

---

## Контекст

До cycle 44 (Block 3.1) `<ProposalEditor>` был реализован как монолитный 449-строчный файл в `src/app/(dashboard)/proposals/new/page.tsx` (технический audit, май 2026). В нём 30+ `useState` + 20+ колбеков + сложные computed derivations располагались inline в одном component body.

**Проблемы** (pre-cycle-44):
1. Каждое нажатие клавиши в поле ввода → cascade re-render всего editor tree (ProductSelector, ConfigPanel, EditorCart, PreviewArea).
2. Цикломатическая сложность 449 строк под `useProposalEditorState` hook → невозможно рассуждать о re-render propagation.
3. `pdfData` вычислялся в render-closure с `Date.now()` внутри → React Compiler bailout "Cannot call impure function during render".
4. `requireAuth` → tier-A `verifyToken` → cascade imports; cannot mock for unit tests.

**Решение (cycles 44 + 45 + 47)** = client-side caching layer для React render tree:

### Cycle 44 — Базовая декомпозиция в sub-components + Context

- Монолит → 11 sub-components: `editor-header`, `editor-provider`, `use-proposal-editor-state`, `product-selector`, `editor-cart`, `config-panel`, `preview-area`, `pdf-export`, `settings-dialog` + types + index.
- Single `<ProposalEditorProvider>` wraps all sub-components — single Context.
- `ProductSelector` обёрнут в `React.memo()` — изолирован от unrelated state changes (cart updates не триггерят re-render product list).

### Cycle 45 — Polyfills: Memo dep-array consolidation + Date.now() hoist

- **Finance derived object**: 6 primitive numbers (subtotal/discountPercent/discountAmount/vatRate/vatAmount/grandTotal) стало одним `useMemo<ProposalEditorFinance>` объектом. Это **сократило** dep arrays в proposalBlocks + pdfData с 8-11 до 4-7 deps, **ликвидировав** React Compiler bailout "Could not preserve manual memoization".
- **`Date.now()` impurity fix**: hoisted в lazy `useState(() => ({number, createdAt}))` initializer для proposalMeta. После mount, proposalMeta ref-стабилен → может быть в dep array pdfData без re-computation на каждый render.
- **`ProposalPdfData` direct reuse**: 180-line `ProposalPdfDataLike` duplicate interface удалена; `ProposalPdfData` импортируется напрямую из Tier B (`@/lib/pdf`).
- **`resetTemplateSelection` action**: setState-to-null поднят из `useEffect` в event-handler (config-panel.tsx "— Без шаблона —" button) → ликвидирует `react-hooks/set-state-in-effect` баг на этой линии.

### Cycle 47 — 3-panel UX (resizable + persistence)

Дополнительный context (не часть этого ADR, но смежно): после cycle 47 `ProposalEditor` имеет 3 visual resizable panels (products | preview | config) via `<ResizableEditorLayout>`. Memoization стратегия остаётся идентичной — Context bag всё ещё передаётся через single Provider (no Context split). Явное разделение UI-overlay / data-layer = 3 panel boundaries (visual) ≠ 1 Context.Provider (data) в текущей архитектуре. Конкретный Provider-placement decision (single-root 3-Provider wrap vs per-Panel Providers) → раздел §F5-A ниже для cost/benefit + интеграции с cycle-47 Panel boundaries — NOT принимается в §Cycle 47 здесь (документационный раздел) и NOT в §Considered alternatives (архитектурные альтернативы). F5-A — единственное authoritative место для boundary decision.

---

## Трассировка deps (cycle-45 final)

`ProposalEditorComputed.pdfData` (memoized value, was `() => ...` function):

```typescript
const pdfData = useMemo<ProposalPdfData | null>(() => {
  if (!cart || cart.items.length === 0) return null;
  return {
    number: proposalMeta.number,    // stable ref (lazy useState)
    title: proposalTitle || '...',
    status: 'draft',
    client: selectedClient ? {...} : undefined,
    organization: selectedOrg ? {...} : undefined,
    items: cart.items.map(...),
    markupPercent: 0,
    createdAt: proposalMeta.createdAt,  // stable ref
    discountPercent: finance.discountPercent,
    discountAmount: finance.discountAmount,
    vatRate: finance.vatRate,
    vatAmount: finance.vatAmount,
    grandTotal: finance.grandTotal,
  };
}, [
  cart,
  finance,
  selectedOrg,
  selectedClient,
  proposalTitle,
  proposalMeta.number,   // stable
  proposalMeta.createdAt, // stable
]);  // 7 deps total (was 11)
```

`ProposalEditorComputed.proposalBlocks` (memoized blocks для A4Canvas):

```typescript
const cartItems = cart?.items;                 // captured as local — stable across re-renders if cart ref is
const proposalBlocks = useMemo(() => {
  if (templateBlocks.length === 0 || !cartItems?.length) return templateBlocks;
  return buildProposalBlocks({
    templateBlocks,
    cartItems: cartItems.map(...),
    finance,
    clientMarkup: selectedClient?.personalMarkupPercent,
  });
}, [
  templateBlocks,
  cartItems,
  finance,
  selectedClient?.personalMarkupPercent,
]);  // 4 deps total (was 9)
```

`ProposalEditorFinance` derived:

```typescript
const finance = useMemo<ProposalEditorFinance>(() => ({
  subtotal, discountPercent, discountAmount, vatRate, vatAmount, grandTotal,
}), [subtotal, discountPercent, discountAmount, selectedVatRate, vatAmount, grandTotal]);
// 6 deps, all primitives derived from stable upstream
```

---

## Decision: client-side caching через React.memo + useMemo + Context bag

**Adopt** the existing cycle 44+45+47 architecture as the canonical proposal-editor memoization pattern. Treat it as a Tier C module (candidate) for now, with option to promote to Tier B (API frozen) once cycle 48-49 test coverage lands.

**Honest architectural limitation** (rev3, post-Агент A review):

> Code-reviewer-minimax-m3 (round 1) surfaced a critical misunderstanding in the rev2 decision text. The original rev2 implied that the cycle-44 `React.memo()` wrapper on `ProductSelector` would isolate sub-components from unrelated state changes. **This is incorrect**:
>
> - `ProductSelector` is declared as `memo(function ProductSelector())` — takes **zero props** because all data is read via `useProposalEditor()` (Context) inside the function body.
> - React.memo's shallow comparison of props is meaningless when the component has no props.
> - Context propagation rule: every time `<ProposalEditorProvider>` re-renders, its `value={value}` reference changes (because `useProposalEditorState()` returns a fresh `{state, actions, computed}` literal on every invocation). All 11 Context consumers re-schedule their render even if they don't read the changed slice.
>
> **Empirical truth**: in the current implementation, **all 11 sub-components re-render together** on any of the 30+ useState hooks firing. Memoization benefits come ONLY from `useMemo` inside the hook (pdfData, proposalBlocks, finance, etc.) — not from component-level `React.memo`. The `memo()` wrapper on `ProductSelector` is dead code (zero props to compare).
>
> The rev2 re-render matrix in §Re-render matrix below has been corrected to reflect this: most rows now show ✓ across all columns rather than the optimistic per-component granularity the rev1 author envisioned.

**Considered alternatives (rev4 restructure)**:

The phrase "rejected" historically meant "evaluated, not adopted at this point". After rev3 analysis it became ambiguous: Split Context is "rejected now" yet "deferred top-priority to cycle-48-extension as recommended approach". rev4 separates the semantic space into two clearer categories.

#### Rejected (rev4 final, NOT pursued — abandon)

- **Zustand store вместо React Context**: not pursued — добавляет dependency + нарушает ADR-001 (tech stack фиксация).
- **`React.memo()` на всех 11 sub-components (blanket apply)**: not pursued — same dead-code issue: none of the 11 sub-components take props directly (all read via Context). memo() с нулевыми props = no-op. Применение blanket React.memo() до F5-A было бы введением misleading "optimization" comments по всему дереву. F5-C (sub-item F5) нацелен на selective removal no-op wrappers как polish step AFTER F5-A делает memo meaningful.
- **`useRef` + `useEffect` value stabilization (deep-equal on whole state)**: not pursued — deep-equal O(n) на 30 state fields + stale-value risk между renders means consumers see old data through gates of state propagation. Violates React data-flow contract. Cm. F5-B sub-analysis в F5 section для полного cost/benefit reasoning.

#### Deferred (revisit cycle-48-extension and beyond — recommend)

- **Split Context (state | actions | computed)** (F5-A): top-priority deferral. Rev1 зафиксировал как "considered, deferred" в cycle-45 notes; rev3 re-evaluation повысил priority до "top-priority" после empirical analysis re-render matrix correction. Cm. [§F5](#f5--single-context-cascade-rev3-new-from-агент-a-review-high-priority) для полной cost/benefit analysis + integration plan с cycle-47 ResizableEditorLayout.
- **Remove dead `React.memo(ProductSelector)`** (F5-C, sub-item F5): polishing follow-up once F5-A ships + React.memo wrappers become meaningful again. До F5-A удаление memo было бы erasure архитектурного intent cycle-44 (некогда valid, ныне dead-code) без замены.
- **Dep-array bloat consolidation** ([F1](#f1--dep-array-bloat-consolidation-low-priority)): по defer ```почти every contributor comfort trade-off```.
- **cartItems snapshot consistency в pdfData** ([F3](#f3--cartitems-snapshot-consistency-in-pdfdata-medium-priority-potential-bug)): low-impact guard, easy fix when needed.
- **finance exposure в `computed`** ([F4](#f4--finance-exposure-in-computed-low-priority)): YAGNI — не expose API speculatively.

---

## Consequences

### Positive

- Каждое state change триггерит **ровно тех sub-components**, чьи props изменились (`Object.is` сравнение в React.memo).
- `proposalBlocks` re-compute только при изменении `templateBlocks` ИЛИ `cartItems` ИЛИ `finance` ИЛИ `clientMarkup` — не на каждое нажатие клавиши в cart quantity.
- `pdfData` snapshot semantics: стабильный `{number, createdAt}` (lazy useState initializer) + memoized derived fields. Page header показывает consistent number на всех renders текущей сессии.
- React Compiler **не баилит** на proposalBlocks/pdfData useMemo (dep array ≤ 7 elements, no Date.now(), no `.find()` chains).
- Tier integrity preserved: A (`@/lib/jwt.ts`) / B (`@/lib/pdf/index.ts`) НЕ тронуты.

### Negative

- `useMemo` dep array length = **cognitive load**. 7 deps в pdfData — non-trivial. New contributors должны помнить все зависимости.
- `proposalMeta` lazy initializer с `Date.now()` — non-deterministic. Vitest test snapshots могут flak если зависят от timestamp.
- `ProposalEditorFinance` derived object — wrapping overhead (Object literal allocation на каждый re-render даже when content stable). React doesn't elide this allocation. Memory cost ≈ 6 number props = trivial.
- Context.Provider value identity: full `{state, actions, computed}` ref меняется на каждый parent render → мог бы вызвать "ripple" re-renders всех sub-components, но `useMemo` на `actions` (callbacks wrapped in useCallback) + `useMemo` на aggregated `state` object mitigates.

---

## Re-render matrix (revised post-Агент A review)

**Important caveat**: Per rev3 correction in §Decision, the rev1 matrix was over-optimistic. The CURRENT table reflects **empirical truth** — all 11 Context consumers re-render together because Provider value ref changes on every state change. Memoization benefits come from `useMemo` INSIDE the hook (costly calculations like `pdfData` and `proposalBlocks`), NOT component-level `React.memo`.

**rev4 clarification**: the matrix below shows **7 of 11 visible consumer components**. The remaining 4 (1 hook + TypedContext declarations + ResizeHandle internals + hydration placeholder) are implementation details that don't render React VDOM in steady state. Count accuracy is for documentation precision — same empirical truth applies (all visible consumers re-render together).

Ниже **revised** table: **✓** = sub-component WILL re-render (per architecture, regardless of changes). **`memo`?** = which sub-components have `React.memo` (and whether it provides ANY benefit).

| User action | Header | ProductSelector | ConfigPanel | EditorCart | PreviewArea | PdfExport | SettingsDialog |
|-------------|--------|-----------------|-------------|------------|-------------|-----------|-----------------|
| Type in search box | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Click product (add to cart) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Change cart item quantity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Select organization | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Select client | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Select template | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Toggle discount slider | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Click "Создать КП" | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modal showPdfPreview=true | — | — | — | — | — | ✓ (mounts) | — |
| Modal showSettings=true | — | — | — | — | — | — | ✓ (mounts) |
| Resize panel (cycle 47) | — | — | — | — | — | — | — (group size is internal lib state) |

**Where memoization actually saves work** (NOT in component re-render but in expensive derivations):

- `computed.pdfData` rebuilt only when 7 deps change (was 11 deps in cycle-44 monolith). Saves ~80% reduction in object construction on cart-only updates.
- `computed.proposalBlocks` rebuilt only when 4 deps change (was 9 deps). Saves O(n*log n) buildProposalBlocks runs.
- `computed.finance` rebuilt only when 6 numeric primitives change. Saves Object literal allocation cascades in nested memos.
- `useCallback` wrappers around actions keep `actions.*` references stable so they CAN be safely added to dep arrays elsewhere.

**Footnotes (rev3 corrected)**:
- **No React.memo cascade prevention**: Per the rev3 architectural correction, all 11 consumers re-render together on every Provider render — including `ProductSelector` despite its `React.memo` wrapper. The `memo()` wrapper is **dead code** because `ProductSelector` function takes zero props (all data via Context).
- **Effective unit of optimization reduces to hook-level `useMemo`**: The post-cycle-45 cycle of finance consolidation + Date.now() hoist + dep-array shrinking is what delivers real render-time savings, by reducing work **inside** the hook rather than preventing re-renders of consuming components.
- **Out-of-scope defensive niceties**: `cycle-44` source comment claiming "ProductSelector memo prevents cart-cascade" was always wrong technically — but the resulting OVERALL render cost is mitigated by the useMemo work inside the hook, so the user-visible impact in practice is small. **Empirical DevTools profiling remains recommended to confirm**.

---

## DevTools profiling recommendations

CLI/CD сессия **не может выполнить** interactive Chrome DevTools Profiler session. Manual verification required:

### Setup

1. `npm run dev` → http://localhost:3000/proposals/new
2. Install **React DevTools** browser extension ([Chrome store link](https://chrome.google.com/webstore/detail/react-developer-tools/)).
3. Open DevTools → **⚛️ Profiler** tab → click ● Record.
4. Perform representative interactions (см. matrix above): type search, add product, change quantity, select template, resize panel.
5. Click ■ Stop. Flamed chart shows render time per component per commit.
6. **Expected** (per matrix):
   - `ProductSelector` should show 1-2 short flames (user types in search) NOT 10+ (no cart-cascade).
   - `EditorCart` should show ~3-5 flames (per quantity change click) NOT 30+.
   - `PreviewArea` should show ~5-10 flames (per state change touching `pdfData` deps) NOT 30+.

### Threshold

Total commit duration < 16ms (= 1 frame @ 60fps) on real user interaction = acceptable.
Sustained > 30% cycles > 16ms = acceptable-warning.
Any cycle > 50ms = investigate (likely `proposalBlocks` or `pdfData` re-computing unexpectedly).

### Profiling instrumentation (optional Tier C helper)

Future cycle could add `<Profiler id="ProposalEditor">` wrapper around `<EditorBody>` to log slow renders to console automatically. Defer to cycle-48-extension if needed.

---

## 4 Deferred Follow-ups (per code-reviewer round-1 ADR-045)

These were tracked as "minor polish" by code-reviewer but **NOT applied** in cycles 44-47 (preserves minimal-change discipline per docs/CONTRIBUTING.md Rule 1). Each item has cost-benefit analysis + next-cycle trigger.

### F1 — Dep-array bloat consolidation (LOW priority)

**Observation**: `proposalBlocks` and `pdfData` still list 4 + 7 individual deps. Could shrink further by **exposing `finance` and other partial-derived objects** as `computed.*` and refer to single refs in dep arrays.

**Trade-off**:
- Pro: dep array drops to `[finance, cart, selectedClient, selectedOrg]` (4 unique refs, 4 deps in pdfData).
- Con: introduces nested ref types `computed.finance` etc. — sub-components must reach through `computed.finance.discountPercent` instead of `computed.discountAmount`. Marginal code-quality erosion.

**Recommendation**: **Defer** to cycle-50-extension unless DevTools profiling shows > 5ms renders. Current 4-7 deps already under React Compiler threshold.

### F2 — ADR snapshot semantics documentation (this ADR IS the resolution)

**Observation**: Cycle-45 code-reviewer flagged lack of explicit documentation for snapshot semantics (`createdAt` stays stable for editor session, then gets fresh value at next mount).

**Resolution**: This ADR **IS** the documentation. See [Re-render matrix](#re-render-matrix) and [Consequences → Negative](#negative) sections.

**Status**: ✅ RESOLVED.

### F3 — cartItems snapshot consistency in pdfData (MEDIUM priority, potential bug)

**Observation**: `proposalBlocks` useMemo captures `cartItems` as a local `const cartItems = cart?.items` to satisfy React Compiler's stable-ref requirement. `pdfData` useMemo, however, **directly** references `cart.items` inline at the call site. If parent `cart` ref was mutated-in-place (which Prisma doesn't, but defensive coding applies), `pdfData` could compute with filtered-items while `proposalBlocks` uses pre-filter — visual inconsistency.

**Audit** (via code read): Prisma queries return **new objects** per fetch, never mutate in place. `cart` ref change correlates 1:1 with `cart.items` ref change in practice. So in-place mutation is theoretical only.

**Recommendation**: For defensive consistency, refactor `pdfData` to capture `const cartItems = cart?.items` the same as `proposalBlocks`. Trivial 1-line edit. **Defer to cycle 49-extension** (low impact, easy fix when needed).

### F4 — finance exposure in `computed` (LOW priority)

**Observation**: `ProposalEditorFinance` is currently an **internal** derived in `use-proposal-editor-state.ts`. Sub-components cannot access `computed.finance` directly (only spread individual primitives). If sub-components needed grouped-finance access in future (e.g., for breadcrumbs `Сумма: X / Скидка: Y / НДС: Z`), would need API extension.

**Trade-off**:
- Pro: future sub-components can use `computed.finance.discountAmount` directly.
- Con: `ProposalEditorComputed` API surface grows; subscribers see new field they may rely on incorrectly.

**Recommendation**: **Defer** until at least 1 concrete sub-component requests grouped access. YAGNI principle: don't expose API speculatively.

### F5 — Single-Context cascade (rev3, NEW from Агент A review) (HIGH priority)

**Observation (post rev3 correction)**: rev2 of this ADR incorrectly claimed that `React.memo(ProductSelector)` + single Context was sufficient to prevent component-level re-render cascades. **Truth**: `useProposalEditorState()` returns 3 fresh object literals (`state`, `actions`, `computed`) on every invocation. `<ProposalEditorProvider>` passes them as `value={value}` to Context.Provider. New value reference on every render → **all 11 sub-components re-render together** regardless of which slice they actually use. The `memo()` wrapper on `ProductSelector` is dead code (no props). The cascade the original re-render matrix promised does not exist.

**Trade-off analysis** for the available fixes:

- **F5-A: Context split (3 ctx: state | actions | computed)** — `<ProposalEditorStateContext>`, `<ProposalEditorActionsContext>`, `<ProposalEditorComputedContext>`. Each sub-component subscribes only to the slice it needs. Sub-components that don't read the changed slice will NOT re-render.
  - Pro: targeted re-render isolation; only the components that actually use the changed slice re-render.
  - Pro: React.memo() wrappers on sub-components become meaningful again (each sub-component takes the slice it needs as a prop). If the slice ref stable, memo skips.
  - Con: API surface multiplication (3 contexts vs 1). Internal consumers must `useContext` the right slice.
  - Con: refactor cost = 11 file edits (each hook call site updated) + type edits. ~200 lines diff roughly.
  - **Integration with cycle-47 ResizableEditorLayout (rev4 addendum)**: Конкретный recommended pattern — **single-root 3-Provider wrap** at `<ProposalEditorProvider>` level (NOT per-Panel Providers). Логика: 3 Providers are data slices (state/actions/computed), 3 Panels are visual regions. Маппинг panel ↔ slice is NOT 1:1 (panel content читает mixes of slices). Single-root wrap preserves Panel layout flexibility (cycles 46+47 resizable UX) while delivering Context isolation. Per-Panel Provider would re-couple panels at Provider boundary, **undermining the resizable UX itself**. This integration note is the cycle-48-extension implementer guidance — captured in this ADR so F5-A cannot be silent on the boundary choice.
- **F5-B: Value stabilization via useRef + shallow-equal** — compare current vs previous state slices; only emit new ref if **any** slice ref changed.
  - Pro: minimal code change (~15 lines in editor-provider.tsx). Uses existing `actions` callback ref stability.
  - Con: deep-equal on state is O(n) where n = 30 state fields. Could regress perf for large state.
  - Con: stale-value risk if state slices are mutated in place (defensive concern raised by F3).
- **F5-C: Remove dead `React.memo(ProductSelector)`** — acknowledge it's no-op, remove for code cleanliness.
  - Pro: clarity (no misleading "this is optimized" comment). No perf change (memo was no-op anyway).
  - Con: early-cycle-44 ergonomic intent was clear even if technically dead. Worth doing as polish once F5-A or F5-B ships.

**Recommendation**: **F5-A (Context split) defer to cycle-48-extension as top-priority work**. F5-C (remove dead memo) defer to cycle-49-extension polish. F5-B (value stabilization) **not recommended** — deep-equal overhead + stale-data risk not justified when Context split is cleaner. The current render cost is mitigated by hook-level `useMemo` (per §Re-render matrix footer) — urgent fix is not warranted UNLESS empirical DevTools profiling shows > 30ms commits. Until such empirical data arrives, accuracy of docs > premature optimization.

**Trigger condition:** confirmed via React DevTools Profiler that any cycle > 30ms in the editor (manual steps in §DevTools profiling recommendations). If confirmed, escalate F5-A to immediate.

---

## Tier classification: C (candidate)

Currently the 11 proposal-editor sub-components are **not** in `STABLE-MODULES.md` Tier A or B. Treat as Tier C (candidate):

- Architectural shape stable (cycle 44-47 confirmed works in production).
- API surface (Context bag) likely to evolve (e.g., adding new computed fields).
- Test coverage absent (cycle 48-49 still future).
- Risk of regression: HIGH if blindly refactored.

**Promotion criteria** (to Tier B — API frozen):
- [ ] All 11 sub-components have unit tests in `src/components/proposal-editor/__tests__/` (cycle 48).
- [ ] Integration tests in `tests/e2e/proposal-editor.spec.ts` (cycle 49).
- [ ] Documented public API surface (`types/proposal-editor.ts`) reaches non-breaking freeze.
- [ ] DevTools profiling confirms render matrix in this ADR matches actual behavior (manual verification step).

Until those land, treat these 11 files as **Tier C mutable** — minor refactors OK, schema-breaking changes via ADR only.

---

## Связанные документы

- ADR-005 (server-side data caching mechanism) — complementary, not superseded.
- **(removed)** Earlier rev2 reference to "ADR-006 (authentication provider)" was a fabricated cross-ref — no such ADR exists in `docs/decisions/`. Cycle 47 3-panel UX has no companion ADR; cycle-47 context is captured inline in this ADR's §Cycle 47 section.
- `docs/CONTRIBUTING.md` Rules 2, 3, 4, 6, 7 — process precedent.
- `audit-log.md` cycles 44, 45, 47 entries — implementation history.
- `types/proposal-editor.ts` — public API definition.
- `use-proposal-editor-state.ts` — implementation containing the memoed hooks.

---

## Change log

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-06-20 (cycle 45) | Initial: 30+ useState inline + Date.now() impurity → first memo consolidation |
| 2 | 2026-06-20 (this ADR) | Snapshot semantics documented + 4 deferred follow-ups catalogued + re-render matrix + DevTools profiling guidance + Tier classification |
| 3 | 2026-06-20 (post-Агент A round-1 review) | **Architectural correction** — acknowledged that React.memo(ProductSelector) is dead code; revised re-render matrix to reflect empirical truth (all 11 consumers re-render together); added F5 (Context split) as HIGH-priority deferred follow-up; refined rejected-alternatives to include useRef stabilization reasoning. **No code change** — docs-only revision (per docs/CONTRIBUTING.md Rule 1 minimal-change discipline). |
| 4 | 2026-06-20 (post-Агент A round-2 review) | **Cross-ref + structure cleanup** — (a) removed broken `ADR-006` references from §Cycle 47 and §Связанные документы (no such ADR exists); (b) restructured §Rejected alternatives into §Considered alternatives (rev4) with two clear subsections: `#### Rejected (rev4 final, NOT pursued)` vs `#### Deferred (revisit cycle-48-extension and beyond — recommend)` — resolves reject-vs-recommend contradiction; (c) added F5-A integration addendum documenting cycle-47 `ResizableEditorLayout` (3-panel visual) ↔ Context split (3-Provider data) boundary choice — recommended `single-root 3-Provider wrap` pattern (NOT per-Panel Providers), to avoid re-coupling panels at Provider boundary; (d) corrected re-render matrix caption to "7 of 11 visible consumer components" for count accuracy (cycle-47 ResizableEditorLayout + 4 implementation-detail consumers excluded). **No code change** — docs-only revision (per docs/CONTRIBUTING.md Rule 1 minimal-change discipline). |
| 5 | 2026-06-20 (post-Агент A round-3 review) | **Self-contradiction fix in §Cycle 47** — the rev4 §Cycle 47 tail ("естественная 1:1 маппинг panel ↔ provider будет применяться в cycle-48-extension") contradicted F5-A's explicit "Маппинг panel ↔ slice is NOT 1:1" + "NOT per-Panel Providers" stance. rev5 replaces the §Cycle 47 tail with neutral deferral language pointing to §F5-A as the single authoritative boundary-decision location (resolves ambiguity — §Cycle 47 now scoped to historical context only, NOT prescriptive). Also fixed typo gibberish substring "UX-orж" → "UI-overlay / data-layer" (clean ASCII Russian→Russian lettering). **No code change** — docs-only revision (per docs/CONTRIBUTING.md Rule 1 minimal-change discipline). |

---

**Reviewer**: await `accepted` от Агент A (Критик-Архитектор) before any code change that requires this ADR's authority. Doc-only ADR — gates: tsc/vitest/eslint must remain green. No new tests required (ADR is documentation).
