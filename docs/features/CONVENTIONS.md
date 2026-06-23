# 🧱 Modular Monolith Conventions — kppdf-5.0

> **Дата принятия**: 2026-06-23
> **Версия**: 1.0 (initial)
> **Статус**: accepted (см. ниже про monorepo deferred)
> **Связанное решение**: отказ от Turborepo + packages/* split на текущем масштабе (`Solo + 2 AI агента`).

---

## 1. Решение

Физическое разделение проекта на `packages/*` через Turborepo + npm workspaces **откладывается** до наступления **одного из триггеров**:

1. Появляется второе приложение, переиспользующее Prisma + UI kit (клиентский портал / mobile app).
2. Внедряется CI/CD с параллельными джобами (Turbo-cache срежет 15→2 мин).
3. Команда вырастет до 3+ живых разработчиков.

**До этого** используем **Modular Monolith**: логические фичи внутри существующего `src/`, границы через TS path aliases + ESLint rules + barrel exports.

---

## 2. Структура

```
src/
├── app/                          # Next.js routes (физические URL)
├── components/
│   ├── ui/                       # shared UI kit (cn, cva, Radix-based)
│   ├── layout/                   # общие layout компоненты
│   ├── skeletons/                # loading states
│   └── proposal-editor/          # ✅ feature folder (cycle 44-47) — reference pattern
├── features/                     # 🆕 canonical home для крупных фич
│   └── <feature>/
│       ├── index.ts              # PUBLIC barrel export — обязательный
│       ├── public/               # явно публичные sub-модули (опционально)
│       └── <internal>...         # private — не импортировать извне
├── lib/
│   ├── shared/                   # 🆕 переиспользуемые pure helpers
│   ├── validations/              # Zod-схемы (уже есть)
│   ├── constants/                # константы domain (статусы и т.п.)
│   ├── <feature>/                # pure-функциональные модули фичи (если без UI)
│   └── <single-file helpers>     # jwt, db, env, status-workflow, etc.
├── hooks/                        # shared React hooks
├── stores/                       # Zustand stores
└── types/                        # общие TypeScript типы
```

---

## 3. Когда создавать `src/features/<name>/`

**Создавай feature folder** когда модуль удовлетворяет **≥2** из:

- Имеет собственный **UI компонент и логику** (Page + Form + Hook + Helper).
- Используется изолированно (не пробрасывается через всю app).
- Имеет **≥3 файлов** в одной тематике (правки в одной папке случаются чаще, чем по всему `src/`).
- Будет расти со временем (≥10 файлов через 2-3 месяца).

**Примеры кандидатов** (когда будут зрелые):

| Фича | Текущее состояние | Целевая папка |
|------|-------------------|---------------|
| Редактор шаблонов документов | `src/components/ui/{a4-canvas,a4-page,block-dialogs,block-editor,sortable-block}.tsx` (5 файлов в ui/, неправильно с точки зрения cohesion) | `src/features/templates-editor/` |
| Производство — Gantt + tasks | `src/components/ui/gantt-chart.tsx` + `src/app/(dashboard)/production/*` | `src/features/production/` (UI) + `src/lib/production/` (helpers) |
| Склад — KPI + закупки + отгрузки | `src/app/(dashboard)/warehouse/*` (5 секций) | `src/features/warehouse/` + существующий `src/lib/warehouse/` (auto-receive-finished-goods.ts уже там) |

**НЕ создавай** features/ для:

- Одиночных helpers (живут в `src/lib/<name>.ts` — в порядке).
- Универсальных UI-китов (в `src/components/ui/`).
- Tier A/B стабильных модулей (`jwt.ts`, `pdf/index.ts`) — их **нельзя перемещать**, см. `STABLE-MODULES.md`.

---

## 4. Barrel Export Pattern (обязательный)

Каждая фича **должна** иметь `index.ts` на верхнем уровне:

```ts
// src/features/<name>/index.ts
// PUBLIC API этой фичи. Только то, что реально нужно другим фичам.

export { MyComponent } from './components/my-component';
export { useMyHook } from './hooks/use-my-hook';
export { myHelper } from './lib/my-helper';
export type { MyType } from './types';

// НЕ реэкспортируй private утилиты, internal hooks, test helpers.
```

**Импорт из фичи — только через barrel**:

```ts
// ✅ Правильно
import { MyComponent, useMyHook } from '@/features/my-feature';

// ❌ Неправильно (запрещено ESLint правилом)
import { MyComponent } from '@/features/my-feature/components/my-component';
import { useMyHook } from '@/features/my-feature/hooks/use-my-hook';
```

ESLint правило `no-restricted-imports` (см. `eslint.config.mjs`) **warn'ит** на глубоких импортах между фичами. После cycle 61 — будет **error**.

---

## 5. TypeScript Path Aliases

Добавлены в `tsconfig.json`:

```json
"paths": {
  "@/*":        ["./src/*"],
  "@/features/*": ["./src/features/*"],
  "@/shared/*":   ["./src/lib/shared/*"]
}
```

И в `vitest.config.ts` соответствующие alias'ы.

**Convention**:

| Alias | Когда использовать | Пример |
|-------|---------------------|---------|
| `@/...` | Default — для всего в `src/` | `import { prisma } from '@/lib/db'` |
| `@/features/...` | Явно подчеркивает cross-feature импорт | `import { Editor } from '@/features/proposals-editor'` |
| `@/shared/...` | Из `@/lib/shared/` (pure helpers) | `import { cn } from '@/shared/utils'` |

**Антипаттерн**: `@/features/X/internal/Y` — нарушает 4.

---

## 6. ESLint Boundaries

`eslint.config.mjs` содержит warn-уровень `no-restricted-imports`:

```js
"no-restricted-imports": ["warn", {
  patterns: [{
    group: ["@/features/*/*"],
    message:
      "Modular Monolith: import через '@/features/<name>' (barrel). " +
      "Глубокие файлы — private API фичи.",
  }],
}]
```

**NB**: Это правило начинает работать, **только когда фичи созданы**. До cycle 59 — нет `src/features/` folder → правило ничего не запрещает. После первого feature — запрещает deep-импорты из других фич.

**Почему только один pattern**: ESLint's `no-restricted-imports` использует gitignore-style glob, который не поддерживает extglob negation (`!(index|public)`). Поэтому вместо whitelist @/features/X/{index,public} с запретом всего остального, мы запрещаем ЛЮБОЕ под-путь глубже одного сегмента `@/features/X/*` — пользователю выгоднее написать bare barrel `@/features/X` (которое тоже резолвится в index.ts).

---

## 7. Migration Path (постепенная, без breaking changes)

Этапы конвертации существующих модулей в features (если/когда выгодно):

| # | Действие | Трудозатраты | Риск |
|---|----------|--------------|------|
| 1 | Создать папку `src/features/<name>/`, перенести файлы из `components/ui/` или `lib/`. | M | S — только перемещение, импорты обновляются через find-replace. |
| 2 | Написать barrel `index.ts`. | S | 0 |
| 3 | Заменить все импорты `../components/ui/X` → `@/features/<name>` (barrel) ВНУТРИ фичи. | S | S — если barrel реэкспортирует X. |
| 4 | Аналогично обновить импорты ВНЕ фичи. | M | M — может быть N файлов-потребителей. |
| 5 | Promote ESLint rule to **error** (после первого feature). | XS | 0 |
| 6 | Удалить пустой старый `src/components/ui/X` или `src/lib/X` файл. | XS | 0 |

**Abort condition**: если на этапе 4 изменения затрагивают **>30 файлов** или требуют **>2 PR** — откатись и оставь модуль в старом месте. Конвертация должна быть **low-cost или нулевая**.

---

## 8. Антипаттерны (не делать)

1. **❌ God-module в `src/features/`** — features не должны экспортировать >50 symbols. Если больше — разбей на под-features.
2. **❌ Cross-feature private access** — фича A не должна импортировать private helpers фичи B. Создай новый shared helper в `src/shared/` или `src/lib/` вместо этого.
3. **❌ Рекурсивный barrel re-export** (`'./deep/path'` → index → index → ...) — компилируется, но скрывает фактическую структуру.
4. **❌ Feature в `src/components/ui/`** — UI-кит это **визуальные атомы**, не бизнес-фичи. Бизнес-фичи живут в `src/features/`.
5. **❌ Side-effects в barrel `index.ts`** — никаких `import './styles.css'` в корне feature. Вынеси в явный bootstrap.

---

## 9. Tier A/B взаимодействие

`STABLE-MODULES.md` замораживает пути к:

- `src/lib/jwt.ts` (Tier A)
- `src/lib/pdf/index.ts` (Tier B)

**Эти файлы НЕ переносятся в `src/features/`** — даже если кажется, что логически они вписываются в feature. Их импорты остаются `@/lib/jwt`, `@/lib/pdf`.

**Новый feature import'ит Tier A/B**:

```ts
// src/features/<name>/lib/private-ops.ts
import { signAccessToken } from '@/lib/jwt';        // ✅ разрешено (Tier A public API)
import { cn } from '@/shared/utils';                // ✅ разрешено
// import { internal-jwt } from '@/lib/jwt/internal' // ❌ запрещено (Tier A private)
```

---

## 10. Когда переходить на monorepo

Пересмотри этот документ при:

- `src/features/` > 10 активных фич, каждая ≥30 файлов.
- Появилось 2-е приложение (mobile, admin portal).
- Команда ≥3 живых разработчиков.
- CI/CD с >5 параллельными джобами.

До этого: **Modular Monolith внутри `src/` + ESLint boundaries = best fit для текущего масштаба**.

---

## 11. Changelog

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 2026-06-23 | Initial. Aliases добавлены, ESLint rule мягкий (warn), документ создан. |
