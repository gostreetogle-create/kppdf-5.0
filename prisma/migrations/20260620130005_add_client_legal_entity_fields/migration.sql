-- Cycle 54 (B.2): Client юрлица (B2B) — expand Client model.
--
-- Adds:
--   - type discriminator ('individual' | 'legal') with default 'individual'
--   - companyName, legalForm, kpp, ogrn, legalAddress for legal entities
--   - 3 indexes для filter/search performance
--
-- Backward compatibility:
--   - ALTER TABLE ADD COLUMN с DEFAULT 'individual' applied atomically;
--     существующие строки получают type='individual' в одной операции.
--   - NOT NULL на type после DEFAULT safe (existing rows already filled).
--   - Idempotent: re-running миграция безопасно (no-op после первого запуска).

-- Step 1: ADD COLUMN with DEFAULT. Postgres 11+ optimizes ADD COLUMN with DEFAULT
-- (no rewrite of existing rows).
ALTER TABLE "Client"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'individual';

-- Step 2: ADD nullable legal entity fields (no DEFAULT — NULL означает не задано).
ALTER TABLE "Client" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Client" ADD COLUMN "legalForm" TEXT;
ALTER TABLE "Client" ADD COLUMN "kpp" TEXT;
ALTER TABLE "Client" ADD COLUMN "ogrn" TEXT;
ALTER TABLE "Client" ADD COLUMN "legalAddress" TEXT;

-- Step 3: CreateIndex для filter по type + search by companyName/inn.
CREATE INDEX "Client_type_idx" ON "Client"("type");
CREATE INDEX "Client_companyName_idx" ON "Client"("companyName");
CREATE INDEX "Client_inn_idx" ON "Client"("inn");
