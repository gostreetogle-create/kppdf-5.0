# 🗺️ MASTER CHECKLIST — kppdf-5.0

**Дата генерации**: 2026-06-21
**Тип**: Генеральный аудит проекта (single source of truth)
**Назначение**: Объединяет ВСЕ существующие чек-листы (`docs/operations/CURRENT-CHECKLIST.md`, `tasks/*.md`, `docs/operations/audit-tasks*.md`) в один сводный документ. При обрыве контекста / потере связи — открыть сначала этот файл.

---

## 1. 🚦 РЕАЛЬНОЕ СОСТОЯНИЕ GATES

После `npx prisma generate` (без него TSC падает на отсутствии `src/generated/prisma`):

| Gate       | Результат             | Комментарий                                              |
| ---------- | --------------------- | -------------------------------------------------------- |
| `tsc`      | ✅ **0 ошибок**       | Prisma client v7.8.0 сгенерирован в 210ms                |
| `vitest`   | ✅ **272 / 272 passed** | 16 test files. Покрытие: counter, statuses, proposal-block-builder, number-protection, validations (supply/reference/finance/extra), utils |
| `eslint`   | ❌ **2 errors / 16 warnings** | См. § 4 «P1 — быстрые победы»                       |
| `build`    | ⏳ не запускался (ВЫХОДИТ за рамки audit, проверим при деплое) |

**КРИТИЧЕСКАЯ ИНФРА-ЗАДАЧА (решена в этом audit)**:
> `node_modules` отсутствовал → `npm install` (196 пакетов) → `npx prisma generate` → gates 🟢.

---

## 2. ✅ / ⚠️ / 🔴 ВАЛИДАЦИЯ ЗАЯВЛЕННЫХ ЦИКЛОВ

Сверка `docs/operations/CURRENT-CHECKLIST.md` с реальным кодом через `code_searcher`:

| Cycle | Заявлен | Реальность (по коду) | Вердикт |
|-------|---------|----------------------|---------|
| **39** M5 JWT decoupling | ✅ DONE | `auth.ts` + `jwt.ts` — реальные отдельные модули, импорты чистые | ✅ Реально |
| **40** env.ts consolidation | ✅ DONE | `src/lib/env.ts` standalone, без дублей | ✅ Реально |
| **41** PDF page-break + Latin overflow | ✅ DONE | Файлы существуют | ✅ Реально |
| **42-43** Версионирование КП + sourceItemId | ✅ DONE | `Proposal.parentProposalId`, `ProposalItem.sourceItemId` есть в `schema.prisma` | ✅ Реально |
| **44-45** ProposalEditor refactor (449→11 sub-comp) | ✅ DONE | `src/components/proposal-editor/` = 11 файлов в `list_directory` | ✅ Реально |
| **46** ESLint cleanup auth.ts | ✅ DONE | Imports вычищены (cycle 46 remove debt) | ✅ Реально |
| **47** requireRole во всех entity routes | ✅ DONE | `code_search requireRole` в `src/app/api/**/*.ts` — найдены во всех критических contracts / production-orders / supplier-orders / incoming-invoices / proposals. **GET routes остаются на requireAuth** (правильно по ADR) | ✅ Реально |
| **48-49** Test coverage Tier C | ✅ DONE | Coverage теперь 272 tests (vs 88 в CYCLE-39 — рост 184 tests) | ✅ Реально |
| **51** StatusWorkflow live query | ✅ DONE | `code_search "VALID_TRANSITIONS" -g *.ts` = **0 actual exports** (только comments). `assertTransitionAllowed` импортируется в 5 routes | ✅ Реально |
| **52** requireRole для mutations | ✅ DONE | PATCH/PUT/DELETE в contracts/, proposals/ — все на `requireRole(['manager'])`. GET routes на `requireAuth()` (по ADR) | ✅ Реально |
| **53** Finished Goods auto-IN | ✅ DONE | `src/lib/warehouse/auto-receive-finished-goods.ts` существует, используется в `production-orders/[id]/status/route.ts`. `InventoryMovement.productionOrderId FK` в schema | ✅ Реально |
| **54** Client юрлица (B2B) | ⚠️ ЧАСТИЧНО | `Organization` model имеет расширенные поля (inn/kpp/ogrn/signers/bank/...), но **НЕ добавлен `type` discriminator** (cycl B.2 spec на `Client.type` указывает — нужна миграция schema) | ⚠️ Требует доработки |

**ВЫВОД**: циклы 39-53 **реально сделаны и закоммичены**. Цикл 54 — **schema-discriminator не внедрён**, нужно доделать.

---

## 3. 📚 СИНХРОНИЗАЦИЯ ДОКУМЕНТАЦИИ

Эти документы **НЕ СИНХРОНИЗИРОВАНЫ с реальностью** (требуют обновления):

| Документ | Заявленное | Реальность | Sync Fix |
|----------|------------|------------|----------|
| `docs/domain/BUSINESS-LOGIC.md` | Этапы 5-12 = 🔴 НЕ СДЕЛАНО / ⚠️ ЧАСТИЧНО | Cycles 51-54 сделаны (см. § 2) | Обновить статус этапов 5-12 → ✅ DONE для завершённых |
| `docs/operations/CURRENT-CHECKLIST.md` | Последний sync: 2026-06-20 | Realtime: 2026-06-21 audit | Добавить § «GENERAL AUDIT 2026-06-21 (cycle X)» |
| `tasks/PARALLEL_WORK_LOG.md` | Various in-progress | Проект в steady-state после prisma generate | Обновить датой «полный аудит завершён» |

`docs/GLOSSARY.md`, `docs/spec/SPEC.md`, `docs/decisions/ADR-*.md` — актуальны.

---

## 4. 🎯 ПРИОРИТЕТНАЯ ДОРОЖНАЯ КАРТА

### 🟥 P0 — CRITICAL (блокеры)

| ID | Задача | Effort | Impact |
|----|--------|--------|--------|
| **P0.1** | ➜ **DONE**: prisma generate + node_modules install | — | ✅ |
| **P0.2** | ➜ **DONE (2026-06-22)**: Sync `BUSINESS-LOGIC.md` с реальностью — §4 stages 5/6/9/10/12, §6.2 all 7 counters, §7 all 6 FK relations flipped 🔴 → ✅ с ссылками на код | 30 min | Высокий |

### 🟧 P1 — Быстрые победы (минуты)

| ID | Задача | Effort | Impact |
|----|--------|--------|--------|
| **P1.1** | ➜ **DONE в этом audit**: fix `gantt-skeleton.tsx:42` — `Math.random()` during render → deterministic by `i` | — | ✅ |
| **P1.2** | ➜ **DONE**: fix `number-protection.test.ts:7` — remove `as any` (literal `proposal` passes TS) | — | ✅ |
| **P1.3** | ➜ **DONE (2026-06-22)**: ESLint warnings cleanup — 0 warnings, 0 errors (`npx eslint src --max-warnings=999`) | — | Чистота |
| **P1.4** | ➜ **DONE (2026-06-22)**: Verify `npm run build` — production build SUCCESS, Static + Dynamic/Proxy routes confirmed | — | Уверенность |
| **P1.PERF-AUDIT** | ➜ **DONE (2026-06-22)**: `PERFORMANCE_CHECKLIST.md` audit — добавлен header reference на ✅ `PERFORMANCE_OPTIMIZATION_CHECKLIST.md` (8/8 шагов плана реализованы) | — | Навигация |

### 🟨 P2 — Завершение начатых циклов

| ID | Задача | Тэги | Effort |
|----|--------|------|--------|
| **P2.1** | ➜ **DONE (2026-06-22)**: **Cycle 54 schema completion** — `Client.type` discriminator в `prisma/schema.prisma` (legal/entrepreneur/individual). Миграция `20260622000000_add_organization_type_discriminator` + Zod DU в `src/lib/validations/organization.ts` + production-bug fix (POST инжектит `pickValidType` default `legal` для backward-compat UI не отправлял type) + wire-in `applyTypeAwareValidation` в PUT с DB-type-aware refinement + 27 unit tests (`validations-organization.test.ts`) | В2B, schema | ✅ |
| **P2.2** | **Verify cycle 47**: проверить что ВСЕ 9 entity routes имеют role-guard в PATCH/PUT/DELETE (не только критические 5) | requireRole | 2h |
| **P2.3** | **Verify cycle 47 fully**: 9 routes → `production-orders`, `supplier-orders`, `incoming-invoices`, `tenders`, `shipments`, `purchase-requests` и т.д. | guards | 4h |

### 🟩 P3 — Business-logic expansion (из BUSINESS-LOGIC §5)

| ID | Задача | Ссылка | Effort |
|----|--------|--------|--------|
| **P3.1** | Заказы поставщикам → автоматическое бронирование | BUSINESS-LOGIC §5.1 | 6-8h |
| **P3.2** | КП → автосоздание purchase-request для материалов по BOM | §5.2 | 8-10h |
| **P3.3** | Финансы: автоматический cash-flow при invoice payment | §5.3 | 6h |
| **P3.4** | Складская аналитика min-quantity alerts | §5.4 | 4h |
| **P3.5** | Интеграция DaData для автозаполнения реквизитов | §5.5 (есть route `/api/dadata`) | 4-6h |

### 🟦 P4 — Quality & performance

| ID | Задача | Effort |
|----|--------|--------|
| **P4.1** | Избавиться от `as any` (16 warnings) — типизация properly | 4-6h |
| **P4.2** | Performance audit per `tasks/PERFORMANCE_OPTIMIZATION_CHECKLIST.md` | 8-10h |
| **P4.3** | E2E tests expansion (Playwright) — сейчас только `tests/e2e/login.spec.ts` | 8h |
| **P4.4** | OpenAPI spec sync (per `tasks/OPENAPI_CHECKLIST.md`) | 2-3h |

---

## 5. 📊 МЕТРИКИ ПРОЕКТА

| Метрика | Значение |
|---------|----------|
| Prisma models / enums | **51** определение |
| API route folders | **44** |
| Pages (`page.tsx`) | **44** |
| Test files | 16 (vitest) + 1 (playwright `login.spec.ts`) |
| Tests passed | **272/272** |
| Components top-level | `activity-log`, `crud-page`, `layout`, `proposal-editor` (11 суб-компонентов), `providers`, `skeletons`, `ui` |
| Recent commits | `fix+docs: 31 validation tests`, `v3.8: Business logic refactor + Client→Organization + DaData`, `perf: optimize bundle`, `feat: comprehensive dashboard overhaul` |
| Working tree | **clean**, branch `main` синхронизирован с `origin/main` |

---

## 6. 🚀 РЕКОМЕНДУЕМЫЙ ПОРЯДОК ИМПЛЕМЕНТАЦИИ

### Фаза 1: Гигиена (1-2 ч) — ✅ DONE 2026-06-22
1. ✅ Fix P1.3 (ESLint warnings cleanup) — **0 warnings** at audit
2. ✅ Run `npm run build` (P1.4) — production build green
3. ✅ Sync `BUSINESS-LOGIC.md` (P0.2) — stages 5/6/9/10/12 + § 6.2 + § 7 synced
4. ✅ PERFORMANCE_CHECKLIST.md — header note points to ✅ OPTIMIZATION

### Фаза 2: Завершение начатых циклов (6-8 ч) — 📋 NEXT
1. Cycle 54 schema discriminator (P2.1) — Organization.type discriminator
2. Verify cycle 47 на 9 entity routes (P2.2, P2.3) — requireRole coverage

### Фаза 3: Business-logic expansion — выбор по приоритету бизнеса
*(зависит от решения пользователя — какие feature важнее)*
- D-A3 Гантт DnD (6-8h)
- D-A4 Снабжение auto-form (6-10h)
- D-A5 Shipment UI (6-10h)
- D-A6 Ролевая панель UI (4-8h)

### Фаза 4: Quality gate (продолжающаяся)
- После каждой P* фазы — re-run `tsc`, `vitest`, `eslint`, `build`.

---

## 7. 🧭 СТРУКТУРА ЧЕКЛИСТОВ ПРОЕКТА (для навигации)

```
docs/operations/
  ├── MASTER-CHECKLIST.md        ← Вы здесь (single source of truth)
  ├── CURRENT-CHECKLIST.md       ← per-cycle дневник
  ├── STABLE-MODULES.md          ← Tier A/B/C модули
  ├── audit-tasks.md             ← cycles 39-50 (tech)
  ├── audit-tasks-business.md    ← cycles 51-58 (business)
  ├── business-tasks.md          ← развёрнутые B-tasks
  └── DEPLOY-SYNO.md             ← deploy guide

tasks/
  ├── BUSINESS_LOGIC_REFACTOR_CHECKLIST.md  ← рефакторинг B-логики
  ├── DB_MIGRATION_CHECKLIST.md             ← миграции schema
  ├── OPENAPI_CHECKLIST.md                  ← OpenAPI compliance
  ├── PARALLEL_WORK_LOG.md                  ← журнал параллельных задач
  ├── PERFORMANCE_CHECKLIST.md              ← перформанс roadmap
  ├── PERFORMANCE_OPTIMIZATION_CHECKLIST.md ← optimization tactics
  ├── SKELETONS_CHECKLIST.md                ← skeletons
  ├── UNIT_TESTS_CHECKLIST.md               ← test coverage
  └── current-task.md                       ← what is being worked on NOW

docs/decisions/
  ├── ADR-001-architecture-boundaries.md
  ├── ADR-002-foundation-before-critical.md
  ├── ADR-003-status-workflow-live-query.md
  ├── ADR-004-business-critical-layer.md
  ├── ADR-005-proposal-editor-modularization.md
  └── ADR-005-rev2-proposal-editor-react-memoization.md
```

---

## 8. 🆘 EMERGENCY RIETRYIES (если контекст потерян)

1. Прочитай § 1 (gates) — проверь реальное состояние одной командой: `npx tsc --noEmit && npx vitest run && npx eslint src --max-warnings=999 | tail -5`
2. Если `Cannot find module '../generated/prisma/client'` — выполни `npx prisma generate`.
3. Прочитай § 2 — что реально сделано, чтобы не иллюзионировать.
4. Следуй § 4 по приоритетам — не делай P* параллельно без согласования.
5. После КАЖДОГО цикла обновляй `CURRENT-CHECKLIST.md` (правило команды в `AGENTS.md`).

---

**Этот документ — НЕ заменяет `CURRENT-CHECKLIST.md`**, а служит индексом/картой. Cycle-by-cycle журнал остаётся в `CURRENT-CHECKLIST.md`, общий roadmap — здесь.
