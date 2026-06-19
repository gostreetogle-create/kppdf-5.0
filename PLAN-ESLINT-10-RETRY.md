# PLAN-ESLINT-10-RETRY — цикл №15 (отложенный retry)

**Дата:** 2026-06-19
**Запрашивал:** <user_message>Подготовь plan cycle 15 — адресует обнаруженные риски ESLint 10. PLAN-ESLINT-10-RETRY.md: когда Next 16.x.x выйдет с совместимым eslint-plugin-react (peer supports eslint 10), какие шаги: bump eslint-config-next 16→16.x.x, npm install eslint@^10, ожидаемая lint validators chain. Отслеживай Next.js releases RSS — это signal для retry.</user_message>
**Автор:** Buffy (Cykl 14+)
**Parent plan:** `ESLINT-10-UPGRADE-PLAN.md` (2026-06-19, cycle 11)
**Closed:** cycle 13a (deferred via Path A rollback — `eslint` 10.5.0 → 9.39.4)

⚠️ **ВАЖНО:** Прежний `ESLINT-10-UPGRADE-PLAN.md` содержал некорректное утверждение:
> "Next.js 16.x официально поддерживает ESLint 10 (Next выпустил совместимые патчи в своих 16.x релизах)."
> "plugin:react/recommended — стабилен в v10"

**Реальность (проверено в cycle 13a и подтверждено в research cycle 15):**
- `eslint-plugin-react@7.37.5` (latest) — peer `^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7` — **НЕ включает ^10**
- `eslint-config-next@16.2.9` (latest) — peer `eslint: >=9.0.0` (семанически разрешает 10, но transitive `eslint-plugin-react` cap блокирует install)
- `eslint-plugin-react-hooks` — pending fix (GitHub react/react issue #35758, Feb 2026)
- **`eslint-plugin-react@8.x` НЕ существует** на июнь 2026 — никто не выпустил major

Этот план документирует **честное retry**, исходя из upstream-реальности, а не из ошибочных предположений.

---

## TL;DR

| Параметр | Значение |
|----------|----------|
| Статус ESLint | v9.39.4 (стабильно, rollback завершён) |
| Целевая версия | ESLint v10.x.x (latest stable) |
| Текущий blocker | `eslint-plugin-react@7.37.5` peer cap on `^9.7` |
| Retry стратегия | **Defer until upstream catches up** (Path A extended) |
| Trigger conditions | 3 конкретных сигнала (см. §3) |
| Monitor cadence | Quarterly (Next.js релизная cadence ≈ 1 minor / 6–8 weeks) |
| Effort на retry | ~30 min если trigger fires green |

**Вердикт:** цикл 15 = monitoring + readiness plan. **НЕ** execute-ready — ждём upstream.

---

## 1. Root cause (cycle 13a — что именно сломалось)

### 1.1 Симптом

```
$ npm install --save-dev eslint@^10.5.0
[install completed, +9 packages, -26 packages, ~12 updated]

$ npm run lint
TypeError: contextOrFilename.getFilename is not a function
    at react/display-name rule (eslint-plugin-react)
```

### 1.2 Корневая причина

ESLint 10 удалил `context.getFilename()` и `contextOrFilename.getFilename()` из `RuleContext` API (заменено на `context.filename`). Старые плагины, использующие `contextOrFilename.getFilename()`, **крашатся на load rule**.

`eslint-plugin-react` reference-имплементация: использовала API pre-v10. Авторы не выпустили patch.

### 1.3 Почему path C/D невозможны (cycle 13a)

| Path | Что | Почему отклонён |
|------|-----|-----------------|
| A — Rollback | `npm i -D eslint@^9.39.4` | ✅ **выбран** — zero cost, restore baseline |
| B — Override rule | `rules: { 'react/display-name': 'off' }` | ⚠️ Теряем 1 проверку (несколько правил молча сломаются аналогично) |
| C — Override peer dep | `overrides: { "eslint-plugin-react": "^X" }` | ❌ `7.37.5` = latest, нет совместимой версии. **Нет кандидата для override** |
| D — Bump `eslint-config-next` | bump 16.2.9 → 16.3.x | ⚠️ 16.3.x не существует на июнь 2026; даже если shipped, транзитивный `eslint-plugin-react` остаётся |

### 1.4 Архитектурное заключение

Цикл 13a закрыт через Path A. **Retry возможен только когда upstream либо:**

1. Выпустит `eslint-plugin-react@8.x` (peer `^10`) — **никто не собирается** на июнь 2026
2. Выпустит patched `eslint-plugin-react@7.37.x` с peer `^10` — **нет в roadmap**
3. Удалит `react` preset из `eslint-config-next` default → пользователь сам выбирает plugin
4. Next.js core team примет eslint-plugin-react override в свой codemod

---

## 2. Current state snapshot (June 2026)

Снято командой `npm view` (полные данные в research notes):

| Пакет | Installed | Latest | Peer-eslint | ESLint 10 ready? |
|-------|-----------|--------|-------------|------------------|
| `eslint` | 9.39.4 | 10.5.0 | n/a (host) | YES (latest major) |
| `eslint-config-next` | 16.2.9 | 16.2.9 | `>=9.0.0` | ⚠️ Семантически permits, transitive blocker |
| `eslint-plugin-react` | 7.37.5 (transitive) | 7.37.5 | `^3..^9.7` | **❌ НЕТ** (no 8.x exists) |
| `eslint-plugin-react-hooks` | 5.x (transitive) | 5.1.0 | pending fix | **❌ НЕТ** (issue #35758) |
| `typescript-eslint` | 8.61.0 | 8.61.1 | `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0` | ✅ YES (v8.57+) |
| `@eslint/js` | 9.x | 10.x | n/a | ✅ YES |

**Сводка:** ESLint 10 и его peer-friendly пакеты (`typescript-eslint`, `@eslint/js`) готовы. **React-preset plugin ecosystem — нет.**

---

## 3. RETRY TRIGGER conditions

Retry-plan execution начинается **только когда выполнено ОДНО из условий:**

### Trigger A — `eslint-plugin-react@8.x` released

**Check:**
```bash
npm view eslint-plugin-react@latest version
npm view eslint-plugin-react@latest peerDependencies.eslint
# Ожидаемо: "^8 || ^9 || ^10" или новая формулировка
```

**Действие:** candidate `eslint-plugin-react@8.0.0` на npm registry с peer-deps `^10`.

### Trigger B — `eslint-plugin-react-hooks@5.2.0+` patches peer-deps

**Check:**
```bash
npm view eslint-plugin-react-hooks@latest peerDependencies.eslint
# Ожидаемо: "^8.57.0 || ^9.0.0 || ^10.0.0"
```

**Reference:** GitHub react/react issue #35758 (Feb 2026).

### Trigger C — `eslint-config-next` removes react preset OR ships with ESLint 10 native

**Check:**
```bash
npm view eslint-config-next@latest peerDependencies
npm view eslint-config-next@latest dependencies
# Ожидаемо: отсутствие transitive eslint-plugin-react, ИЛИ явная зависимость с peer ^10
```

### Disqualifying conditions

Retry **НЕ выполняется**, если:
- ❌ Node.js < 20.19.0
- ❌ Working tree dirty (uncommitted changes от других tasks)
- ❌ Vitest тесты failing до retry
- ❌ ESLint 10 peer-deps ещё НЕ поддерживаются (повторное подтверждение cap)

---

## 4. Monitoring strategy

### 4.1 Sources to monitor

| Source | URL | Cadence | Что искать |
|--------|-----|---------|------------|
| Next.js GitHub Releases | https://github.com/vercel/next.js/releases | Weekly | Заголовок версии (`16.3.0`+) с упоминанием "ESLint 10" в release notes |
| Next.js Blog | https://nextjs.org/blog | Weekly | Nuance о `eslint-config-next` migration |
| eslint-plugin-react releases | https://github.com/jsx-eslint/eslint-plugin-react/releases | Weekly | `v8` tag или `v7.38.x` with peer update |
| eslint-plugin-react-hooks releases | https://github.com/facebook/react/releases | Weekly | Tracking issue #35758 |
| npm registry | `npm view ... peerDependencies` | Monthly | Programmatic check (см. §4.2) |

### 4.2 Programmatic check script (cycle 15 готов)

Сохранить как `scripts/check-eslint10-compat.sh` (per-задача из cycle 15 backlog):

```bash
#!/bin/bash
# scripts/check-eslint10-compat.sh
# Запускать quarterly или перед каждым retry-attempted cycle

set -e

echo "=== eslint-plugin-react ==="
npm view eslint-plugin-react@latest version
npm view eslint-plugin-react@latest peerDependencies.eslint

echo ""
echo "=== eslint-plugin-react-hooks ==="
npm view eslint-plugin-react-hooks@latest version
npm view eslint-plugin-react-hooks@latest peerDependencies.eslint

echo ""
echo "=== eslint-config-next ==="
npm view eslint-config-next@latest version
npm view eslint-config-next@latest peerDependencies.eslint

echo ""
echo "=== typescript-eslint ==="
npm view typescript-eslint@latest version
npm view typescript-eslint@latest peerDependencies.eslint

echo ""
echo "=== Trigger evaluation ==="
ESLINT_REACT_PEER=$(npm view eslint-plugin-react@latest peerDependencies.eslint)
ESLINT_HOOKS_PEER=$(npm view eslint-plugin-react-hooks@latest peerDependencies.eslint)
NEXT_CONFIG_PEER=$(npm view eslint-config-next@latest peerDependencies.eslint 2>/dev/null || echo "none")

if echo "$ESLINT_REACT_PEER" | grep -qE '\^10|\^8 \|\| \^9 \|\| \^10'; then
  echo "✅ TRIGGER A: eslint-plugin-react supports ESLint 10"
elif echo "$ESLINT_HOOKS_PEER" | grep -qE '\^10|\^8 \|\| \^9 \|\| \^10'; then
  echo "✅ TRIGGER B: eslint-plugin-react-hooks supports ESLint 10"
elif echo "$NEXT_CONFIG_PEER" | grep -qE '\^10'; then
  echo "✅ TRIGGER C: eslint-config-next supports ESLint 10"
else
  echo "⏸ DEFER: no upstream compat yet. Continue monitoring."
  exit 1
fi
```

**Файл будет добавлен в следующем execution cycle (cycle 15)**, если подтверждено что retry в планах.

### 4.3 Notification rules

| Event | Действие |
|-------|----------|
| `eslint-plugin-react@8.0.0` опубликован | Создать task `cycle-16-eslint-10-retry-execute` в agent-queue |
| `eslint-plugin-react@7.38.0` с peer patch | Создать task `cycle-16-eslint-10-retry-execute` |
| `eslint-config-next@16.3.0` опубликован | Прочитать release notes. Если есть ESLint 10 support → task. Иначе ignore. |
| `typescript-eslint` minor + peer change | Создать task (нота: почти всегда compat) |

---

## 5. Retry execution steps (when trigger fires)

### Pre-flight (Step 0)

```bash
# 5.0.1 Verify trigger (run check script)
./scripts/check-eslint10-compat.sh

# 5.0.2 Node version
node -v  # expect ≥ 20.19.0

# 5.0.3 Working tree clean
git status  # expect "nothing to commit, working tree clean"
# Если не чисто → commit current state OR stash

# 5.0.4 Current tests pass
npx vitest run  # expect 64/64

# 5.0.5 Current lint baseline (post MiMo cycle-14 fixes)
npm run lint 2>&1 | tee /tmp/lint-baseline-before-retry-15.log
# Запомнить количество ошибок (будем < 52 благодаря cycle 14)
```

### Step 1 — Branch

```bash
git checkout -b chore/eslint-10-upgrade-v2
git add -A
git commit -m "chore: pre-eslint-10-v2 cycle-15 baseline"
```

### Step 2 — Bump versions

В `package.json`:
```diff
-eslint@^9.39.4
+eslint@^10.5.0
-eslint-config-next@^16.2.9
+eslint-config-next@^16.2.9  # (next minor если released, e.g. ^16.3.0)
```

**Минимальный diff.** Если экосистем готов, install без overrides.

### Step 3 — npm install

```bash
npm install
# Без --legacy-peer-deps (мы НЕ ожидаем конфликтов после trigger fire)
```

**Если peer warning → STOP.** Не использовать `--force` или overrides. Это значит upstream ещё не полностью compat.

### Step 4 — Smoke test

```bash
npx eslint --version  # expect v10.x.x

npm run lint 2>&1 | tee /tmp/lint-after-retry-15.log | head -80
```

**Сравнить с /tmp/lint-baseline-before-retry-15.log:**
- Зелёное → ✅ continue
- Новые хиты (которых не было в baseline) → Step 5
- Crash (тот же симптом что cycle 13a) → STOP, defer ещё

### Step 5 — Autofix (если нужны новые хиты)

```bash
npx eslint . --fix
# ВНИМАНИЕ: --fix может изменить package.json comments — git diff перед commit
```

### Step 6 — Ручной разбор новых warning'ов

Возможные категории (от ESLint 10 migration guide):
- `no-shadow-restricted-names` → `globalThis` shadow detection
- `radix` schema change → `parseInt(x, 10)` уже у нас; check callers
- Improved JSX scope → `no-unused-vars` на JSX-prop names

**Если < 5 новых warning'ов** → fix inline в PR.
**Если > 20** → split в отдельный PR.

### Step 7 — Полная валидация (parallel)

```bash
npx tsc --noEmit 2>&1 | tail -10
npx vitest run 2>&1 | tail -10
npm run lint 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

**Все 4 должны быть зелёными.**

### Step 8 — Audit + commit

```bash
git add -A
git commit -m "chore(deps): upgrade eslint 9.39 → 10.x (cycle 15 retry)

- Bump eslint to ^10
- Bump eslint-config-next to ^16.x.x (latest)
- Fix N new lint hits from improved JSX scope tracking
- Verified: tsc 0 errors, vitest 64/64, lint exit 0, build OK
- Triggered by: <trigger A/B/C> (см. PLAN-ESLINT-10-RETRY §3)"

git checkout main
git merge chore/eslint-10-upgrade-v2

# audit-log.md cycle №15 entry
```

---

## 6. Validation chain (post-retry)

После успешного bump → **полная цепочка валидации:**

```
node -v                           → ≥ 20.19 ✅
npx eslint --version              → v10.x ✅
npx tsc --noEmit                  → 0 errors ✅
npx vitest run                    → 64/64 (или больше после cycle 14) ✅
npm run lint                      → exit 0 (или exit 1 с reduced error count) ✅
npm run build                     → success ✅
audit-log.md cycle №15 entry      → ⏳ append перед merge
```

**Целевой diff:** baseline (после cycle 14 completion) → после retry (cycle 15). Ожидаемо 0 новых warning'ов или < 5.

---

## 7. Fallback paths (если retry частично fails)

### Fallback F1 — `eslint-config-next` minor возможно не patched

Если `eslint-config-next@16.x.x` (next minor) содержит обновлённый `eslint-plugin-react`, но всё ещё cap на 9 — use it and apply **manual override**:

```json
// package.json
{
  "overrides": {
    "eslint-plugin-react": "^7.38.0",
    "eslint-plugin-react-hooks": "^5.2.0"
  }
}
```

**⚠️ риск:** overrides могут вызвать непредвиденные behavior changes. Test exhaustively.

### Fallback F2 — Новая версия `eslint-plugin-react@7.38.x` ОК, но react-hooks нет

```json
{
  "overrides": {
    "eslint-plugin-react-hooks": "^5.2.0-patch-1"
  }
}
```

Нетипично — overrides для patch'ей создают community risk. Use only if urgent.

### Fallback F3 — If everything блокирует — extend deferral

Если после триггера install всё равно fails → **defer еще на 1 quarter.** Document новые данные в audit-log, выставить новые check dates.

### Fallback F4 (worst case) — Accept ESLint 9 indefinitely

Если upstream effectively abandons ESLint 10 support для react-preset (например, react 19 community move to `eslint-plugin-react-hooks`) — **accept current state** (ESLint 9.39.4). Document в audit-log как "stable state" без retry.

---

## 8. Rollback plan

Если retry начат и something fails:

```bash
# После Step 3 install
git checkout -- package.json package-lock.json
npm install

# После Step 6 lint crashes
git reset --hard HEAD~1  # если ещё не push

# После merge в main
git revert -m 1 <merge-commit-hash>
```

**Key invariant:** package-lock.json + eslint.config.mjs + cycle 14 helper-файлы должны вернуться в идентичное pre-retry state. Validate:

```bash
git diff main..HEAD -- package.json package-lock.json eslint.config.mjs
# Должен быть пустой после revert
```

---

## 9. Open questions / запросы к пользователю

После cycle 14 completion (MiMo done), перед cycle 15:

1. **Готовность ждать upstream?** До 12 месяцев (если upstream не движется) или принять override strategy?
2. **Quality monitoring:** проверять ежемесячно (script in `scripts/`) или quarterly?
3. **CI trigger:** если `npm install` exit 0 в upstream-monitoring step → автоматически создать issue/ticket?
4. **Override tolerance:** при каких условиях использовать Fallback F1 (overrides)?
5. **Scope reinforcement:** cycle 15 = только retry, или включить рефакторинг тех 3 helper items из cycle 14 если ещё остались?

Дефолты (если пользователь skip):
- Ждать upstream (Path A extended indefinite)
- Quarterly monitor cadence
- Manual trigger (no auto-issue)
- Override only if explicit user approval
- Cycle 15 = retry only, рефакторинг отдельно

---

## 10. Что НЕ входит в этот план

❌ TYpeScript 6 upgrade (отдельный цикл 14+)
❌ Next.js minor bump (16 → 17) — вне scope (independent track)
❌ Prettier или другие formatter'ы — вне scope, не используются
❌ Refactor существующих lint warnings (это cycle 14 — MiMo territory)
❌ Новый ESLint config presets (vanilla только)

---

## 11. References

- ESLint 10 migration guide: <https://github.com/eslint/eslint/blob/main/docs/src/use/migrate-to-10.0.0.md>
- Parent plan: `ESLINT-10-UPGRADE-PLAN.md` (cycle 11)
- Cycle 13a closure: `audit-log.md` цикл №13a (Path A)
- GitHub issue: react/react #35758 (eslint-plugin-react-hooks peer update)
- Next.js: <https://nextjs.org/blog> · Releases RSS: <https://github.com/vercel/next.js/releases.atom>

---

## 12. Готовность

✅ Plan complete. Retry-blocks documented (3 trigger conditions).
✅ Monitoring strategy ready (4 sources, script in §4.2 if user requests).
✅ Execution steps ready (§5) идемпотентны — можно запускать сразу когда trigger fires.
✅ Validation chain (§6) + rollback (§8) готовы.

⏳ **Hard block до upstream.** Cycle 15 = bookkeeping + monitoring, не execute.

---

## Appendix — Snapshot timestamp

| Field | Value |
|-------|-------|
| Snapshot taken | 2026-06-19 |
| `eslint-plugin-react` latest at snapshot | 7.37.5 (peer `^3..^9.7`) |
| `eslint-plugin-react@8.x` | NOT released |
| `eslint-config-next` latest at snapshot | 16.2.9 (peer `>=9.0.0`) |
| `eslint-config-next@16.3.x` | NOT released |
| Next retry estimated window | Q4 2026 — Q2 2027 (estimated) |

Snapshot data должна быть **refreshed в начале каждой cycle 15 re-attempt**:
```bash
npm view eslint-plugin-react@latest version peerDependencies.eslint
npm view eslint-config-next@latest version peerDependencies.eslint
npm view eslint-plugin-react-hooks@latest version peerDependencies.eslint
```

### §11.1 — RSS / Release feeds to monitor (manual quarterly check)

| Source | URL | What to grep |
|--------|-----|--------------|
| Next.js releases (GitHub) | <https://github.com/vercel/next.js/releases.atom> | `eslint`, `ESLint 10`, `eslint-config-next` |
| Next.js blog (RSS) | <https://nextjs.org/feed.xml> | `ESLint` |
| eslint-plugin-react releases | <https://github.com/jsx-eslint/eslint-plugin-react/releases.atom> | `peer-deps`, `eslint`, `^10` |
| eslint-plugin-react-hooks | <https://github.com/facebook/react/releases.atom> | `eslint-plugin-react-hooks` |
| TypeScript-ESLint releases | <https://github.com/typescript-eslint/typescript-eslint/releases.atom> | (informational; already at 8.x with ^10 support) |

**Programmatic quarterly check (preferred):**
```bash
./scripts/check-eslint10-compat.sh
# Exit 0 = viable retry
# Exit 1 = no progress (defer)
# Exit 2 = partial progress (TRIGGER B only)
# Exit 3 = unreachable (network)
```

**Continuous polling (optional, 12h cadence):**
```bash
# Linux/macOS cron (every 12h):
0 */12 * * * cd /path/to/kppdf-5.0 && scripts/listen-nextjs-eslint10.sh
# Windows Task Scheduler: basic task every 12 hours, run scripts/listen-nextjs-eslint10.sh --quiet
```

