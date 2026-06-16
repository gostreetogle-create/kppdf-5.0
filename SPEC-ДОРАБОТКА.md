# SPEC-ДОРАБОТКА: Анализ v4.0 → v5.0 и план доведения до качества

> Дата: 15 июня 2026
> Статус: 🟢 Завершено
> Следующая проверка: после завершения каждого модуля

---

## 1. Сравнительная таблица: v4.0 vs v5.0

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

### 1.3 Шаблоны таблиц

| Функция | v4.0 | v5.0 | Что нужно |
|---|---|---|---|
| API | ✅ CRUD | ✅ MiMo сделал | OK |
| Редактор колонок | ✅ tableName + fieldName + label + width + order | ❌ НЕТ | 🔴 **Создать** |
| Связь с документ-шаблоном | ✅ DocBlock.tableTemplateId | ❌ НЕТ | Нужно |

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

## 2. План доработки по этапам

### Этап 1 — Модели данных + API (сейчас)

Сделать сегодня:
- [x] **Обновить Prisma schema**: DocumentTemplate, DocBlock, DocTextColumn, TableTemplate (MiMo создал, проверить)
- [x] **API для шаблонов документов**: CRUD + clone + preview (MiMo)
- [x] **API для шаблонов таблиц**: CRUD (MiMo создал ✅)
- [x] **Добавить поля в Proposal**: templateId, discountPercent, vatRate

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

### Этап 3 — Доработка Proposal Showcase (Я)

- [x] Заменить правую панель на A4 Canvas с блоками из шаблона
- [x] Двойной клик по таблице → диалог редактирования
- [x] Глобальная скидка + НДС
- [x] Персональная наценка клиента
- [x] Автовыбор шаблона
- [x] Скачать PDF из canvas

---

## 3. Критические замечания

1. **Нельзя двигаться дальше, пока этап 1-3 не сделан качественно**. Ни Гантт, ни склад, ни финансы — пока шаблоны документов и КП не работают как в v4.0 или лучше.

2. **Каждый модуль перед сдачей**: typecheck ✅ → тест в браузере ✅ → code review ✅

3. **Тесты** — v4.0 имела spec.ts файлы на каждый сервис. Нужно вернуть практику.

4. **Автосохранение черновиков** — критически важно для UX. Без него пользователь теряет данные при случайном закрытии.

---

## 4. Распределение между ИИ

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
