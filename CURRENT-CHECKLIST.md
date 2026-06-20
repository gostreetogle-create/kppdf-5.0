# Текущий чек-лист kppdf-5.0 (обновляется каждый цикл)

**Дата последнего обновления**: 2026-06-20 (после cycles 39-43 DONE; cycles 51+52 только что СТАРТОВАНЫ)
**Назначение**: при обрыве интернета или потере контекста — сразу понятно, на чём остановились. Файл обновляется **перед началом** и **после завершения** каждого цикла.

---

## 🟢 ЗАВЕРШЁННЫЕ ЦИКЛЫ

| Цикл | Блок | Статус | Commit | Gates |
|------|------|--------|--------|-------|
| 39 | M5 — JWT decoupling (auth/jwt развязка) | ✅ DONE | cycle-39 | tsc 0, vitest 88/88, lint 0 |
| 40 | 1.3 — `src/lib/env.ts` consolidation | ✅ DONE | cycle-40 | tsc 0, vitest 88/88, lint 0 |
| 41 | 5.1+5.2 — PDF page-break + Latin overflow | ✅ DONE | cycle-41 | tsc 0, vitest 88/88, lint 0 |
| 42-43 | 3.2 — Версионирование КП + `sourceItemId` | ✅ DONE | cycle-42-43 | tsc 0, vitest 88/88, lint 0 |

**Завершено**: 4/8 тех-блоков (50%).

## 🚧 В ПРОЦЕССЕ / ТОЛЬКО ЧТО СТАРТОВАНЫ

| Цикл | Блок | Статус | Spec | Notes |
|------|------|--------|------|-------|
| **51** | **B.3 — StatusWorkflow live query + seed migration** | 🚧 **in_progress** | [`tasks/current-task.md`](tasks/current-task.md) | Foundation layer — `src/lib/status-workflow.ts` (new) + seed migration SQL |
| **52** | **B.6 — Роли в API guards** | 🚧 **in_progress** | см. cycle 51 spec | Foundation layer — механическая замена `requireAuth` → `requireRole([...])` (helper уже в `auth.ts:67`) |

**Foundation layer стартовал параллельно** — разные файлы, готовит B.1+B.2.

## 📋 ПЛАНИРУЕМЫЕ ЦИКЛЫ (тех-план)

| Цикл | Блок | Статус | Зависимости |
|------|------|--------|-------------|
| 44-45 | 3.1 — `<ProposalEditor>` refactor | 📋 planned | нет |
| 46-47 | 4.1 — Proposal editor 3-panel UX | 📋 planned | 3.1 |
| 48-49 | 6.1 — Tests isolation / integration | 📋 planned | нет |
| 50 | 7.1 — Zustand refresh TTL + silent preempt | 📋 planned | нет |

## 📋 ПЛАНИРУЕМЫЕ ЦИКЛЫ (бизнес-план v2)

| Цикл | Блок | Статус | Зависимости |
|------|------|--------|-------------|
| 51 | B.3 StatusWorkflow live query | 🚧 in progress | — (foundation) |
| 52 | B.6 Roles API guards | 🚧 in progress | — (foundation) |
| 53 | B.1 Finished Goods auto-IN | 📋 planned | После B.6 (роли для authorized transition) |
| 54 | B.2 Client модель для юрлиц | 📋 planned | После B.6 (роли для admin/manager создание) |
| 55 | B.4 Защита номеров | 📋 planned | После B.3 |
| 56 | B.5 OrderClosing FK | 📋 planned | независим |
| 57 | B.7 UserActivity UI | 📋 planned | независим |

---

## 🎯 ТЕКУЩИЙ ФОКУС

**Foundation layer только что стартовал**: cycles 51 (B.3 StatusWorkflow) + 52 (B.6 Roles).

Cycle 51 — substantive: new helper + cache + seed migration.
Cycle 52 — mechanical: existing `requireRole` уже в `src/lib/auth.ts:67`, нужно только USAGE в route handlers + опциональный `strict` флаг.

**Specs**: [`tasks/current-task.md`](tasks/current-task.md) — полная документация обоих циклов.

**Параллельность**: cycles 51 и 52 могут идти parallel — разные файлы. Единственный merge-conflict: `src/app/api/proposals/[id]/route.ts` PATCH section (cycle 51 меняет transition check, cycle 52 меняет requireAuth → requireRole). Решение — сериализация правок этой строки: cycle 51 сначала, cycle 52 потом.

---

## PRE-FLIGHT CHECKLIST для B-циклов (per [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md))

Перед КАЖДЫМ B-циклом, agent B обязан:

1. ⚠️ **Прочитать [STABLE-MODULES.md](STABLE-MODULES.md)**: проверить, не трогается ли Tier A/B модуль без ADR.
   - Tier A: `src/lib/jwt.ts` (НЕ ТРОГАТЬ).
   - Tier B: `src/lib/pdf/index.ts` (API frozen, internals flexible).
2. ⚠️ **Прочитать [ADR-001-architecture-boundaries.md](docs/decisions/ADR-001-architecture-boundaries.md)**: tech stack зафиксирован, любое изменение стека → ADR-002+.
3. ⚠️ **Прочитать [tasks/current-task.md](tasks/current-task.md)**: детальная спецификация цикла.
4. ⚠️ **Создать ADR-NNN** для любых архитектурных решений (cache strategy, role-map, etc.).
5. ✅ **Запустить gates** после имплементации: tsc 0 / vitest green / eslint 0.
6. ✅ **Code-reviewer** перед commit.
7. ✅ **Обновить ВСЕ 7 документов** (STABLE / audit-tasks / audit-tasks-business / audit-log / current-checklist / current-task / ADR если был).
8. ✅ **Один тематический commit**: `cycle-51: B.3 StatusWorkflow` или `cycle-52: B.6 Roles`.
9. ✅ **После завершения обоих**: открыть B.1 (cycle 53) и B.2 (cycle 54).

---

## 🚪 ТЕКУЩИЕ GATES

```
$ npx tsc --noEmit      → exit 0 ✅
$ npx vitest run        → 88/88 (6 suites) ✅
$ npx eslint src ...    → 0 errors (3 cosmetic warnings) ✅
```

Ожидается сохранение (не ухудшение) gate-результатов после cycles 51+52.

---

## ⛔ БЛОКЕРЫ

Нет активных блокеров. Foundation layer стартован.

### Известные не-блокеры

- Working tree содержит uncommitted изменения до cycle 39 (sortable-block, image-aware preview). Cleanup deferred — вне scope.
- 3 cosmetic lint warnings в `src/lib/auth.ts` (unused imports: signAccessToken, signRefreshToken, JwtPayload — pre-existing re-exports). Fix deferred до очередного touch-up.
- Тестов PDF не существует (Tier B API frozen; cycles 48-49 добавят).
- Тестов env.ts не существует (Tier C candidate; cycles 48-49 добавят).
- Тестов StatusWorkflow/requireRole НЕ существуют (cycles 48-49).

---

## 📝 АНТИ-ПАТТЕРН-ПРЕВЕНТИВНЫЙ ЧЕК (перед каждым cycle)

- [ ] Не трогаю ли я Tier A модуль без ADR?
- [ ] Не предлагаю ли я смену стека (требует ADR-002+)?
- [ ] Не делаю ли «рефакторинг-ради-рефакторинга»?
- [ ] Все ли 7+ документов обновлю по завершении цикла?
- [ ] Покрыт ли новый код тестами (или явно deferred)?
- [ ] Минимальный ли PR (один тематический commit на цикл)?
- [ ] Cycle 52 учитывает, что `requireRole` уже существует?
- [ ] Cache invalidation в admin routes поставлен?
- [ ] Seed migration idempotent (ON CONFLICT DO NOTHING + @@unique)?

Если на любой пункт ответ «да, нарушаю» — **СТОП**.

---

## 🔗 СВЯЗАННЫЕ ДОКУМЕНТЫ

| Документ | Назначение |
|----------|-----------|
| [`STABLE-MODULES.md`](STABLE-MODULES.md) | Реестр стабильных модулей (Tier A/B/C) |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Правила для ИИ-агентов |
| [`docs/decisions/ADR-001-architecture-boundaries.md`](docs/decisions/ADR-001-architecture-boundaries.md) | Tech stack зафиксирован |
| [`docs/decisions/ADR-002-foundation-before-critical.md`](docs/decisions/ADR-002-foundation-before-critical.md) | **NEW (в процессе)** — foundation layer ПЕРЕД business-critical |
| [`docs/decisions/ADR-TEMPLATE.md`](docs/decisions/ADR-TEMPLATE.md) | Шаблон ADR |
| [`audit-tasks.md`](audit-tasks.md) | Тех-план (cycles 39-50) |
| [`audit-tasks-business.md`](audit-tasks-business.md) | Бизнес-план v2 (cycles 51-57) |
| [`business-tasks.md`](business-tasks.md) | Детальный план B-циклов |
| [`discussion.md`](discussion.md) | Тех-дискуссия |
| [`discussion-business-logic.md`](discussion-business-logic.md) | Бизнес-дискуссия (Round 1+2+FINAL) |
| [`tasks/current-task.md`](tasks/current-task.md) | **Текущая спецификация активных циклов (51+52)** |
| [`audit-log.md`](audit-log.md) | Полная история циклов |

---

## История обновлений

| Дата | Изменение |
|------|-----------|
| 2026-06-20 (early) | Initial creation: 4 цикла DONE, docs system подготовлен |
| 2026-06-20 (now) | **Foundation layer СТАРТОВАН** (cycles 51+52 marked 🚧 in_progress); spec в tasks/current-task.md; ADR-002 в процессе |
