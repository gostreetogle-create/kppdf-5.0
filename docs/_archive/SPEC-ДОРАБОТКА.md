<a id="heading-1"></a>
# SPEC-ДОРАБОТКА: Анализ v4.0 → v5.0 и план доведения до качества
## Index of Sections / Содержание

_Авто-генерированный TOC. Якоря: `<a id="heading-N">` ordinal anchors, портативны во всех markdown-рендерерах (GitHub / GitLab / VSCode / Typora). Перегенерация: `perl scripts/inject-md-toc.pl <file>` (идемпотентно — перед новой вставкой удаляет старые anchor-markers + старый TOC-блок)._

**Всего headings:** 15 (# = 1, ## = 5, ### = 9).

- [SPEC-ДОРАБОТКА: Анализ v4.0 → v5.0 и план доведения до качества](#heading-1)
- [1. Сравнительная таблица: v4.0 vs v5.0](#heading-2)
  - [1.1 Визуальный редактор шаблонов документов ⚠️ КРИТИЧЕСКИЙ ПРОВАЛ](#heading-3)
  - [1.2 Proposal Showcase (Оформление КП)](#heading-4)
  - [1.3 Шаблоны таблиц](#heading-5)
  - [1.4 Модели данных (Prisma schema)](#heading-6)
- [2. План доработки по этапам](#heading-7)
  - [Этап 1 — Модели данных + API (сейчас)](#heading-8)
  - [Этап 2 — Визуальный редактор шаблонов документов (MiMo + Я)](#heading-9)
  - [Этап 3 — Доработка Proposal Showcase (Я)](#heading-10)
- [3. Критические замечания](#heading-11)
- [4. Распределение между ИИ](#heading-12)
  - [MiMo Code Agent (сильные стороны):](#heading-13)
  - [Buffy (мои сильные стороны):](#heading-14)
- [5. Чек-лист качества](#heading-15)

---



> Дата: 15 июня 2026
> Статус: 🟢 Завершено
> Следующая проверка: после завершения каждого модуля

---

<a id="heading-2"></a>
## 1. Сравнительная таблица: v4.0 vs v5.0

<a id="heading-3"></a>
### 1.1 Визуальный редактор шаблонов документов ⚠️ КРИТИЧЕСКИЙ ПРОВАЛ

| Функция | v4.0 (Angular) | v5.0 (наш) | Что нужно |
|---|---|---|---|
| Drag-and-drop блоков (текст/таблица/разделитель) | ✅ kp-doc-canvas + cdkDropList | ❌ НЕТ | Создать A4 canvas с DnD |
| Текстовые блоки с мульти-колонками | ✅ DocTextColumn (ширина, выравнивание, жирность, курсив, подчёркивание, цвет) | ❌ НЕТ | Rich text редактор |
| Табличные блоки, привязанные к шаблону таблицы | ✅ tableTemplateId → рендер колонок | ❌ НЕТ | Связать table-templates API с блоками |
| Разделители (высота + линия) | ✅ separator: height, showLine | ❌ НЕТ | Простой блок-разделитель |
| Фоновые изображения по страницам | ✅ массив backgroundImages, перетаскивание, прозрачность | ❌ НЕТ | Загрузка + drag-reorder + слайдер opacity |
| Undo/Redo (50 шагов) | ✅ UndoRedoStack + Ctrl+Z/Ctrl+Shift+Z | ❌ НЕТ | История изменений |
| Автосохранение черновиков в localStorage | ✅ каждые 2с, восстановление при входе | ❌ НЕТ | Draft система |
| Предпросмотр документа | ✅ kp-doc-preview-dialog | ✅ DocPreview (минимальный) | Доделать до уровня v4.0 |
| Предпросмотр PDF | ✅ через jsPDF | ✅ generateProposalPdf | Доработать для шаблонов |
| Клонирование шаблона | ✅ cloneTemplate API | ❌ НЕТ | Добавить |
| Тесты | ✅ spec.ts на компонент + сервис | ❌ НЕТ | Добавить |

<a id="heading-4"></a>
### 1.2 Proposal Showcase (Оформление КП)

| Функция | v4.0 | v5.0 (наш) | Что нужно |
|---|---|---|---|
| Сетка товаров слева | ✅ | ✅ | Нормально |
| Поиск + фильтры | ✅ | ✅ | Нормально |
| **Живой A4 Canvas справа** | ✅ kp-doc-canvas с блоками из шаблона | ❌ **Только модалка** | 🔴 **Критично: переделать** |
| **Редактирование строки с CANVAS** | ✅ двойной клик по таблице → диалог | ❌ **НЕТ** | 🔴 **Критично** |
| **Глобальная скидка** | ✅ discountPercent + discountAmount | ❌ **НЕТ** | 🔴 **Нужно** |
| **Расчёт НДС** | ✅ vatRate + ndsAmount (выделение из суммы) | ❌ **НЕТ** | 🔴 **Нужно** |
| Персональная наценка клиента | ✅ personalMarkupPercent | ❌ НЕТ | Нужно |
| "Сохранить как копию" при редактировании | ✅ saveEditItemAsCopy() | ❌ НЕТ | Нужно |
| Автовыбор шаблона по организации | ✅ templateOptions фильтр по orgId | ❌ НЕТ | Нужно |
| Создание КП из корзины | ✅ | ✅ | Нормально |

<a id="heading-5"></a>
### 1.3 Шаблоны таблиц

| Функция | v4.0 | v5.0 | Что нужно |
|---|---|---|---|
| API | ✅ CRUD | ✅ MiMo сделал | OK |
| Редактор колонок | ✅ tableName + fieldName + label + width + order | ❌ НЕТ | 🔴 **Создать** |
| Связь с документ-шаблоном | ✅ DocBlock.tableTemplateId | ❌ НЕТ | Нужно |

<a id="heading-6"></a>
### 1.4 Модели данных (Prisma schema)

v4.0 (MongoDB Mongoose) → v5.0 (Prisma SQLite). Что нужно добавить:

```
DocumentTemplate:
  name, description, docType, pageSize, backgroundImages[], organizationId,
  isDefault, backgroundOpacity, blocks[]:
    - id, type(text|table|separator), order, title, content,
    - columns[]: id, content, width, textAlign, fontWeight, fontStyle, textDecoration, color
    - tableTemplateId, height, showLine, settings: {padding, fontSize, align}

TableTemplate:
  name, columns[]: tableName, fieldName, label, width, order
```

Proposal model — добавить:
- templateId (уже есть в body, не сохраняется)
- discountPercent
- vatRate
- clientMarkupPercent

---

<a id="heading-7"></a>
## 2. План доработки по этапам

<a id="heading-8"></a>
### Этап 1 — Модели данных + API (сейчас)

Сделать сегодня:
- [x] **Обновить Prisma schema**: DocumentTemplate, DocBlock, DocTextColumn, TableTemplate (MiMo создал, проверить)
- [x] **API для шаблонов документов**: CRUD + clone + preview (MiMo)
- [x] **API для шаблонов таблиц**: CRUD (MiMo создал ✅)
- [x] **Добавить поля в Proposal**: templateId, discountPercent, vatRate

<a id="heading-9"></a>
### Этап 2 — Визуальный редактор шаблонов документов (MiMo + Я)

- [x] Компонент A4 Canvas (kp-doc-canvas) — Next.js версия
- [x] Drag-and-drop блоков (dnd-kit библиотека)
- [x] Редактор текстового блока (rich text с колонками)
- [x] Редактор табличного блока (выбор шаблона)
- [x] Редактор разделителя
- [x] Загрузка фоновых изображений + drag-reorder + opacity
- [x] Undo/Redo стек
- [x] Автосохранение в localStorage
- [x] Предпросмотр документа
- [x] Страница списка + редактор

<a id="heading-10"></a>
### Этап 3 — Доработка Proposal Showcase (Я)

- [x] Заменить правую панель на A4 Canvas с блоками из шаблона
- [x] Двойной клик по таблице → диалог редактирования
- [x] Глобальная скидка + НДС
- [x] Персональная наценка клиента
- [x] Автовыбор шаблона
- [x] Скачать PDF из canvas

---

<a id="heading-11"></a>
## 3. Критические замечания

1. **Нельзя двигаться дальше, пока этап 1-3 не сделан качественно**. Ни Гантт, ни склад, ни финансы — пока шаблоны документов и КП не работают как в v4.0 или лучше.

2. **Каждый модуль перед сдачей**: typecheck ✅ → тест в браузере ✅ → code review ✅

3. **Тесты** — v4.0 имела spec.ts файлы на каждый сервис. Нужно вернуть практику.

4. **Автосохранение черновиков** — критически важно для UX. Без него пользователь теряет данные при случайном закрытии.

---

<a id="heading-12"></a>
## 4. Распределение между ИИ

<a id="heading-13"></a>
### MiMo Code Agent (сильные стороны):
✅ Создание API роутов (table-templates сделал)
✅ PDF генерация (jspdf, html2canvas — сделал отлично)
✅ UI компоненты (DocPreview, ProposalPreview)
✅ Страницы детального просмотра

**Поручить MiMo:**
1. ✏️ **Визуальный редактор шаблонов документов** (самая большая задача)
2. 🔧 **API DocumentTemplate CRUD + clone**
3. 📄 **Редизайн PDF генерации** — использовать шаблоны документов
4. 🧪 **Тесты** на свои модули

<a id="heading-14"></a>
### Buffy (мои сильные стороны):
✅ Сложные Next.js страницы с состоянием
✅ Prisma schema + миграции
✅ Интеграция API + UI
✅ Code review

**Я беру:**
1. 📊 **Proposal Showcase** — полная доработка до уровня v4.0
2. 🗄️ **Prisma schema** — DocumentTemplate + DocBlock модели
3. 🔄 **Интеграция** — связать шаблоны с Proposal Showcase
4. 👁️ **Code review** всего что делает MiMo

---

<a id="heading-15"></a>
## 5. Чек-лист качества

Перед тем как считать модуль готовым:
- [x] TypeScript `tsc --noEmit` — 0 ошибок
- [x] Все API протестированы (браузер / curl)
- [x] Нет неиспользуемых импортов
- [x] Нет закомментированного кода
- [x] Обработка ошибок (try/catch, error state)
- [x] Loading state (skeleton / spinner)
- [x] Empty state (нет данных)
- [x] Адаптивность (mobile/tablet/desktop)
- [x] Предусмотрены edge cases (0 товаров, удаление последнего и т.д.)
- [x] Undo/Redo (где применимо)
- [x] Draft autosave (где применимо)
