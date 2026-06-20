# Карта аудита UI — Фаза 1 (ПП)

**Дата**: 2026-06-20
**Аудитор**: MiMo Code Agent

---

## Результат аудита

**Всего найдено**: 69 хардкод-цветов в 10 файлах

### Категория 1: `text-gray-500/600` — метки полей (19 шт)

| Файл | Кол-во | Контекст |
|------|--------|----------|
| `proposals/[id]/page.tsx` | 7 | Метки полей: "Клиент", "Наценка", "Создано" и т.д. |
| `contracts/[id]/page.tsx` | 6 | Метки полей: "Заказчик", "Сумма", "Создан" и т.д. |
| `contract-preview.tsx` | 2 | Организация (ИНН, адрес), дата договора |
| `admin/inventor-files/page.tsx` | 1 | Fallback цвет для неизвестного типа файла |

**Замена**: `text-gray-500/600` → `text-muted-foreground`

### Категория 2: `bg-gray-100` — фон таблицы (1 шт)

| Файл | Контекст |
|------|----------|
| `contract-preview.tsx:96` | Фон строки "Итого" в таблице |

**Замена**: `bg-gray-100` → `bg-muted`

### Категория 3: Семантические статус-цвета (49 шт)

| Цвет | Кол-во | Назначение | Замена |
|------|--------|------------|--------|
| `text-red-*` | 17 | Ошибки, дедлайн, дефицит | `text-destructive` |
| `text-green-*` | 8 | Успех, выполнено | `text-success` |
| `text-blue-*` | 5 | Инфо, тип данных | `text-info` |
| `text-emerald-*` | 6 | Производство, валюта | `text-success` |
| `text-purple-*` | 2 | Иконки типов | `text-primary` |
| `text-violet-*` | 3 | Даты, рабочие центры | `text-primary` |
| `text-teal-*` | 2 | Виды работ | `text-info` |
| `text-amber-*` | 1 | Исполнитель | `text-warning` |
| `text-orange-*` | 1 | Тип файла | `text-warning` |
| `bg-emerald-*` | 3 | Кнопка CTA | `bg-success` |
| `border-green-*` | 1 | Завершённая задача | `border-success` |

### Категория 4: Hover-состояния удаления (6 шт)

| Файл | Контекст |
|------|----------|
| `warehouse/shipping/page.tsx` | Кнопка "Удалить" |
| `production/modules/page.tsx` | Кнопки удаления работ/материалов |
| `finance/order-closings/page.tsx` | Кнопка "Удалить" |
| `contracts/[id]/page.tsx` | Кнопка закрытия ошибки |

**Замена**: `hover:text-red-500` → `hover:text-destructive`

### Категория 5: Оверлеи — БЕЗ ИЗМЕНЕНИЙ (10 шт)

`bg-black/20`, `bg-black/50`, `bg-white/25`, `bg-white/30` — intentional overlays, корректны в обеих темах.

---

## Итого по исправлениям

| Приоритет | Тип | Кол-во | Действие |
|-----------|-----|--------|----------|
| P0 | `text-gray-*` | 21 | → `text-muted-foreground` |
| P1 | `text-red-*` | 17 | → `text-destructive` |
| P2 | `text-green-*` + `text-emerald-*` | 14 | → `text-success` |
| P3 | `text-blue-*` + `text-teal-*` | 7 | → `text-info` |
| P4 | `text-purple-*` + `text-violet-*` | 5 | → `text-primary` |
| P5 | `text-amber-*` + `text-orange-*` | 2 | → `text-warning` |
| P6 | `bg-emerald-*` + `bg-gray-*` | 4 | → `bg-success` / `bg-muted` |
| P7 | `border-green-*` | 1 | → `border-success` |
| P8 | `hover:text-red-*` | 6 | → `hover:text-destructive` |
| - | Overlays `bg-black/white` | 10 | Оставить как есть |

**Всего к исправлению**: 59 хардкод-цветов (из 69; 10 оверлеев — ок)
