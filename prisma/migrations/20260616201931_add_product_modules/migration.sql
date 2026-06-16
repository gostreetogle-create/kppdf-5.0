-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ProductModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "article" TEXT,
    "width" REAL,
    "height" REAL,
    "depth" REAL,
    "weight" REAL,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "ProductModule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleWorkType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimatedHours" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "moduleId" TEXT NOT NULL,
    "workTypeId" TEXT NOT NULL,
    CONSTRAINT "ModuleWorkType_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProductModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModuleWorkType_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "WorkType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "isPurchased" BOOLEAN NOT NULL DEFAULT true,
    "moduleId" TEXT NOT NULL,
    CONSTRAINT "ModuleMaterial_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProductModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageItemId" TEXT NOT NULL,
    CONSTRAINT "InventoryMovement_storageItemId_fkey" FOREIGN KEY ("storageItemId") REFERENCES "StorageItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "estimatedHours" REAL,
    "actualHours" REAL,
    "plannedStart" DATETIME,
    "plannedEnd" DATETIME,
    "actualStart" DATETIME,
    "actualEnd" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" TEXT NOT NULL,
    "workTypeId" TEXT,
    "workCenterId" TEXT,
    "workerId" TEXT,
    CONSTRAINT "OrderTask_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderTask_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "WorkType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderTask_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderTask_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderTask" ("actualEnd", "actualHours", "actualStart", "createdAt", "description", "estimatedHours", "id", "orderId", "plannedEnd", "plannedStart", "sortOrder", "status", "title", "updatedAt", "workTypeId", "workerId") SELECT "actualEnd", "actualHours", "actualStart", "createdAt", "description", "estimatedHours", "id", "orderId", "plannedEnd", "plannedStart", "sortOrder", "status", "title", "updatedAt", "workTypeId", "workerId" FROM "OrderTask";
DROP TABLE "OrderTask";
ALTER TABLE "new_OrderTask" RENAME TO "OrderTask";
CREATE INDEX "OrderTask_orderId_idx" ON "OrderTask"("orderId");
CREATE INDEX "OrderTask_status_idx" ON "OrderTask"("status");
CREATE INDEX "OrderTask_workerId_idx" ON "OrderTask"("workerId");
CREATE INDEX "OrderTask_workCenterId_idx" ON "OrderTask"("workCenterId");
CREATE TABLE "new_ProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "plannedStart" DATETIME,
    "plannedEnd" DATETIME,
    "actualStart" DATETIME,
    "actualEnd" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workTypeId" TEXT,
    "workCenterId" TEXT,
    "contractId" TEXT,
    "proposalId" TEXT,
    CONSTRAINT "ProductionOrder_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "WorkType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOrder_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductionOrder" ("actualEnd", "actualStart", "createdAt", "id", "notes", "number", "plannedEnd", "plannedStart", "priority", "status", "title", "updatedAt", "workCenterId", "workTypeId") SELECT "actualEnd", "actualStart", "createdAt", "id", "notes", "number", "plannedEnd", "plannedStart", "priority", "status", "title", "updatedAt", "workCenterId", "workTypeId" FROM "ProductionOrder";
DROP TABLE "ProductionOrder";
ALTER TABLE "new_ProductionOrder" RENAME TO "ProductionOrder";
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");
CREATE INDEX "ProductionOrder_number_idx" ON "ProductionOrder"("number");
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");
CREATE INDEX "ProductionOrder_contractId_idx" ON "ProductionOrder"("contractId");
CREATE INDEX "ProductionOrder_proposalId_idx" ON "ProductionOrder"("proposalId");
CREATE TABLE "new_Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "clientId" TEXT,
    "organizationId" TEXT,
    "templateId" TEXT,
    "markupPercent" REAL NOT NULL DEFAULT 0,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 20,
    "notes" TEXT,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Proposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Proposal" ("clientId", "createdAt", "id", "markupPercent", "notes", "number", "organizationId", "status", "title", "updatedAt", "validUntil") SELECT "clientId", "createdAt", "id", "markupPercent", "notes", "number", "organizationId", "status", "title", "updatedAt", "validUntil" FROM "Proposal";
DROP TABLE "Proposal";
ALTER TABLE "new_Proposal" RENAME TO "Proposal";
CREATE UNIQUE INDEX "Proposal_number_key" ON "Proposal"("number");
CREATE INDEX "Proposal_number_idx" ON "Proposal"("number");
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Counter_name_key" ON "Counter"("name");

-- CreateIndex
CREATE INDEX "ProductModule_productId_idx" ON "ProductModule"("productId");

-- CreateIndex
CREATE INDEX "ModuleWorkType_moduleId_idx" ON "ModuleWorkType"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleWorkType_workTypeId_idx" ON "ModuleWorkType"("workTypeId");

-- CreateIndex
CREATE INDEX "ModuleMaterial_moduleId_idx" ON "ModuleMaterial"("moduleId");

-- CreateIndex
CREATE INDEX "WorkCenter_name_idx" ON "WorkCenter"("name");
