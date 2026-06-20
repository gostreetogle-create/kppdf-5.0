# OpenAPI Specification Checklist

**Ответственный:** ИИ-2
**Дата начала:** 2026-06-20
**Статус:** Ожидает начала

> Исполнитель обязан отмечать выполненные шаги [x] и записывать каждое значимое действие в PARALLEL_WORK_LOG.md

---

- [ ] Изучить существующие API-роуты: `src/app/api/**/*.ts`
- [ ] Описать основные сущности в `components/schemas`: User, Client, Proposal, Contract, ProductionOrder, Organization, WorkType, Shipment
- [ ] Описать эндпоинты авторизации: `POST /api/auth/login`, `POST /api/auth/refresh`, `DELETE /api/auth/login`
- [ ] Описать CRUD эндпоинты для каждой сущности (GET list, GET by id, POST, PUT, DELETE)
- [ ] Описать параметры запроса: `page`, `limit`, `sort`, `search`, `status`
- [ ] Описать security-схему: Bearer JWT token
- [ ] Использовать OpenAPI 3.0.3
- [ ] Сохранить в `docs/openapi.yaml`
- [ ] Проверить валидность YAML
