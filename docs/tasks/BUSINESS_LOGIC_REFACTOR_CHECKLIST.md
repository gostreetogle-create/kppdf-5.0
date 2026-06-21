# Чек-лист доработки бизнес-логики

## Статус: ✅ Полностью выполнено

### Принятые архитектурные решения:
1. ✅ **Client → Organization + роль «Клиент»** — Client удалён, данные перенесены, customerId в Proposal/Contract
2. ✅ **Person** — новая модель, many-to-many с Organization через OrganizationContact
3. ✅ **Material** — новая модель, supplierId → Organization (роль «Поставщик»)
4. ✅ **ProductModule.productId** — опциональный
5. ✅ **Файлы** — API upload → public/uploads/
6. ✅ **DaData** — автозаполнение данных организации по ИНН

---

## Этапы реализации

### Этап 1: Prisma-схема (БД)
- [x] Модель `Person` (name, phone, email, position)
- [x] Модель `OrganizationContact` (personId, organizationId) — junction
- [x] Модель `Material` (name, article, unit, description, price?, image?, supplierId?, category?)
- [x] Модель `MaterialCategory` (name)
- [x] `ProductModule.productId` → optional
- [x] `Organization` → добавлен выпадающий список Person для выбора контактных лиц (**✅ выполнено 21.06.2026**): `contactPersonIds` в валидации + API + форма
- [x] `prisma db push`

### Этап 2: Валидации (Zod)
- [x] `src/lib/validations/person.ts`
- [x] `src/lib/validations/material.ts`
- [x] `src/lib/validations/material-category.ts`
- [x] Обновить `src/lib/validations/product-module.ts` (productId optional)
- [x] Обновить `src/lib/validations/organization.ts` (roleIds, contactPersonIds)

### Этап 3: API
- [x] `/api/persons` — CRUD с кэшированием
- [x] `/api/materials` — CRUD с кэшированием
- [x] `/api/materials/categories` — CRUD
- [x] `/api/upload` — POST (загрузка файлов, requireEditor)
- [x] Обновить `/api/organizations` — roleIds, фильтрация `?role=`
- [x] `/api/org-roles` — список OrgRole
- [x] `/api/dadata/find-by-inn` — DaData API прокси для автозаполнения

### Этап 4: Страницы
- [x] `src/app/(dashboard)/materials/page.tsx` — список материалов
- [x] `src/app/(dashboard)/persons/page.tsx` — список контактных лиц
- [x] Обновить `organizations/page.tsx` — выбор ролей, DaData-заполнение

### Этап 5: UI модуля
- [x] `productId` — опциональный
- [x] Изображение — file input + URL как запасной
- [x] Материалы — компактные карточки с тултипами
- [x] Tooltips на русском
- [x] Быстрое создание WorkType (модальное окно + авто-выбор)

### Этап 6: Sidebar
- [x] Добавить пункт «Материалы» в справочники
- [x] «Клиенты» → удалён (Client модель удалена)

### Этап 7: Тестирование
- [x] `npx tsc --noEmit` — 0 ошибок ✅
- [x] `npx vitest run` — 272/272 passed ✅
- [x] Code Review — замечания исправлены ✅
