# Questions for Human

## Cycle 1 — 2026-06-18

### Design: 127+ hardcoded Tailwind colors (Medium Priority)

**Проблема:** В проекте ~127+ мест используют хардкоженные Tailwind классы для статусов и индикации: `bg-green-100 text-green-700`, `bg-red-50 text-red-700`, `bg-yellow-100 text-yellow-700` и т.д. Эти классы не работают в тёмной теме и не используют CSS-переменные.

**Текущее состояние:**
- Создан общий `StatusBadge` компонент в `src/lib/constants/statuses.tsx`
- ~8 страниц уже мигрированы (certificates, rpp-entries, tenders, contracts, proposals, production)
- ~6 страниц всё ещё используют ручные `<span>` с хардкоженными цветами (products, organizations, warehouse, production/work-types, production/work-centers, production/workers)

**Что нужно решить:**
1. Заменить ручные `<span className="bg-green-100 text-green-700">` на `StatusBadge` компонент
2. Создать CSS-переменные для статусных цветов в `globals.css`
3. Обновить `StatusBadge` для использования CSS-переменных вместо hardcoded Tailwind классов

**Оценка:** ~2 часа на полную миграцию.

**Вопрос:** Делаем полную миграцию сейчас или оставляем как известное ограничение?

### Build: JWT_SECRET required for production build (Info)

**Проблема:** Сборка `npm run build` требует `JWT_SECRET` в переменных окружения из-за проверки в `src/lib/auth.ts`. Это ожидаемое поведение — просто нужно помнить про `export JWT_SECRET=... && npm run build`.

**Решение:** Документировано в README.md и .env.example. OK.
