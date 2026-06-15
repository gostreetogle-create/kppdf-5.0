# BUSINESS-LOGIC: Бизнес-логика KPPDF CRM

> Версия: 1.0
> Дата: 15 июня 2026
> Назначение: единый источник истины по тому, как работают модули

---

## 1. Схема связей модулей

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Товары     │────→│  Витрина КП  │────→│  КП (Proposal)  │
│  Категории  │     │  (Showcase)  │     │                  │
└─────────────┘     │              │     └────────┬─────────┘
                    │  Корзина →   │              │
┌─────────────┐     │  документ    │              ▼
│  Клиенты    │────→│              │     ┌─────────────────┐
│  Организации│     └──────────────┘     │  Договор         │
└─────────────┘                          │  (Contract)      │
                                         └────────┬─────────┘
┌──────────────────┐                              │
│  Шаблоны         │                              ▼
│  документов      │──────────────────→  ┌─────────────────┐
│  (с блоками)     │                      │  PDF генерация  │
└──────────────────┘                      │  + печать       │
                                          └─────────────────┘
┌─────────────────┐
│  Шаблоны таблиц  │──→ Используются в табличных блоках шаблонов
└─────────────────┘
```

---

## 2. Модуль: Товары и категории (Products)

### Назначение
Справочник продукции. Товары бывают двух типов: закупаемые и производимые.

### Модель Product
| Поле | Тип | Описание |
|---|---|---|
| id | string | UUID |
| sku | string | Артикул (уникальный) |
| name | string | Наименование |
| categoryId | string | FK к ProductCategory |
| productType | 'purchased' \| 'manufactured' | Тип товара |
| description | string? | Описание |
| basePrice | number? | Базовая цена |
| defaultMarkupPercent | number? | Наценка по умолчанию % |
| unit | string | Единица измерения |
| weightKg | number? | Вес |
| dimensions | string? | Габариты Д×Ш×В |
| material | string? | Основной материал |
| hasPassport | boolean | Есть паспорт качества |
| hasDrawing | boolean | Есть чертёж |
| photos | ProductPhoto[]? | Фотографии |
| isActive | boolean | Показывать в витрине |
| createdAt | DateTime | Дата создания |
| updatedAt | DateTime | Дата изменения |

### Модель ProductCategory
| Поле | Тип | Описание |
|---|---|---|
| id | string | UUID |
| name | string | Название |
| prefix | string | Префикс для артикула (2 буквы) |
| description | string? | Описание |
| sortOrder | int | Порядок сортировки |
| isActive | boolean | Активна |

### Правила
1. SKU генерируется по маске: `[префикс_категории][4_цифры]`, напр. `SP0001`
2. Тип `purchased` — товар закупается у поставщика
3. Тип `manufactured` — производится на своих мощностях
4. `defaultMarkupPercent` — наценка, которая применяется при добавлении в КП
5. Если товар `isActive = false` — не показывать в витрине

---

## 3. Модуль: Клиенты и Организации

### Назначение
Две сущности: **Организации** (юрлица/ИП) и **Клиенты** (физлица — контактные лица).

### Модель Organization
| Поле | Тип | Описание |
|---|---|---|
| id | string | UUID |
| name | string | Полное наименование |
| shortName | string | Краткое наименование |
| legalForm | string | ООО/АО/ИП и т.д. |
| inn | string | ИНН |
| kpp | string | КПП |
| ogrn | string | ОГРН |
| phone | string | Телефон |
| email | string | Email |
| legalAddress | string | Юридический адрес |
| postalAddress | string | Почтовый адрес |
| bankName | string | Наименование банка |
| bankBik | string | БИК |
| bankAccount | string | Расчётный счёт |
| signerName | string | ФИО подписанта |
| signerPosition | string | Должность подписанта |
| vatRate | number? | Ставка НДС (%) |
| isActive | boolean | Активна |

### Модель Client
| Поле | Тип | Описание |
|---|---|---|
| id | string | UUID |
| lastName | string | Фамилия |
| firstName | string | Имя |
| patronymic | string? | Отчество |
| phone | string | Телефон |
| email | string? | Email |
| inn | string? | ИНН физлица |
| address | string? | Адрес |
| organizationId | string? | FK к Organization |
| personalMarkupPercent | number? | Индивидуальная наценка % |
| notes | string? | Комментарий |
| isActive | boolean | Активен |

### Правила
1. Клиент может быть привязан к организации (тогда он — контактное лицо)
2. `personalMarkupPercent` — если задан, переопределяет `defaultMarkupPercent` товара при создании КП
3. Организация используется в шаблонах документов (чей бланк) и в КП (кто выставляет)

---

## 4. Модуль: Шаблоны таблиц (TableTemplate)

### Назначение
Настраиваемая структура колонок для табличных блоков в документах.

### Модель TableTemplate
```json
{
  "id": "string",
  "name": "string",
  "columns": [
    {
      "id": "string",
      "tableName": "string",      // откуда берутся данные
      "fieldName": "string",       // какое поле
      "label": "string",           // заголовок колонки
      "width": "string?",          // ширина
      "type": "text|number|date|currency",
      "order": "number"
    }
  ]
}
```

### Правила
1. Шаблон таблицы используется в **table-блоке** шаблона документа
2. При рендере документа: колонки заполняются данными из соответствующих полей
3. `tableName` указывает источник данных (products / items / services)

---

## 5. Модуль: Шаблоны документов (DocumentTemplate)

### Назначение
Визуальный шаблон для генерации документов (КП, договор, счёт, отгрузка).
Пользователь собирает документ из блоков на A4 холсте.

### Модель DocumentTemplate
```json
{
  "id": "string",
  "name": "string",
  "description": "string?",
  "docType": "quotation|contract|invoice|shipping",
  "pageSize": "A4|A5|letter",
  "backgroundImages": ["url1", "url2", ...],
  "backgroundOpacity": 1.0,
  "organizationId": "string?",
  "isDefault": false,
  "blocks": [ /* DocBlock[] */ ],
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### DocBlock — виды блоков

**text** — текст/описание/статья документа
```
{
  id, type: 'text', order: N,
  content: "HTML-строка или простой текст",
  columns: [ /* DocTextColumn[] */ ],
  settings: { padding, fontSize, align }
}
```

**table** — таблица с данными (связана с шаблоном таблицы)
```
{
  id, type: 'table', order: N,
  title: "Спецификация товаров",
  tableTemplateId: "ссылка на TableTemplate",
  settings: { padding, fontSize, align }
}
```
В runtime:
- `_inlineRows` — строки данных для заполнения
- `_footerRows` — итоговые строки (Всего, Скидка, НДС, Итого)
- `_columnSummaries` — суммы по числовым колонкам

**separator** — разделитель
```
{
  id, type: 'separator', order: N,
  height: 20,         // px
  showLine: false      // показывать линию
}
```

### DocTextColumn — колонка текстового блока
```
{
  id, content, width: "50%",
  textAlign: "left|center|right",
  fontWeight: "normal|bold",
  fontStyle: "normal|italic",
  textDecoration: "none|underline",
  color: "#hex"
}
```

### DocBlockSettings
```
{
  padding: "8px 12px",
  fontSize: "14px",
  align: "left|center|right"
}
```

### Правила
1. `isDefault` — шаблон автоматически выбирается при создании нового документа этого типа
2. `backgroundImages` — массив URL, по одному на страницу (первый — для всех страниц)
3. `backgroundOpacity` — применяется ко всем фоновым изображениям
4. В режиме редактирования: блоки отображаются как на A4, с возможностью перетаскивания
5. В режиме просмотра/печати: фоновые изображения и блоки формируют готовый документ
6. При создании КП: если выбран шаблон, его блоки формируют основу документа, а данные подставляются в table-блоки

### Бизнес-поток: от шаблона к документу
```
1. Пользователь выбирает шаблон для КП
2. Шаблон загружается с сервера (blocks)
3. Система находит table-блоки с tableTemplateId
4. В table-блок подставляются _inlineRows из корзины (ProposalShowcase)
5. Рассчитываются _footerRows: Итого, НДС, Скидка, Всего к оплате
6. Документ отображается на A4 Canvas
7. Пользователь может скачать PDF или создать КП в БД
```

---

## 6. Модуль: Витрина КП / Showcase

### Назначение
Интерактивная страница оформления коммерческого предложения.
Товары слева → корзина (свёрнутый список) → живой A4 canvas справа с предпросмотром.

### Поток данных
```
Продукты (слева)
  │
  ├── поиск, фильтр по категории/типу
  │
  ├── клик → addToCart (CartService)
  │
  ├── корзина → строки для table-блока
  │
  ├── Выбор организации → определяет:
  │     ├── какие шаблоны доступны (фильтр по organizationId)
  │     └── ставка НДС (vatRate из Organization)
  │
  ├── Выбор шаблона → загружает blocks → A4 Canvas рендер
  │
  ├── Выбор клиента → если personalMarkupPercent > 0 → применяется к ценам
  │
  ├── Настройки документа:
  │     ├── глобальная скидка % → пересчёт итогов
  │     ├── заголовок
  │     └── срок действия
  │
  ├── A4 Canvas (справа):
  │     ├── блоки из шаблона
  │     ├── таблица с товарами (строки из корзины)
  │     ├── footer: Итого, Скидка, НДС, Всего
  │     └── двойной клик по строке → диалог редактирования
  │
  └── Действия:
        ├── Скачать PDF (через generateProposalPdf)
        ├── Предпросмотр (модалка)
        └── Создать КП (сохранить в БД)
```

### Расчёты
```
Цена с наценкой = basePrice × (1 + markupPercent / 100)
    где markupPercent = max(client.personalMarkupPercent, product.defaultMarkupPercent)

Сумма позиции = Цена с наценкой × quantity

Скидка = ∑(суммы позиций) × discountPercent / 100

НДС = (∑(суммы позиций) − скидка) × vatRate / (100 + vatRate)

Итого = ∑(суммы позиций) − скидка
```

---

## 7. Модуль: КП и Договоры (Proposals / Contracts)

### Модель Proposal
```json
{
  "id": "string",
  "number": "string (уникальный)",
  "title": "string?",
  "status": "draft|sent|approved|rejected",
  "organizationId": "string?",
  "clientId": "string?",
  "templateId": "string?",
  "items": [
    {
      "id", "productId", "sku", "name", "unit",
      "quantity", "unitPrice", "markupPercent", "total"
    }
  ],
  "totalAmount": "number",
  "discountPercent": "number?",
  "vatRate": "number?",
  "notes": "string?",
  "validUntil": "string?",
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### Правила
1. Номер КП генерируется автоматически: `КП-{год}-{XXXX}`, где XXXX — счётчик
2. Статус меняется: draft → sent → approved/rejected
3. При создании из корзины: снэпшот цен фиксируется (item.unitPrice — цена на момент создания)
4. Если был выбран templateId — все блоки шаблона сохраняются в Proposal отдельно (для PDF)
5. Можно скачать PDF из шаблона или из снэпшота

---

## 8. Модуль: PDF генерация

### Архитектура
```
Данные (ProposalPdfData / ContractPdfData)
        │
        ▼
  generateProposalPdf(data) → jsPDF документ
  generateContractPdf(data) → jsPDF документ
        │
        ├── html2canvas (если есть HTML блоки)
        └── jspdf (A4, таблицы, подписи)
        │
        ▼
  downloadPdf(doc, filename) → скачивание
```

### Правила
1. Размер: A4 (210 × 297 мм)
2. Шрифт: поддерживает кириллицу (шрифт Roboto или Noto Sans)
3. Отступы: 20мм со всех сторон
4. Шапка: логотип организации (если есть) + реквизиты
5. Таблица: наименование, кол-во, ед., цена, сумма
6. Подвал: Итого, НДС, Всего к оплате, подпись
7. Если выбран шаблон с блоками — блоки встраиваются в PDF

---

## 9. Модуль: Производство (Production)

> Документировать после завершения этапа шаблонов и КП

- ProductionOrder — производственный заказ
- OrderTask — задача по заказу (рабочий, работа, статус)
- WorkCenter — рабочее место
- Worker — работник
- WorkType — вид работы
- Гантт-чарт — визуализация задач на временной шкале

---

## 10. Типы документов (DocType)

Системные типы, к которым привязываются шаблоны:

| slug | name | Назначение |
|---|---|---|
| quotation | Коммерческое предложение | Основной документ продаж |
| contract | Договор | Договор поставки/услуг |
| invoice | Счёт | Счёт на оплату |
| shipping | Отгрузка | Отгрузочные документы |

---

## 11. Принципы работы с данными

### Сохранение черновиков
- Каждые 2 секунды — автосохранение в localStorage
- Ключ: `kppdf:draft:{module}:{id?}`
- При загрузке страницы — проверка черновика
- После успешного сохранения в БД — черновик удаляется

### Undo/Redo
- Стек изменений блоков (макс 50)
- Ctrl+Z — undo
- Ctrl+Shift+Z — redo
- После нового изменения после undo — redo стек очищается

### Обработка ошибок
- Все API запросы — try/catch
- Показывать уведомление пользователю
- Не терять данные при ошибке (сохранять в localStorage как черновик)
