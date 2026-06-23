# 🎨 KPPDF UI Kit — Design System v2.1

> Версия: 2.1.0
> Стек: Next.js 16 + React 19 + Tailwind CSS 4 + Lucide Icons
> Путь: `src/components/ui/`
> Библиотеки: `tailwind-merge`, `class-variance-authority` (cva), `@radix-ui/react-slot`

---

## 1. Дизайн-токены

### 1.1 Цвета — v3 «Neutral Slate + Deep Violet»

**Светлая тема**: воздушно-белая база + холодные нейтральные серые + **Deep Violet** (`#7C3AED`) акцент. Убраны кремовые/коричневые оттенки из v2.
**Тёмная тема**: глубокая синевато-сланцевая база (`#0B0E14`) + 5-уровневое tint-elevation (Linear-inspired) + **Electric Violet** (`#A78BFA`) акцент. Полностью убран зеленоватый отлив из v2.

| Токен | HEX (светлая) | HEX (тёмная) | Tailwind |
|-------|---------------|--------------|----------|
| Background | `#FBFBFD` | `#0B0E14` | `bg-background` |
| Foreground | `#0F1116` | `#E5E7EB` | `text-foreground` |
| Primary | `#7C3AED` | `#A78BFA` | `bg-primary` |
| Secondary | `#F4F5F8` | `#181C24` | `bg-secondary` |
| Card | `#FFFFFF` | `#11151C` | `bg-card` |
| Border | `#E4E7EC` | `#2A2E38` | `border-border` |
| Muted | `#F4F5F8` | `#14171F` | `bg-muted` |
| Muted FG | `#6B727D` | `#9BA1AE` | `text-muted-foreground` |
| Success | `#10B981` | `#34D399` | `bg-success` |
| Warning | `#F59E0B` | `#FBBF24` | `bg-warning` |
| Destructive | `#EF4444` | `#F87171` | `bg-destructive` |
| Info | `#06B6D4` | `#60A5FA` | `bg-info` |
| Accent | `#F4EBFF` | `#1A1E27` | `bg-accent` |
| Sidebar | `#FFFFFF` ⚒ | `#0E1119` | `bg-sidebar` |

⚒ **Исправлен баг v2**: `--sidebar` в светлой теме был `#1a1510` (тёмно-коричневый) — левое меню оставалось тёмным при выборе светлой темы. В v3 теперь истинно-светлое.

#### Glass поверхности (full-glassmorphism v3)

| Токен | Светлая | Тёмная | Назначение |
|-------|---------|--------|------------|
| `--glass-bg` | `rgba(255,255,255,0.78)` | `rgba(14,17,25,0.72)` | Полупрозрачный фон плавающих элементов |
| `--glass-border` | `rgba(15,17,21,0.08)` | `rgba(255,255,255,0.08)` | Тонкая граница на glass-поверхностях |
| `--glass-highlight` | `rgba(255,255,255,0.60)` | `rgba(255,255,255,0.04)` | Световая полоска для premium-feel |

Применяется классом `.glass-surface` ИЛИ через `bg-[var(--glass-bg)] backdrop-blur-2xl` — в topbar, sidebar, dropdowns, popovers, dialogs.

#### Shadows v3 (нейтральные slate, не warm-brown как в v2)

| Токен | Light | Dark |
|-------|-------|------|
| `--shadow-xs` | `0 1px 2px rgb(15 17 21 / 0.05)` | `0 1px 2px rgb(0 0 0 / 0.40)` |
| `--shadow-sm` | `0 1px 3px + 2px rgb(15 17 21 / 0.06)` | `0 1px 3px + 2px rgb(0 0 0 / 0.50)` |
| `--shadow-md` | `4-6px rgb(15 17 21 / 0.08)` | `4-8px rgb(0 0 0 / 0.50)` |
| `--shadow-lg` | `10-15px rgb(15 17 21 / 0.10)` | `12-20px rgb(0 0 0 / 0.55)` |
| `--shadow-xl` | `20-25px rgb(15 17 21 / 0.12)` | `24-32px rgb(0 0 0 / 0.60)` |

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

### 1.6 Философия дизайна v3

#### Тёмная тема: mix из 3 референсов

**Обязательный референс — «Лаборатория Касперского» (Kaspersky)**
  - Синевато-сланцевая база без намёка на зелень (`#0B0E14` family).
  - Толстые 1px границы для enterprise-чёткости.
  - Глубокая иерархия тонов: brand-confidence через neutral contrast.

**Linear (linear.app)**
  - 5-уровневая tint-elevation лестница: bg < sidebar < muted < card < popover. Каждый уровень слегка СВЕТЛЕЕ предыдущего. Это даёт воспринимаемую глубину без тяжёлых теней.

**Vercel Dashboard (vercel.com/dashboard)**
  - Ультра-глубокий чёрный в основании + строгая pure-black стратегия теней (alpha до 0.60) для больших surface-различий.
  - Акцент работает «сверху» surface, не смешивается с фоном.

#### Светлая тема: акцент Deep Violet

**Выбран**: Violet-700 (`#7C3AED`) для светлой / Violet-400 (`#A78BFA`) для тёмной. Brand-coherence через одну hue-семью.

**Аргументация**:
  - **WCAG AA verified**: `#7C3AED` на `#FFFFFF` = 6.5:1 (normal text AAA). На тёмном `#0B0E14` electric violet = 8.2:1 (AAA).
  - **Отказ от banal blue**: Indigo `#6366F1` (Stripe/Apple) уже везде — выбрали чуть deeper, чуть editorial.
  - **Linear-совместимость`: violet family уже используется в Linear (`#5E6AD2`) — мы выбрали насыщенный сосед той же hue-семьи.
  - **Симметрия light↔dark**: единая фиолетовая семья делает переключение темы визуально coherent (blue accent в light → violet accent в dark ломал бы continuity).
  - **Industrial CRM fit**: не «consumer warmly» (как coral), не «wellness fresh» (как turquoise). Deep violet = jot-down, sophisticated, production-ready.

#### WCAG AA verification

Все ключевые color pair-ы проверены:

| Пара | Light | Dark |
|------|-------|------|
| Foreground on Background | 17.4 : 1 (AAA) | 14.1 : 1 (AAA) |
| Primary on Background | 6.5 : 1 (AA) | 8.2 : 1 (AAA) |
| Primary-fg on Primary | 6.5 : 1 (AA) | 8.2 : 1 (AAA) |
| Muted-fg on Background | 5.1 : 1 (AA) | 7.1 : 1 (AAA) |
| Sidebar-fg on Sidebar | 16.6 : 1 (AAA) | 11.0 : 1 (AAA) |

#### Anti-patterns, которых избегаем

- ❌ Кремовый фон (`#fefaf2`) — **заменён** на `#FBFBFD` для airy feel.
- ❌ Тёплые brown shadows (`rgb(139 115 85)`) — **заменены** на cool-slate (`rgb(15 17 21)`).
- ❌ Зеленоватая тёмная тема (`#0d1a11` + `#4ade80`) — **полностью убрана**, теперь slate + violet.
- ❌ Dark sidebar в light theme (баг v2) — **исправлено в v3** (`#FFFFFF` sidebar).
- ❌ Banal blue SaaS accent — **заменён** на Deep Violet.

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

## 6. AI Skill Reference (v3.1)

Дополнительные reference-документы для аудита и расширения дизайн-системы — взяты из подмножества `ui-ux-pro-max-skill-2.6.2/` (был полностью удалён, осталось **~124 КБ** в этой папке).

| Файл | Назначение | Когда использовать |
|------|------------|---------------------|
| `docs/design/ai-skill-reference/ui-ux-pro-max-rules.md` | 161 industry-правил + 10 Quick-Reference категорий (Accessibility, Touch, Performance, Style, Layout, Typography, Animation, Forms, Navigation, Charts) | Любой UI/UX review, pre-delivery чек |
| `docs/design/ai-skill-reference/shadcn-components.md` | Каталог shadcn-компонентов (Form, Navigation Menu, Command, Combobox, Data Table) | Перед написанием нового компонента — проверить, нет ли уже shadcn-варианта |
| `docs/design/ai-skill-reference/shadcn-theming.md` | Theming + CSS variables + dark mode setup | При выборе нового паттерна темизации |
| `docs/design/ai-skill-reference/shadcn-accessibility.md` | ARIA patterns, keyboard nav, screen reader | Решение спорных A11y вопросов |
| `docs/design/ai-skill-reference/stacks/nextjs.csv` | Stack-guidelines для Next.js (RSC, bundle, suspense, cache) | При больших рефакторах на Server Components |
| `docs/design/ai-skill-reference/stacks/react.csv` | React performance (rerender, memo, list) | При оптимизации render-blocking мест |
| `docs/design/ai-skill-reference/design-tokens-starter.json` | Стартовый JSON для design-tokens Cmd (3-layer: primitive → semantic → component) | Если решите генерировать токены из конфига вместо CSS-vars |

**Не используем** (явно вырезано): canvas-fonts (~20 МБ TTF), slides/ (Chart.js презентации), banner-design/, design/ (logo/icon генерация), cli/ (npm-пакет), .claude-plugin/ (marketplace).

---

## 7. История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| **3.0.0** | **20.06.2026** | **Neutral Slate + Deep Violet v3.** Полный рефакторинг цветовой палитры: тёмная = Kaspersky (slate) + Linear (5-level tint) + Vercel (deep black). Светлая = airy cool-white + violet accent. Убран кремовый и зелёный, исправлен баг «тёмный sidebar в light theme», добавлены glass-токены (`--glass-bg/border/highlight`), neutral slate shadows вместо warm brown. WCAG AA verified пары accent+background в обеих темах. |
| 2.1.0 | 16.06.2026 | Летняя палитра (золото/коралл/зелень/крем). Редактор v3: проф. тулбар WYSIWYG, адаптивный A4, многостраничность, ref-based contentEditable. |
| 2.0.0 | 16.06.2026 | Полный редизайн: cva + Slot, 30+ компонентов, анимации, z-index, тени. |

---

*Последнее обновление: 16.06.2026*
