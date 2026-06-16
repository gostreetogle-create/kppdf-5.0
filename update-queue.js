const fs = require('fs');
const q = JSON.parse(fs.readFileSync('agent-queue.json', 'utf-8'));

const newTasks = [
  // P0 - Buffy
  {
    id: 'counter-model',
    title: 'Counter model + nextCounter() + API для авто-нумерации документов',
    assignee: 'buffy',
    status: 'in_progress',
    priority: 0,
    depends_on: [],
    description: 'Создать Counter модель в Prisma. Функция nextCounter(name). Интегрировать в Proposals (КП-XXXX).'
  },
  {
    id: 'proposal-status',
    title: 'PATCH /api/proposals/:id/status — управление статусами КП',
    assignee: 'buffy',
    status: 'in_progress',
    priority: 0,
    depends_on: [],
    description: 'Статусы draft→sent→approved→rejected. Валидация переходов. Авто-даты.'
  },
  {
    id: 'contract-status',
    title: 'PATCH /api/contracts/:id/status — управление статусами договоров',
    assignee: 'buffy',
    status: 'in_progress',
    priority: 0,
    depends_on: [],
    description: 'Статусы draft→active→completed→cancelled. Валидация переходов.'
  },
  {
    id: 'proposal-to-contract',
    title: 'POST /api/proposals/:id/convert-to-contract — конвертация КП в договор',
    assignee: 'buffy',
    status: 'pending',
    priority: 0,
    depends_on: ['proposal-status'],
    description: 'Создать Contract из Proposal. Скопировать items. Связать proposalId.'
  },
  // P1 - MiMo
  {
    id: 'supplier-order-api',
    title: 'API routes for SupplierOrder + SupplierOrderItem',
    assignee: 'mimo',
    status: 'pending',
    priority: 1,
    depends_on: [],
    description: 'CRUD для SupplierOrder. Статусы draft→confirmed→shipped→delivered→cancelled.'
  },
  {
    id: 'incoming-invoice-api',
    title: 'API routes for IncomingInvoice',
    assignee: 'mimo',
    status: 'pending',
    priority: 1,
    depends_on: [],
    description: 'CRUD для IncomingInvoice. Статусы draft→paid→overdue.'
  },
  {
    id: 'inventory-api',
    title: 'API routes for Inventory items + movements с авто-пересчётом',
    assignee: 'mimo',
    status: 'pending',
    priority: 1,
    depends_on: [],
    description: 'StorageItem остатки. InventoryMovement журнал. POST /movements → auto upsert quantity.'
  },
  {
    id: 'upload-api',
    title: 'POST /api/upload — загрузка файлов',
    assignee: 'mimo',
    status: 'pending',
    priority: 2,
    depends_on: [],
    description: 'multer-подобная загрузка. Auth middleware. 10MB лимит.'
  }
];

// Filter out duplicates
const existingIds = new Set(q.tasks.map(t => t.id));
for (const task of newTasks) {
  if (!existingIds.has(task.id)) {
    q.tasks.unshift(task);
    existingIds.add(task.id);
  }
}

// Update agent stats
for (const agent of ['buffy', 'mimo']) {
  const agentTasks = q.tasks.filter(t => t.assignee === agent);
  q.agents[agent].tasks_pending = agentTasks.filter(t => t.status === 'pending').length;
  q.agents[agent].tasks_in_progress = agentTasks.filter(t => t.status === 'in_progress').length;
}

fs.writeFileSync('agent-queue.json', JSON.stringify(q, null, 2));
console.log('QUEUE UPDATED');
console.log('Buffy P0:', JSON.stringify(q.tasks.filter(t => t.assignee === 'buffy' && (t.status === 'in_progress' || t.status === 'pending')).map(t => ({ id: t.id, status: t.status }))));
console.log('MiMo P1:', JSON.stringify(q.tasks.filter(t => t.assignee === 'mimo' && (t.status === 'in_progress' || t.status === 'pending')).map(t => ({ id: t.id, status: t.status }))));
