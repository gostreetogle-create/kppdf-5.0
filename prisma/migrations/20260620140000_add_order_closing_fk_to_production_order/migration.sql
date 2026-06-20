-- Cycle 56 (B.5): OrderClosing FK relation to ProductionOrder.
--   * existing orderId column → typed FK with SetNull cascade.
--   * Reverse relation (ProductionOrder.orderClosings OrderClosing[])
--     applied via Prisma schema; no DB-level reverse side needed.
--
-- Safety: SetNull cascade ensures historical OrderClosing records survive
-- ProductionOrder deletion (audit-trail safe). No data loss — existing
-- orphan orderId values will simply be NULLed at delete time.
--
-- NOT VALID pattern: avoids full-table scan during ADD CONSTRAINT.
-- VALIDATE CONSTRAINT runs a separate (non-blocking) scan — safe with
-- existing data and no downtime.
--
-- Migration runs inside a Prisma-managed transaction (no COMMIT here).

ALTER TABLE "OrderClosing"
  ADD CONSTRAINT "OrderClosing_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id")
  ON DELETE SET NULL
  NOT VALID;

ALTER TABLE "OrderClosing"
  VALIDATE CONSTRAINT "OrderClosing_orderId_fkey";

-- Index on orderId — fast lookup by production order (B.5 audit-trail use case).
CREATE INDEX IF NOT EXISTS "OrderClosing_orderId_idx" ON "OrderClosing"("orderId");
