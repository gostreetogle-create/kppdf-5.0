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

---

## Cycle 25 — 2026-06-19 — RESOLVED markers (autonomous audit)

### ✅ RESOLVED — Hardcoded Tailwind colors (originally Cycle 1 question, Medium Priority)

**Resolution history:**
- **Cycle 5 (2026-06-18) — `StatusBadge` full migration:** все 6 страниц (products, organizations, warehouse, work-types, work-centers, workers) мигрированы с локальных `<span>` на централизованный `StatusBadge` из `src/lib/constants/statuses.tsx`. Добавлена `USER_ROLE` карта с тёмной темой. -39 строк дублей.
- **Cycle 8 (2026-06-19) — CSS variable migration:** 28 переменных в `:root` + `[data-theme="dark"]` (12 status пар bg/text + 4 solid). ~127 hardcoded мест в 14 файлах мигрированы на `bg-[var(--status-X-bg)] text-[var(--status-X-text)]` алиасы.

**Conclusion:** Both deliverables in original Cycle 1 question are COMPLETE. No further migration needed. Dark mode теперь работает прозрачно через CSS-переменные. Раздел закрыт.

### ✅ CONFIRMED OK — JWT_SECRET required for production build

Status confirmed OK (cycle 18-jwt-secret-strict убрал dev-fallback). README.md + .env.example documentation complete. No action.

### Queue state at this audit
- 33/33 implementation complete
- Vitest 75/75 passing
- tsc 0 / eslint 0
- MiMo concurrent: 1 in_progress + 11 ready (cycle-19 onwards)

### What remains (recorded for next cycles, not blocking)
- TODO pagination в src/lib/types/server-pages.ts — 1 строка (не блокирующий)
- 12 `as any` в src/lib/types/server-pages.ts — deliberate null-bridge (server→client), documented в cycle-14 outcome
- @ts-nocheck в src/generated/prisma/* — generated, out of scope
- @ts-ignore в src/generated/prisma/* — generated
- Load testing, visual regression, axe-core (a11y) — deferred to cycle-22+ per cycle-24 plan
