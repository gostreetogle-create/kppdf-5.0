# План задач по результатам аудита БИЗНЕС-ЛОГИКИ kppdf-5.0

**Дата**: 2026-06-20 (обновлено после Round 2 / ФИНАЛЬНЫЙ КОНСЕНСУС + cycles 51+52 DONE)
**Источник**: [`discussion-business-logic.md`](./discussion-business-logic.md) — Round 1 + 2 + ФИНАЛЬНЫЙ КОНСЕНСУС.
**Технический параллельный план**: [`audit-tasks.md`](./audit-tasks.md) (cycles 39-50).
**Детальная имплементация по каждому блоку**: [`business-tasks.md`](./business-tasks.md).
**Конституция проекта**: [`docs/CONTRIBUTING.md`](../CONTRIBUTING.md), [`docs/decisions/ADR-001-architecture-boundaries.md`](../decisions/ADR-001-architecture-boundaries.md).
**Участники**: Агент A (Бизнес-Архитектор), Агент B (Бизнес-Рецензент).
**Контекст**: технический аудит завершён (4/8 blocks DONE — M5 + env.ts + versioning + PDF). Бизнес-аудит Round 1+2 завершён, **ФИНАЛЬНЫЙ КОНСЕНСУС подписан обеими сторонами**. **Foundation layer (cycles 51+52) ЗАВЕРШЁН**.

---

## 📊 Прогресс (cycles 39-50 тех + cycles 51-57 бизнес v2)

| Цикл | Блок | Тип | Приоритет | Статус |
|------|------|-----|-----------|--------|
| 39 | M5 — auth/jwt развязка | технический | High | ✅ DONE |
| 40 | 1.3 — `src/lib/env.ts` consolidation | технический | Low | ✅ DONE |
| 41 | 5.1+5.2 — PDF page-break + Latin overflow | технический | High+Low | ✅ DONE |
| 42-43 | 3.2 — Версионирование КП + `sourceItemId` | технический | Medium | ✅ DONE |
| 44-45 | 3.1 — `<ProposalEditor>` refactor (architectural) | технический | Medium | ✅ DONE |
| 46-47 | 4.1 — Proposal editor 3-panel UX + B.6-extension partial | технический | Medium | ✅ DONE |
| 48-49 | 6.1 — Tests isolation / integration | технический | Low | ✅ DONE |
| 50 | 7.1 — Zustand refresh TTL + silent refresh | технический | Low | ✅ DONE |
| **51** | **B.3 — StatusWorkflow live query + seed** | **бизнес** | **🔴 Critical** | ✅ **DONE** |
| **52** | **B.6 — Роли в API guards (`requireRole`)** | **бизнес** | **🔴 Critical** | ✅ **DONE** |
| **53** | **B.1 — Finished Goods auto-IN** | **бизнес** | **🔴 Critical** | ✅ **DONE** |
| **54** | **B.2 — Client юрлица (B2B)** | **бизнес** | **🔴 Critical** | ✅ **DONE** |
| **55** | **B.4 — Защита номеров документов** | **бизнес** | **🟡 High** | ✅ **DONE** |
| **56** | **B.5 — OrderClosing FK relation** | **бизнес** | **🟡 High** | ✅ **DONE** |
| **57** | **B.7 — UserActivity UI** | бизнес | 🟢 Low | ✅ DONE |

**Завершено технических**: 8/8 (100%).
**Завершено бизнес**: 7/7 (100%). ✅ All foundation + business-critical + high-priority + low layers.

---

## 🔴 DEFERRED FOLLOWUPS (выявлены в audit 2026-06-21)

| # | Задача | Source | Приоритет | Effort | Статус |
|---|--------|--------|-----------|--------|--------|
| **D-A1** | **Cycle 47-extension batch 1 (cart POST/PATCH + proposals/dadata)** | audit-tasks-business.md DEFERRED | 🟢 Low | 1 h (batch 1) | ✅ **DONE** (a821a5e, 2026-06-22) — 6 routes migrated |
| **D-A1b** | **Cycle 47-extension batch 2-N** (warehouses/finance/admin рауты с `requireAuth`) | deferred из D-A1 | 🟢 Low | 3-5 h | 📋 planned — 70+ requireAuth() остаётся в batches 2-N |
| **D-A2** | **Cycle 50** silent refresh preempt | audit-tasks.md cycle 50 | 🟢 Low | 4 h | ✅ **DONE** (cycle 50 — auth-refresh.ts shipped) |
| **D-A3** | **Cycle 14+: Гантт DnD** | BUSINESS-LOGIC §7 | 🟢 Low | 6-8 h | 📋 planned |
| **D-A4** | **Cycle 8+: Снабжение auto-form** | BUSINESS-LOGIC §8 | 🟢 Low | 6-10 h | 📋 planned |
| **D-A5** | **Cycle 11+: Shipment UI** | BUSINESS-LOGIC §11 | 🟢 Low | 6-10 h | 📋 planned |
| **D-A6** | **Cycle 13+: Ролевая панель UI** | BUSINESS-LOGIC §5/§13 | 🟢 Low | 4-8 h | 📋 planned |

---

## ✅ Выполненные бизнес-блоки (полный список)
