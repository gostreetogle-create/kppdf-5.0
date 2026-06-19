<a id="heading-1"></a>
# ЧЕК-ЛИСТ-МИГРАЦИИ.md — Перенос функционала из v4.0 в v5.0
## Index of Sections / Содержание

_Авто-генерированный TOC. Якоря: `<a id="heading-N">` ordinal anchors, портативны во всех markdown-рендерерах (GitHub / GitLab / VSCode / Typora). Перегенерация: `perl scripts/inject-md-toc.pl <file>` (идемпотентно — перед новой вставкой удаляет старые anchor-markers + старый TOC-блок)._

**Всего headings:** 19 (# = 1, ## = 14, ### = 4).

- [ЧЕК-ЛИСТ-МИГРАЦИИ.md — Перенос функционала из v4.0 в v5.0](#heading-1)
- [Легенда](#heading-2)
- [1. 🟢 Аутентификация и пользователи](#heading-3)
- [2. 🟢 PROPOSAL SHOWCASE — Оформление КП (САМОЕ ВАЖНОЕ)](#heading-4)
- [3. 🟢 PDF генерация документов](#heading-5)
- [4. 🟢 Визуальный редактор шаблонов документов (Document Templates)](#heading-6)
- [5. 🟢 Шаблоны таблиц (Table Templates)](#heading-7)
- [6. 🟢 Гантт-чарт для производства](#heading-8)
- [7. 🟢 Производство (базовое — уже есть в v5.0)](#heading-9)
- [8. 🟢 Финансовый модуль](#heading-10)
- [9. 🟢 Склад (расширение)](#heading-11)
- [10. 🟢 Администрирование (расширение)](#heading-12)
- [11. 🟢 UI/UX улучшения](#heading-13)
- [12. 🟢 Уже готово для старта](#heading-14)
- [План миграции по этапам](#heading-15)
  - [Этап 1 (Ядро — 2-3 дня)](#heading-16)
  - [Этап 2 (Расширение — 3-4 дня)](#heading-17)
  - [Этап 3 (Склад + Админка — 2-3 дня)](#heading-18)
  - [Этап 4 (Полировка — 1-2 дня)](#heading-19)

---



<a id="heading-2"></a>
## Легенда
- 🔴 v5.0 не имеет / не реализовано
- 🟡 v5.0 имеет частично
- 🟢 v5.0 уже реализовано

---

<a id="heading-3"></a>
## 1. 🟢 Аутентификация и пользователи
- [x] JWT access + refresh токены
- [x] bcrypt хэширование паролей
- [x] Role-based guard (requireAuth, requireRole)
- [x] Логин / логаут
- [x] Текущий пользователь (getCurrentUser)
- [x] Seed пользователей (admin/manager)

<a id="heading-4"></a>
## 2. 🟢 PROPOSAL SHOWCASE — Оформление КП (САМОЕ ВАЖНОЕ)

**UI/Фронтенд:**
- [x] Страница оформления КП с layout: товары слева / сборка КП справа
- [x] Поиск и фильтрация товаров по категориям и типу
- [x] Карточки товаров с ценой, единицей измерения
- [x] Добавление товара в корзину (сессия КП)
- [x] Drag-and-drop шаблонов документов на КП (A4Canvas — интегрирован в Proposal Showcase)
- [x] Подстановка полей организации, клиента, шаблона
- [x] Настройка наценки (%)
- [x] Персональная наценка клиента (personalMarkupPercent)
- [x] Глобальная скидка на КП (слайдер 0-30%)
- [x] Расчёт НДС (выделение из суммы, ставка из организации)
- [x] Разбивка итогов: Сумма → Скидка → НДС → Итого к оплате
- [x] Диалог редактирования строки (кол-во, цена, наценка)
- [x] Диалог настроек (скидка, информация о товарах)
- [x] Предпросмотр PDF (модалка с DocPreview)
- [x] Скачать PDF (generateProposalPdf)
- [x] Создание КП (сохранение в БД)

**API/Бэкенд:**
- [x] CartSession + CartItem API (создание, корзина, товары)
- [x] API создания КП из корзины (convert)
- [x] API статусов КП (PATCH /api/proposals/[id] с валидацией переходов)
- [x] Генерация номера КП (КП-YYYY-NNN)
- [x] API PDF генерации (через библиотеку на клиенте)

<a id="heading-5"></a>
## 3. 🟢 PDF генерация документов
- [x] Установка html2canvas + jsPDF
- [x] Компонент предпросмотра документа
- [x] Шаблон КП для PDF (лого, реквизиты, таблица товаров, подпись)
- [x] Шаблон договора для PDF
- [x] Шаблон счёта для PDF (generateInvoicePdf в src/lib/pdf/index.ts)
- [x] Кнопка "Скачать PDF" на страницах КП/договора

<a id="heading-6"></a>
## 4. 🟢 Визуальный редактор шаблонов документов (Document Templates)
- [x] A4Page — A4 страница 210×297мм с фоном и прозрачностью
- [x] A4Canvas — dnd-kit drag&drop, рендер блоков, выделение
- [x] SortableBlock — grip handle, кнопки edit/delete, 3 типа блоков
- [x] TextBlockDialog — мультиколонки, ширина%, выравнивание, жирность, курсив, цвет
- [x] TableBlockDialog — выбор шаблона таблицы, заголовок, высота
- [x] SeparatorBlockDialog — высота, линия
- [x] useUndoRedo — 50 шагов, Ctrl+Z / Ctrl+Shift+Z
- [x] useDraftAutosave — localStorage каждые 2с, восстановление
- [x] BlockEditor — интеграция всего, кнопки добавления блоков
- [x] Страница списка шаблонов `/admin/templates`
- [x] Страница редактора `/admin/templates/[id]`
- [x] API CRUD для DocumentTemplate (GET, POST, PUT, DELETE)
- [x] API для DocTypes
- [x] TypeScript 0 ошибок, сборка проходит

<a id="heading-7"></a>
## 5. 🟢 Шаблоны таблиц (Table Templates)
- [x] API CRUD для TableTemplate (GET, POST, PUT, DELETE)
- [x] Страница списка `/admin/table-templates`
- [x] Страница редактора `/admin/table-templates/[id]`
  - Drag&Drop колонок
  - Настройка типа (текст, число, дата, валюта)
  - Настройка ширины
  - Предпросмотр таблицы
- [x] Prisma schema — TableTemplate с JSON полем columns
- [x] Навигация в сайдбаре (ссылка "Шаблоны таблиц")

<a id="heading-8"></a>
## 6. 🟢 Гантт-чарт для производства
- [x] Компонент Гантт-чарта
- [x] Масштаб: день / неделя / месяц
- [x] Drag-and-drop для изменения дат задач
- [x] Drag-and-drop для изменения длительности
- [x] Группировка по типам работ / заказам
- [x] Фильтр по статусу задач
- [x] Цветовая кодировка статусов
- [x] Всплывающая подсказка (tooltip) при наведении
- [x] Кнопка создания нового заказа

<a id="heading-9"></a>
## 7. 🟢 Производство (базовое — уже есть в v5.0)
- [x] Prisma schema: WorkType, WorkCenter, Worker, ProductionOrder, OrderTask
- [x] API CRUD для всех сущностей
- [x] Страницы списков (work-types, work-centers, workers)
- [x] Страницы заказов и задач

<a id="heading-10"></a>
## 8. 🟢 Финансовый модуль
- [x] Дашборд финансов
- [x] API и UI для закрытия заказов (OrderClosing)
- [x] API и UI для актов сверки (ReconciliationAct)
- [x] API и UI для финансовых отчётов (FinancialReport)
- [x] Экспорт отчётов

*Prisma schema уже содержит все модели.*

<a id="heading-11"></a>
## 9. 🟢 Склад (расширение)
- [x] Дашборд склада (остатки по складам)
- [x] CRUD для складов (Warehouse)
- [x] API и UI для заявок на закупку (PurchaseRequest)
- [x] API и UI для заказов поставщикам (SupplierOrder)
- [x] API и UI для входящих счетов (IncomingInvoice)
- [x] Управление остатками (StorageItem)

*Prisma schema уже содержит все модели.*

<a id="heading-12"></a>
## 10. 🟢 Администрирование (расширение)
- [x] CRUD для DocTypes
- [x] CRUD для тендеров
- [x] Feature Flags (пока только seed)
- [x] CRUD для пользователей (User management)
- [x] CRUD для статусов (StatusWorkflow)
- [x] CRUD для RPP записей
- [x] CRUD для сертификатов (Certificate)
- [x] CRUD для CAD-файлов (InventorFile)
- [x] Мониторинг-дашборд админа (admin/page.tsx)

<a id="heading-13"></a>
## 11. 🟢 UI/UX улучшения
- [x] Единая цветовая схема (кастомные CSS variables)
- [x] Анимации переходов и hover-эффекты
- [x] Loading skeleton для всех страниц
- [x] Confirm-диалоги при удалении (компонент ConfirmDialog)
- [x] Toast уведомления (уже есть компонент)
- [x] Breadcrumbs навигация (компонент Breadcrumbs в dashboard-layout)
- [x] Date picker (уже есть компонент)
- [x] Форматирование дат (formatDate, formatDateTime в utils.ts)
- [x] Форматирование валют (formatCurrency в utils.ts)
- [x] App Guide — встроенная документация (компонент AppGuide)

<a id="heading-14"></a>
## 12. 🟢 Уже готово для старта
- [x] Prisma schema — покрывает все модели из v4.0
- [x] Auth — JWT, cookies, guard
- [x] UI компоненты — базовый набор
- [x] API-структура — все основные endpoint'ы
- [x] Типы — TypeScript типы для всех сущностей
- [x] Seed данные — тестовое наполнение БД
- [x] SQLite dev.db — работает

---

<a id="heading-15"></a>
## План миграции по этапам

<a id="heading-16"></a>
### Этап 1 (Ядро — 2-3 дня)
1. Proposal Showcase (корзина + КП)
2. PDF генерация
3. Визуальный редактор шаблонов док-в

<a id="heading-17"></a>
### Этап 2 (Расширение — 3-4 дня)
4. Шаблоны таблиц
5. Гантт-чарт
6. Финансовый модуль

<a id="heading-18"></a>
### Этап 3 (Склад + Админка — 2-3 дня)
7. Складской модуль (расширение)
8. Администрирование (CRUD пользователи, статусы, сертификаты, RPP, CAD)

<a id="heading-19"></a>
### Этап 4 (Полировка — 1-2 дня)
9. UI/UX: анимации, цвета, адаптивность
10. App Guide
11. Тестирование и отладка
