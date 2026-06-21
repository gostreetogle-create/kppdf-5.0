# 🚀 Performance Optimization Checklist

> **Дата:** 21 июня 2026  
> **Проект:** KPPDF v5.0 (Next.js 16 + React 19 + Prisma 7 + PostgreSQL)  
> **Lighthouse:** LCP 3.3s | TBT 270ms | 3,280 KiB network | FCP 0.3s

---

## 1. Результаты аудита

### Текущие проблемы (по приоритету)

| # | Проблема | Влияние | Оценка |
|---|----------|---------|--------|
| 1 | **Все страницы — Client Components** | Нет SSR/статики, весь JS грузится сразу | 🔴 Критично |
| 2 | **Auth check блокирует рендер** | `fetch('/api/auth/me')` в layout — пустой экран до ответа | 🔴 Критично |
| 3 | **Тяжёлые библиотеки без lazy load** | recharts, jspdf, html2canvas, @dnd-kit грузятся везде | 🔴 Критично |
| 4 | **Нет динамического импорта UI** | 45 UI компонентов в одном бандле | 🟡 Средне |
| 5 | **Lucide-react — все иконки в бандле** | ~1000 иконок, используется ~20 | 🟡 Средне |
| 6 | **CSS — избыточные токены** | ~700 строк CSS-переменных, ~30% не используется | 🟡 Средне |
| 7 | **Back/forward cache заблокирован** | 1 failure reason (вероятно auth redirect) | 🟡 Средне |
| 8 | **Нет preload шрифтов** | Geist шрифты грузятся с задержкой | 🟢 Низкий |
| 9 | **Нет preconnect для API** | DNS lookup для API endpoint'ов | 🟢 Низкий |

### Архитектурные выводы

```
Текущая архитектура:
┌──────────────────────────────────────────────┐
│  RootLayout (сервер)                         │
│  └── Providers (клиент)                      │
│      ├── ReactQuery                          │
│      ├── Toast                               │
│      └── DashboardLayout (клиент)            │
│          ├── Sidebar (клиент) ← все иконки   │
│          ├── Topbar (клиент)                  │
│          ├── AuthCheck (fetch /api/auth/me)  │ ← БЛОКИРУЕТ
│          └── Page Content (все клиент)       │ ← НЕТ SSR
└──────────────────────────────────────────────┘
```

---

## 2. План оптимизации (8 шагов)

### Шаг 1: Next.js конфиг 🔧

**Файл:** `next.config.ts`

```ts
const nextConfig = {
  output: 'standalone',
  
  // ⬇️ ДОБАВИТЬ
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  experimental: {
    optimizePackageImports: [
      'lucide-react',  // tree-shaking иконок
      'date-fns',       // только используемые функции
      '@radix-ui/react-slot',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },
  
  // УЖЕ ЕСТЬ
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
```

**Ожидаемый эффект:** -30% размера бандла (lucide tree-shaking + radix оптимизация)

---

### Шаг 2: Server Components страниц 🏗️

**Проблема:** Все 44 страницы используют `'use client'`, хотя большинство из них только отображают данные.

**Что сделать:**

1. **Страницы-списки** (organizations, products, materials и др.) — Server Components с Suspense
2. **Только формы и интерактив** оставить Client Components
3. **Вынести `'use client'`** из layout'ов в минимальную обёртку

```
Новая архитектура:
┌──────────────────────────────────────────────┐
│  Layout (сервер)                             │
│  ├── Providers (клиент, легковесный)         │
│  │   ├── ReactQuery                          │
│  │   └── Toast                               │
│  └── DashboardLayout (сервер)                │
│      ├── Sidebar (клиент, lazy load)         │
│      ├── Topbar (клиент, lazy load)          │
│      └── Page (сервер/клиент — по странице)  │
└──────────────────────────────────────────────┘
```

**Ожидаемый эффект:** -40% JS на страницу (данные с сервера, не через API)

---

### Шаг 3: Динамический импорт тяжёлых библиотек 📦

**Проблема:** recharts, jspdf, html2canvas, @dnd-kit грузятся в основном бандле.

**Что сделать:**

```tsx
// ВМЕСТО: import { GanttChart } from '@/components/ui/gantt-chart'
// СДЕЛАТЬ:
const GanttChart = dynamic(() => import('@/components/ui/gantt-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-96" />,
});

// Аналогично для:
// - chart.tsx → recharts (SSR: false)
// - proposal-preview → jspdf + html2canvas (SSR: false)
// - gantt-chart → @dnd-kit
// - block-editor → @dnd-kit/sortable
// - contract-preview, doc-preview → тяжелые
```

**Целевые компоненты для dynamic import:**

| Компонент | Библиотека | Размер | Стратегия |
|-----------|-----------|--------|-----------|
| `gantt-chart.tsx` | @dnd-kit | ~50 KB | `dynamic(..., {ssr: false})` |
| `proposal-preview.tsx` | html2canvas + jspdf | ~150 KB | `dynamic(..., {ssr: false})` |
| `contract-preview.tsx` | jspdf + jspdf-autotable | ~100 KB | `dynamic(..., {ssr: false})` |
| `doc-preview.tsx` | html2canvas | ~80 KB | `dynamic(..., {ssr: false})` |
| `block-editor.tsx` | @dnd-kit/sortable | ~40 KB | `dynamic(..., {ssr: false})` |
| `DashboardCharts` | recharts | ~200 KB | УЖЕ заменён на SVG |

**Ожидаемый эффект:** -30% от first load JS (~300-400 KB)

---

### Шаг 4: Оптимизация аутентификации 🔐

**Проблема:** DashboardLayout делает `fetch('/api/auth/me')` и показывает спиннер до ответа.

**Что сделать:**

```tsx
// В dashboard-layout.tsx — заменить fetch на middleware + cookies
// Или использовать серверный layout с проверкой token'а через cookies()

// Вариант А: middleware (рекомендуемый)
// middleware.ts
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// Вариант Б: серверный layout (быстрее)
// src/app/(dashboard)/layout.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {
  const user = await getCurrentUser(); // читает cookies на сервере
  if (!user) redirect('/login');
  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
```

**Ожидаемый эффект:** Устранение ~300ms задержки + bfcache fix

---

### Шаг 5: Оптимизация Lucide 🎯

**Проблема:** Все иконки грузятся, хотя используется ~20 из 1000+.

**Что сделать:**

1. **optimizePackageImports** уже будет в next.config (Шаг 1)
2. **Проверить импорты** — заменить `import { X, Y, Z } from 'lucide-react'` на прямые импорты, если optimizePackageImports не справляется
3. **Создать иконки для sidebar** — самые частые

**Ожидаемый эффект:** ~200 KB → ~20 KB для иконок

---

### Шаг 6: CSS оптимизация 🎨

**Проблема:** globals.css ~700 строк, много повторяющихся токенов.

**Что сделать:**

1. **Tailwind CSS scanning** уже настроен, но:
   - Проверить `@source not "../../**/*.md"` — уже есть ✅
   - Удалить **неиспользуемые CSS-переменные** (тёмная тема)
2. **Tailwind v4 JIT** автоматически tree-shakes CSS при сборке (уже работает)
3. **Удалить дублирующиеся анимации** — `@keyframes` занимают место

**Ожидаемый эффект:** Минимальный (CSS уже оптимизирован Tailwind JIT)

---

### Шаг 7: Back/Forward Cache 🔙

**Проблема:** Lighthouse показывает 1 failure reason для bfcache.

**Что делать:**

1. Проверить, что не используется `window.onunload`
2. Убрать `Cache-Control: no-store` где не нужно
3. Проверить, что auth redirect не блокирует bfcache
4. Использовать `router.push` вместо `router.replace` для навигации

**Ожидаемый эффект:** Мгновенная навигация "назад"

---

### Шаг 8: Preload и Preconnect 🔗

**Что сделать:**

```tsx
// В root layout (src/app/layout.tsx)
<head>
  {/* Preconnect для шрифтов */}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  
  {/* Preload критических шрифтов */}
  <link
    rel="preload"
    href="/_next/static/media/geist-sans.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
</head>
```

**Ожидаемый эффект:** FCP улучшение на ~100ms

---

## 3. Ожидаемые результаты

| Метрика | До | После (цель) |
|---------|-----|--------------|
| **LCP** | 3.3s | < 1.5s |
| **TBT** | 270ms | < 100ms |
| **FCP** | 0.3s | < 0.3s |
| **First Load JS** | ~1.5 MB | < 500 KB |
| **Network Payload** | 3,280 KiB | < 1,000 KiB |
| **Performance Score** | ~65 | > 90 |
| **bfcache** | ❌ 1 failure | ✅ Работает |

---

## 4. Порядок выполнения

```
Приоритет 1: 🔴 Шаг 1 + Шаг 3 (динамический импорт)
  Эффект: -30% бандла, -500ms LCP

Приоритет 2: 🔴 Шаг 4 (аутентификация)
  Эффект: bfcache fix, -300ms загрузка layout'а

Приоритет 3: 🟡 Шаг 5 (lucide)
  Эффект: -180 KB бандла

Приоритет 4: 🟡 Шаг 2 (Server Components)
  Эффект: -40% JS на страницу (требует рефакторинга)

Приоритет 5: 🟢 Шаг 6 + 7 + 8 (доработки)
  Эффект: ~100ms совокупно
```

---

## 5. Критические метрики для отслеживания

```bash
# Размер бандла
npx next build 2>&1 | grep -E "(First Load|page|JS|kB)"

# Проверка unused exports
npx tsx scripts/analyze-unused.ts

# Lighthouse CI
npx playwright test --project=lighthouse
```
