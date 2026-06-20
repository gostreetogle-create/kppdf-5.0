# Cycle 40 — Block 1.3 env.ts consolidation

**Дата**: 2026-06-20
**Агент A (Критик)** — координатор
**Агент B (Исполнитель)** — основной исполнитель (но cycle 40 мелкий, выполняет А самостоятельно)
**Источник плана**: `audit-tasks.md` Блок 1.3 (цикл 40)

---

## Цель задания

Устранить дублирование `process.env.NODE_ENV === 'production'` паттерна в 4 файлах через единый `src/lib/env.ts` модуль + запретить прямой доступ на уровне ESLint.

---

## Файлы, которые нужно изменить

| Файл | Строки | Что заменить |
|------|--------|--------------|
| `src/lib/db.ts` | 14 | `if (process.env.NODE_ENV !== 'production')` → `if (!isProd)` |
| `src/proxy.ts` | 25 | `process.env.NODE_ENV === 'production'` → `isProd` |
| `src/app/api/auth/login/route.ts` | 58, 66 | `process.env.NODE_ENV === 'production'` → `isProd` |
| `src/app/api/auth/refresh/route.ts` | 49, 58 | `process.env.NODE_ENV === 'production'` → `isProd` |

---

## Шаги

### 1. Создать `src/lib/env.ts`

```ts
// src/lib/env.ts
// Single source of truth for environment-derived runtime constants.
// Заменить любые прямые обращения process.env.NODE_ENV / NEXT_PUBLIC_BASE_URL
// на эти exports. Запрещено ESLint rule no-restricted-syntax (см. eslint.config.mjs).

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = !isProd; // dev or test
export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
```

### 2. Заменить usages

- В каждом из 4 файлов добавить `import { isProd } from '@/lib/env';` (или относительный путь, согласно convention).
- Заменить `process.env.NODE_ENV === 'production'` → `isProd`.
- Заменить `process.env.NODE_ENV !== 'production'` → `!isProd`.

**Convention проверка**: посмотри в `tsconfig.json` алиас `@/*`. Если есть (а он есть, потому что в задаче выше обсуждался `@/lib/auth`), используй `@/lib/env`. Иначе относительный.

### 3. Добавить ESLint rule

В `eslint.config.mjs` — добавить в правила для `src/**/*.ts(x)`:
```js
'no-restricted-syntax': [
  'error',
  {
    selector:
      "MemberExpression[property.name='NODE_ENV'][object.property.name='env'][object.object.name='process']",
    message:
      "Use `isProd`/`isDev` from '@/lib/env' instead of direct process.env.NODE_ENV access."
  }
]
```

Также добавить правило для `NEXT_PUBLIC_BASE_URL`:
```js
{
  selector:
    "MemberExpression[property.name='NEXT_PUBLIC_BASE_URL']",
  message:
    "Use `baseUrl` from '@/lib/env' instead of direct process.env.NEXT_PUBLIC_BASE_URL access."
}
```

ESLint config — flat config формат (Next.js 16). Сохрани стиль, не ломай существующие правила.

---

## Критерии приёмки (gates)

1. **`npx tsc --noEmit`** — 0 ошибок.
2. **`npx vitest run`** — все тесты зелёные (88/88 в 6/6 suites).
3. **`npx eslint src --max-warnings=999`** — 0 ошибок (допускаются старые warnings, не новые).
4. **`grep -rn "process\.env\.NODE_ENV" src/`** — должно вернуть **0 результатов** (всё заменено на `isProd`).
5. **Visual smoke** — это серверное изменение, визуально ничего не должно сломаться.

---

## Особые заметки

- **`src/proxy.ts`** (НЕ `src/middleware.ts`) — Next.js 16 файл. Читай через `read_files`.
- **`src/lib/auth.ts`** уже был обновлён в cycle 39 (jwt.ts decoupling). Не трогать.
- **`@/lib/env`**: проверить, что tsconfig имеет `paths` для `@/*`. Если нет — fallback на относительный `../../lib/env` и т.д.

---

## === КОМАНДА ДЛЯ АГЕНТА B ===

> Прочитай `tasks/current-task.md` и выполни задание. После завершения:
> 1. Запиши результат в раздел `=== РЕЗУЛЬТАТ ===` ниже в этом же файле.
> 2. Обнови `audit-log.md` в соответствии с шаблоном (формат записи — см. ниже).

**Шаблон для `audit-log.md`**:
```
## Цикл 40 — env.ts consolidation (2026-06-20)

Создан [src/lib/env.ts](src/lib/env.ts) с экспортами isProd/isDev/baseUrl.

Заменено в N файлах:
- `src/lib/db.ts:14` …
- `src/proxy.ts:25` …
- `src/app/api/auth/login/route.ts:58,66` …
- `src/app/api/auth/refresh/route.ts:49,58` …

ESLint rule добавлен: `no-restricted-syntax` для `process.env.NODE_ENV` и `process.env.NEXT_PUBLIC_BASE_URL`.

Гейты: tsc 0 / vitest 88/88 / lint 0 / grep 0 совпадений.
```

---

---

## === РЕЗУЛЬТАТ === (выполнено Агентом A, 2026-06-20, cycle 40)

### Что сделано
- ✅ Создан [`src/lib/env.ts`](src/lib/env.ts) с `isProd`, `isDev`, `baseUrl` (single source of truth).
- ✅ Заменено в **4 файлах**:
  - `src/lib/db.ts:14` — относительный импорт `'./env'` (соответствует existing convention в db.ts для sibling modules)
  - `src/proxy.ts:24` — удалён локальный `const isProd = process.env.NODE_ENV === 'production'`, добавлен `@/lib/env` import (импорт хоистится выше функции, поэтому в `proxy()` `isProd` доступен)
  - `src/app/api/auth/login/route.ts:58,66` — `secure: process.env.NODE_ENV === 'production'` → `secure: isProd` (2 occurrences)
  - `src/app/api/auth/refresh/route.ts:49,58` — same (2 occurrences)
- ✅ ESLint rule `no-restricted-syntax` расширен:
  - 2 selector для прямого member access (`process.env.NODE_ENV`, `process.env.NEXT_PUBLIC_BASE_URL`)
  - 2 selector для computed member (`process.env['NODE_ENV']`, `process.env['NEXT_PUBLIC_BASE_URL']`)
  - Override block для `src/lib/env.ts` (source of truth, only file allowed direct access)
- ✅ JSDoc-комментарий в env.ts уточняет семантику `isDev` (covers BOTH `development` AND `test`, не strict dev-only).

### Gates
| Проверка | Результат |
|----------|-----------|
| `npx tsc --noEmit` | **0 ошибок** ✅ |
| `npx vitest run` | **88/88 тестов (6/6 suites)** ✅ (включая auth.test.ts после jwt.ts lazy fix) |
| `npx eslint src --max-warnings=999` | **0 ошибок** (3 cosmetic warnings pre-existing в `auth.ts` — НЕ моих) ✅ |
| `grep -rn 'process\.env\.NODE_ENV' src/` | **только `src/lib/env.ts`** (allowed source) ✅ |
| `grep -rn 'process\.env\.NEXT_PUBLIC_BASE_URL' src/` | **только `src/lib/env.ts`** (allowed source) ✅ |

### Промежуточные фиксы по дороге
1. **Self-referential ESLint errors** — правило `no-restricted-syntax` срабатывало на сам файл определения `src/lib/env.ts:6,8`. Fix: override block с `files: ['src/lib/env.ts']`, `rules: { 'no-restricted-syntax': 'off' }`.
2. **Computed-member selector** — code-reviewer nit: добавил 2 новых selector для `process.env['NODE_ENV']` (bracket access). Покрывает редкий случай будущих рефакторингов.
3. **`isDev` semantic** — code-reviewer nit: добавил JSDoc-комментарий в env.ts (covers dev AND test, не strict dev-only).
4. **`jwt.ts` lazy secret read** — `const JWT_SECRET = process.env.JWT_SECRET ?? null` читался при hoisted import, `beforeAll` не успевал задать env. Fix: `ensureSecret()` и `verifyToken()` читают `process.env.JWT_SECRET` lazily при вызове. Фикс: `src/lib/jwt.ts:16-54`.

### Code-reviewer verdict
**PASS** (стилистический nit про `ignores` vs override block — non-actionable, обе формы валидны в ESLint 9 flat config; override block более explicit и читаем).

### Файлы окончательно изменены
- `src/lib/env.ts` (new)
- `src/lib/jwt.ts` (lazy secret read bugfix)
- `src/lib/db.ts`
- `src/proxy.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `eslint.config.mjs`

