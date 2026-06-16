# 🎨 KPPDF UI Kit — Design System

> Версия: 1.0.0  
> Стек: Next.js 16 + React 19 + Tailwind CSS 4 + Lucide Icons  
> Путь: `src/components/ui/`

---

## 1. Дизайн-токены

Все токены определены в `src/app/globals.css` как CSS-переменные и продублированы в `@theme inline {}` для Tailwind 4.

### 1.1 Цвета

| Токен | CSS-переменная | Tailwind | Описание |
|-------|----------------|----------|----------|
| Background | `--background` | `bg-background` | Основной фон |
| Foreground | `--foreground` | `text-foreground` | Основной текст |
| Primary | `--primary` | `bg-primary` | Акцентный цвет |
| Primary FG | `--primary-foreground` | `text-primary-foreground` | Текст на primary |
| Secondary | `--secondary` | `bg-secondary` | Вторичный фон |
| Secondary FG | `--secondary-foreground` | `text-secondary-foreground` | Текст на secondary |
| Card | `--card` | `bg-card` | Фон карточек |
| Card FG | `--card-foreground` | `text-card-foreground` | Текст на карточках |
| Border | `--border` | `border-border` | Границы |
| Input | `--input` | `border-input` | Границы полей ввода |
| Ring | `--ring` | `ring-ring` | Фокусные кольца |
| Muted | `--muted` | `bg-muted` | Приглушённый фон |
| Muted FG | `--muted-foreground` | `text-muted-foreground` | Приглушённый текст |
| Destructive | `--destructive` | `bg-destructive` | Ошибки/удаление |
| Destructive FG | `--destructive-foreground` | `text-destructive-foreground` | Текст на destructive |
| Success | `--success` | `bg-success` | Успех |
| Warning | `--warning` | `bg-warning` | Предупреждение |
| Info | `--info` | `bg-info` | Информация |

### 1.2 Тема (светлая/тёмная)

```css
/* Светлая тема (по умолчанию) */
:root { /* ...токены... */ }

/* Тёмная тема */
[data-theme="dark"] { /* ...токены... */ }
```

Переключение: `document.documentElement.setAttribute('data-theme', 'dark')`

### 1.3 Типографика

| Свойство | Значение |
|----------|----------|
| Шрифт | `var(--font-geist-sans)` (system-ui fallback) |
| Моноширинный | `var(--font-geist-mono)` |
| Размеры | Tailwind: `text-xs`(12px), `text-sm`(14px), `text-base`(16px), `text-lg`(18px), `text-xl`(20px), `text-2xl`(24px) |

### 1.4 Скругления

| CSS-переменная | Значение | Tailwind |
|----------------|----------|----------|
| `--radius` | `0.5rem` | `rounded-lg` |

### 1.5 Анимации

| Класс | Описание |
|-------|----------|
| `.animate-fadeIn` | Появление сдвигом 4px вверх, 0.2s |
| `.animate-spin` | Вращение 360°, 1s linear infinite |

---

## 2. Компоненты

### 2.1 Button

**Путь:** `src/components/ui/button.tsx`  
**Экспорт:** `Button`

Универсальная кнопка с поддержкой вариантов, размеров, загрузки и иконок.

```tsx
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

<Button>Сохранить</Button>
<Button variant="destructive" size="sm">Удалить</Button>
<Button variant="outline" icon={<Plus />}>Создать</Button>
<Button variant="secondary" loading>Загрузка...</Button>
<Button variant="ghost" size="sm">Отмена</Button>
<Button variant="link">Подробнее</Button>
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Стиль |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер |
| `loading` | `boolean` | `false` | Показать спиннер |
| `icon` | `ReactNode` | — | Иконка слева/справа |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Позиция иконки |

---

### 2.2 Card

**Путь:** `src/components/ui/card.tsx`  
**Экспорт:** `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card hover>
  <CardHeader>
    <CardTitle>Заголовок</CardTitle>
    <CardDescription>Описание карточки</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Основной контент</p>
  </CardContent>
  <CardFooter>
    <Button>Действие</Button>
  </CardFooter>
</Card>
```

**Card Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `hover` | `boolean` | `false` | Эффект тени при наведении |

---

### 2.3 Input

**Путь:** `src/components/ui/input.tsx`  
**Экспорт:** `Input`

```tsx
import { Input } from '@/components/ui';

<Input placeholder="Текст..." />
<Input label="Email" type="email" placeholder="mail@example.com" />
<Input label="Пароль" type="password" />
<Input label="Имя" error="Обязательное поле" />
<Input label="Поиск" clearable value={value} onChange={...} />
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `type` | `'text' \| 'number' \| 'password' \| 'email' \| 'tel' \| 'url' \| 'search'` | `'text'` | Тип поля |
| `label` | `string` | — | Подпись над полем |
| `error` | `string` | — | Сообщение об ошибке |
| `clearable` | `boolean` | `false` | Кнопка очистки |

---

### 2.4 Select

**Путь:** `src/components/ui/select.tsx`  
**Экспорт:** `Select`

```tsx
import { Select } from '@/components/ui';

const options = [
  { value: '1', label: 'Опция 1' },
  { value: '2', label: 'Опция 2', disabled: true },
];

<Select
  label="Категория"
  placeholder="Выберите..."
  options={options}
  value={selected}
  onChange={...}
  error="Обязательное поле"
/>
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `label` | `string` | — | Подпись |
| `placeholder` | `string` | — | Плейсхолдер (disabled option) |
| `options` | `{ value: string; label: string; disabled?: boolean }[]` | — | Опции |
| `error` | `string` | — | Ошибка |

---

### 2.5 Table

**Путь:** `src/components/ui/table.tsx`  
**Экспорт:** `Table` + типы `Column`, `TableProps`

```tsx
import { Table, type Column } from '@/components/ui';

const columns: Column<Product>[] = [
  { key: 'name', label: 'Название', sortable: true },
  { key: 'price', label: 'Цена', sortable: true,
    render: (val) => `${val} ₽` },
  { key: 'status', label: 'Статус',
    render: (val) => <Badge>{val}</Badge> },
];

<Table
  columns={columns}
  data={products}
  pageSize={10}
  searchable
  searchKeys={['name', 'sku']}
  emptyMessage="Товаров нет"
/>
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `columns` | `Column<T>[]` | — | Конфигурация колонок |
| `data` | `T[]` | — | Данные |
| `pageSize` | `number` | `10` | Элементов на странице |
| `searchable` | `boolean` | `false` | Поле поиска |
| `searchPlaceholder` | `string` | `'Поиск...'` | Плейсхолдер поиска |
| `searchKeys` | `(keyof T)[]` | все колонки | Поля для поиска |
| `emptyMessage` | `string` | `'Нет данных'` | Пустой список |

---

### 2.6 Dialog

**Путь:** `src/components/ui/dialog.tsx`  
**Экспорт:** `Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter`

Модальное окно через `createPortal`. Закрытие по Escape и по клику на backdrop.

```tsx
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui';

<Dialog open={isOpen} onClose={() => setIsOpen(false)}>
  <DialogHeader>
    <DialogTitle>Подтверждение</DialogTitle>
    <DialogDescription>Вы уверены?</DialogDescription>
  </DialogHeader>
  <div className="py-4">
    <p>Основной контент диалога</p>
  </div>
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Отмена</Button>
    <Button onClick={handleConfirm}>Подтвердить</Button>
  </DialogFooter>
</Dialog>
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `open` | `boolean` | — | Видимость |
| `onClose` | `() => void` | — | Закрытие |
| `className` | `string` | — | Доп. стили |

---

### 2.7 Badge

**Путь:** `src/components/ui/badge.tsx`  
**Экспорт:** `Badge`

```tsx
import { Badge } from '@/components/ui';

<Badge>Обычный</Badge>
<Badge variant="secondary">Черновик</Badge>
<Badge variant="success">Активный</Badge>
<Badge variant="warning">Ожидает</Badge>
<Badge variant="destructive">Просрочен</Badge>
<Badge variant="info">Новый</Badge>
<Badge variant="outline">Версия 1.0</Badge>
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'success' \| 'warning' \| 'info'` | `'default'` | Стиль |

---

### 2.8 Toggle

**Путь:** `src/components/ui/toggle.tsx`  
**Экспорт:** `Toggle`

```tsx
import { Toggle } from '@/components/ui';

<Toggle label="Активен" checked={isActive} onChange={...} />
```

---

### 2.9 Avatar

**Путь:** `src/components/ui/avatar.tsx`  
**Экспорт:** `Avatar`

```tsx
import { Avatar } from '@/components/ui';

<Avatar />
<Avatar initials="JD" />
<Avatar src="/photo.jpg" alt="User" />
<Avatar size="sm" initials="AB" />
<Avatar size="lg" fallback={<UserIcon />} />
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер |
| `src` | `ImageProps['src']` | — | URL фото |
| `alt` | `string` | — | Alt текст |
| `initials` | `string` | — | Инициалы |
| `fallback` | `ReactNode` | `User` иконка | Fallback |

---

### 2.10 Breadcrumb

**Путь:** `src/components/ui/breadcrumb.tsx`  
**Экспорт:** `Breadcrumb`

```tsx
import { Breadcrumb } from '@/components/ui';

<Breadcrumb items={[
  { label: 'Главная', href: '/dashboard' },
  { label: 'Товары', href: '/products' },
  { label: 'Редактирование' },
]} />
```

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `items` | `{ label: string; href?: string }[]` | Элементы хлебных крошек |

Также есть авто-компонент `Breadcrumbs` (из пути) — `src/components/ui/breadcrumbs.tsx`.

---

### 2.11 DropdownMenu

**Путь:** `src/components/ui/dropdown-menu.tsx`  
**Экспорт:** `DropdownMenu`

```tsx
import { DropdownMenu } from '@/components/ui';
import { MoreHorizontal } from 'lucide-react';

<DropdownMenu
  trigger={<Button variant="ghost" icon={<MoreHorizontal />} />}
  align="right"
  items={[
    { label: 'Редактировать', icon: <Pencil size={14} />, onClick: handleEdit },
    { label: 'Удалить', icon: <Trash2 size={14} />, destructive: true, onClick: handleDelete },
    { divider: true },
    { label: 'Дублировать', icon: <Copy size={14} />, onClick: handleDuplicate },
  ]}
/>
```

**Props:**

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `trigger` | `ReactNode` | — | Элемент-триггер |
| `items` | `DropdownMenuItem[]` | — | Пункты меню |
| `align` | `'left' \| 'right'` | `'left'` | Выравнивание |

**DropdownMenuItem:**

| Prop | Тип | Описание |
|------|-----|----------|
| `label` | `string` | Текст пункта |
| `icon` | `ReactNode` | Иконка |
| `onClick` | `() => void` | Обработчик |
| `disabled` | `boolean` | Отключён |
| `destructive` | `boolean` | Красный цвет |
| `divider` | `boolean` | Разделитель |

---

### 2.12 Toast

**Путь:** `src/components/ui/toast.tsx`  
**Экспорт:** `ToastProvider, useToast`

```tsx
// app/layout.tsx — обернуть приложение
<ToastProvider>
  <App />
</ToastProvider>

// В любом компоненте
const { toast } = useToast();
toast('success', 'Данные сохранены');
toast('error', 'Ошибка загрузки');
toast('info', 'Новое уведомление');
toast('warning', 'Внимание!');
```

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `variant` | `'success' \| 'error' \| 'info' \| 'warning'` | Тип уведомления |
| `message` | `string` | Текст |

---

### 2.13 ConfirmDialog

**Путь:** `src/components/ui/confirm-dialog.tsx`  
**Экспорт:** `ConfirmDialog`

```tsx
import { ConfirmDialog } from '@/components/ui';

<ConfirmDialog
  open={showConfirm}
  title="Удалить запись?"
  message="Это действие нельзя отменить"
  confirmLabel="Удалить"
  cancelLabel="Отмена"
  danger
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

---

### 2.14 Skeleton

**Путь:** `src/components/ui/skeleton.tsx`  
**Экспорт:** `Skeleton`

```tsx
import { Skeleton } from '@/components/ui';

<Skeleton className="h-4 w-48" />
<Skeleton className="h-10 w-full" />
<Skeleton className="h-32 w-full rounded-xl" />
```

---

### 2.15 Datepicker

**Путь:** `src/components/ui/datepicker.tsx`  
**Экспорт:** `Datepicker`

```tsx
import { Datepicker } from '@/components/ui';

<Datepicker label="Дата начала" value={date} onChange={...} />
<Datepicker label="Дата конца" error="Укажите дату" />
```

---

### 2.16 EmptyState

**Путь:** `src/components/ui/empty-state.tsx`  
**Экспорт:** `EmptyState`

```tsx
import { EmptyState } from '@/components/ui';

<EmptyState
  icon={Package}
  title="Нет товаров"
  description="Добавьте первый товар, чтобы начать работу"
  actionLabel="Создать товар"
  onAction={() => router.push('/products/new')}
/>
```

---

### 2.17 ErrorBoundary

**Путь:** `src/components/ui/error-boundary.tsx`  
**Экспорт:** `ErrorBoundary`

```tsx
import { ErrorBoundary } from '@/components/ui';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

### 2.18 CrudPage

**Путь:** `src/components/crud-page.tsx`  
**Экспорт:** `CrudPage`

Универсальная страница CRUD со встроенным поиском, сортировкой, пагинацией, удалением и формой.

```tsx
import { CrudPage } from '@/components/crud-page';

<CrudPage
  title="Товары"
  apiPath="/api/products"
  columns={[
    { key: 'name', label: 'Название' },
    { key: 'price', label: 'Цена',
      render: (item) => `${item.price} ₽` },
    { key: 'isActive', label: 'Статус',
      render: (item) => item.isActive
        ? <Badge variant="success">Активен</Badge>
        : <Badge variant="secondary">Неактивен</Badge> },
  ]}
  createHref="/products/new"
  detailHref={(item) => `/products/${item.id}`}
/>
```

---

## 3. Специфичные компоненты

Эти компоненты находятся в `src/components/ui/` и `src/components/` но используются только в определённых страницах:

| Компонент | Где используется | Описание |
|-----------|-----------------|----------|
| `GanttChart` | Производство | Диаграмма Гантта |
| `BlockEditor` | Шаблоны документов | Редактор блоков |
| `BlockDialogs` | Шаблоны документов | Диалоги блоков |
| `DocPreview` | Документы | Предпросмотр документа |
| `ProposalPreview` | КП | Предпросмотр КП |
| `ContractPreview` | Договоры | Предпросмотр договора |
| `A4Canvas` | Документы | A4 canvas для печати |
| `A4Page` | Документы | A4 страница |
| `SortableBlock` | Шаблоны | Сортируемые блоки |

---

## 4. Утилиты

### 4.1 cn() — classnames merger

**Путь:** `src/lib/utils.ts`

```tsx
import { cn } from '@/lib/utils';

cn('base-class', condition && 'active-class', className)
// → 'base-class active-class custom-class'
```

### 4.2 Библиотеки

| Библиотека | Назначение |
|-----------|------------|
| `lucide-react` | Иконки |
| `clsx` | Объединение классов (через cn) |
| `date-fns` | Форматирование дат |
| `zustand` | Стейт-менеджмент |
| `react-hook-form` | Формы |
| `zod` | Валидация |

---

## 5. Правила использования

### ✅ DO

- Используйте `cn()` для объединения классов
- Используйте CSS-переменные через `var(--token)` для кастомных стилей
- Используйте Tailwind-классы через `bg-[var(--token)]`
- Для всех модалок используйте `Dialog` (не пишите свои)
- Для списков используйте `Table` (не пишите свою пагинацию)
- Для уведомлений используйте `useToast()`

### ❌ DON'T

- Не используйте хардкод цветов (`#fff`, `bg-gray-100`)
- Не создавайте новые модальные окна — используйте `Dialog`
- Не копируйте кнопки — используйте `Button` со всеми вариантами
- Не пишите свои спиннеры — используйте `Skeleton` или `Button loading`

---

## 6. Plan: что нужно добавить

| Компонент | Приоритет | Ответственный |
|-----------|-----------|---------------|
| **FormField** (унифицированный с error/label) | P1 | Buffy |
| **Typography** (H1-H6, Text, Small, Code) | P1 | Buffy |
| **Layout** (Container, Stack, Flex, Grid) | P1 | Buffy |
| **Spinner** (отдельный, не только в Button) | P2 | MiMo |
| **Icon** (обёртка над lucide с size/variant) | P2 | MiMo |
| **Tabs** | P2 | MiMo |
| **Tooltip** | P2 | MiMo |
| **Progress** (линейный/круговой) | P2 | MiMo |
| **Transition system** (анимации) | P3 | Buffy |

---
*Последнее обновление: 15.06.2026*
