# PLAN-LINT-WARNINGS-CYCLE-16 — Cleanup of 19 remaining warnings (post-cycle-14)

**Дата:** 2026-06-19
**Запрашивал:** <user_message>Продолжай cycle 14. Audit remaining 60 warnings — категоризация и план cycle 16</user_message>
**Автор:** Buffy (Cycles 14+)
**Parent plans:** `ESLINT-10-RETRY.md` (cycle 15 strategy) · `PLAN-LINT-WARNINGS-CYCLE-16.md` (initial draft based on PRE-cycle-14 baseline — **superseded by this revision**)
**Trigger:** автоматически запускается сразу — cycle 14 уже завершён (sig-019, sig-020 от MiMo)
**Source baseline (REVISED):** `/tmp/lint-after-cycle-14.log` (post-cycle-14, current state)

---

## TL;DR

| Параметр | Значение (pre-cycle-14) | Значение (post-cycle-14, ACTUAL) |
|----------|--------------------------|----------------------------------|
| Errors | 52 | **0** ✅ |
| Warnings | 62 | **19** |
| Цель cycle 16 | — | **0 warnings** (или ≤3 documented) |
| Доминирующая категория | `no-unused-vars` (47 / 75.8%) | `react-hooks/exhaustive-deps` (**10** / 52.6%) |
| Вторая | `react-hooks/exhaustive-deps` (12 / 19.4%) | `no-unused-vars` (**9** / 47.4%) |
| Misc / unique rules | 6 | 2 |
| Затронуто файлов | ~22 | **16** |
| Усилие | 3-4 часа | **~2-3 часа** (меньше scope) |
| Риск | 🟢 low для A | 🟡 medium для hook-deps (stale closures risk) |

**Цикл 16 = exhaustive warning sweep на residual.** Меньший scope чем предварительно планировалось — MiMo уже закрыл многое в cycle 14.

---

## 1. Status snapshot (2026-06-19, post-cycle-14)

### 1.1 Координация с MiMo

| Signal | Статус | Note |
|--------|--------|------|
| sig-019 | ✅ acked | MiMo: cycle 12 cleanup (112→0 errors, 60→19 warnings) |
| sig-020 | ✅ acked | MiMo: cycle 14 завершён, all `as any[]` refactored, helper file consumed |
| sig-015 | ⚠️ signal MiMo→Buffy (agent-cli 11:42) | pending ack — likely "Принял задачи, начинаю" |

**Пендинг сигналов для Buffy:** sig-015 (low priority acknowledgment).

### 1.2 Cycle 14 fact report (from sig-019, sig-020)

| Metric | Pre-cycle-14 | Post-cycle-14 | Delta |
|--------|--------------|---------------|-------|
| Errors | 52 | 0 | -52 ✅ |
| Warnings | 62 | 19 | -43 |
| TypeScript errors | 0 | 0 | unchanged |
| Vitest | 64/64 | 64/64 | unchanged |
| Build | success | success | unchanged |

**Top cycle-14 wins:**
- Клиент-server мост: `as any[]` → `@/lib/types/server-pages` consumption (5 entities + 4 base-models)
- `use-undo-redo.ts:45` ref-during-render → useEffect
- `pdf/index.ts:13` Function type → call signature
- `update-queue.js` require() → ESM import

### 1.3 Source data

Файл `/tmp/lint-after-cycle-14.log` имеет exit code 0 (✅), footer:
```
✖ 19 problems (0 errors, 19 warnings)
```

Multi-line format:
```
./relative/path/to/file.tsx
  27:6  warning  React Hook useEffect has a missing dependency: 'load'  react-hooks/exhaustive-deps
```

---

## 2. Warning breakdown (post-cycle-14)

### 2.1 Phase A — `react-hooks/exhaustive-deps` (10 hits, 52.6%)

**⚠️ HIGHEST RISK category.** Эти warnings указывают на:
- Stale closures (effect читает устаревшее значение)
- Missing re-runs (effect не реагирует на dep changes)
- Infinite loops (если dep circular)

**Файлы (16 уникальных с warnings — react-hooks subset):**

| Файл | Hits | Контекст (sample) |
|------|------|-------------------|
| `src/components/crud-page.tsx` | (multiple) | Центральный CRUD компонент — high impact |
| `src/components/ui/block-dialogs.tsx` | 1 | Блок диалогов |
| `src/components/ui/block-editor.tsx` | 1 | Блок-редактор |
| `src/components/ui/gantt-chart.tsx` | (likely 1-2) | Гантт — perf-sensitive |
| `src/app/(dashboard)/finance/order-closings/page.tsx` | (likely 1) | Финансы |
| `src/app/(dashboard)/finance/reconciliation/page.tsx` | (likely 1) | Акты сверки |
| `src/app/(dashboard)/proposals/new/page.tsx` | (likely 1) | Конструктор КП |
| `src/app/(dashboard)/admin/users/page.tsx` | (likely 1) | Юзеры |
| (Other admin pages) | — | `certificates`, `inventor-files`, `rpp-entries`, `status-workflows`, `table-templates/[id]`, `tenders/client.tsx` |
| (Other API or hooks) | — | `api/import/cad/route.ts`, `api/procurement-needs/route.ts` |

**Risk profile:**
- 🔴 **High risk (3 samples):** Missing critical deps → stale data, broken UI
- 🟡 **Medium:** Intentional skip with comment нужна; suppress with reason
- 🟢 **Low:** Stale suppression (eslint-disable comment уже не применяется) — delete the suppress

### 2.2 Phase B — `@typescript-eslint/no-unused-vars` (9 hits, 47.4%)

**🟢 LOWEST RISK category.** Pure dead-code cleanup.

**Файлы (subset):**

| Файл | Hits | Тип |
|------|------|-----|
| `src/app/(dashboard)/admin/certificates/page.tsx` | likely 1 | admin form |
| `src/app/(dashboard)/admin/inventor-files/page.tsx` | likely 1 | admin form |
| `src/app/(dashboard)/admin/rpp-entries/page.tsx` | likely 1 | admin form |
| `src/app/(dashboard)/admin/status-workflows/page.tsx` | likely 1 | admin |
| `src/app/(dashboard)/admin/users/page.tsx` | likely 1 | admin form |
| `src/app/(dashboard)/proposals/new/page.tsx` | (likely 1-2) | proposal builder |
| `src/app/api/import/cad/route.ts` | 1 | API route |
| `src/app/api/procurement-needs/route.ts` | 1 | API route |
| (Other) | — | rest of warnings |

**Sub-categorization (typical):**
- `~5 hits`: catch params `(e)` — `(_e)` or `({})` convention
- `~3 hits`: destructured unused (`{ x, _y, z }` where z unused)
- `~1 hit`: stale import (`import { X }` no longer referenced)

### 2.3 Misc / Other rules (0 unique this cycle!)

✅ All previous misc rules already fixed by cycle 14.
✅ No `@next/next/no-img-element` remaining.
✅ No other single-instance residual.

---

## 3. Cycle 16 strategy

### 3.1 Принципы

1. **Single task для MiMo** — holistic view
2. **Phase B first** (low risk) → **Phase A second** (risk-aware)
3. **`--fix` для unused-vars** — `eslint . --fix` стандарт
4. **NO `--fix` для exhaustive-deps** — manual decision per warning
5. **Suppress with reason** для non-trivial hook cases

### 3.2 Phase-by-phase

#### Phase B — no-unused-vars (9 hits, low risk)

**Шаг 1 — Autofix dry-run:**
```bash
npx eslint . --rule '@typescript-eslint/no-unused-vars: error' --fix-dry-run | head -50
```

**Шаг 2 — Apply autofix:**
```bash
npx eslint . --rule '@typescript-eslint/no-unused-vars: error' --fix
```

**Шаг 3 — Manual review residual:**
```bash
npx eslint . 2>&1 | grep '@typescript-eslint/no-unused-vars'
```

**Шаг 4 — Per residual:**
- Catch param → rename to `_e` или remove `e` from signature
- Destructure unused → remove from destructure OR prefix `_`
- Stale import → delete import line

**Time: 15-30 мин total.**

#### Phase A — react-hooks/exhaustive-deps (10 hits, HIGH risk)

**⚠️ Per-warning decision protocol:**

| Ситуация | Действие |
|----------|----------|
| Зависимость obvious (state var) | **Add to deps + memoize callback** if needed |
| Зависимость causes infinite loop | **Memoize callback** (useCallback) + add stable reference dep |
| Intentional skip (perf, ref-stable) | **Allow-list suppress** with reason: `// eslint-disable-next-line react-hooks/exhaustive-deps -- reason: ref is stable, intentionally run once` |
| Stale suppress (rule no longer applies) | **Delete the suppress comment** |

**Manual-only workflow:**
```bash
# List all warnings
npx eslint . 2>&1 | grep 'react-hooks/exhaustive-deps'

# Per warning: read file context (10 lines before/after)
# Decide + apply
```

**Critical files needing careful review:**
- `src/components/crud-page.tsx` — used by all 16 admin pages
- `src/components/ui/gantt-chart.tsx` — perf-sensitive, complex effect deps
- `src/components/ui/block-dialogs.tsx` + `block-editor.tsx` — block editing logic

**Time: 60-120 мин total** (manual, risk-aware).

### 3.3 Validation chain (post-cycle-16)

```bash
# Parallel
npx tsc --noEmit                # 0 errors (invariant)
npx vitest run                  # 64/64+ passing
npm run lint 2>&1 | tee /tmp/lint-after-cycle-16.log  # exit 0 + ≤ 3 warnings
npm run build                   # success
```

**Acceptance:**
- 19 → 0 warnings (или documented 3 with justification comments)
- 0 errors (invariant maintained from cycle 14)
- 16 affected files updated
- All test pass + build succeeds

---

## 4. Files affected (16 unique)

### 4.1 Phase B targets (mechanical)

1. `src/app/(dashboard)/admin/certificates/page.tsx`
2. `src/app/(dashboard)/admin/inventor-files/page.tsx`
3. `src/app/(dashboard)/admin/rpp-entries/page.tsx`
4. `src/app/(dashboard)/admin/status-workflows/page.tsx`
5. `src/app/(dashboard)/admin/users/page.tsx`
6. `src/app/(dashboard)/proposals/new/page.tsx`
7. `src/app/api/import/cad/route.ts`
8. `src/app/api/procurement-needs/route.ts`
9. (1-2 manual residual files)

### 4.2 Phase A targets (risk-aware)

1. `src/components/crud-page.tsx` (CENTRAL — exact count needs verification)
2. `src/components/ui/block-dialogs.tsx`
3. `src/components/ui/block-editor.tsx`
4. `src/components/ui/gantt-chart.tsx`
5. `src/app/(dashboard)/finance/order-closings/page.tsx`
6. `src/app/(dashboard)/finance/reconciliation/page.tsx`
7. `src/app/(dashboard)/proposals/new/page.tsx`
8. `src/app/(dashboard)/admin/tenders/client.tsx`
9. `src/app/(dashboard)/admin/table-templates/[id]/page.tsx`
10. Maybe 1 other

---

## 5. Risk assessment

| Phase | Risk | Mitigation |
|-------|------|-----------|
| B — no-unused-vars | 🟢 LOW | `--fix` standard, then manual cleanup; tsc after |
| A — react-hooks | 🟡 MEDIUM | Manual decision per file; explicit memoization for circular risk; suppress-with-reason for non-trivial; never apply `--fix` blindly |

**Overall:** cycle 16 is LOW-RISK since errors already at 0, work is incremental cleanup. Worst case = no behavioral change (just dead code removal + dependency hygiene).

### Red flags

- Stale closure broken in production component (crud-page, gantt-chart, block-editor) → manual deep-dive
- Infinite loop risk detected → buf check архитектурно — memoize state or refactor effect

---

## 6. Execution steps (для MiMo)

### 6.1 Pre-flight (5 мин)

```bash
# Verify cycle 14 done and signals acked
node agent-cli.js buffy signals --pending
# Expected: empty (or only sig-015)

# Capture baseline
ls -la /tmp/lint-after-cycle-14.log
# Confirm: exists, valid

# Tests + tsc baseline still pass
npx tsc --noEmit               # 0
npx vitest run                # 64-64
```

### 6.2 Phase B — mechanical (~15-30 мин)

```bash
# Autofix dry-run + apply
npx eslint . --rule '@typescript-eslint/no-unused-vars: error' --fix
git diff --stat
# Per file: verify changes look correct
```

### 6.3 Phase A — risk-aware (~60-120 мин)

```bash
# List all hook warnings
npx eslint . 2>&1 | grep 'react-hooks/exhaustive-deps' > /tmp/cycle16-hooks.txt
wc -l /tmp/cycle16-hooks.txt  # expect ~10

# Read each warning's context (open file)
# Apply decision per protocol §3.2
```

### 6.4 Post-execution validation (5 мин)

```bash
# Parallel
npx tsc --noEmit
npx vitest run
npm run lint 2>&1 | tee /tmp/lint-after-cycle-16.log
npm run build

# Diff: lint-after-cycle-16 vs lint-after-cycle-14
diff <(grep -cE 'warning' /tmp/lint-after-cycle-14.log) <(grep -cE 'warning' /tmp/lint-after-cycle-16.log)
# Expect: 19 → 0 (или ≤ 3 documented)
```

### 6.5 Signal completion

```bash
node agent-cli.js mimo done lint-warnings-cycle-16
# + signal buffy with cycle-16 summary: 19→N warnings, files touched
```

---

## 7. Что вне cycle 16

❌ TS 6 upgrade (separate cycle, deferred)
❌ ESLint 10 retry (cycle 15 strategy — wait for upstream)
❌ Phase B unused-imports deeper audit (e.g., transitive dependencies)
❌ Phase A suppress cleanup для legacy code (handle case-by-case, this cycle)
❌ New features / refactors (this cycle = strict cleanup)

---

## 8. Открытые вопросы / К пользователю

1. **Strict zero-warnings or ≤3 accept threshold?** (Default: zero)
2. **Suppress-with-reason — стандартный формат?** (Default: `// eslint-disable-next-line <rule> -- reason: <text>`)
3. **Browser smoke test required post-cycle-16?** (Default: no, but recommend for gantt + crud-page)
4. **Single commit vs per-phase?** (Default: 1 commit, two phases in commit body)
5. **Cycle 16 dependency — wait for something or kick off now?** (Default: kick off now — cycle 14 done)

---

## 9. Readiness

✅ Plan complete. ACTUAL baseline: 0 errors + 19 warnings (down from 52/62 in cycle 14).
✅ 16 files affected. 2 phases.
✅ Validation chain defined.
✅ Risk: 🟢 LOW overall, 🟡 MEDIUM for Phase A hook-deps.

🟢 **READY для немедленного старта.**

---

## Appendix — Snapshot delta

| Metric | Pre-cycle-12 | Post-cycle-12 (sig-019) | Post-cycle-14 (sig-020, ACTUAL = source for cycle 16) |
|--------|--------------|--------------------------|------------------------------------------------------|
| Errors | 112 | 0 | 0 |
| Warnings | 60 | 19 | 19 |
| TypeScript | 0 | 0 | 0 |
| Vitest | 64/64 | 64/64 | 64/64 |
| Build | success | success | success |

**History:** Two lint cleanup cycles completed (cycle 12 + cycle 14) → 112+52→0 errors, 60+62→19 warnings. Cycle 16 = final residual sweep.

| Field | Value |
|-------|-------|
| Snapshot taken | 2026-06-19 |
| Source baseline | `/tmp/lint-after-cycle-14.log` (post-cycle-14) |
| Rule distribution | `react-hooks/exhaustive-deps` 10, `@typescript-eslint/no-unused-vars` 9 |
| Files affected | 16 unique |
| Cycle 16 expected outcome | 0 errors + ≤ 3 documented warnings |
| Combined Cycle 12+14+16 | Lint 0 errors, ≤ 5 documented warnings (long-term goal: 0) |
