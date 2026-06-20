# Unit Tests Checklist — Pure Utilities & Validators

**Ответственный:** ИИ-2
**Дата начала:** 2026-06-20
**Статус:** Ожидает начала

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

- [ ] Найти все чистые утилиты в проекте (без side-effects, без prisma/fetch):
  - [ ] `src/lib/utils.ts` — formatCurrency и другие
  - [ ] `src/lib/counter.ts` — nextCounter, formatDocNumber
  - [ ] `src/lib/validations/*.ts` — Zod-схемы
  - [ ] `src/lib/status-workflow.ts` — assertTransitionAllowed (unit-часть)
- [ ] Написать тесты для `src/lib/utils.ts`
- [ ] Написать тесты для `src/lib/counter.ts`
- [ ] Написать тесты для Zod-валидаций (proposals, contracts, clients)
- [ ] Написать тесты для `src/lib/status-workflow.ts` (fallback transitions, cache)
- [ ] Запустить `npx vitest run` — все тесты зелёные
- [ ] Проверить покрытие: положительные + отрицательные + граничные случаи
- [ ] Не устанавливать новые зависимости без необходимости
