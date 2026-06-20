# План задач по результатам совместного аудита kppdf-5.0

**Дата**: 2026-06-20 (обновлено после верификации стека)
**Источник**: [`discussion.md`](./discussion.md) — раунды 1 и 2, ERRATA, финальный консенсус.
**Участники**: Агент A (Критик-Архитектор), Агент B (Рецензент-Исполнитель).
**Контекст**: цикл 39 (2026-06-20) — M5 закрыт. cycle 40 (2026-06-20) — Block 1.3 (env.ts) закрыт. ERRATA-коррекция уточнила реальный стек.

---

## 📊 Прогресс (cycles 39-50)

| Цикл | Блок | Статус |
|------|------|--------|
| 39 | M5 — auth/jwt развязка | ✅ DONE |
| 40 | 1.3 — `src/lib/env.ts` consolidation | ✅ DONE |
| 41 | 5.1 — PDF table page-break + footnote header | 📋 planned |
| 41 | 5.2 — Latin overflow в `legalAddress` | 📋 planned |
| 42-43 | 3.2 — Версионирование КП + `sourceItemId` | 📋 planned |
| 44-45 | 🆕 3.1 — `ProposalEditor` refactor (architectural) | 📋 planned |
| 46-47 | 4.1 — Proposal editor 3-panel UX | 📋 planned |
| 48-49 | 6.1 — Tests isolation / in-memory mock prisma | 📋 planned |
| 50 | 7.1 — Zustand refresh TTL + silent refresh preempt | 📋 planned |

**Завершено**: 2/9 пунктов (M5 + env.ts). **Осталось**: 7 пунктов.

---

## ⚠️ ERRATA: реальный стек проекта (после cycle 39 верификации)

После проверки реальных файлов (`src/lib/db.ts`, `prisma/schema.prisma`, `package.json`)
оказалось, что первоначальное описание стека содержало неточность:

| Утверждение (было) | Реальность | Источник |
|--------------------|------------|----------|
| Prisma 6 + SQLite (better-sqlite3) | **Prisma 7.8.0 + PostgreSQL production** (через PrismaPg driver adapter); `@prisma/adapter-better-sqlite3` установлен как **альтернативный** adapter, но НЕ используется в `db.ts` | `package.json:dependencies`, `prisma/schema.prisma:5` |
| `db.ts` содержит deprecated `datasourceUrl` | `db.ts` использует **современный Prisma 7 паттерн**: `PrismaPg` driver adapter + `new PrismaClient({ adapter })`. НЕ требует правок | `src/lib/db.ts:1-12` |

**Из этого следует**:
- M5 закрыт через **jwt.ts decoupling** (cycle 39) — НЕ через adapter migration.
- Дополнительных правок в `db.ts` не требуется.
- Нижестоящие блоки плана (40–50) **не зависят** от выбора DB adapter.

---

## Рекомендуемый порядок выполнения

### ✅ 0. M5 — Развязка auth/jwt (ВЫПОЛНЕНО в cycle 39)

**Приоритет**: High (был)
**Сложность**: S
**Статус**: ✅ DONE — `tsc 0`, `vitest 88/88` (6/6 suites), `lint 0` (3 cosmetic warning)
**Реальное содержимое**:
- `src/lib/jwt.ts` создан: pure JWT helper (`signAccessToken`, `signRefreshToken`, `verifyToken`).
- `src/lib/auth.ts` обновлён: JWT-код удалён, импорт из `jwt.ts` (workaround под `verbatimModuleSyntax: true`).
- `src/lib/__tests__/auth.test.ts` обновлён: импорт `'../jwt'` (разрывает side-effect chain).
- `src/lib/db.ts` НЕ ТРОНУТ — `PrismaPg` адаптер уже корректен.

---

### ✅ 1. Block 1.3 — `src/lib/env.ts` consolidation — ЗАВЕРШЁН

**Приоритет**: Low
**Сложность**: S
**Цикл**: 40
**Статус**: ✅ COMPLETED (cycle 40, 2026-06-20). Подробности см. в [`tasks/current-task.md`](tasks/current-task.md) (раздел `=== РЕЗУЛЬТАТ ===`) и [`audit-log.md`](audit-log.md) (запись cycle 40).
**Связь с discussion**: Round 2 (А + Б standalone после M5)

**Проблема**:
- Паттерн `process.env.NODE_ENV === 'production'` разбросан минимум в 3 местах (`next.config.ts`, `src/lib/db.ts:14`, компоненты).
- `process.env.NEXT_PUBLIC_BASE_URL` тоже дублируется.

**Решение** — создать `src/lib/env.ts`:
```ts
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
```
+ ESLint rule `no-restricted-syntax` запрещает прямой `process.env.NODE_ENV` в src/.

**AC**:
- Все `process.env.NODE_ENV === 'production'` → `isProd`.
- ESLint rule активен.
- tsc/vitest/lint 0.

---

### 📋 2. Block 5.1 + 5.2 — PDF table page-break + Latin overflow (ОДИН ЦИКЛ, ОДИН PR)

**Приоритет**: High (5.1) + Low (5.2)
**Сложность**: M / S
**Цикл**: 41
**Связь с discussion**: Round 2 (А + Б)

**Проблема** (`src/lib/pdf/index.ts:343/530/654`):
- Три вызова `autoTable(...)` без page-break контроля.
- `legalAddress` может overflow для юрлиц с 500+ char адресом.

**Техника (5.1)**:
- **Основной путь**: `autoTable` с `didDrawCell` / `willDrawCell` — гранулярный контроль.
- **Резервный manual loop** (~30% вероятность): прямой row-by-row с расчётом `y + rowHeight`.
- Header следующей страницы: «Продолжение таблицы стр. N+1» (НЕ footer).
- Header таблицы повторяется на каждой странице.

**Техника (5.2)**:
```ts
const addrLines = doc.splitTextToSize(org.legalAddress, contentW);
if (y + addrLines.length * lineHeight > PAGE_H - MARGIN) {
  doc.addPage(); y = MARGIN_TOP;
}
```

**AC**:
- КП с 30+ позициями без overflow (proposal/contract/invoice).
- «Продолжение таблицы стр. N+1» в header каждой стр. N+1+.
- Юрлица с 600+ char legalAddress без overflow.

---

### 📋 3. Block 3.2 — Версионирование КП

**Приоритет**: Medium
**Сложность**: L
**Цикл**: 42-43
**Связь с discussion**: Round 2 (А предлагает, Б принимает + индекс)

**Schema правки** (`prisma/schema.prisma`):
```prisma
model Proposal {
  // existing fields...
  parentProposalId String?
  parentProposal   Proposal?  @relation("ProposalVersions", fields: [parentProposalId], references: [id])
  childVersions    Proposal[] @relation("ProposalVersions")
  version          Int        @default(1)   // default хватает для existing records
  supersededAt     DateTime?
}

model ProposalItem {
  // existing fields...
  sourceItemId String?
  sourceItem   ProposalItem?  @relation("ItemLineage", fields: [sourceItemId], references: [id])
  derivedItems ProposalItem[] @relation("ItemLineage")

  @@index([sourceItemId])
}
```

**Helper `cloneProposalItems(items, parentVersionId?)`** — копирует `ProposalItem` +
связанные `ProposalItemPhoto[]` (если есть в schema) + связанные компоненты. Используется
в API `/api/proposals/[id]/version` и в editor.

**AC**:
- Existing КП получают `version: 1` через Prisma default.
- Новая версия: soft delete (`supersededAt`) + новый row с `parentProposalId`, `version + 1`.
- Items deep-copy: photos + components копируются, `sourceItemId` указывает на original.
- `@@index([sourceItemId])` применён.
- Audit-log: «v4.0: Proposal versioning».

---

### 📋 4. 🆕 Block 3.1 — `ProposalEditor` refactor (architectural)

**Приоритет**: Medium
**Сложность**: M
**Цикл**: 44-45
**Связь с discussion**: Round 2 (А уточняет: НЕ DRY, а architectural improvement)
**Зависимость**: НЕТ. Но нужен для Block 4.1.

**Почему**:
- `proposals/new/page.tsx` (607 строк) — монолит, трудно тестировать и расширять.
- Подготовка к будущему "edit existing КП" (НЕ viewer, а именно edit mode).
- Упрощает Block 4.1 (3-panel UX требует общего компонента).

**Решение**:
- Выделить `<ProposalEditor initialProposal? mode="new|edit" onSave onCancel />` в `src/components/proposal-editor.tsx`.
- `proposals/new/page.tsx` → тонкая обёртка (<100 строк).
- `proposals/[id]/page.tsx` (viewer) НЕ трогаем.
- Future `proposals/[id]/edit/page.tsx` (НЕ в этом блоке — позже).

**AC**:
- `src/components/proposal-editor.tsx` существует.
- `proposals/new/page.tsx` <100 строк.
- Editor поведение не меняется (визуально идентично).

---

### 📋 5. Block 4.1 — Proposal editor 3-panel UX

**Приоритет**: Medium
**Сложность**: M
**Цикл**: 46-47
**Зависимость**: Block 3.1 (refactor)

**Решение**:
- **Сначала dev-прототип** в `src/app/playground/proposal-editor-3panel/page.tsx`.
- Три resizable панели (рекомендуется `react-resizable-panels`): левая (товары), центр (preview), правая (config).
- LocalStorage save пропорций.
- После design review с пользователем — миграция `proposals/new/page.tsx` + будущего `proposals/[id]/edit/page.tsx` на 3-panel.

**AC**:
- Прототип доступен в dev через `/playground/proposal-editor-3panel`.
- Resizable, пропорции сохраняются.
- Live preview обновляется при изменении товаров.

---

### 📋 6. Block 6.1 — Тесты дальнейшая изоляция

**Приоритет**: Low
**Сложность**: M
**Цикл**: 48-49

**Решение**:
- Audit-grep: ни один test suite не импортирует `db.ts` напрямую.
- Integration suite: helper `mockPrisma()` на основе Prisma 7 driver adapter API (pg in-memory или ephemeral SQLite per test).
- Test-gate гарантирует tsc + vitest green на всех PR.

**AC**:
- Уже сделано: `auth.test.ts` импортирует только `jwt.ts`.
- Все vitest suites изолированы.
- Integration suite покрывает минимум 5 API endpoints.

---

### 📋 7. Block 7.1 — Zustand refresh TTL + silent refresh preempt

**Приоритет**: Low
**Сложность**: S
**Цикл**: 50

**Решение**:
- Добавить `expiresAt: number` в `auth-store.ts` (timestamp из JWT `payload.exp * 1000` — **access token**, не refresh).
- При загрузке: `Date.now() > expiresAt && user` → logout или silent refresh.
- **Silent refresh preempt**: за 60 сек до `expiresAt` → `POST /api/auth/refresh` в фоне.
- Manual logout vs session expired: различается через UI toast.

**AC**:
- После 7 дней бездействия → auto redirect на `/login`.
- Silent refresh за 60 сек до expiresAt.
- UI различает manual logout vs session expired.
- Audit-log: «v4.x: Auth client TTL + silent refresh preempt».

---

## Резюме

| # | Блок | Приоритет | Сложность | Цикл |
|---|------|-----------|-----------|------|
| 0 | M5 — auth/jwt развязка | High (DONE) | S | 39 ✅ |
| 1 | 1.3 — env.ts consolidation | Low | S | 40 |
| 2 | 5.1+5.2 — PDF page-break + Latin | High/Low | M/S | 41 |
| 3 | 3.2 — Версионирование КП + sourceItemId | Medium | L | 42-43 |
| 4 | 🆕 3.1 — ProposalEditor refactor | Medium | M | 44-45 |
| 5 | 4.1 — Proposal editor 3-panel UX | Medium | M | 46-47 |
| 6 | 6.1 — Tests isolation / integration | Low | M | 48-49 |
| 7 | 7.1 — Zustand refresh TTL + silent preempt | Low | S | 50 |

**Примерное количество циклов**: ~12 (с ревью и валидацией каждого блока).

## Что изменилось после ERRATA

| Что было | Что стало | Источник |
|----------|-----------|----------|
| Стек: Prisma 6 + SQLite | Prisma 7.8.0 + PostgreSQL (с `better-sqlite3` как альтернативой) | verification after cycle 39 |
| M5: синтаксический fix `datasourceUrl` | M5: jwt.ts decoupling (независимо от adapter) | cycle 39 audit-log |
| Round 1 Agent A: некорректное описание стека | Исправлено в ERRATA section + обновлено Round 1 / Agent A | эту коррекцию |

**Логический вывод дискуссии валиден** — все 9 пунктов плана правильные, единственная ошибка была в текстовом описании стека (исправлено).

---

**Эти задачи можно брать в работу. Они являются результатом совместного аудита и одобрены обоими агентами.**
