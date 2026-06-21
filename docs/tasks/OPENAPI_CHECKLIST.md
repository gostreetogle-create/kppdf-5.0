# OpenAPI Specification Checklist

**Ответственный:** ИИ-2
**Дата начала:** 2026-06-20
**Статус:** ✅ Завершён

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

- [x] Изучить существующие API-роуты: `src/app/api/**/*.ts` — проанализировано 173 handler-функции
- [x] Описать основные сущности в `components/schemas`: User, Organization, Person, Product, ProductModule, Material, Proposal, Contract, ProductionOrder, OrderTask, WorkType, WorkCenter, Worker, Warehouse, StorageItem, Shipment, PurchaseRequest, SupplierOrder, IncomingInvoice, OrderClosing, ReconciliationAct, DocumentTemplate, TableTemplate, DocType, StatusWorkflow, Tender, Certificate, RppEntry, InventorFile, Cart, ActivityLogEntry — **~60 схем**
- [x] Описать эндпоинты авторизации: `POST /api/auth/login`, `POST /api/auth/refresh`, `DELETE /api/auth/login`, `GET /api/auth/me`
- [x] Описать CRUD эндпоинты для каждой сущности (GET list, GET by id, POST, PUT, DELETE)
- [x] Описать параметры запроса: `page`, `limit`, `sort`, `search`, `status`
- [x] Описать security-схему: Bearer JWT token (Cookie-based)
- [x] Использовать OpenAPI 3.0.3
- [x] Сохранить в `docs/openapi.yaml` — **~3000 строк, ~90 эндпоинтов**
- [x] Проверить валидность YAML — `npx swagger-cli validate docs/openapi.yaml` — **OK** ✅
