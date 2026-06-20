-- Cycle 53 (B.1): finished goods auto-IN
--
-- Adds InventoryMovement.productionOrderId FK to ProductionOrder for связь
-- авто-приёмки готовой продукции с заказом.
--
-- Race protection: @@unique([productionOrderId, storageItemId, type]) —
--  один IN на (order, storageItem) предотвращает двойной IN при повторном
--  transition или concurrent admin clicks. OUT для возврата материалов
--  допустим отдельной строкой (отдельный type).

-- Step 1: ADD COLUMN nullable — existing rows имеют NULL (ручные операции).
ALTER TABLE "InventoryMovement" ADD COLUMN "productionOrderId" TEXT;

-- Step 2: FK constraint with ON DELETE SET NULL.
-- Если production order удаляется, движения сохраняются как historical record.
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

-- Step 3: UNIQUE constraint composite index для race protection.
-- (productionOrderId, storageItemId, type) — один IN на заказ+storageItem.
-- NULL productionOrderId допустим (ручные операции) — Postgres UNIQUE
-- позволяет multiple NULL в unique column.
CREATE UNIQUE INDEX "InventoryMovement_productionOrderId_storageItemId_type_key"
  ON "InventoryMovement"("productionOrderId", "storageItemId", "type");

-- Step 4: single-column index для fast lookup by productionOrderId.
CREATE INDEX "InventoryMovement_productionOrderId_idx"
  ON "InventoryMovement"("productionOrderId");
