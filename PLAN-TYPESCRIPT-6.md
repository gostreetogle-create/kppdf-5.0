# TypeScript 5.9 → 6.0 Upgrade Plan

**Дата:** 2026-06-19
**Запрашивал:** <user_message>Подготовь plan апгрейда TypeScript 5.9 → 6.0</user_message>
**Автор плана:** Buffy (Cycles 10+)

---

## TL;DR

| Параметр | Значение |
|----------|----------|
| Текущая версия | TypeScript 5.9.3 |
| Целевая версия | TypeScript 6.0.3 (latest stable) |
| Тип апгрейда | **major** |
| Риск | 🟡 **СРЕДНИЙ** |
| Объём изменений кода | минимальный (`"typescript": "^5"` → `"^6.0.3"`) + возможные новые tsc-ошибки |
| Объём аудита | средний (74 record-patterns могут дать новые warnings) |
| Оценка времени | ~2-4 часа (install + typecheck + fix + validate) |
| Откат | ✅ тривиальный (lockfile + одна строка) |

**Вердикт:** апгрейд стоит делать сейчас — TS 6 это bridge к **TS 7 на Go** (нативный компилятор, 10× быстрее). Преимущества перевешивают риск.

---

## 1. Аудит текущего состояния

### Файл `tsconfig.json` (24 строки)

```json
{
  "compilerOptions": {
    "target": "ES2017",              // ⚠️ отличается от нового дефолта ES2025
    "lib": ["dom", "dom.iterable", "esnext"],  // dom.iterable теперь redundant
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,                  // ✅ явно = true (не сломается)
    "noEmit": true,                  // ✅ нет output path проблем
    "esModuleInterop": true,
    "module": "esnext",              // ✅ совпадает с новым дефолтом
    "moduleResolution": "bundler",   // ✅ стабильный выбор
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",              // ✅ современный режим
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

### Из `package.json`

```json
"devDependencies": {
  "typescript": "^5",            // → bump на "^6.0.3"
  "@types/node": "^20",          // (без версионных изменений)
  "@types/react": "^19",         // совместим с TS 6 ✓
  // typescript-eslint НЕ установлен явно
}
```

### Чувствительные паттерны в нашем коде (из code-search)

| Паттерн | Кол-во | Риск в TS 6 |
|---------|--------|-------------|
| `as const` | 9 мест | 🟢 улучшение inference, без миграции |
| `as unknown as X` | 5 мест | 🟡 продолжает работать, но линтинг ESLint 10 будет жаловаться отдельно |
| `as any[]` | 9 мест (в `data-*.page.tsx`) | 🟡 работает, но является anti-pattern (TODO отметить) |
| `satisfies` | 0 | 🟢 нет |
| `Record<string, ...>` | 74 места | 🟢 продолжают работать |
| `Object.keys()` | 0 | 🟢 не используем |
| `z.infer/z.input/z.output` | 0 явных | 🟢 TS 6 улучшает z.infer inference |

### Файлы под особым вниманием

| Файл | Почему |
|------|--------|
| `src/lib/db.ts:5` | `globalThis as unknown as { prisma: PrismaClient }` — Prisma 7 должен поддерживать |
| `src/lib/pdf/index.ts:343,511,636` | `doc as unknown as { lastAutoTable }` — jsPDF types стабильны |
| `src/app/(dashboard)/*/page.tsx` (9 файлов) | `data as any[]` — анти-pattern, но совместим |
| `src/app/api/*/route.ts` (40+ файлов) | `Record<string, unknown> for where/orderBy` — массово, стабильно |

---

## 2. Breaking Changes (релевантные для нашего проекта)

Из [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) и [TS 6.0 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).

### 2.1 Дефолты, которые могут ударить

| Флаг | Старый дефолт | Новый дефолт (6.0) | Наш tsconfig | Действие |
|------|---------------|---------------------|---------------|----------|
| `strict` | `false` | `true` | explicit `true` | ✅ ОК |
| `module` | `commonjs` для Node, `esnext` для bundler | `esnext` | explicit `esnext` | ✅ ОК |
| `target` | `es3` | `es2025` | explicit `es2017` | ⚠️ Сознательно оставляем ES2017 для совместимости. **Подтвердить с пользователем если стоит bump до ES2022.** |
| `noUncheckedSideEffectImports` | `false` | **`true`** ⚠️ | не задан | ⚠️ **НУЖНА миграция** — см. шаг 5.2 |
| `libReplacement` | `true` | `false` | не задан | ✅ performance-win |
| `rootDir` | inferred | `.` | не задан | ✅ нет output (noEmit: true) |

### 2.2 Самое критичное: `noUncheckedSideEffectImports: true`

Это **новый дефолт в TS 6** — ловит опечатки в side-effect imports (например `import './componnets.css'`).

**В нашем проекте нужно проверить:**

```bash
grep -rE "^import ['\"]\\." src --include="*.tsx" --include="*.ts" | grep -v "from "
```

Возможные проблемы:
- `import './globals.css'` → ✅ допустимо, валидно
- `import 'server-only'` (Next.js) → ✅ допустимо
- `import 'next/document'` в pages → ✅ допустимо
- Любая динамическая загрузка `.scss/.css` → ✅ допустимо

**Действие:** запустить после апгрейда, исправить опечатки.

### 2.3 DOM lib упрощение

`dom.iterable` теперь включён в `dom`. У нас в `lib` оба — TS 6 может выдать warning на дублирование.

**Действие:** убрать `dom.iterable` из массива `lib` (optional cleanup).

### 2.4 `this`-less inference

Функции без `this` теперь имеют приоритет в generic inference. **Может СУЗИТЬ** тип в arrow-functions внутри JSX.

**Типичные места риска:**

- `src/components/ui/*.tsx` — `onClick={() => doSomething()}` без явных типов
- `src/lib/api-wrapper.ts` — generic-constrained Handlers

**Низкая вероятность проблемы**, но если всплывёт — добавить explicit type параметры.

### 2.5 Новые API в lib (только знать)

- `Map.getOrInsert`, `Map.getOrInsertComputed` — у нас не используется, ОК
- `RegExp.escape` — у нас не используется, ОК
- `Temporal` namespace — у нас не используется, ОК

### 2.6 Compile performance & --stableTypeOrdering

`--stableTypeOrdering` — диагностический флаг, **замедляет** TSC до 25%. Применять только если видим non-deterministic errors.

**Действие:** НЕ включаем в production-config.

### 2.7 Вердикт по риску

🟡 **СРЕДНИЙ** — основные риски это:
1. `noUncheckedSideEffectImports: true` (новый дефолт, нужно явно отключить или пофиксить side-effect imports)
2. Возможное сужение типов в arrow-functions (5-10% вероятность хитов)
3. Prisma 7 + @types/react 19 + Zod 4 — нужна эмпирическая проверка через `tsc --noEmit`

---

## 3. Pre-flight checklist

```bash
# 3.1 Базовая тип-проверка проходит (baseline)
npx tsc --noEmit 2>&1 | tee /tmp/tsc-before.log
# Ожидаем: exit code 0, пустой stdout или только warnings

# 3.2 Текущая версия TS
npx tsc --version
# Ожидаем: Version 5.9.3

# 3.3 Все тесты passing
npx vitest run 2>&1 | tail -8
# Ожидаем: 64/64 ✓

# 3.4 Проверить side-effect imports в коде (потенциальная точка хита)
grep -rE "import ['\"]\\.|import ['\"]~/" src --include="*.tsx" --include="*.ts" | wc -l
# Посмотреть, сколько у нас side-effect imports (запомнить baseline)

# 3.5 Git clean
git status
# Working tree clean
```

**Если 3.1 или 3.3 проваливаются — не апгрейдить пока не починим baseline.**

---

## 4. Шаги миграции (пошагово)

### Шаг 4.1 — Branch + backup

```bash
git checkout -b chore/typescript-6-upgrade
git add -A
git commit -m "chore: pre-typescript-6 baseline"
```

### Шаг 4.2 — Bump version

В `package.json`:

```diff
-    "typescript": "^5",
+    "typescript": "^6.0.3",
```

### Шаг 4.3 — npm install

```bash
npm install
# или pnpm install / bun install
```

### Шаг 4.4 — Первый смоук тип-проверки

```bash
npx tsc --version
# Ожидаем: Version 6.0.3

npx tsc --noEmit 2>&1 | tee /tmp/tsc-after.log
```

**Анализ результата:**

- **0 ошибок** → ✅ сразу к шагу 4.7
- **1-10 ошибок в нашем коде** → правим вручную
- **10-50 ошибок** → крупный аудит, возможно откат
- **> 50 ошибок** → откат (см. раздел 6)

### Шаг 4.5 — Возможные категории ошибок и фиксы

#### Категория A: `noUncheckedSideEffectImports`

Если вылезли ошибки вида "Relative import paths don't have file extensions" или "Cannot resolve side-effect import":

**Опция 1** (быстрый фикс): добавить в `tsconfig.json`:
```json
"noUncheckedSideEffectImports": false
```

**Опция 2** (правильный фикс): добавить `.js` или `.css` к import:
```ts
import './globals.css' → import './globals.css'  (уже правильно)
```

Для Next.js проекта опция 1 разумна — Webpack/Vite всё равно обрабатывают CSS imports.

#### Категория B: arrow-function type narrowing

Если вылезли ошибки вида "Argument of type X is not assignable to parameter of type Y":

**Фикс:** добавить explicit type:
```ts
// было
const handleClick = () => doSomething(event)
// стало
const handleClick = (e: React.MouseEvent) => doSomething(e)
```

#### Категория C: Prisma 7 / Zod 4 type compatibility

Если Prisma или Zod типы вдруг репортят ошибку:

**Опция 1:** `npm update prisma @prisma/client` (получить патч-версию с фиксами)
**Опция 2:** `skipLibCheck: true` уже есть — должен защищать

### Шаг 4.6 — Audit tsconfig (опционально, для дальнейшей чистоты)

Если всё работает, можно сделать мелкий cleanup:

```diff
-    "target": "ES2017",
+    "target": "ES2022",                     // optional bump
     "lib": ["dom", "dom.iterable", "esnext"],
-    "lib": ["dom", "dom.iterable", "esnext"],
+    "lib": ["dom", "esnext"],                // убрать redundant
```

⚠️ **ESLint 10 ещё не умеет читать `target` ES2022 + bundler module правильно в Edge Runtime** — нужно проверить `npm run build`.

### Шаг 4.7 — Полная валидация

Параллельно:

```bash
# Typecheck
npx tsc --noEmit 2>&1 | head -50

# Tests
npx vitest run 2>&1 | tail -10

# Lint (если уже ESLint 10)
npm run lint 2>&1 | tail -10

# Build
npm run build 2>&1 | tail -30
```

**Все четыре должны быть чистыми.**

### Шаг 4.8 — Commit + merge

```bash
git add -A
git commit -m "chore(deps): upgrade typescript 5.9 → 6.0

- Bump typescript dependency
- Add noUncheckedSideEffectImports: false (Next.js bundler-handles CSS)
- Fix N new tsc errors in arrow-function generics
- Verified: tsc ✓, vitest 64/64 ✓, eslint ✓, build ✓"

git checkout main
git merge chore/typescript-6-upgrade

# Audit log
echo "## Цикл №12 (TS 6 upgrade): ✅" >> audit-log.md
echo "- TS 5.9.3 → 6.0.3" >> audit-log.md
echo "- TSC: 0 errors, tests 64/64, build ✓" >> audit-log.md
git add audit-log.md && git commit -m "docs: TS 6 upgrade cycle log"
```

---

## 5. Ожидаемые регрессии и как с ними жить

| Сценарий | Вероятность | План |
|----------|-------------|------|
| 0 изменений кода | 60% | ✅ коммит с одним только bump |
| 1-5 ошибок в arrow-functions | 20% | ручной fix |
| 5-15 ошибок связанных с side-effect imports | 10% | добавить `noUncheckedSideEffectImports: false` |
| Prisma 7 или Zod 4 типы ломаются | < 5% | bump patch-версии или `skipLibCheck` workaround |
| Build ломается (target/module mismatch) | < 5% | bump до ES2022 или откат |
| Коренная поломка (> 50 errors) | < 2% | откат к TS 5.9 |

**Стратегия:** идём по шагам 4.4-4.7. На любом этапе "красной" валидации — см. раздел 6 (Rollback).

---

## 6. Rollback план

### Быстрый откат

```bash
# Откатить коммит
git reset --hard HEAD~1

# Или, если коммит уже в main
git revert HEAD
git push origin main --force-with-lease

# Переустановить TS
npm install typescript@^5.9.3 -D
npx tsc --version  # Version 5.9.3
```

### Полная очистка

```bash
git checkout main
git branch -D chore/typescript-6-upgrade
```

**Откат тривиальный** — TS это 1 строка в `package.json` + lockfile.

---

## 7. Что НЕ меняется в этом апгрейде

✅ НЕ меняются зависимости вне `typescript` (eslint, prisma, zod — отдельно если надо)
✅ НЕ меняются 74 `Record<string, unknown>` паттернов (стабильны)
✅ НЕ ломается компиляция Next.js (Next 16 использует SWC для transpile, TSC — только для typecheck)
✅ НЕ меняется runtime API Node.js (только types)
✅ НЕ добавляются/удаляются зависимости

---

## 8. Файлы под специфическим аудитом после апгрейда

После `npx tsc --noEmit` стоит обратить внимание на:

### 8.1. Файлы с `as unknown as`

- `src/lib/db.ts:5` — Prisma 7 типы должны поддерживать
- `src/lib/pdf/index.ts:343,511,636` — jsPDF internals, ожидается warning
- `src/app/(dashboard)/products/client.tsx:33` — node-assert типа

**Если появились ошибки:** заменить на конкретные типы или явные interface declarations.

### 8.2. Файлы с `as any[]`

- `src/app/(dashboard)/{warehouse,proposals,production,products,contracts,organizations,clients,admin/tenders}/page.tsx`

Это **известные 9 серверных компонентов** где данные передаются в Client Components. `as any[]` — известный анти-pattern, **рекомендую рефакторинг в следующем цикле** (не блокирует TS 6).

### 8.3. Next.js type generation

`tsconfig.json` включает `.next/types/**/*.ts` — это auto-generated типы Next для роутов. **Важно:** после апгрейда запустить `npm run build` чтобы Next регенерировал типы.

### 8.4. Prisma client

@prisma/client v7 имеет свои bundled типы. Если появились ошибки на типах Prisma — `npx prisma generate` для пере-генерации.

---

## 9. Open Questions для пользователя

Перед стартом желательно уточнить (дефолты:

1. **Bump `target` ES2017 → ES2022** в этом же цикле или отдельной задачей?  
   **Дефолт: НЕТ, оставить ES2017 (минимальное изменение).**

2. **Отключить `noUncheckedSideEffectImports` явно** или фиксить side-effect imports?  
   **Дефолт: ОТКЛЮЧИТЬ (один флаг, безопаснее, Next.js уже обрабатывает CSS imports).**

3. **Рефакторинг 9 `as any[]` в server-pages** — оставить на потом или сделать сейчас?  
   **Дефолт: ПОТОМ (отдельный PR).**

4. **Bump `typescript-eslint` явно** (для ESLint 10 совместимости)?  
   **Дефолт: НЕТ, транзитивный работает.**

5. **Стратегия для build (Next 16)** — подтвердить через `npm run build` или это вне scope?  
   **Дефолт: ПОДТВЕРДИТЬ (build обязателен для финальной валидации).**

6. **Стоит ли ждать TS 6.0.4+** (после первых bugfix-релизов)?  
   **Дефолт: НЕТ, 6.0.3 достаточно стабилен.**

---

## 10. Финальный чеклист успеха

- [ ] `npx tsc --version` → `Version 6.0.3`
- [ ] `npx tsc --noEmit` → 0 ошибок (или явные handled через explicit flags)
- [ ] `npx vitest run` → 64/64 passing
- [ ] `npm run build` → success
- [ ] `npm run lint` → exit 0 (если ESLint 10 уже апгрейднут)
- [ ] Изменения в `package.json` только `"typescript": "^5" → "^6.0.3"`
- [ ] Опционально: `"noUncheckedSideEffectImports": false` в tsconfig (1 строка)
- [ ] Опционально: убрать `dom.iterable` из `lib` (1 строка)
- [ ] audit-log.md обновлён (Цикл №12)
- [ ] git tree clean перед merge в main

---

## 11. Timeline

| Шаг | Время |
|-----|-------|
| Pre-flight (baseline checks) | 5 мин |
| npm install | 30 сек |
| Первый tsc | 30 сек |
| Аудит ошибок и фиксов | 30-90 мин |
| Полная валидация | 2 мин |
| Commit + merge + audit-log | 3 мин |
| **Итого** | **~45-100 мин** |

---

## 12. Совместимость с экосистемой

| Пакет | Текущая | Ожидаемая совместимость с TS 6 |
|-------|---------|-------------------------------|
| `next` | 16.2.9 | ✅ полная (Next 16 SWC + TSC) |
| `@types/react` | ^19 | ✅ полная |
| `@types/node` | ^20 | ✅ полная |
| `prisma` + `@prisma/client` | 7.8.0 | ✅ полная (Prisma 7 JSON schemas) |
| `zod` | 4.4.3 | ✅ полная (улучшение inference) |
| `vitest` | 4.1.9 | ✅ полная (vitest 4 written in TS) |
| `tailwindcss` | 4 (CSS only) | n/a |
| `eslint-config-next` | 16.2.9 | ✅ полная |
| `bcryptjs`, `jsonwebtoken`, `cookies-next` | various | ✅ имеют @types |

---

## 13. Готовность

Документ полный. Можно приступать.

**Скажи "TS 6 поехали"** — запущу Шаг 3 (pre-flight) и пойду по шагам 4.1-4.8.

Если хочешь сначала обсудить Open Questions — давай.
