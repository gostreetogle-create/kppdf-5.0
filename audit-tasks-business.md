# План задач по результатам аудита БИЗНЕС-ЛОГИКИ kppdf-5.0

**Дата**: 2026-06-20 (обновлено после Round 2 / ФИНАЛЬНЫЙ КОНСЕНСУС)
**Источник**: [`discussion-business-logic.md`](./discussion-business-logic.md) — Round 1 + 2 + ФИНАЛЬНЫЙ КОНСЕНСУС.
**Технический параллельный план**: [`audit-tasks.md`](./audit-tasks.md) (cycles 39-50).
**Детальная имплементация по каждому блоку**: [`business-tasks.md`](./business-tasks.md).
**Конституция проекта**: [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md), [`docs/decisions/ADR-001-architecture-boundaries.md`](./docs/decisions/ADR-001-architecture-boundaries.md).
**Участники**: Агент A (Бизнес-Архитектор), Агент B (Бизнес-Рецензент).
**Контекст**: технический аудит завершён (4/8 blocks DONE — M5 + env.ts + versioning + PDF). Бизнес-аудит Round 1+2 завершён, **ФИНАЛЬНЫЙ КОНСЕНСУС подписан обеими сторонами**.

---

## 📊 Прогресс (cycles 39-50 тех + cycles 51-57 бизнес v2)

| Цикл | Блок | Тип | Приоритет | Статус |
|------|------|-----|-----------|--------|
| 39 | M5 — auth/jwt развязка | технический | High | ✅ DONE |
| 40 | 1.3 — `src/lib/env.ts` consolidation | технический | Low | ✅ DONE |
| 41 | 5.1+5.2 — PDF page-break + Latin overflow | технический | High+Low | ✅ DONE |
| 42-43 | 3.2 — Версионирование КП + `sourceItemId` | технический | Medium | ✅ DONE |
| 44-45 | 3.1 — `<ProposalEditor>` refactor (architectural) | технический | Medium | 📋 planned |
| 46-47 | 4.1 — Proposal editor 3-panel UX | технический | Medium | 📋 planned |
| 48-49 | 6.1 — Tests isolation / integration mock prisma | технический | Low | 📋 planned |
| 50 | 7.1 — Zustand refresh TTL + silent refresh preempt | технический | Low | 📋 planned |
| **51** | **B.3 — StatusWorkflow live query + seed-миграция** | **бизнес** | **🔴 Critical (foundation)** | 📋 **planned** |
| **52** | **B.6 — Роли в API guards (`requireRole`)** | **бизнес** | **🔴 Critical (foundation)** | 📋 **planned** |
| **53** | **B.1 — Производство → Склад (finished goods IN, auto)** | **бизнес** | **🔴 Critical** | 📋 **planned** |
| **54** | **B.2 — Client модель для юрлиц (B2B)** | **бизнес** | **🔴 Critical** | 📋 **planned** |
| **55** | **B.4 — Защита номеров документов после sent/active/paid** | **бизнес** | **🟡 High** | 📋 **planned** |
| **56** | **B.5 — OrderClosing FK relation (audit-trail strict)** | **бизнес** | **🟡 High** | 📋 **planned** |
| **57** | **B.7 — UserActivity UI (история для всех сущностей)** | **бизнес** | **🟢 Low** | 📋 **planned** |

**Завершено технических**: 4/8 (50% от технического плана).
**Бизнес план v2**: 7 блоков (cycles 51-57), против исходного draft 8 блоков (cycles 51-58). B.7 и B.8 объединены в один блок B.7 (см. Round 2 консенсус).
**Порядок**: foundation layer (51+52 параллельно) → business-critical (53+54 параллельно) → high/low business.

---

## ⚠️ ИНТЕГРАЦИЯ С ТЕХНИЧЕСКИМ ПЛАНОМ

### Стратегия v2: Foundation layer ПЕРЕД business-critical

Отличительная особенность Round 2 консенсуса — **B3+B6 как foundation layer** (cycles 51+52) идут **ДО** Critical-blocks B1+B2 (cycles 53+54). Это обеспечивает:
- B6 (роли) — каждое следующий блок B1/B2 имеет корректную авторизацию.
- B3 (StatusWorkflow live query) — единый workflow-движок для всех entity.
- B1 (Finished Goods IN) — production-orders выполняется с правильной ролью.
- B2 (Client юрлица) — клиенты создаются только admin/manager.

### Параллельность между Блоками

| Пара | Файлы | Parallelism safe? | Notes |
|------|-------|-------------------|-------|
| B3 + B6 | status-workflow.ts + auth-roles.ts + route edits | ✅ Да | Touch разные файлы. Параллель. |
| B1 + B2 | production-orders + Client model + Zod | ✅ Да | Touch разные routes/models. Параллель. |
| B1 + B4 | warehouse + documents | ✅ Да | Разные домены. B4 независимо от B1. |
| B4 + B5 | proposals + finance | ✅ Да | Независимые. |
| B5 + B7 | warehouse + UI | ✅ Да | Независимые. |

### Пересечение с техническими cycles

| Технический цикл | Какой бизнес-блок затрагивает |
|------------------|-------------------------------|
| **Cycle 42-43 (версионирование КП)** | Уже частично закрывает business continuity, но НЕ защиту номеров (нужно B.4). |
| **Cycle 44-45 (`<ProposalEditor>` refactor)** | Открывает путь для **B.7 (UserActivity UI)** — компонент может переиспользовать viewer. |
| **Cycle 46-47 (3-panel UX)** | Улучшает навигацию КП, частично помогает **B.6 (роли)** для разных panel layouts. |
| **Cycle 48-49 (tests isolation)** | Готовит инфраструктуру для unit-тестов B.3, B.6, integration mock для B.1, B.2. |

**Рекомендуемый порядок исполнения**:
1. **Технические cycles 44-50** (как запланировано).
2. **Параллельно с тех. cycles 44-50**: бизнес-циклы 51+52 (foundation B3+B6).
3. **Бизнес-циклы 53+54** (после завершения foundation, параллельно с cycles 46-47).
4. **Бизнес-циклы 55-57** (cycles 48-49 дают test infra для этих).

---

## ✅ Выполненные технические блоки (cycles 39-43)

### ✅ Cycle 39 — M5: auth/jwt развязка
Бизнес-эффект: testable auth flow. Готовит B.6 (роли в guards — нужны тесты).

### ✅ Cycle 40 — env.ts consolidation
Бизнес-эффект: zero-config drift между prod и dev. Косвенно для B.1 (production orders auto).

### ✅ Cycle 41 — PDF page-break + Latin overflow
Бизнес-эффект: **90% КП/договоров теперь корректно печатаются** на многостраничных документах. Без этого — невозможно отправить КП с 30+ позициями юрлицу (длинный `legalAddress` обрезался). Подготавливает B.2 (юрлица имеют длинные адреса).

### ✅ Cycle 42-43 — Версионирование КП
Бизнес-эффект: **audit-trail коммерческих предложений**. История «что предложили → что клиент принял → что отправили в производство». Подготавливает почву для **B.4 (защита номеров)** — теперь v1 заморожен, v2 имеет другой номер.

---

## 🔴 Бизнес-блоки ВЫСОКОГО приоритета

### 🔴 B.3 — StatusWorkflow live query (foundation)

**Приоритет**: 🔴 Critical (foundation, **первый** в порядке исполнения)
**Сложность**: M (средняя)
**Цикл**: 51 (параллельно с B6)
**Зависимости**: НЕТ. Но seed-миграция обязательна.

**Проблема**:
- Модель `StatusWorkflow` (`prisma/schema.prisma:722-734`) существует: `entity/fromStatus/toStatus/roles/isActive`.
- В API handlers — хардкод `VALID_TRANSITIONS`:
  - `src/app/api/proposals/[id]/route.ts:64-70`
  - `src/app/api/production-orders/[id]/status/route.ts:7-15`

**Решение**:
1. Helper `src/lib/status-workflow.ts` с `assertTransitionAllowed(entity, fromStatus, toStatus, userRole)`.
2. In-memory кеш (TTL = 60 сек) для `prisma.statusWorkflow.findMany`.
3. Seed-миграция добавляет стандартные переходы для всех entities в `prisma/migrations/<ts>_seed_status_workflows/`.
4. Refactor существующих API handlers → использовать helper.

**AC**:
- API handlers используют `assertTransitionAllowed()` вместо хардкода.
- Seed migration добавляет все базовые переходы для КП/Договор/Производство/Задача/Отгрузка.
- Cache hit rate > 90% для типичных сценариев.
- UI админка `/admin/status-workflows` — admin может добавить переход, переход начинает работать **без деплоя**.

**Edge cases**:
- Переход ВООБЩЕ не существует → throw WorkflowError 403.
- Роль не подходит → 403.

### 🔴 B.6 — Роли в API guards (foundation)

**Приоритет**: 🔴 Critical (foundation, **второй** в порядке исполнения)
**Сложность**: M
**Цикл**: 52 (параллельно с B3)
**Зависимости**: НЕТ.

**Проблема**:
- 5 ролей в `User.role` (`admin`/`manager`/`production`/`storekeeper`/`accountant`/`viewer`), но **НЕ enforced** в API.
- `requireAuth()` без role-check используется везде → любой авторизованный может менять статусы производственного заказа.

**Решение**:
1. Helper `src/lib/auth-roles.ts`:
   ```ts
   export async function requireRole(roles: string[]): Promise<User>
   ```
2. Audit всех `/api/*` routes + централизованная role-map:
   - `/api/proposals/*` → `admin | manager`
   - `/api/contracts/*` → `admin | manager`
   - `/api/production-orders/*` PATCH → `admin | manager | production`
   - `/api/warehouse/*` → `admin | storekeeper`
   - `/api/finance/*` → `admin | accountant`
   - `/api/users/*` → admin
3. Замена `requireAuth()` → `requireRole([...])`.

**AC**:
- `requireRole(['admin'])` → 403 для non-admin.
- viewer не может изменить ничего (только GET).
- Тесты для каждого role/endpoint (cycle 48-49).

### 🔴 B.1 — Производство → Склад (auto-finished-goods IN)

**Приоритет**: 🔴 Critical
**Сложность**: M
**Цикл**: 53 (после B6)
**Зависимости**: B.6 (роли для authorized transition).

**Проблема**:
- `autoDeductMaterials()` уже списывает материалы со склада (OUT) при `planned → in_progress` ✓.
- **НЕТ** auto-receive-finished-goods при `in_progress → completed` → компания не может отгрузить клиенту то, что «произвела».

**Решение**:
1. Migration: добавить `InventoryMovement.productionOrderId String?` + FK relation + UNIQUE constraint.
2. В `src/app/api/production-orders/[id]/status/route.ts` для transition в `completed`:
   - Получить related `Proposal.items` или `Contract.items` (через `productionOrder.proposalId/contractId`).
   - Defensive check: если уже есть `InventoryMovement type=in WHERE productionOrderId=X` → skip + warning.
   - Для каждого unique `productId`: найти/создать `StorageItem` в default warehouse (первый `isActive=true`), создать `InventoryMovement type=in`.

**AC**:
- `completed` → автоматически создаются `InventoryMovement type=in` для всех products.
- `InventoryMovement.productionOrderId` заполнен.
- UNIQUE constraint предотвращает дубль IN при повторном переходе.
- Default warehouse = первый с `isActive=true`.

### 🔴 B.2 — Client модель для юрлиц (B2B)

**Приоритет**: 🔴 Critical
**Сложность**: L (большая)
**Цикл**: 54 (после B6, параллельно с B1)
**Зависимости**: B.6 (роли для admin/manager создание).

**Проблема**:
- `Client` имеет `lastName/firstName/patronymic` (ФИО физлица). Нет полей для юрлица.
- 90% B2B сделок — с юрлицами. Приходится вбивать «ООО СтройМонтаж» в `lastName` (костыль).

**Решение**:
1. Schema migration:
   ```prisma
   model Client {
     // existing
     type          String   @default("individual") // individual | legal
     companyName   String?
     legalForm     String?  // ООО | ОАО | ИП | ЗАО | ПАО
     inn           String?
     kpp           String?
     ogrn          String?
     legalAddress  String?
     @@index([type])
     @@index([inn])
     @@index([companyName])
   }
   ```
2. Zod validation в `src/lib/validations/client.ts`:
   - `type='legal'` → required `companyName`, required `inn` (**10 цифр** для юрлица, 12 для ИП).
   - `type='individual'` → existing валидация.
3. UI: radio «Тип клиента» в ClientForm динамически показывает поля.
4. Миграция: существующие клиенты получают `type='individual'` по default.

**AC**:
- Создание юрлица через UI: работает, валидирует ИНН (10/12 цифр).
- В КП/Договоре работающий фильтр → корректно отображаются реквизиты юрлица в шапке.
- Существующие клиенты не сломаны.

---

## 🟡 Бизнес-блоки СРЕДНЕГО приоритета

### 🟡 B.4 — Защита номеров документов

**Приоритет**: 🟡 High
**Сложность**: S
**Цикл**: 55 (после B3)
**Зависимости**: B.3 (StatusWorkflow) — желательно использовать единый workflow-engine для статусов.

**Проблема**:
- `Proposal.number @unique` — защита от дубликатов, не от **изменения**.
- Бизнес-инвариант: «отправленный документ — номер заморожен». Не enforced.

**Решение**:
1. Helper `src/lib/number-protection.ts` + `src/lib/constants/frozen-statuses.ts`.
2. Frozen statuses per document:
   - `Proposal`: `sent`, `accepted`, `converted`, `paid`.
   - `Contract`: `active`, `completed`.
   - `ProductionOrder`: `in_progress`, `completed`.
   - `SupplierOrder`: `confirmed`, `shipped`, `delivered`.
3. В PATCH endpoint каждого документа: `assertNumberImmutable(...)`.

**AC**:
- PATCH `Proposal.number` при `status='sent'` → 400 «Номер заморожен после отправки».
- Frozen statuses конфигурируемые.
- Тесты для каждого типа документа.

### 🟡 B.5 — OrderClosing FK relation (audit-trail strict)

**Приоритет**: 🟡 High
**Сложность**: S
**Цикл**: 56 (независим)
**Зависимости**: НЕТ.

**Проблема**:
- `OrderClosing.orderId String?` (строка 611 schema) — **НЕ FK Prisma relation** (soft reference).
- Audit-trail broken: при удалении `ProductionOrder` — `OrderClosing` остаётся без обратной ссылки.

**Решение**:
```prisma
model OrderClosing {
  orderId String?
  order ProductionOrder? @relation(fields: [orderId], references: [id], onDelete: SetNull)
  @@index([orderId])
}
```
**Cascade: SetNull** — order может удаляться, OrderClosing остаётся как historical record.

**AC**:
- Удаление `ProductionOrder` НЕ блокирует (`SetNull`).
- Audit-grep: другие soft-reference поля найдены и исправлены.

---

## 🟢 Бизнес-блоки НИЗКОГО приоритета

### 🟢 B.7 — UserActivity UI (история для всех сущностей)

**Приоритет**: 🟢 Low
**Сложность**: M
**Цикл**: 57 (независим)
**Зависимости**: НЕТ.

**Проблема**:
- `UserActivity(entity, entityId)` пишется, но в UI нет кнопки «Посмотреть историю».
- `OrderHistory` — только для production orders, не универсальная.

**Решение**:
1. Компонент `<ActivityLog entity entityId />` в `src/components/activity-log.tsx` (read из `UserActivity`).
2. API endpoint `GET /api/activity-log?entity=X&entityId=Y&page=N`.
3. Tab «История» в viewer'ах Proposals/Contracts/ProductionOrders.

**AC**:
- Timeline корректно отображает events.
- Pagination 25 events на страницу.
- Real-time: новые events появляются без refresh (опционально).

---

## Резюме (v2)

| # | Блок | Приоритет | Сложность | Цикл | Тип | Order |
|---|------|-----------|-----------|------|-----|-------|
| 0 | M5 — auth/jwt развязка | High | S | 39 ✅ | тех | — |
| 1 | 1.3 — env.ts consolidation | Low | S | 40 | тех | — |
| 2 | 5.1+5.2 — PDF page-break + Latin | High+Low | M/S | 41 ✅ | тех | — |
| 3 | 3.2 — Версионирование КП + sourceItemId | Medium | L | 42-43 ✅ | тех | — |
| 4 | 3.1 — `<ProposalEditor>` refactor | Medium | M | 44-45 | тех | — |
| 5 | 4.1 — Proposal editor 3-panel UX | Medium | M | 46-47 | тех | — |
| 6 | 6.1 — Tests isolation / integration | Low | M | 48-49 | тех | — |
| 7 | 7.1 — Zustand refresh TTL + silent preempt | Low | S | 50 | тех | — |
| **B.3** | **StatusWorkflow live query** | **🔴 Critical** | **M** | **51** | **бизнес** | **foundation (parallel w/ B6)** |
| **B.6** | **Роли API guards** | **🔴 Critical** | **M** | **52** | **бизнес** | **foundation (parallel w/ B3)** |
| **B.1** | **Finished Goods auto-IN** | **🔴 Critical** | **M** | **53** | **бизнес** | **after B6** |
| **B.2** | **Client юрлица (B2B)** | **🔴 Critical** | **L** | **54** | **бизнес** | **after B6 (parallel w/ B1)** |
| **B.4** | **Защита номеров** | 🟡 High | S | 55 | бизнес | after B3 |
| **B.5** | **OrderClosing FK** | 🟡 High | S | 56 | бизнес | independent |
| **B.7** | **UserActivity UI** | 🟢 Low | M | 57 | бизнес | independent |

**Изменения от исходного draft**:

| Что было | Что стало | Обоснование |
|----------|-----------|-------------|
| B1 первый, B2 второй, B3 третий, B6 шестой | **B3 + B6 первый (parallel)**, B1 + B2 после | B6 (роли) — **cross-cutting foundation**, без которого B1/B2 небезопасны. B3 (single workflow source) — foundation для всех entity |
| B.7 (search UX для 1000+) | **B.7 = UserActivity UI** | Консенсус Round 2: search UX менее критично, чем история. |
| B.8 (Template duplication) | **Удалён** | Объединён с B.7 (одна история для всех entity, шаблоны — частный случай). |

**От cycle 51 до cycle 57**: ~7 циклов (с ревью и валидацией каждого блока). Параллельность B3+B6 и B1+B2 даёт ускорение.

---

## ⚠️ ПРИМЕЧАНИЯ

### Round 1 + 2 консенсус vs. ФИНАЛЬНЫЙ КОНСЕНСУС

Round 1 / Agent A + Agent B initial 4-вопросный диалог (verified):
- Top-1: B.1 Finished Goods IN ✓ (Round 2 Agent A подтвердил)
- Client model: расширить существующую (НЕ отдельная LegalEntity) ✓
- StatusWorkflow: live query (НЕ seed-as-hardcode) ✓

Round 2 мои дополнения **все приняты**:
- **B.6 placement**: перемещён с позиции 6 на позицию 2 (foundation layer)
- **B.2 Zod validation**: refinements по типу клиента (10 цифр юрлицо / 12 цифр ИП)
- **B.3 seed migration**: обязательна при первой поставке
- **B.1 warehouse choice**: вариант A (default warehouse) для MVP
- **B.2 миграция existing**: `type='individual'` default
- **B.7 scope**: `UserActivity` (НЕ `OrderHistory`)

**ФИНАЛЬНАЯ КАРТИНА**: 7 блоков, согласованных обеими сторонами.

### Honest disclosures

- Тесты для всех B-циклов **deferred** в cycles 48-49 (testability independence + integration mock prisma), за исключением простых smoke проверок.
- B.2 (Client юрлица) и B.1 (Finished Goods IN) циклы **можно сделать parallel** — touch разные routes/models. Но cycle numbers (53/54) последовательные, так что фактически будут делаться 2 PR-а.
- B.6 требует **полного audit** всех routes — 30+ endpoints. Это самая трудозатратная часть.

### Cross-cutting правила (новая система СТАБИЛЬНОСТИ)

При работе с B-циклами:
- `src/lib/jwt.ts` — **Tier A STABLE**, не трогать (см. `STABLE-MODULES.md`).
- `src/lib/pdf/index.ts` — **Tier B API FROZEN**, только внутренняя реализация может меняться.
- Все API routes — обычные (Tier D), можно менять.
- Prisma schema — может мигрировать, миграции пишутся в `audit-log.md`.
- Любое изменение Tier A/B требует **ADR** (см. `docs/CONTRIBUTING.md` Правило 3).

---

**Файл синхронизирован с**:
- [`discussion-business-logic.md`](./discussion-business-logic.md) — Round 1+2+Консенсус.
- [`business-tasks.md`](./business-tasks.md) — детальная имплементация по каждому блоку.
- [`docs/decisions/ADR-001-architecture-boundaries.md`](./docs/decisions/ADR-001-architecture-boundaries.md) — tech stack зафиксирован.

**Дата последнего обновления**: 2026-06-20 (v2: после ФИНАЛЬНЫЙ КОНСЕНСУС).
