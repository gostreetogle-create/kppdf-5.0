# ADR-004 — Business-Critical Layer: Cycles 53 + 54

**Дата**: 2026-06-20
**Статус**: ✅ Accepted
**Автор схемы**: Агент A (Бизнес-Архитектор)
**Циклов**: 2 (53 + 54, parallel over different modules)

---

## Контекст

После завершения **Foundation Layer** (cycles 51 + 52 — см. [`ADR-002-foundation-before-critical.md`](./ADR-002-foundation-before-critical.md) и [`ADR-003-status-workflow-live-query.md`](./ADR-003-status-workflow-live-query.md)) — `B.3 StatusWorkflow live query` + `B.6 Roles API guards` были ✅ closed.

Сейчас foundation layer разблокировал **business-critical cycles**:

- **Cycle 53 (B.1)** — `ProductionOrder.status='completed'` должен auto-IN готовой продукции на склад. Без этого — компания не может отгрузить клиенту то, что «произвела». Auto-receipt InventoryMovement был критическим blockers с самого начала проекта.
- **Cycle 54 (B.2)** — `Client` модель должна поддерживать юрлица (B2B). 90% B2B сделок — с компаниями. Существующая модель (ФИО физлица) — костыль для 90% use cases.

---

## Принятые решения

### Cycle 53: B.1 Finished Goods auto-IN

**Решение 1**: `InventoryMovement.productionOrderId` как **nullable FK**, НЕ NON-NULL.

- **Плюсы**: ручные IN/OUT/transfer (не привязанные к ProductionOrder) по-прежнему работают — поле просто `NULL` для них. Backward-compatible 100%.
- **Альтернатива (NON-NULL)**: сломала бы manual movements (требует stub productionOrder для каждого ручного IN/OИТ/transfer).

**Решение 2**: `@@unique([productionOrderId, storageItemId, type])` для race protection.

- **Обоснование**: предотвращает дубль IN при concurrent transition в `completed` (два parallel PATCH с разных worker'ов → 2 IN → race). Postgres treats NULL as distinct в UNIQUE — значит несколько строк с `productionOrderId=NULL` (ручные) спокойно сосуществуют.
- **OUT для возврата материалов**: разрешён отдельно (его `type='out'`, не `type='in'`, поэтому UNIQUE не блокирует).

**Решение 3**: Helper `src/lib/warehouse/auto-receive-finished-goods.ts` (НЕ inline в PATCH handler).

- **Обоснование**: бизнес-логика — многоступенчатая per-product pipeline, не хардкодится в route. Reusable в batch imports / CLI tools / cron jobs в будущем.
- **Возврат**: `{created, skipped, errors, log: string[]}` — структурированный для observability без throwing.

**Решение 4**: Per-product `$transaction` + `try/catch` P2002 как `skipped`.

- **Обоснование**: каждый product независимо — если один падает (race), остальные продолжают. P2002 (unique constraint violation) = idempotent receipt — уже принят ранее, skip + log.

**Решение 5**: PATCH status update **ПЕРЕД** auto-IN.

- **Trade-off documented**: если auto-IN fails после status update, completion остаётся (business-critical > inventory perfect-sync).
- **Обоснование**: completion = основной business invariant. Inventory desync в edge case = admin вручную правит через `/api/storage-items`.

---

### Cycle 54: B.2 Client юрлица (B2B)

**Решение 1**: Discriminator field `type String @default("individual")` (НЕ separate `LegalEntity` модель).

- **Обоснование**: 1:1 polymorphic relation без overhead в JOIN'ах. Backward-compat естественно — existing клиенты остаются с `type='individual'` через DB DEFAULT.
- **Альтернатива (separate `LegalEntity` модель с 1:1 FK)**: over-engineering — Сlaient уже имеет `organizationId` + `organizationId`-soft-link для organizational boundaries; юрлицо = client с extra fields, НЕ отдельный aggregate.

**Решение 2**: Zod `z.discriminatedUnion('type', [...])`, НЕ `z.object` + `.superRefine`.

- **Обоснование**: discriminated union = structurally type-safe + better error messages (Zod указывает на branch mismatch).
- **Branch-specific validation**:
  - Individual: required lastName/firstName. INN = 10 цифр (юрлицо) OR 12 цифр (ИП) — optional.
  - Legal: required companyName + INN (10 цифр) + KPP (9 цифр) + legalAddress. lastName/firstName auto-defaulted to ''.

**Решение 3**: `UpdateClientSchema` как **flat `.partial()`** (vs mirror discriminated union).

- **Trade-off documented**: loses type-safety on partial updates, **но** обеспечивает backward-compat:
  - PUT `/api/clients/[id]` может использоваться для switch type с partial fields update.
  - Альтернатива (mirror DU на PUT) создала бы strict-validation 400 на transition switch — нежелательно в real data.
- **Pragmatic choice** для MVP; can be hardened post-deployment если потребуется.

**Решение 4**: Search в GET `/api/clients` — `mode: 'insensitive'` на всех `contains`.

- **Обоснование**: Cyrillic поиск «ооо» должен находить «ООО СтройМонтаж». Без `mode: 'insensitive'` Postgres (и Prisma по default) — case-sensitive.
- **Search fields**: `lastName | firstName | phone | companyName | inn`.

**Решение 5**: UI radio с conditional fields display (НЕ tab-based multi-form).

- **Обоснование**: linear form flow — пользователь сразу видит, как выглядит результат, не переключается между 'views'.
- **Single `<ClientForm>` с условным рендером** selected branch.

---

## Reversibility

| Decision | Reversible? | Effort | Comment |
|----------|-------------|--------|---------|
| Helper `autoReceiveFinishedGoods.ts` | ✅ | M (low) | Helper self-contained; rewrite = replace import. |
| Schema `productionOrderId` FK | ⚠️ | M | Drop nullable + re-add non-nullable = data migration. |
| Client type discriminator | ⚠️ | L | Split into `LegalEntity` model = большая миграция, de-link existing rows. |
| Zod DU + flat Update | ✅ | S | Just Zod changes, no schema migration. |
| Search contains insensitive | ✅ | S | Trivial revert. |
| UI radio | ✅ | M | Replace with tabs = component split. |

**Overall**: средний reversibility — ничего не carved-in-stone. Each decision can be reverted independently.

---

## Multi-pod / Scale Concerns

- **`status-workflow.ts` cache** (60s in-memory) — single-pod only. Multi-pod → cache поздно invalidates. Cycle 51+ADR-003 уже acknowledged + documented.
- **`auto-receive-finished-goods.ts`** — никакого in-memory cache, чистый DB call per invocation. Multi-pod safe.
- **`Client` schema** — index-only concerns; multi-pod search is parallelizable. ✅

---

## Cross-cutting notes

- **Tier A untouched**: `src/lib/jwt.ts` NOT touched. ✅
- **Tier B API frozen**: `src/lib/pdf/index.ts` NOT touched. ✅
- **New Tier C candidates**: `status-workflow.ts` (cycle 51) + `auto-receive-finished-goods.ts` (cycle 53).
- **`Client.new fields` базируется на существующих `Organization.inn/kpp/legalAddress`** — НЕ дублирование, а per-client fields (юрлица также имеет запись в Organization для банковских реквизитов). Both полей совместимы — Organization для company-level, Client для per-client.
- **Backward-compat 100%**: existing individual client's remain работоспособными без миграции данных.

---

## Acceptance Criteria (post-cycle 53+54)

| Проверка | Ожидание |
|----------|----------|
| Cycle 53: Production transition completed → IN created | В БД: `InventoryMovement type='in', productionOrderId=<id>, storageItemId=<auto>`, quantity суммарно = sum(proposalItem.quantity) |
| Cycle 53: Race повторного transition в completed → skip | UNIQUE constraint blocks; P2002 caught; status НЕ revert |
| Cycle 53: Manual IN без заказа | OK — productionOrderId=NULL works |
| Cycle 54: Create individual client | Works (existing flow не сломан) |
| Cycle 54: Create legal client | Works — required validation на companyName/inn/kpp/legalAddress |
| Cycle 54: Search Cyrillic "ооо" → finds "ООО" | matches via `mode: 'insensitive'` |
| Cycle 54: PUT update changing fields type | Works (flat partial schema allows this) |
| Cycle 54 сущ: pre-existing clients | type='individual' via DB DEFAULT; existing fields не нарушены |

---

## Filing

- ADR документ: [`ADR-004-business-critical-layer.md`](./ADR-004-business-critical-layer.md).
- Industry standards referenced: Prisma UNIQUE + Postgres CASE-INSENSITIVE search + Zod discriminated union.
- Связанные ADR: [`ADR-002-foundation-before-critical.md`](./ADR-002-foundation-before-critical.md), [`ADR-003-status-workflow-live-query.md`](./ADR-003-status-workflow-live-query.md).
- Связанные PR commits: `cycle-53: B.1 Finished Goods auto-IN` + `cycle-54: B.2 Client юрлица (B2B)`.
