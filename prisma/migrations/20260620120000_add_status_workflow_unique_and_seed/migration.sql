-- Migration for Cycle 51 (B.3 StatusWorkflow live query + seed)
--
-- 1. Clean up duplicate (entity, fromStatus, toStatus) rows so the unique constraint can be applied.
--    Keeps the row with the earliest createdAt (preserves historical/audit ordering).
-- 2. Convert the lookup index into a UNIQUE constraint to enforce idempotent seeding.
-- 3. Seed the canonical transition graph for 5 entities (proposal, contract, productionOrder,
--    incomingInvoice, supplierOrder). Idempotent via ON CONFLICT — safe to run on already-seeded DB.

-- Step 1: Remove duplicate StatusWorkflow rows (keep earliest by createdAt).
DELETE FROM "StatusWorkflow"
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY entity, "fromStatus", "toStatus"
             ORDER BY "createdAt" ASC, id ASC
           ) AS rn
    FROM "StatusWorkflow"
  ) t
  WHERE t.rn > 1
);

-- Step 2: Replace the non-unique lookup index with a UNIQUE constraint.
-- Postgres: drop the plain index, recreate as unique. The @@index([entity, fromStatus])
-- in schema is a prefix of the unique constraint and remains efficient.
DROP INDEX IF EXISTS "StatusWorkflow_entity_fromStatus_idx";
CREATE UNIQUE INDEX "StatusWorkflow_entity_fromStatus_toStatus_key"
  ON "StatusWorkflow"("entity", "fromStatus", "toStatus");

-- Step 3: Seed canonical transitions for 5 entities.
-- Roles are comma-separated. "manager,admin" = manager role + admin bypass (admin bypass
-- is enforced in src/lib/status-workflow.ts regardless of the roles string).
-- gen_random_uuid() requires PostgreSQL 13+ (project targets PG).
INSERT INTO "StatusWorkflow" (id, name, entity, "fromStatus", "toStatus", roles, "isActive", "createdAt", "updatedAt")
VALUES
  -- ===== proposal =====
  (gen_random_uuid()::text, 'Proposal: draft → sent',           'proposal', 'draft',    'sent',      'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: sent → accepted',        'proposal', 'sent',     'accepted',  'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: sent → rejected',        'proposal', 'sent',     'rejected',  'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: sent → paid',            'proposal', 'sent',     'paid',      'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: accepted → converted',   'proposal', 'accepted', 'converted', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: accepted → paid',        'proposal', 'accepted', 'paid',      'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: paid → converted',       'proposal', 'paid',     'converted', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Proposal: rejected → draft',       'proposal', 'rejected', 'draft',     'manager,admin', true, NOW(), NOW()),
  -- ===== contract =====
  (gen_random_uuid()::text, 'Contract: draft → active',          'contract', 'draft',     'active',    'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Contract: active → completed',      'contract', 'active',    'completed', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Contract: active → cancelled',      'contract', 'active',    'cancelled', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Contract: completed → cancelled',   'contract', 'completed', 'cancelled', 'manager,admin', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Contract: cancelled → draft',       'contract', 'cancelled', 'draft',     'manager,admin', true, NOW(), NOW()),
  -- ===== productionOrder (manager + production roles) =====
  (gen_random_uuid()::text, 'PO: planned → in_progress',         'productionOrder', 'planned',       'in_progress',  'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: planned → cancelled',           'productionOrder', 'planned',       'cancelled',   'manager,admin',            true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: in_progress → manufacturing',   'productionOrder', 'in_progress',   'manufacturing','manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: in_progress → painting',         'productionOrder', 'in_progress',   'painting',     'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: in_progress → completed',       'productionOrder', 'in_progress',   'completed',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: in_progress → cancelled',       'productionOrder', 'in_progress',   'cancelled',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: manufacturing → painting',      'productionOrder', 'manufacturing', 'painting',     'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: manufacturing → completed',    'productionOrder', 'manufacturing', 'completed',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: manufacturing → cancelled',    'productionOrder', 'manufacturing', 'cancelled',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: painting → shipping',           'productionOrder', 'painting',      'shipping',     'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: painting → completed',         'productionOrder', 'painting',      'completed',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: painting → cancelled',         'productionOrder', 'painting',      'cancelled',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: shipping → completed',         'productionOrder', 'shipping',      'completed',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: shipping → cancelled',         'productionOrder', 'shipping',      'cancelled',    'manager,admin,production', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PO: cancelled → planned',           'productionOrder', 'cancelled',     'planned',      'manager,admin',            true, NOW(), NOW()),
  -- ===== incomingInvoice =====
  (gen_random_uuid()::text, 'IncomingInvoice: draft → paid',     'incomingInvoice', 'draft',   'paid',    'manager,admin,accountant', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'IncomingInvoice: draft → overdue',  'incomingInvoice', 'draft',   'overdue', 'manager,admin,accountant', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'IncomingInvoice: overdue → paid',   'incomingInvoice', 'overdue', 'paid',    'manager,admin,accountant', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'IncomingInvoice: overdue → draft',  'incomingInvoice', 'overdue', 'draft',   'manager,admin,accountant', true, NOW(), NOW()),
  -- ===== supplierOrder =====
  (gen_random_uuid()::text, 'SupplierOrder: draft → confirmed',  'supplierOrder', 'draft',     'confirmed', 'manager,admin,storekeeper', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SupplierOrder: draft → cancelled',  'supplierOrder', 'draft',     'cancelled', 'manager,admin',             true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SupplierOrder: confirmed → shipped','supplierOrder', 'confirmed', 'shipped',   'manager,admin,storekeeper', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SupplierOrder: confirmed → cancelled','supplierOrder', 'confirmed','cancelled', 'manager,admin',             true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SupplierOrder: shipped → delivered', 'supplierOrder', 'shipped',   'delivered', 'manager,admin,storekeeper', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SupplierOrder: shipped → cancelled',  'supplierOrder', 'shipped',   'cancelled', 'manager,admin',             true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SupplierOrder: cancelled → draft',   'supplierOrder', 'cancelled', 'draft',     'manager,admin',             true, NOW(), NOW())
ON CONFLICT ("entity", "fromStatus", "toStatus") DO NOTHING;
