# Unit Tests Checklist — Pure Utilities & Validators

**Ответственный:** ИИ-2
**Дата начала:** 2026-06-20
**Статус:** Выполнено (287 тестов, 16 файлов)

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

- [x] Найти все чистые утилиты в проекте (без side-effects, без prisma/fetch):
  - [x] `src/lib/utils.ts` — formatCurrency, formatDate, formatDateTime, cn
  - [x] `src/lib/counter.ts` — formatDocNumber (nextCounter через DB, тестируется интеграционно)
  - [x] `src/lib/validations/*.ts` — Zod-схемы (27 файлов)
  - [x] `src/lib/status-workflow.ts` — WorkflowError, FALLBACK_TRANSITIONS
  - [x] `src/lib/number-protection.ts` — assertNumberImmutable, NumberLockedError
  - [x] `src/lib/jwt.ts` — signAccessToken, signRefreshToken, verifyToken
- [x] Написать тесты для `src/lib/utils.ts` → utils.test.ts (15 tests)
- [x] Написать тесты для `src/lib/counter.ts` → counter-formats.test.ts (5 tests) + counter.test.ts (7 tests)
- [x] Написать тесты для Zod-валидаций:
  - validations.test.ts (40 tests) — proposal, contract, production-order, document-template
  - validations-extra.test.ts (31 tests) — client, product, warehouse, tender
  - validations-supply.test.ts (24 tests) — supplier-order, purchase-request
  - validations-finance.test.ts (25 tests) — order-closing, reconciliation-act, incoming-invoice
  - validations-reference.test.ts (36 tests) — certificate, rpp-entry, worker, work-type, work-center, storage-item
- [x] Написать тесты для `src/lib/number-protection.ts` → number-protection.test.ts (11 tests)
- [x] Написать тесты для `src/lib/jwt.ts` → jwt.test.ts (9 tests)
- [x] Запустить `npx vitest run` — 287 тестов зелёные, 16 файлов
- [x] Проверить покрытие: положительные + отрицательные + граничные случаи
- [x] Не устанавливать новые зависимости без необходимости
