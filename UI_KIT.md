# 🎨 KPPDF UI Kit — Design System v2.1

> Версия: 2.1.0
> Стек: Next.js 16 + React 19 + Tailwind CSS 4 + Lucide Icons
> Путь: `src/components/ui/`
> Библиотеки: `tailwind-merge`, `class-variance-authority` (cva), `@radix-ui/react-slot`

---

## 1. Дизайн-токены

### 1.1 Цвета — «Летняя» палитра

Тёплая цветовая схема с золотистыми, коралловыми и зеленоватыми оттенками. Кремовый фон не утомляет глаза.

| Токен | HEX (светлая) | HEX (тёмная) | Tailwind |
|-------|---------------|--------------|----------|
| Background | `#fefaf2` | `#1a1510` | `bg-background` |
| Foreground | `#2d2318` | `#e8dcc8` | `text-foreground` |
| Primary | `#b8860b` | `#daa520` | `bg-primary` |
| Secondary | `#f5ede0` | `#2d2318` | `bg-secondary` |
| Card | `#fffdf8` | `#231d15` | `bg-card` |
| Border | `#e8dcc8` | `#3d3020` | `border-border` |
| Muted | `#f8f2e8` | `#2d2318` | `bg-muted` |
| Muted FG | `#8b7355` | `#a08c70` | `text-muted-foreground` |
| Success | `#5b8c3e` | `#6b9e45` | `bg-success` |
| Warning | `#d4a017` | `#e6b422` | `bg-warning` |
| Destructive | `#c0392b` | `#e74c3c` | `bg-destructive` |
| Info | `#5b9ec4` | `#6baed4` | `bg-info` |
| Accent | `#f0e0c8` | `#3d3020` | `bg-accent` |
| Sidebar | `#1a1510` | `#120e08` | `bg-sidebar` |

### 1.2 Тени

| Токен | Tailwind |
|-------|----------|
| `--shadow-xs` | `shadow-xs` |
| `--shadow-sm` | `shadow-sm` |
| `--shadow-md` | `shadow-md` |
| `--shadow-lg` | `shadow-lg` |
| `--shadow-xl` | `shadow-xl` |

### 1.3 Z-Index система

| Токен | Значение | Назначение |
|-------|----------|------------|
| `--z-dropdown` | 100 | DropdownMenu |
| `--z-sticky` | 200 | Sticky элементы |
| `--z-popover` | 300 | Popover, Tooltip |
| `--z-modal` | 400 | Dialog, Sheet |
| `--z-toast` | 500 | Toast уведомления |
| `--z-tooltip` | 600 | Tooltip (поверх всего) |

### 1.4 Анимации

| Класс | Описание |
|-------|----------|
| `.animate-spin` | Вращение 360°, 1s linear infinite |
| `.animate-fade-in` | Появление сдвигом 4px вверх, 0.2s |
| `.animate-fade-out` | Исчезновение сдвигом 4px вниз, 0.2s |
| `.animate-slide-in-right` | Въезд справа, 0.3s |
| `.animate-slide-out-right` | Выезд вправо, 0.3s |
| `.animate-slide-in-left` | Въезд слева, 0.3s |
| `.animate-slide-in-top` | Въезд сверху, 0.3s |
| `.animate-slide-in-bottom` | Въезд снизу, 0.3s |
| `.animate-scale-in` | Появление с scale, 0.2s |
| `.animate-scale-out` | Исчезновение с scale, 0.2s |
| `.animate-accordion-down` | Раскрытие accordion, 0.2s |
| `.animate-accordion-up` | Схлопывание accordion, 0.2s |
| `.animate-indeterminate` | Бесконечный progress, 1.5s |

### 1.5 Тема

```css
:root { /* светлая тема */ }
[data-theme="dark"] { /* тёмная тема */ }
```

Переключение: `document.documentElement.setAttribute('data-theme', 'dark')`

---

## 2. Компоненты

### 2.1 Core Primitives

#### Button
Универсальная кнопка с `cva`-вариантами, `Slot` для `asChild`, и встроенным спиннером.

```tsx
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

<Button>Сохранить</Button>
<Button variant="destructive" size="sm">Удалить</Button>
<Button variant="outline"><Plus className="h-4 w-4" />Создать</Button>
<Button variant="ghost" loading>Загрузка...</Button>
<Button variant="link">Подробнее</Button>
<Button asChild><Link href="/">На главную</Link></Button>
```

| Prop | Тип | По умолч. | Описание |
|------|-----|-----------|----------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Стиль |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'icon' \| 'icon-sm' \| 'icon-xs'` | `'md'` | Размер |
| `loading` | `boolean` | `false` | Показать спиннер |
| `asChild` | `boolean` | `false` | Рендер как дочерний элемент |

#### Input
Поле ввода с поддержкой `prefix`/`suffix`, очистки, показа пароля.

```tsx
<Input placeholder="Текст..." />
<Input prefix={<Search className="h-4 w-4" />} placeholder="Поиск..." />
<Input type="password" placeholder="Пароль" />
<Input error="Обязательное поле" />
<Input clearable value={value} onChange={...} onClear={() => setValue('')} />
```

| Prop | Тип | Описание |
|------|-----|----------|
| `type` | `'text' \| 'number' \| 'password' \| 'email' \| 'tel' \| 'url' \| 'search'` | Тип поля |
| `error` | `string` | Сообщение об ошибке |
| `clearable` | `boolean` | Кнопка очистки |
| `prefix` | `ReactNode` | Элемент слева |
| `suffix` | `ReactNode` | Элемент справа |

#### Select
Нативный селект с кастомной стрелкой.

```tsx
<Select options={[{ value: '1', label: 'Опция 1' }]} placeholder="Выберите..." />
<Select error="Обязательное поле" options={[...]} value={v} onChange={...} />
```

#### Textarea
Многострочное поле ввода.

```tsx
<Textarea placeholder="Описание..." rows={5} />
<Textarea error="Слишком длинный текст" />
```

#### Label
Подпись к полю с индикатором обязательности.

```tsx
<Label htmlFor="email">Email</Label>
<Label htmlFor="name" required>Имя</Label>
```

#### Switch (вместо старого Toggle)
Переключатель с размерами и контролируемым/неконтролируемым режимом.

```tsx
<Switch checked={isActive} onCheckedChange={setIsActive} />
<Switch size="sm" defaultChecked />
<Switch size="lg" disabled />
```

| Prop | Тип | Описание |
|------|-----|----------|
| `size` | `'sm' \| 'md' \| 'lg'` | Размер |
| `checked` | `boolean` | Контролируемое состояние |
| `defaultChecked` | `boolean` | Начальное состояние |
| `onCheckedChange` | `(checked: boolean) => void` | Колбэк изменения |

#### Separator
Разделитель (горизонтальный/вертикальный, сплошной/пунктирный).

```tsx
<Separator />
<Separator orientation="vertical" className="h-6" />
<Separator variant="dashed" />
<Separator decorative={false} />
```

---

### 2.2 Layout

```tsx
import { Container, Flex, Grid, Stack } from '@/components/ui';

<Container size="lg">
  <Flex direction="col" gap="lg" align="start">
    <Grid cols="auto-md" gap="md">
      <Card>...</Card>
      <Card>...</Card>
    </Grid>
  </Flex>
</Container>
```

| Компонент | Варианты |
|-----------|----------|
| `Container` | `size`: `sm` \| `md` \| `lg` \| `xl` \| `full` |
| `Flex` | `direction`, `align`, `justify`, `wrap`, `gap` |
| `Grid` | `cols`: `1`-`6` \| `auto-sm` \| `auto-md` \| `auto-lg`, `gap` |
| `Stack` | `gap`: `none`-`xl` |

---

### 2.3 Typography

```tsx
import { H1, H2, H3, H4, P, Lead, Large, Small, Muted, Code, Blockquote } from '@/components/ui';

<H1>Заголовок 1</H1>
<H2>Заголовок 2</H2>
<P>Параграф текста с отступами</P>
<Lead>Вводный текст крупнее и приглушённый</Lead>
<Muted>Приглушённый вспомогательный текст</Muted>
<Code>const x = 1;</Code>
<Blockquote>Цитата с полосой слева</Blockquote>
```

Также доступен универсальный `<Typography variant="h1" as="h2">` с пропами `as` и `asChild`.

---

### 2.4 Feedback & Display

#### Badge
```tsx
<Badge>Обычный</Badge>
<Badge variant="success">Активный</Badge>
<Badge variant="destructive">Просрочен</Badge>
<Badge variant="outline">Версия 1.0</Badge>
```

| Prop | Тип | Значения |
|------|-----|----------|
| `variant` | `string` | `default` \| `secondary` \| `destructive` \| `outline` \| `success` \| `warning` \| `info` |

#### Spinner
```tsx
<Spinner />                          // md, текущий цвет
<Spinner size="lg" variant="primary" />
<Spinner size="xl" variant="destructive" />
```

| Prop | Тип | Значения |
|------|-----|----------|
| `size` | `string` | `xs` \| `sm` \| `md` \| `lg` \| `xl` |
| `variant` | `string` | `default` (text-current) \| `primary` \| `destructive` \| `success` \| `warning` \| `muted` |

#### Skeleton
```tsx
<Skeleton className="h-4 w-48" />
<Skeleton shape="text" count={3} />
<Skeleton shape="circle" className="h-12 w-12" />
<Skeleton shape="button" className="w-32" />
<Skeleton shape="card" />
```

| Prop | Тип | Значения |
|------|-----|----------|
| `shape` | `string` | `rectangle` \| `circle` \| `text` \| `text-sm` \| `text-lg` \| `button` \| `card` |
| `count` | `number` | Количество скелетонов |

#### Progress
```tsx
// Линейный
<Progress value={60} />
<Progress value={75} color="success" showValue />
<Progress variant="indeterminate" />
<Progress size="lg" value={80} color="warning" />

// Круговой
<CircularProgress value={60} showValue />
<CircularProgress size="xl" color="destructive" showValue />
<CircularProgress indeterminate />
```

| Prop | Тип | Значения |
|------|-----|----------|
| `value` | `number` | Текущее значение (0-max) |
| `max` | `number` | Максимум (по умолч. 100) |
| `size` | `string` | `sm` \| `md` \| `lg` \| `xl` |
| `color` | `string` | `primary` \| `success` \| `warning` \| `destructive` |
| `variant` | `string` | `default` \| `indeterminate` |
| `showValue` | `boolean` | Показать процент |

#### Alert
```tsx
<Alert variant="success">
  <AlertTitle>Успешно!</AlertTitle>
  <AlertDescription>Данные сохранены</AlertDescription>
</Alert>

<Alert variant="destructive">
  Произошла ошибка при загрузке
</Alert>
```

#### Icon
Обёртка над Lucide иконками с размерами и цветами.

```tsx
import { Icon } from '@/components/ui';
import { User, Settings } from 'lucide-react';

<Icon icon={User} size="lg" variant="primary" />
<Icon icon={Settings} size="sm" variant="muted" />
```

#### Avatar
```tsx
<Avatar initials="JD" />
<Avatar src="/photo.jpg" alt="User" status="online" />
<Avatar size="xl" status="busy" />

// Группа
<AvatarGroup limit={3}>
  <Avatar initials="AB" />
  <Avatar initials="CD" />
  <Avatar initials="EF" />
  <Avatar initials="GH" />
</AvatarGroup>
```

| Prop | Тип | Описание |
|------|-----|----------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | Размер |
| `status` | `'online' \| 'away' \| 'busy' \| 'offline'` | Индикатор |

#### EmptyState
```tsx
<EmptyState title="Нет товаров" description="Добавьте первый товар" actionLabel="Создать" onAction={...} />
<EmptyState variant="search" title="Ничего не найдено" description="Измените параметры поиска" />
```

#### ErrorBoundary
```tsx
<ErrorBoundary fallback={<div>Ошибка!</div>}>
  <YourComponent />
</ErrorBoundary>
```

---

### 2.5 Navigation

#### Breadcrumb
```tsx
<Breadcrumb items={[
  { label: 'Главная', href: '/dashboard' },
  { label: 'Товары' },
]} showHome maxItems={3} />
```

| Prop | Тип | Описание |
|------|-----|----------|
| `items` | `{ label, href? }[]` | Элементы |
| `showHome` | `boolean` | Иконка домика |
| `maxItems` | `number` | Коллапсирование |
| `separator` | `ReactNode` | Кастомный разделитель |

#### DropdownMenu
```tsx
<DropdownMenu
  trigger={<Button variant="ghost"><MoreHorizontal /></Button>}
  align="end"
  groups={[
    {
      label: 'Действия',
      items: [
        { label: 'Редактировать', icon: <Pencil />, onClick: handleEdit },
        { label: 'Удалить', icon: <Trash2 />, destructive: true, onClick: handleDelete },
      ],
    },
    {
      items: [
        { divider: true },
        { label: 'Экспорт', shortcut: '⌘E', onClick: handleExport },
      ],
    },
  ]}
/>
```

| Prop | Тип | Описание |
|------|-----|----------|
| `items` / `groups` | `DropdownMenuItem[]` / `DropdownMenuGroup[]` | Пункты меню |
| `align` | `'start' \| 'center' \| 'end'` | Выравнивание |
| `side` | `'bottom' \| 'top'` | Сторона открытия |

#### Tabs (Compound)
```tsx
<Tabs.Root defaultValue="tab1">
  <Tabs.List variant="tabs">
    <Tabs.Trigger value="tab1">Общее</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Детали</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Контент 1</Tabs.Content>
  <Tabs.Content value="tab2">Контент 2</Tabs.Content>
</Tabs.Root>
```

Варианты `Tabs.List`/`Tabs.Trigger`: `tabs` (фон), `underline` (подчёркивание), `pills` (таблетки).

---

### 2.6 Overlays

#### Dialog
```tsx
<Dialog open={open} onClose={() => setOpen(false)} size="lg">
  <DialogHeader>
    <DialogTitle>Заголовок</DialogTitle>
    <DialogDescription>Описание</DialogDescription>
  </DialogHeader>
  <div>Контент</div>
  <DialogFooter>
    <Button variant="outline" onClick={...}>Отмена</Button>
    <Button onClick={...}>Сохранить</Button>
  </DialogFooter>
</Dialog>
```

| Prop | Тип | Значения |
|------|-----|----------|
| `size` | `string` | `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `full` |
| `closeOnEscape` | `boolean` | Закрытие по Escape |
| `closeOnBackdrop` | `boolean` | Закрытие по клику вне |

#### ConfirmDialog
```tsx
<ConfirmDialog
  open={showConfirm}
  title="Удалить запись?"
  message="Это действие нельзя отменить"
  confirmLabel="Удалить"
  danger
  loading={isDeleting}
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

#### Toast
```tsx
const { toast, dismiss, promise } = useToast();

toast('success', 'Данные сохранены');
toast('error', 'Ошибка', { description: 'Попробуйте позже' });
toast('info', 'Обновление', { action: { label: 'Отменить', onClick: undo } });

// Promise toast
await promise(saveData(), {
  loading: 'Сохранение...',
  success: 'Сохранено!',
  error: 'Ошибка сохранения',
});
```

#### Tooltip
```tsx
<Tooltip content="Подсказка" side="top">
  <Button variant="ghost"><Info /></Button>
</Tooltip>
```

| Prop | Тип | Описание |
|------|-----|----------|
| `content` | `ReactNode` | Содержимое |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | Позиция |
| `delayDuration` | `number` | Задержка (мс) |

#### Popover
```tsx
<Popover trigger={<Button>Открыть</Button>} align="center">
  <div className="space-y-2">
    <h4 className="font-medium">Заголовок</h4>
    <p className="text-sm text-muted-foreground">Содержимое popover</p>
  </div>
</Popover>
```

#### Sheet
Боковая панель (drawer) с анимированным слайдом.

```tsx
<Sheet open={open} onClose={() => setOpen(false)} side="right">
  <div className="space-y-4 pt-8">
    <h2 className="text-lg font-semibold">Фильтры</h2>
    {/* контент */}
  </div>
</Sheet>
```

| Prop | Тип | Значения |
|------|-----|----------|
| `side` | `string` | `top` \| `bottom` \| `left` \| `right` |

#### Accordion
```tsx
<Accordion type="single" defaultValue="item-1">
  <Accordion.Item value="item-1" trigger="Раздел 1">
    <p>Содержимое раздела 1</p>
  </Accordion.Item>
  <Accordion.Item value="item-2" trigger="Раздел 2">
    <p>Содержимое раздела 2</p>
  </Accordion.Item>
</Accordion>
```

| Prop | Тип | Описание |
|------|-----|----------|
| `type` | `'single' \| 'multiple'` | Один или несколько открытых |
| `defaultValue` | `string \| string[]` | Значение по умолчанию |
| `value` | `string \| string[]` | Контролируемое значение |
| `onValueChange` | `(val) => void` | Колбэк изменения |

---

### 2.7 Data

#### Table
```tsx
const columns: Column<Product>[] = [
  { key: 'name', label: 'Название', sortable: true },
  { key: 'price', label: 'Цена', sortable: true, render: (v) => `${v} ₽` },
];

<Table
  columns={columns}
  data={products}
  pageSize={20}
  searchable
  loading={isLoading}
  selectable
  selectedIds={selected}
  onSelectionChange={setSelected}
  getRowId={(row) => row.id}
/>
```

| Prop | Тип | Описание |
|------|-----|----------|
| `loading` | `boolean` | Скелетон-строки |
| `loadingRows` | `number` | Кол-во скелетон-строк |
| `selectable` | `boolean` | Чекбоксы |
| `selectedIds` | `string[]` | Выбранные ID |
| `onSelectionChange` | `(ids: string[]) => void` | Колбэк выбора |
| `getRowId` | `(row: T) => string` | Функция получения ID |

---

### 2.8 Forms

#### FormField / FormSelect / FormTextarea
```tsx
<FormField label="Название" name="name" required error={errors.name} {...register('name')} />
<FormSelect label="Категория" name="category" options={categories} />
<FormTextarea label="Описание" name="description" rows={4} />
```

#### Datepicker
```tsx
<Datepicker label="Дата начала" value={date} onChange={...} />
<Datepicker label="Дата" error="Укажите дату" />
```

---

### 2.9 Редактор шаблонов документов (v3)

Архитектура редактора шаблонов — сборка документов из блоков на A4-холсте.

#### BlockEditor — корневой компонент
```tsx
<BlockEditor
  blocks={template.blocks}
  onChange={blocks => setTemplate({ ...template, blocks })}
  backgroundImage={template.backgroundImage}
  backgroundOpacity={template.backgroundOpacity}
  templateId={template.id}
  tableTemplates={tableTemplates}
  onCreateTableTemplate={() => router.push('/admin/table-templates/new')}
/>
```

**Layout:** левая панель (кнопки +Текст +Таблица +Разделитель + Отмена/Повтор) + правый A4-холст.
**Адаптивный масштаб:** `ResizeObserver` вычисляет `scale = (containerWidth - 32) / 794`, холст занимает максимум доступного места.

#### A4Canvas — многостраничный холст
Группирует блоки по `DocBlock.page` через `useMemo(Map)`. Каждая группа рендерится в отдельный `<A4Page>`. Единый `DndContext` для драг-н-дропа между страницами. Кнопка «+ Добавить страницу» снизу.

#### A4Page — страница A4
```tsx
<A4Page scale={0.8} backgroundImage="url" backgroundOpacity={0.5}
  pageNumber={2} totalPages={3} editable>
  {/* SortableBlock[] */}
</A4Page>
```
Индикатор страницы: «2/3» в правом нижнем углу (только в режиме редактирования).

#### TextBlockDialog v3 — WYSIWYG редактор текста
Профессиональный диалог редактирования текстового блока:
- **Тулбар:** группа кнопок Bold/Italic/Underline с разделителями-бордерами (32px), color picker как цветной квадрат
- **Колонки:** горизонтальный лейаут, `min-width: 240px`, `overflow-x-auto` с `scrollSnapType` при многих колонках
- **Авто-расширение:** `height: auto` + `min-height: 100px` — текст растягивает блок вертикально
- **Курсор:** `useRef<Map>` + `useEffect` инициализация вместо `dangerouslySetInnerHTML` (не прыгает)
- **Равные ширины:** при добавлении/удалении колонки все перераспределяются поровну

```tsx
<TextBlockDialog block={block} onSave={handleSave} onClose={handleClose} />
```

#### TableBlockDialog — настройка таблицы
- Выпадающий список шаблонов из `/api/table-templates`
- Пустое состояние: «Нет шаблонов таблиц. Создать первый»
- Авто-подстановка заголовка из имени выбранного шаблона

#### SortableBlock — сортируемый блок на холсте
- Drag-and-drop через `@dnd-kit/sortable`
- При выделении: кнопки Редактировать/Удалить справа
- Текстовые блоки: колонки с `min-width: 200px`, `overflow-x-auto`, HTML-рендеринг через `dangerouslySetInnerHTML` (display-only)

---

### 2.10 Специфичные компоненты

| Компонент | Где используется | Описание |
|-----------|-----------------|----------|
| `GanttChart` | Производство | Диаграмма Гантта |
| `BlockEditor` | Шаблоны документов | Корневой редактор блоков (v3) |
| `A4Canvas` | Шаблоны | Многостраничный A4-холст |
| `A4Page` | Шаблоны | Страница A4 с индикатором |
| `SortableBlock` | Шаблоны | Сортируемый блок |
| `TextBlockDialog` | Шаблоны | WYSIWYG редактор текста (v3) |
| `TableBlockDialog` | Шаблоны | Диалог таблицы |
| `SeparatorBlockDialog` | Шаблоны | Диалог разделителя |
| `DocPreview` | Документы | Предпросмотр документа |
| `ProposalPreview` | КП | Предпросмотр КП |
| `ContractPreview` | Договоры | Предпросмотр договора |

---

## 3. Утилиты

### 3.1 cn() — безопасное слияние классов
```tsx
import { cn } from '@/lib/utils';
cn('px-4 py-2', condition && 'bg-primary', className)
// tailwind-merge разрешает конфликты классов (px-4 px-2 → px-2)
```

### 3.2 cva() — system вариантов
Все компоненты используют `class-variance-authority` для вариантов:
```tsx
const variants = cva('base', {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: 'default', size: 'md' },
});
```

### 3.3 Slot — паттерн asChild
```tsx
<Button asChild>
  <Link href="/">На главную</Link>
</Button>
```
Кнопка рендерится как `<a>`, наследуя все стили Button.

---

## 4. Правила использования

### ✅ DO
- Используйте `cn()` для объединения классов
- Используйте CSS-переменные через `var(--token)` для кастомных стилей
- Импортируйте компоненты из `@/components/ui`
- Для модалок используйте `Dialog`, для сайд-панелей — `Sheet`
- Для уведомлений — `useToast()`
- Для табов — `<Tabs.Root>` / `<Tabs.List>` / `<Tabs.Trigger>` / `<Tabs.Content>`
- Для аккордеонов — `<Accordion>` / `<Accordion.Item>`

### ❌ DON'T
- Не используйте хардкод цветов (`#fff`, `bg-gray-100`)
- Не создавайте новые модальные окна — используйте `Dialog`/`Sheet`
- Не копируйте кнопки — используйте `Button` со всеми вариантами
- Не пишите спиннеры — используйте `Spinner` или `Button loading`
- Не используйте `<Toggle>` (устарел) — используйте `<Switch>`

---

## 5. Миграция

| v1 | v2+ | Действие |
|----|-----|----------|
| `Button icon={<Plus />}` | `<Button><Plus />текст</Button>` | Иконка как children |
| `Button iconPosition="right"` | Порядок children | Иконка справа = после текста |
| `Card hover` | `Card variant="interactive"` | Замена пропа |
| `Toggle` | `Switch` | Полная замена |
| `Breadcrumbs` (авто) | `Breadcrumb` (явный) | Передавать items явно |
| `scale={0.5}` (жёстко) | Адаптивный ResizeObserver | Автоматический масштаб |
| Одна страница A4 | `DocBlock.page` + много A4Page | Многостраничность |

---

## 6. История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 2.1.0 | 16.06.2026 | Летняя палитра (золото/коралл/зелень/крем). Редактор v3: проф. тулбар WYSIWYG, адаптивный A4, многостраничность, ref-based contentEditable. |
| 2.0.0 | 16.06.2026 | Полный редизайн: cva + Slot, 30+ компонентов, анимации, z-index, тени. |

---

*Последнее обновление: 16.06.2026*
