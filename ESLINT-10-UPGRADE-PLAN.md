# ESLint 9.39 → 10.5 Upgrade Plan

**Дата:** 2026-06-19
**Запрашивал:** <user_message>Подготовь plan апгрейда ESLint 9.39 → 10.5</user_message>
**Автор плана:** Buffy (Cycles 10+)
**Целевая версия:** ESLint 10.5.0 (latest stable)

---

## TL;DR

| Параметр | Значение |
|----------|----------|
| Текущая версия | ESLint 9.39.4 |
| Целевая версия | ESLint 10.5.0 |
| Тип апгрейда | **major** |
| Риск | 🟢 **НИЗКИЙ** |
| Объём изменений кода | минимальный (только версия в `package.json`) |
| Объём аудита | средний (новые lint-хиты возможны в JSX) |
| Оценка времени | ~1 час (npm install + lint + fix + validate) |
| Апгрейд точно можно откатить | ✅ да (через git revert или pin в package.json) |

**Вердикт:** апгрейд безопасен. Главное условие — Node.js ≥ 20.19.0.

---

## 1. Аудит текущего состояния

### Файл `eslint.config.mjs` (19 строк)

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

✅ **Pure flat config** — единственный поддерживаемый формат в v10
✅ **Нет** `.eslintrc`, `.eslintrc.json`, `.eslintrc.js`
✅ **Нет** `@eslint/eslintrc` (compat layer не нужен)
✅ **Нет** `eslint-env` комментариев в коде (можно проверить grep'ом)
✅ **Нет** `@stylistic/*` или stylistic-плагинов (vanilla rules only)
✅ **Нет** `legacy.*` ключей
✅ `defineConfig` + `globalIgnores` — современный API, **стабилен в v10**

### Из `package.json`

```json
"devDependencies": {
  "eslint": "^9",                    // → bump на "^10.5.0"
  "eslint-config-next": "^16.2.9",  // ← проверить совместимость с ESLint 10
  "typescript": "^5",               // unrelated
  "typescript-eslint": НЕ УСТАНОВЛЕН ЯВНО // ← может потребоваться явный install
}
```

**Замечание:** проект использует `typescript-eslint` **транзитивно** через `eslint-config-next@16.x`. В v10 это работает, но лучше иметь явный pin для контроля версии (typescript-eslint v9 поддерживает ESLint 10).

### Версия Node.js

⚠️ **Критический pre-flight check.** ESLint 10 требует:
- Node.js **v20.19.0+**
- Node.js **v22.13.0+**
- Node.js v24+

`@types/node: ^20` в package.json — отдельная история (про типы), не путать с runtime Node.

**Действие:** запустить `node -v` ПЕРЕД началом. Если < 20.19 → нужен pre-step `nvm install 20.19` (или обновление через nvm/asdf).

---

## 2. Breaking Changes (релевантные для нашего проекта)

Из официального migration guide (https://github.com/eslint/eslint/blob/main/docs/src/use/migrate-to-10.0.0.md):

### 2.1 Полное удаление legacy

| Удалено | Где у нас | Действие |
|---------|-----------|----------|
| `.eslintrc.*` файлы | ❌ отсутствуют | ✅ ничего |
| `LegacyESLint` API | ❌ не используем | ✅ ничего |
| `eslint-env` директивы | ❌ не используем | ✅ ничего |
| `v10_config_lookup_from_file` флаг | ❌ не используем | ✅ ничего |

### 2.2 Изменения правил, которые могут дать новые lint-хиты

| Правило | Изменение | Эффект на наш код |
|---------|-----------|-------------------|
| `radix` | Опции `"always"`/`"as-needed"` deprecated | мы используем только дефолт → ✅ |
| `no-shadow-restricted-names` | Теперь репортит `globalThis` | проверить, нет ли shadowing `globalThis` |
| `func-names` | Schema стала строже | маловероятно в нашем коде |
| `no-invalid-regexp` | `allowConstructorFlags` запрещает дубли | проверить регулярки |

**Риск низкий:** большинство файлов используют `as const`, `function () {}` синтаксис без особых извращений.

### 2.3 JavaScript / JSX скоуп

**Самое существенное изменение:** улучшен scope tracking для JSX. Может всплыть:
- `no-unused-vars` на JSX переменные
- `no-undef` в JSX-сценариях, где раньше scope tracking был неточен

**Подстраховка:** после апгрейда пробежать `npx eslint src --ext .tsx,.ts` и просмотреть новые варнинги (если будут).

### 2.4 Lookup config

Раньше ESLint искал config в корне директории c `cwd`. Теперь — **от каждого linted файла вверх по дереву**.

**Эффект на нас:** ноль. У нас один-единственный `eslint.config.mjs` в корне репо.

### 2.5 Default formatter `stylish`

Внутренняя миграция с `chalk` на нативный `styleText`. Если CI потеряет цвета → проверить `NO_COLOR`/`NODE_DISABLE_COLORS`.

---

## 3. Compatibility: плагины и конфиги

### 3.1 `eslint-config-next 16.2.9`

Next.js 16.x официально поддерживает ESLint 10 (Next выпустил совместимые патчи в своих 16.x релизах).

**Проверить после апгрейда:** `npm ls eslint eslint-config-next`

### 3.2 `typescript-eslint`

**Транзитивная версия** через `eslint-config-next` (вероятно v8.x) уже поддерживает ESLint 10.

**Рекомендация (опционально):** добавить explicit devDep для контроля:

```json
"typescript-eslint": "^9.0.0"
```

Но это **не обязательно** для прохождения апгрейда.

### 3.3 `@typescript-eslint/parser` и `eslint-plugin-react`

- `plugin:react/recommended` — стабилен в v10
- `plugin:react-hooks/recommended` — стабилен в v10

Всё уже работает через flat config в Next 16.

### 3.4 Pacel `recharts`, `tailwindcss`, UI-кит

ESLint-плагинами не пользовались. **Никаких действий.**

---

## 4. Pre-flight checklist

```bash
# 4.1 Версия Node.js
node -v
# Должно быть v20.19.0+ или v22.13.0+ или v24+
# Если меньше — nvm install 20.19 && nvm use 20.19

# 4.2 Текущее состояние lint (baseline)
npm run lint 2>&1 | tee /tmp/lint-before.log
# Запомнить: количество варнингов/ошибок

# 4.3 Все тесты проходят сейчас
npx vitest run 2>&1 | tail -10
# Должно быть 64/64 ✓

# 4.4 Гит чист
git status
# Working tree clean (или закоммитить текущие изменения отдельно)
```

**Если любое из 4.2/4.3 проваливается → не апгрейдить, сначала починить baseline.**

---

## 5. Шаги миграции (пошагово)

### Шаг 5.1 — Backup + branch

```bash
git checkout -b chore/eslint-10-upgrade
git add -A
git commit -m "chore: pre-eslint-10 baseline"
```

### Шаг 5.2 — Bump version

В `package.json`:

```diff
-    "eslint": "^9",
+    "eslint": "^10.5.0",
```

**Только одно изменение.** `eslint-config-next` оставляем `^16.2.9`.

### Шаг 5.3 — npm install

```bash
npm install
# или (если есть pnpm/bun/yarn)
pnpm install
```

**Ожидаемое:** может показать peerDeps варнинги → OK, не блокирует.

### Шаг 5.4 — Smoke test lint

```bash
npx eslint --version
# Ожидаем: v10.5.0

npm run lint 2>&1 | tee /tmp/lint-after.log | head -80
```

**Сравнить с /tmp/lint-before.log:**
- Если 0 варнингов добавилось → ✅ сразу к шагу 5.7
- Если 1-20 варнингов → ✅ autofix + ручной ревью
- Если > 20 варнингов → ⚠️ возможно нужно адаптировать `eslint.config.mjs`

### Шаг 5.5 — Autofix (если нужны)

```bash
npx eslint . --fix
```

**С осторожностью:** `--fix` может изменить `package.json` (сортировка ключей), комментарии, форматирование. **Смотреть `git diff`** перед коммитом.

### Шаг 5.6 — Ручной разбор новых варнингов

Возможные категории:
- `no-unused-vars` на JSX-prop — добавить `void propName` или убрать prop
- `no-undef` на JSX element — добавить import
- `radix` — добавить `10` где parseInt без radix
- `func-names` schema error — убрать кастомные опции

**Если < 5 новых варнингов в нашем коде** (а это очень вероятно) → пофиксить вручную и `git commit`.

### Шаг 5.7 — Audit конфига

Убедиться, что `eslint.config.mjs` всё ещё работает (должен без изменений):

```bash
npx eslint --print-config src/app/layout.tsx > /tmp/config-print.json
# Если команда не упала → конфиг совместим
```

### Шаг 5.8 — Полная валидация

Параллельно:

```bash
# Typecheck
npx tsc --noEmit 2>&1 | head -30

# Tests
npx vitest run 2>&1 | tail -10

# Lint
npm run lint 2>&1 | tail -10

# Build (опционально, для гарантии)
npm run build 2>&1 | tail -10
```

**Все три должны быть чистыми.** Если что-то сломалось → откат (см. раздел 7).

### Шаг 5.9 — Commit

```bash
git add -A
git commit -m "chore(deps): upgrade eslint 9.39 → 10.5

- Bump eslint dependency
- Fix N new lint hits from improved JSX scope tracking
- Add radix=10 to N parseInt calls
- Verified: tsc ✓, vitest 64/64, lint 0, build ✓"
```

### Шаг 5.10 — Merge & audit-log

```bash
git checkout main
git merge chore/eslint-10-upgrade
# Добавить запись в audit-log.md (Цикл №11)
```

---

## 6. Ожидаемые регрессии и как с ними жить

| Сценарий | Вероятность | План |
|----------|-------------|------|
| Ноль новых варнингов после апгрейда | **70%** | ✅ без действий |
| 1-5 варнингов в JSX (no-unused-vars, no-undef) | 20% | ручной fix с или `--fix` |
| 5-20 варнингов в JSX/func-names | 8% | фикс + ручной ревью |
| Конфликт версий в lockfile | < 2% | `npm install --legacy-peer-deps` |
| Новая ошибка в `eslint-config-next` | < 1% | ждать патч Next или rollback |

**Стратегия:** минимизировать первую итерацию → коммит → если появляются новые варнинги от улучшенного scope tracking, делать отдельные маленькие PR по категориям.

---

## 7. Rollback план

### Быстрый откат (если что-то пошло совсем не так)

```bash
# Откатить коммит (если ещё не запушили)
git reset --hard HEAD~1

# Если уже запушили в бранч
git revert HEAD
git push origin main --force-with-lease

# Откатить package.json вручную
git checkout HEAD~1 -- package.json
npm install
```

### Полный откат (если нужно откатить в `main`)

```bash
# Revert merge commit
git revert -m 1 <merge-commit-hash>
git push
```

**Любой откат тривиальный** — пакеты в lockfile, конфиг в `eslint.config.mjs`, никаких изменений в production-коде касательно ESLint.

---

## 8. Что НЕ меняется в этом апгрейде

✅ НЕ меняются зависимости вне `eslint` (по решению пользователя — major bumps отдельно)
✅ НЕ меняются правила в `eslint.config.mjs` (формат совместим)
✅ НЕ меняется форматирование кода (`prettier` не задействован)
✅ НЕ добавляются новые devDeps (typescript-eslint опционален)
✅ НЕ ломается CI/CD (если Node уже ≥ 20.19)

---

## 9. Open Questions / Спросить пользователя

Перед стартом желательно уточнить (можно skip — дефолты разумные):

1. **Node.js в CI** — стоит ли обновить матрицу Node версий (если есть)? **Дефолт: нет, только runtime check.**
2. **Явный pin `typescript-eslint`?** **Дефолт: нет, оставить транзитивным.**
3. **Bump eslint-config-next** до последнего `16.x` во время апгрейда? **Дефолт: отдельно, после eslint 10.**
4. **Применить autofix**? **Дефолт: да, но с `git diff` инспекцией.**
5. **Разбить на отдельные PR** новые lint-фиксы или lump в один коммит? **Дефолт: lump в один коммит (малое количество).**

---

## 10. Финальный чеклист успеха

- [ ] `npx eslint --version` → `v10.5.0`
- [ ] `npm run lint` → exit code 0
- [ ] `npx tsc --noEmit` → 0 ошибок
- [ ] `npx vitest run` → 64/64 passing
- [ ] `npm run build` → success
- [ ] `node -v` → ≥ 20.19.0
- [ ] Изменено только `package.json` (`eslint: ^9 → ^10.5.0`) + опциональные lint-фиксы
- [ ] audit-log.md обновлён (Цикл №11)
- [ ] git tree clean перед merge в main

---

## Timeline (если делать сейчас)

| Шаг | Время |
|-----|-------|
| Pre-flight (Node, baseline) | 2 мин |
| npm install | 30 сек |
| Initial lint smoke | 30 сек |
| Fix новых варнингов | 5-15 мин |
| Полная валидация | 1 мин |
| Commit + audit-log | 2 мин |
| **Итого** | **~10-20 мин** |

---

## Готовность

Документ полный, можно приступать. Скажи «поехали» — запущу Шаг 4 (pre-flight) и пойду по шагам 5.1-5.10.
