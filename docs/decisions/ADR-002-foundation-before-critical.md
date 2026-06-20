# ADR-002: Foundation layer before business-critical

**Дата**: 2026-06-20
**Статус**: accepted
**Заменяет**: (нет)

---

## Контекст

В Round 2 ФИНАЛЬНЫЙ КОНСЕНСУС бизнес-аудита определена цепочка из 7 B-циклов (B.1-B.7). При первичном рассмотрении порядок был:
- B.1 (Finished Goods IN) первый (top-1 operational gap)
- B.6 (Roles API guards) шестой (medium priority)

При ближайшем анализе Агент B указал на **architectural concern**: B.6 (роли) — это **cross-cutting foundation**, которое должно быть на месте **до** business-critical blocks (B.1, B.2). Без B.6:
- B.1 (auto-IN): любой авторизованный пользователь может завершить производственный заказ → потенциально создаёт phantom stock.
- B.2 (Client юрлица): любой пользователь может создать client-юрлицо → риск фиктивных контрагентов.
- B.3 (StatusWorkflow — тех цикл): мутирование правил переходов не требует admin-роли если guard не проверяет.

**Проблема**: запустить Critical-блок (B.1) ДО foundation (B.6) = architectural risk.

### Конкретные факты

- B.3 (StatusWorkflow live query) — substantive change: замена хардкода VALID_TRANSITIONS на queries к таблице StatusWorkflow.
- B.6 (Roles API guards) — механическая замена `requireAuth()` → `requireRole([...])` в `/api/*` route handlers.
- B.1 (Finished Goods IN) — добавляет auto-creating InventoryMovement при `ProductionOrder.completed` → требует `production` role check (или manager).
- B.2 (Client юрлица) — schema migration + UI form для юрлиц → требует `admin | manager` role check на create endpoint.

**Без B.6**, B.1 и B.2 будут создаваться вне правильной AAA (Authentication + Authorization + Audit) модели → техдолг отложен, требует retrofit в более позднем цикле.

---

## Решение

### Порядок B-циклов v2 (FINAL CONSENSUS)

| Цикл | Блок | Приоритет | Зависимости | Параллелизация |
|------|------|-----------|-------------|----------------|
| **51** | **B.3 StatusWorkflow live query** | 🔴 Critical | — | **Параллельно с B6** |
| **52** | **B.6 Roles API guards** | 🔴 Critical | — | **Параллельно с B3** |
| 53 | B.1 Finished Goods auto-IN | 🔴 Critical | После B6 | — |
| 54 | B.2 Client юрлица | 🔴 Critical | После B6 | Параллельно с B1 |
| 55 | B.4 Защита номеров | 🟡 High | После B3 | — |
| 56 | B.5 OrderClosing FK | 🟡 High | нет | — |
| 57 | B.7 UserActivity UI | 🟢 Low | нет | — |

**Принцип**: foundation layer (cycles 51+52) **ПЕРЕД** business-critical (cycles 53+54).

### Конкретные шаги

1. **B.3 StatusWorkflow** (cycle 51):
   - Helper `src/lib/status-workflow.ts` с `assertTransitionAllowed(...)` + in-memory cache (TTL 60s) + hardcoded fallback per entity + `WorkflowError` class.
   - Seed-миграция начальных переходов для 5 entity types (`proposal`, `contract`, `productionOrder`, `orderTask`, `shipment`).
   - Cache invalidation hook в `src/app/api/admin/status-workflows/route.ts`.
   - Refactor `src/app/api/proposals/[id]/route.ts` PATCH и `src/app/api/production-orders/[id]/status/route.ts` PATCH.

2. **B.6 Roles API guards** (cycle 52):
   - `requireRole(['admin'], { strict: true })` — для admin-only operations (`/api/users/*`).
   - `requireRole(['manager'])` — для proposal/contract PATCH/PUT/DELETE.
   - `requireRole(['manager', 'production'])` — для production-orders status.
   - `requireRole(['storekeeper'])` — для `/api/warehouse/*`.
   - `requireRole(['accountant'])` — для `/api/finance/*`.
   - GET endpoints остаются с `requireAuth()`.

3. **Sequential dependency**: cycle 53+ (B.1/B.2) **запускаются только после **верификации** обоих foundation cycles.

---

## Альтернативы

### Альтернатива A: «B.1/B.2 first, B.6 retrofit позже»

Изначальный план (Round 1 / Agent A). B.1 (top-1 operational) идёт первым, B.6 (medium priority) — позже.

**Плюсы**:
- Быстрее закрываем top-1 operational gap.

**Почему отвергли**:
- B.1 будет создавать `InventoryMovement IN` без role check → потенциальные несанкционированные stock mutations.
- B.2 будет создавать client-юрлица без role check → риск фиктивных контрагентов.
- Минимальный tech-debt retrofit: придётся проходить по всем циклам 53+ после cycle 52 добавлять role-check → **двойная работа**.
- Audit-trail risk: B.1 + B.2 завершаются, потом B.6 backfill-ит role-проверку → существующие данные могут быть несоответствующими.

### Альтернатива B: «Inline role-check в каждом Critical-блоке»

Каждый Critical-блок (B.1, B.2) делает минимальный inline role check на конкретном route. Потом cycle 52 (B.6) унифицирует через `requireRole`.

**Плюсы**:
- B.1 + B.2 могут стартовать раньше.
- Каждый Critical-блок «сразу защищён».

**Почему отвергли**:
- Inline role-check дублируется между блоками → tech-debt immediately.
- Нет единого source of truth для ролей → complex maintenance.

### Альтернатива C: «Foundation layer sequential», затем параллельно B.1+B.2

Cycle 51+B.6 (sequential, чтобы не было merge-конфликтов), потом cycle 53+ параллельно.

**Плюсы**:
- Нет merge-конфликтов в `src/app/api/proposals/[id]/route.ts` (где cycle 51 меняет transition check, cycle 52 меняет require call).

**Почему отвергли**:
- Sequences 2 cycles одинаковой длины overhead.
- Cycle 51 и 52 могут работать на разных файлах большую часть времени — конфликт минимален (только 1 строка в `proposals/[id]/route.ts`).

### Выбор: Альтернатива C модифицированная (parallel cycles 51+52, сериализация merge conflict)

51 и 52 могут идти parallel — разные файлы большую часть. Конфликт в одной строке (`proposals/[id]/route.ts` PATCH) решается сериализацией правок этой строки: cycle 51 сначала, cycle 52 потом (или merge carefully).

---

## Последствия

### Позитивные

- **+Безопасность foundation**: B.1 + B.2 запускаются с правильной авторизацией и workflow validation.
- **+Single source of truth**: workflow правила в БД, не хардкод. Роли — единая AAA модель.
- **-Tech-debt reduced**: нет необходимости retrofit B.1/B.2 после backward-compat с B.6.
- **+Audit-trail clean**: каждое действие логируется через правильный guard.

### Негативные

- **+2 cycles первыми (51+52) перед business-critical return-on-investment**: для closing top-1 (B.1) требуется 2 preparatory cycles.
- **-Параллелизм ciclos ограничен**: 51+52 в parallel OK, но tooling нужно аккуратно manage merge в `proposals/[id]/route.ts`.

### Реверс-условия

Решение пересматривается, если:
- Выявлена **критическая производственная проблема** (например, urgent customer request требует B.1 именно сейчас) — но только с explicit ADR override и timestamp.
- B.6 строго зависит от инфраструктуры (Redis cache), недоступной в текущей среде — тогда B.6 использует in-memory кеш с documented limitation.

---

## Решение и одобрение

- **Автор ADR**: Агент A (Архитектор)
- **Дата принятия**: 2026-06-20
- **Одобрено**: Round 2 / Agent B (см. FINAL CONSENSUS) — двусторонний консенсус.

---

## Связанные документы

- [`../../business-tasks.md`](../../business-tasks.md) — детальный план B-циклов.
- [`../../audit-tasks-business.md`](../../audit-tasks-business.md) v2 — обновлённый roadmap.
- [`../../discussion-business-logic.md`](../../discussion-business-logic.md) — Round 1+2+FINAL.
- [`../../tasks/current-task.md`](../../tasks/current-task.md) — спецификация cycles 51+52.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — правила для будущих правок.
- [`../001-architecture-boundaries.md`](../001-architecture-boundaries.md) — tech stack boundaries (ADR-001).
