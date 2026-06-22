# ADR-006 — Silent Refresh Preempt (Cycle 50 / 7.1)

**Дата**: 2026-06-22
**Статус**: ✅ Accepted
**Автор схемы**: Агент A (Бизнес-Архитектор)
**Цикл**: 50 (тех-план, 🟢 Low priority, complexity S)

---

## Контекст

Access token живёт 24h (`src/lib/jwt.ts: ACCESS_TOKEN_EXPIRY`), refresh token — 7d.
Любой пользователь, оставивший UI открытым дольше 24h, получает 401 на следующем
запросе → жёсткий re-login flow. Это неудобно для долгих сессий (снабженец,
складской worker, производственный менеджер оставляют вкладку открытой на
смену+).

Status quo: `/api/auth/refresh` endpoint существует (`src/app/api/auth/refresh/`)
но вызывается только из login flow (после `/api/auth/login`) — никакой
proactive rotation.

Проблема: 24h UI session → 401 → forced logout = bad UX.

---

## Принятые решения

### Decision 1: silent preemptive refresh за 5 минут до expiry

**Обоснование**: 5 мин = compromise между:
- достаточно времени для refresh в случае temporary network failure (1-2 retry);
- достаточно близко к expiry, чтобы окно "не-authenticated" максимально короткое.

**Альтернатива (refresh at 50% lifetime)**: слишком агрессивно — refresh token rotation чаще чем нужно.

### Decision 2: scheduling через module-level Zustand-singleton

**Реализация**: `src/stores/auth-refresh.ts` — `createRefreshScheduler(onExpire)` factory
с internal timer ref + `schedule()` / `clear()`. `src/stores/auth-store.ts` держит
module-level `scheduler` instance, shared across all subscribers.

**Обоснование**: один timer на всё app — нет race conditions между множественными
`setUser` вызовами (login → hydration → token refresh → re-hydration).

**Альтернатива (per-component timer)**: race issues, difficult to cancel cleanly on logout.

### Decision 3: onExpire обрабатывает 3 failure modes

```
1. res.ok (200) → read data.expiresAt → reschedule → continue
2. !res.ok (401/403/500) → force logout (refresh token revoked/expired или hard fail)
3. Network error (fetch reject) → keep session, console.warn
   (next user action будет 401 если access реально expired)
```

**Обоснование**: balance между UX (network glitch ≠ forced logout) и security
(refresh 401 = revoked token = must logout).

### Decision 4: parseJwtExpiry без signature verification

**Обоснование**: signature verification — server-side concern (`verifyToken()` в `src/lib/jwt.ts`).
Client-side parse только извлекает `exp` claim для scheduling purposes.
Defense-in-depth: server всё равно верифицирует при `/api/auth/refresh` запросе.

### Decision 5: 12 vitest tests с deterministic fake timers

**Паттерн**: `vi.useFakeTimers()` + `vi.setSystemTime(baseline)` + `vi.advanceTimersByTime()` + `await Promise.resolve()` microtask drain.

**Избегаем**: `vi.runAllTimersAsync()` — fires ALL pending timers (включая будущие), что ломает scheduled-expiry semantics. `await new Promise(setTimeout, 0)` — никогда не сработает в fake mode.

---

## Reversibility

| Decision | Reversible? | Effort | Comment |
|----------|-------------|--------|---------|
| Silent preempt scheduling | ✅ | S | Just remove scheduler calls in store — auth flow back to 24h hard expiry. |
| 5min lead time | ✅ | S | Change DEFAULT_REFRESH_LEAD_MS constant. |
| Module-level singleton | ✅ | M | Refactor to per-component — race condition analysis needed. |
| parseJwtExpiry base64 decode | ✅ | S | Pure function — replace any time. |
| 3-mode failure handling | ⚠️ | M | Network handling policy = UX-critical. Hardening requires AB-test. |

**Overall**: high reversibility. Nothing carved-in-stone.

---

## Multi-pod / Scale Concerns

- **Singleton scheduler per process**: multi-pod deploy — каждый pod имеет own scheduler instance. Per-user refresh: works correctly, just not coordinated across pods (нет shared state needed).
- **Tier A `src/lib/jwt.ts` не тронут** — реализация чисто client-side.
- **Tier B `src/lib/pdf/index.ts` не тронут**.

---

## Cross-cutting notes

- Cycle 50 — тех-план, не бизнес-critical. Tier C candidate для `auth-refresh.ts` (см. `STABLE-MODULES.md`).
- `Tier A/B` not touched ✅.
- Tests:
  - 12 vitest tests в `src/lib/__tests__/auth-refresh.test.ts`.
  - Покрытие: parseJwtExpiry (5 paths), createRefreshScheduler (7 paths).
  - Fake timers `vi.advanceTimersByTime` + microtask drain via `await Promise.resolve()`.
- **NOT в scope**: server-side refresh endpoint hardening (rate-limiting на `/api/auth/refresh`,
  refresh token rotation, absolute session cap). Всё это — отдельные cycles.

---

## Acceptance Criteria

| Проверка | Ожидание |
|----------|----------|
| `parseJwtExpiry(valid_jwt)` | Returns exp*1000 ms |
| `parseJwtExpiry(invalid)` | Returns null |
| `parseJwtExpiry(no_exp_claim)` | Returns null |
| 5min lead → fire | onExpireCalled after 5min elapsed |
| Reschedule → cancel prev | no double-fire |
| `clear()` → cancel | onExpire NOT called after 10min |
| Network error on refresh | session kept + console.warn |
| 401/500 on refresh | force logout |
| Logout → cleanup timer | no zombie refresh после logout |

---

## Filing

- ADR документ: [`ADR-006-silent-refresh-preempt.md`](./ADR-006-silent-refresh-preempt.md).
- Implementation:
  - [`src/stores/auth-refresh.ts`](../src/stores/auth-refresh.ts) (helper, ~95 lines)
  - [`src/stores/auth-store.ts`](../src/stores/auth-store.ts) (extended with tokenExpiresAt + scheduler)
  - [`src/lib/__tests__/auth-refresh.test.ts`](../src/lib/__tests__/auth-refresh.test.ts) (12 vitest tests)
- Tier classification: `auth-refresh.ts` — Tier C CANDIDATE.
- Status: ✅ Accepted, implemented, gates green (tsc 0 / vitest 284/284 / eslint 0).

---

## Связанные документы

- [`ADR-003-status-workflow-live-query.md`](./ADR-003-status-workflow-live-query.md) — architectural pattern (live config + cache)
- [`docs/operations/STABLE-MODULES.md`](../operations/STABLE-MODULES.md) — Tier A/B/C classification
- [`docs/operations/audit-tasks.md`](../operations/audit-tasks.md) — cycle 50 spec
- [`src/lib/jwt.ts`](../src/lib/jwt.ts) — Tier A STABLE — NOT touched per ADR
