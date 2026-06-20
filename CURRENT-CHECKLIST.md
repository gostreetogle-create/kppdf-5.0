# Текущий чек-лист kppdf-5.0 (обновляется каждый цикл)

**Дата последнего обновления**: 2026-06-20 (post-cycle 51 span — только что завершён audit prepare / docs system)
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

## 🔵 В ПРОЦЕССЕ / ТОЛЬКО ЧТО ЗАВЕРШЕНО

| Цикл | Блок | Статус | Notes |
|------|------|--------|-------|
| **docs** | **Documentation system (STABLE-MODULES, ADR-001, CONTRIBUTING, CURRENT-CHECKLIST)** | ✅ **только что завершён** | System created: защита от бесконечного рефакторинга |

## 📋 ПЛАНИРУЕМЫЕ ЦИКЛЫ (тех-план)

| Цикл | Блок | Статус | Зависимости |
|------|------|--------|-------------|
| 44-45 | 3.1 — `<ProposalEditor>` refactor | 📋 planned | НЕТ (но нужно для 4.1) |
| 46-47 | 4.1 — Proposal editor 3-panel UX | 📋 planned | 3.1 |
| 48-49 | 6.1 — Tests isolation / integration | 📋 planned | НЕТ |
| 50 | 7.1 — Zustand refresh TTL + silent preempt | 📋 planned | НЕТ |

## 📋 ПЛАНИРУЕМЫЕ ЦИКЛЫ (бизнес-план)

| Цикл | Блок | Статус | Зависимости |
|------|------|--------|-------------|
| **51** | **B.1 — Производство → Склад (finished goods IN, auto)** | 📋 **planned** | B.6 (роли) |
| 52 | B.2 — Client model для юрлиц | 📋 planned | B.6 |
| 53 | B.3 — StatusWorkflow реальное применение | 📋 planned | НЕТ (нужен seed) |
| 54 | B.4 — Защита номеров документов | 📋 planned | B.3 |
| 55 | B.5 — OrderClosing FK relation | 📋 planned | НЕТ |
| 56 | B.6 — Роли в API guards (`requireRole`) | 📋 planned | НЕТ |
| 57 | B.7 — List/Search UX для 1000+ | 📋 planned | 3.1 (UI component) |
| 58 | B.8 — Дублирование шаблонов + OrderHistory в UI | 📋 planned | НЕТ |

---

## 🎯 ТЕКУЩИЙ ФОКУС

**Только что завершено**: Documentation system (STABLE-MODULES + ADR-001 + CONTRIBUTING + CURRENT-CHECKLIST + ADR-TEMPLATE).

**Следующий рекомендуемый цикл**: **cycle 51 — B.1 Производство → Склад (finished goods IN)**.
- High priority (Top-1 в бизнес-аудите).
- Решает критический business gap.
- Связан с autoDeductMaterials() уже реализованным в `production-orders/[id]/status/route.ts`.

**Альтернатива**: **cycle 44-45 — 3.1 `<ProposalEditor>` refactor** (если хочется двигаться по тех-плану дальше).

**Pre-cycle checklist для cycle 51**:

1. Прочитать [`audit-tasks-business.md`](audit-tasks-business.md) — секция B.1.
2. Прочитать [`STABLE-MODULES.md`](STABLE-MODULES.md) — понять, какие модули можно трогать.
3. Прочитать [`docs/decisions/ADR-001-architecture-boundaries.md`](docs/decisions/ADR-001-architecture-boundaries.md) — стек фиксирован.
4. Создать [`tasks/current-task.md`](tasks/current-task.md) для cycle 51 с детальной спецификацией.
5. Imплементация + tests.
6. Gates (tsc/vitest/eslint).
7. Code-reviewer verdict.
8. Обновить ВСЕ документы (STABLE-MODULES, audit-tasks-business, audit-log, CURRENT-CHECKLIST).
9. Commit.

---

## ⛔ БЛОКЕРЫ

Нет активных блокеров. Проект готов к продолжению по новым правилам.

### Известные не-блокеры (пре-cycle-39 uncommitted changes)

Working tree содержит uncommitted изменения до cycle 39 (sortable-block improvements, image-aware preview, UI/PDF improvements). Это вне scope текущих циклов; отдельная задача cleanup в будущем (НЕ блокер).

### Honest disclosures

- 3 cosmetic lint warnings в `src/lib/auth.ts` (unused variables: `signAccessToken`, `signRefreshToken`, `JwtPayload`) — pre-existing, fix deferred.
- Тестов PDF не существует (Tier B: pdf/index.ts API frozen, no Vitest coverage yet — cycles 48-49 add them).
- Тестов env.ts не существует (Tier C candidate — cycles 48-49 add them).

---

## 🚪 ТЕКУЩИЕ GATES

```
$ npx tsc --noEmit      → exit 0 ✅
$ npx vitest run        → 88/88 (6 suites) ✅
$ npx eslint src ...    → 0 errors (3 cosmetic warnings) ✅
```

---

## 📝 АНТИ-ПАТТЕРН-ПРЕВЕНТИВНЫЙ ЧЕК (перед каждым cycle)

- [ ] Не трогаю ли я Tier A модуль без ADR?
- [ ] Не предлагаю ли я смену стека (требует ADR-002+)?
- [ ] Не делаю ли «рефакторинг-ради-рефакторинга»?
- [ ] Все ли 7 документов обновлю по завершении цикла?
- [ ] Покрыт ли новый код тестами?
- [ ] Минимальный ли PR (один тематический commit)?

Если на любой пункт ответ «да, нарушаю» — **СТОП**. Оформить ADR или скорректировать cycle scope.

---

## 🔗 СВЯЗАННЫЕ ДОКУМЕНТЫ

| Документ | Назначение |
|----------|-----------|
| [`STABLE-MODULES.md`](STABLE-MODULES.md) | Реестр стабильных модулей (Tier A/B/C) |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Правила для ИИ-агентов |
| [`docs/decisions/ADR-001-architecture-boundaries.md`](docs/decisions/ADR-001-architecture-boundaries.md) | Tech stack зафиксирован |
| [`docs/decisions/ADR-TEMPLATE.md`](docs/decisions/ADR-TEMPLATE.md) | Шаблон нового ADR |
| [`audit-tasks.md`](audit-tasks.md) | Тех-план (cycles 39-50) |
| [`audit-tasks-business.md`](audit-tasks-business.md) | Бизнес-план (cycles 51-58) |
| [`discussion.md`](discussion.md) | Тех-дискуссия агентов |
| [`discussion-business-logic.md`](discussion-business-logic.md) | Бизнес-дискуссия |
| [`tasks/current-task.md`](tasks/current-task.md) | Текущий активный цикл (спецификация) |
| [`audit-log.md`](audit-log.md) | Полная история циклов (2040+ строк) |

---

## История обновлений

| Дата | Изменение |
|------|-----------|
| 2026-06-20 | Initial creation: 4 цикла DONE (39-43), docs system подготовлен, рекомендован cycle 51 |
