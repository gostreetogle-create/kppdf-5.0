<a id="heading-1"></a>
# ЧЕК-ЛИСТ РЕАЛИЗАЦИИ KPPDF CRM
## Index of Sections / Содержание

_Авто-генерированный TOC. Якоря: `<a id="heading-N">` ordinal anchors, портативны во всех markdown-рендерерах (GitHub / GitLab / VSCode / Typora). Перегенерация: `perl scripts/inject-md-toc.pl <file>` (идемпотентно — перед новой вставкой удаляет старые anchor-markers + старый TOC-блок)._

**Всего headings:** 35 (# = 1, ## = 8, ### = 26).

- [ЧЕК-ЛИСТ РЕАЛИЗАЦИИ KPPDF CRM](#heading-1)
- [СТАТУСЫ ЗАДАЧ](#heading-2)
- [🔵 ФАЗА 1: КРИТИЧЕСКИЕ РАЗРЫВЫ (разрывы в цепочке workflow)](#heading-3)
  - [1.1 ✅ nextProductionOrderNumber() в counter.ts](#heading-4)
  - [1.2 ✅ Поля contractId, proposalId в Prisma ProductionOrder](#heading-5)
  - [1.3 ✅ API POST /api/contracts/[id]/convert-to-production](#heading-6)
  - [1.4 ✅ Кнопка «Передать в производство» на странице договора](#heading-7)
  - [1.5 ✅ Поле workCenterId в OrderTask + ProductionOrder](#heading-8)
  - [1.6 ✅ Авто-конвертация КП→ProductionOrder при статусе «оплачено»](#heading-9)
- [🟢 ФАЗА 2: АВТО-НОМЕРА + БЛОКИРОВКИ](#heading-10)
  - [2.1 ✅ Авто-номера в формах (7 форм)](#heading-11)
  - [2.2 ✅ Блокировка номеров в ProposalForm и ContractForm](#heading-12)
  - [2.3 ✅ Проверка дубликатов номеров](#heading-13)
- [🟢 ФАЗА 3: МОДУЛИ ТОВАРА + СНАБЖЕНИЕ](#heading-14)
  - [3.1 ✅ ProductModule — модули/изделия товара](#heading-15)
  - [3.2 ✅ ModuleWorkType — виды работ модуля](#heading-16)
  - [3.3 ✅ ModuleMaterial — материалы модуля](#heading-17)
  - [3.4 ✅ Страница редактирования товара с модулями](#heading-18)
  - [3.5 ✅ Модуль снабжения: авто-список закупок](#heading-19)
  - [3.6 ✅ Интеграция снабжения со складом](#heading-20)
- [🟢 ФАЗА 4: ГАНТТ + ПРОИЗВОДСТВО](#heading-21)
  - [4.1 ✅ DnD-редактирование сроков на Гантте](#heading-22)
  - [4.2 ✅ Авто-заполнение Гантта из модулей товара](#heading-23)
  - [4.3 ✅ Статусная модель производства](#heading-24)
  - [4.4 ✅ Панель рабочего «Мои задачи»](#heading-25)
- [🟢 ФАЗА 5: РОЛИ + ОТГРУЗКА + ПОКРАСКА](#heading-26)
  - [5.1 ✅ Ролевая модель: панели по ролям](#heading-27)
  - [5.2 ✅ Модуль отгрузки](#heading-28)
  - [5.3 ✅ Модуль покраски (RAL)](#heading-29)
  - [5.4 ✅ Закрытие заказа: авто-заполнение + акты](#heading-30)
- [🟡 ФАЗА 6: ИНТЕГРАЦИИ + АНАЛИТИКА](#heading-31)
  - [6.1 ✅ API для импорта из CAD-систем](#heading-32)
  - [6.2 ✅ Дашборд аналитики](#heading-33)
  - [6.3 ✅ История всех действий по заказу](#heading-34)
- [ИТОГ](#heading-35)

---



> Версия: 2.1
> Дата: 18 июня 2026
> Назначение: детальная спецификация каждой задачи. ФИНАЛЬНЫЙ СТАТУС.
> Проведён полный browser-аудит всех 20+ страниц — все работают без runtime-ошибок.

---

<a id="heading-2"></a>
## СТАТУСЫ ЗАДАЧ

| Символ | Значение |
|--------|----------|
| ✅ | Готово |
| 🔄 | В работе |
| 🔴 | Не начато |
| ⚠️ | Частично |

**Общий прогресс: 97% (32/33 задач)**

| Проверка | Статус |
|----------|--------|
| TypeScript `npx tsc --noEmit` | ✅ 0 ошибок |
| Build `npm run build` | ✅ 0 ошибок |
| Unit-тесты `npx vitest run` | ✅ 64/64 |
| Browser-аудит (20+ страниц) | ✅ Все работают |
| Дашборд (SVG-графики) | ✅ Без recharts |
| Отгрузка /warehouse/shipping | ✅ Работает |
| Гантт /production/gantt | ✅ Работает |
| RAL /products/[id] | ✅ Работает |
| Login + Refresh token | ✅ С версионированием |

---

<a id="heading-3"></a>
## 🔵 ФАЗА 1: КРИТИЧЕСКИЕ РАЗРЫВЫ (разрывы в цепочке workflow)

<a id="heading-4"></a>
### 1.1 ✅ nextProductionOrderNumber() в counter.ts
**Файл:** `src/lib/counter.ts`
**Статус:** ✅ Реализовано. Атомарный upsert, race condition исключён.

<a id="heading-5"></a>
### 1.2 ✅ Поля contractId, proposalId в Prisma ProductionOrder
**Файл:** `prisma/schema.prisma`
**Статус:** ✅ Добавлены связи, индексы, обратные связи.

<a id="heading-6"></a>
### 1.3 ✅ API POST /api/contracts/[id]/convert-to-production
**Файл:** `src/app/api/contracts/[id]/convert-to-production/route.ts`
**Статус:** ✅ Реализовано + создаёт детальные OrderTasks из ProductModule → ModuleWorkType, распределяет по рабочим дням.

<a id="heading-7"></a>
### 1.4 ✅ Кнопка «Передать в производство» на странице договора
**Файл:** `src/app/(dashboard)/contracts/[id]/page.tsx`
**Статус:** ✅ Кнопка в шапке, лоадер, success-баннер, скрытие после конвертации.

<a id="heading-8"></a>
### 1.5 ✅ Поле workCenterId в OrderTask + ProductionOrder
**Файл:** `prisma/schema.prisma`
**Статус:** ✅ Добавлено в обе модели с индексами. Задачи привязаны к рабочим центрам.

<a id="heading-9"></a>
### 1.6 ✅ Авто-конвертация КП→ProductionOrder при статусе «оплачено»
**Файл:** `src/app/api/proposals/[id]/route.ts` (PATCH)
**Статус:** ✅ РЕАЛИЗОВАНО. При PATCH статуса 'paid' создаётся ProductionOrder с задачами из модулей товаров. В одной транзакции: проверка дубликатов, создание заказа, обновление статуса. Номер заказа = номер КП (или ЗК-XXXX если занят).

---

<a id="heading-10"></a>
## 🟢 ФАЗА 2: АВТО-НОМЕРА + БЛОКИРОВКИ

<a id="heading-11"></a>
### 2.1 ✅ Авто-номера в формах (7 форм)
**Статус:** ✅ Все формы генерируют номера автоматически.

<a id="heading-12"></a>
### 2.2 ✅ Блокировка номеров в ProposalForm и ContractForm
**Статус:** ✅ Поле readOnly при редактировании.

<a id="heading-13"></a>
### 2.3 ✅ Проверка дубликатов номеров
**Статус:** ✅ Реализовано в API-роутах (findUnique по number).

---

<a id="heading-14"></a>
## 🟢 ФАЗА 3: МОДУЛИ ТОВАРА + СНАБЖЕНИЕ

<a id="heading-15"></a>
### 3.1 ✅ ProductModule — модули/изделия товара
**Файл:** `prisma/schema.prisma`
**Статус:** ✅ Модель создана (id, productId, name, article, width/height/depth, weight, image).

<a id="heading-16"></a>
### 3.2 ✅ ModuleWorkType — виды работ модуля
**Файл:** `prisma/schema.prisma`
**Статус:** ✅ Модель создана (moduleId, workTypeId, estimatedHours, sortOrder).

<a id="heading-17"></a>
### 3.3 ✅ ModuleMaterial — материалы модуля
**Файл:** `prisma/schema.prisma`
**Статус:** ✅ Модель создана (moduleId, name, quantity, unit, isPurchased).

<a id="heading-18"></a>
### 3.4 ✅ Страница редактирования товара с модулями
**Файл:** `src/app/(dashboard)/products/[id]/page.tsx`
**Статус:** ✅ Вкладка «Модули» с CRUD для модулей, видов работ, материалов.

<a id="heading-19"></a>
### 3.5 ✅ Модуль снабжения: авто-список закупок
**Файл:** `src/app/(dashboard)/production/procurement/page.tsx`
**Статус:** ✅ Страница снабжения с авто-формированием списка закупок из модулей.

<a id="heading-20"></a>
### 3.6 ✅ Интеграция снабжения со складом
**Файл:** `src/app/api/procurement-needs/route.ts`
**Статус:** ✅ Расчёт inStock/deficit, интеграция со StorageItem.

---

<a id="heading-21"></a>
## 🟢 ФАЗА 4: ГАНТТ + ПРОИЗВОДСТВО

<a id="heading-22"></a>
### 4.1 ✅ DnD-редактирование сроков на Гантте
**Файл:** `src/components/ui/gantt-chart.tsx`
**Статус:** ✅ Gantt с onItemUpdate, масштаб день/неделя/месяц, today-маркер, цвета статусов.

<a id="heading-23"></a>
### 4.2 ✅ Авто-заполнение Гантта из модулей товара
**Файл:** `src/app/api/contracts/[id]/convert-to-production/route.ts`
**Статус:** ✅ При конвертации создаются OrderTasks из ModuleWorkType с распределением по дням.

<a id="heading-24"></a>
### 4.3 ✅ Статусная модель производства
**Файл:** `src/app/api/production-orders/[id]/status/route.ts`
**Статус:** ✅ Статусы: planned → in_progress → manufacturing → painting → shipping → completed. Валидация переходов. Авто-списание материалов.

<a id="heading-25"></a>
### 4.4 ✅ Панель рабочего «Мои задачи»
**Файл:** `src/app/(dashboard)/production/my-tasks/page.tsx`
**Статус:** ✅ Фильтр по сотруднику, статусы, кнопки «Начать работу» / «Завершить».

---

<a id="heading-26"></a>
## 🟢 ФАЗА 5: РОЛИ + ОТГРУЗКА + ПОКРАСКА

<a id="heading-27"></a>
### 5.1 ✅ Ролевая модель: панели по ролям
**Файлы:** `src/components/layout/sidebar.tsx`, `src/stores/auth-store.ts`
**Статус:** ✅ Sidebar фильтруется по роли: admin — всё, manager — продажи, production — производство, worker — только «Мои задачи».

<a id="heading-28"></a>
### 5.2 ✅ Модуль отгрузки
**Файл:** `src/app/(dashboard)/warehouse/shipping/page.tsx`
**Статус:** ✅ CRUD, создание из ProductionOrder, частичная отгрузка, фото, авто-статус.

<a id="heading-29"></a>
### 5.3 ✅ Модуль покраски (RAL)
**Файлы:** Product, Proposal, ProductionOrder + RalSelector + RalBadge
**Статус:** ✅ RAL на товаре, в КП, в заказе. RalSelector с палитрой 30 цветов, поиск.

<a id="heading-30"></a>
### 5.4 ✅ Закрытие заказа: авто-заполнение + акты
**Файл:** `src/app/(dashboard)/finance/order-closings/page.tsx`
**Статус:** ✅ Выбор заказа → авто-заполнение суммы, примечаний. CrudPage с таблицей.

---

<a id="heading-31"></a>
## 🟡 ФАЗА 6: ИНТЕГРАЦИИ + АНАЛИТИКА

<a id="heading-32"></a>
### 6.1 ✅ API для импорта из CAD-систем
**Файлы:** `src/app/api/import/cad/route.ts` (new), `src/lib/validations/cad-import.ts` (new)
**Статус:** ✅ Реализовано. POST /api/import/cad принимает JSON с products → modules → materials/workTypes. Upsert по sku, полная замена модулей (deleteMany + recreate) для идемпотентности, per-product interactive transaction, дедупликация по sku, pre-validation WorkType, partial-success response. RBAC: withEditor HOF. Zod-схемы .strict() + лимиты (50 товаров, 100 модулей).

<a id="heading-33"></a>
### 6.2 ✅ Дашборд аналитики
**Файлы:** `src/app/(dashboard)/dashboard/page.tsx`, `src/app/api/dashboard/stats/route.ts`
**Статус:** ✅ Статистика по заказам, задачам, предложениям. API aggregation endpoint.

<a id="heading-34"></a>
### 6.3 ✅ История всех действий по заказу
**Файлы:** `prisma/schema.prisma` (OrderHistory, UserActivity), API + logging
**Статус:** ✅ OrderHistory + UserActivity модели, logOrderAction, API для чтения.

---

<a id="heading-35"></a>
## ИТОГ

| Фаза | Статус | Задач |
|------|--------|-------|
| Фаза 1: Критические разрывы | ✅ 6/6 | — |
| Фаза 2: Авто-номера | ✅ 3/3 | — |
| Фаза 3: Модули товара | ✅ 6/6 | — |
| Фаза 4: Гантт | ✅ 4/4 | — |
| Фаза 5: Роли + Отгрузка | ✅ 4/4 | — |
| Фаза 6: Интеграции | ✅ 3/3 | — |
| **ИТОГО** | **✅ 33/33 (100%) 🎉** | **Все задачи завершены** |
| **Проверки** | **TypeScript 0, Build 0, Tests 64/64** | **Browser-аудит: ✅** |
