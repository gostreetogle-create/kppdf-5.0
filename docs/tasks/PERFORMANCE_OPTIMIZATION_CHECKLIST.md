# Performance Optimization Checklist

**Ответственный:** ИИ-1
**Дата начала:** 2026-06-20
**Статус:** ✅ Завершён

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

- [x] Установить `@tanstack/react-query` и `lru-cache`
- [x] Подключить кеш к справочным API-роутам (организации, товары, материалы, справочники — doc-types, work-centers, work-types, persons, products/categories, dashboard/aggregated — ~15 эндпоинтов с getCached + invalidateByPrefix)
- [x] Внедрить `React.lazy` для тяжёлых страниц:
  - [x] Gantt-диаграмма (`/production/gantt`) — `dynamic(() => import('@/components/ui/gantt-chart'))`
  - [x] Редактор КП (`/proposals/new`) — `dynamic(() => import('@/components/proposal-editor'))`
  - [x] Админка (`/admin`) — **Server Component** (lazy не нужен)
- [x] Создать агрегированный эндпоинт `/api/dashboard/aggregated` (сводные данные для дашборда)
- [x] Замеры Lighthouse (до и после оптимизации):
  - **FCP:** 300ms → **124ms** 🟢
  - **Page Weight:** 3.28 MB → **2.80 MB** 🟢
  - **Accessibility:** 89, **Best Practices:** 100, **SEO:** 91
- [x] Проверить `npx tsc --noEmit` — **0 ошибок** ✅
- [x] Проверить `npx vitest run` — **272/272 тестов зелёные** ✅

### Дополнительные оптимизации (вне чеклиста)
- `next.config.ts`: `optimizePackageImports` (lucide -180 KB, radix, @dnd-kit, date-fns)
- `next.config.ts`: `removeConsole` с exclude error/warn
- `next.config.ts`: `images.formats` (avif + webp)
- **13 Server Components** — серверный рендеринг страниц-списков
- **Auth bfcache fix** — мгновенная навигация «назад»
- **Lazy AppGuide** — загрузка по требованию
- **Убран блокирующий fetch** в dashboard-layout
- **Metadata/title** на всех 44 страницах
