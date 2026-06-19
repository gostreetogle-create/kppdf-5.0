#!/usr/bin/env node

/**
 * agent-cli.js — Agent Communication Protocol CLI
 *
 * Использование:
 *   node agent-cli.js <agent> <command> [args]
 *
 * Агенты:
 *   buffy    — стратегический ассистент (архитектура, API, code review)
 *   mimo     — исполнительный агент (UI, компоненты, интеграции)
 *
 * Команды:
 *   list              — показать все задачи
 *   pending           — показать только pending задачи (сортировка по priority)
 *   my-tasks          — показать задачи текущего агента
 *   take <id>         — взять задачу в работу (pending → in_progress)
 *   done <id>         — отметить задачу выполненной (in_progress → done)
 *   resume <id>       — разблокировать задачу (blocked → in_progress)
 *   block <id> <msg>  — заблокировать задачу с причиной
 *   next              — показать следующую доступную задачу для агента
 *   signal <to> <msg> — отправить сигнал другому агенту
 *   signals           — показать непрочитанные сигналы для агента
 *   ack <id>          — подтвердить получение сигнала
 *   status            — полный статус проекта
 *   validate          — проверить целостность очереди
 *   help              — эта справка
 *
 * Примеры:
 *   node agent-cli.js buffy next
 *   node agent-cli.js mimo take confirm-dialogs
 *   node agent-cli.js buffy done gantt-chart
 *   node agent-cli.js buffy signal mimo "API готов, проверяй"
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, 'agent-queue.json');

function readQueue() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.error('❌ agent-queue.json не найден!');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
}

function writeQueue(queue) {
  queue.last_updated = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
}

function getAgent(agentName) {
  const queue = readQueue();
  if (!queue.agents[agentName]) {
    console.error(`❌ Неизвестный агент: ${agentName}`);
    console.error(`   Доступные: ${Object.keys(queue.agents).join(', ')}`);
    process.exit(1);
  }
  return queue;
}

function printTask(task, showAgent = false) {
  const statusIcon = {
    'done': '✅',
    'in_progress': '🔴',
    'pending': '⏳',
    'blocked': '🚫',
    'cancelled': '❌',
  }[task.status] || '⬜';

  const assignee = showAgent ? ` [${task.assignee}]` : '';
  const deps = task.depends_on?.length ? ` (ждёт: ${task.depends_on.join(', ')})` : '';

  console.log(`  ${statusIcon} ${task.id}${assignee}`);
  console.log(`     ${task.title}${deps}`);
  if (task.description) console.log(`     📝 ${task.description}`);
  if (task.block_reason) console.log(`     🚫 Причина: ${task.block_reason}`);
  if (task.completed_at) console.log(`     ✅ ${new Date(task.completed_at).toLocaleString('ru-RU')}`);
  console.log('');
}

function printSignal(signal, queue) {
  const fromAgent = queue.agents[signal.from]?.name || signal.from;
  const toAgent = queue.agents[signal.to]?.name || signal.to;
  const ackStatus = signal.acknowledged ? '✅ Прочитано' : '🆕 НОВОЕ';
  const typeIcon = { info: '📨', urgent: '⚠️', blocker: '🚫' }[signal.type] || '📨';
  const typeLabel = signal.type === 'urgent' ? ' [СРОЧНЫЙ]' : signal.type === 'blocker' ? ' [БЛОКЕР]' : '';
  console.log(`  [${signal.id}] ${typeIcon} ${ackStatus}${typeLabel}`);
  console.log(`     От: ${fromAgent} → Кому: ${toAgent}`);
  console.log(`     ${signal.message}`);
  console.log(`     ${new Date(signal.created_at).toLocaleString('ru-RU')}`);
  console.log('');
}

// === COMMANDS ===

function cmdList(queue) {
  console.log(`\n📋 Все задачи (${queue.tasks.length}):\n`);
  const byStatus = { done: [], in_progress: [], pending: [], blocked: [], cancelled: [] };
  queue.tasks.forEach(t => {
    (byStatus[t.status] || byStatus.pending).push(t);
  });

  if (byStatus.in_progress.length) {
    console.log('🔴 В РАБОТЕ:');
    byStatus.in_progress.forEach(t => printTask(t, true));
  }
  if (byStatus.pending.length) {
    console.log('⏳ ОЖИДАЮТ:');
    byStatus.pending.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
      .forEach(t => printTask(t, true));
  }
  if (byStatus.blocked.length) {
    console.log('🚫 ЗАБЛОКИРОВАНЫ:');
    byStatus.blocked.forEach(t => printTask(t, true));
  }
  if (byStatus.done.length) {
    console.log(`✅ ВЫПОЛНЕНО (${byStatus.done.length}):`);
    byStatus.done.slice(-5).reverse().forEach(t => printTask(t, true));
  }
}

function cmdPending(queue) {
  const pending = queue.tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  console.log(`\n⏳ Ожидают выполнения (${pending.length}):\n`);
  pending.forEach(t => printTask(t, true));

  // Show what's ready (no unmet dependencies)
  const ready = pending.filter(t => {
    if (!t.depends_on?.length) return true;
    return t.depends_on.every(depId => {
      const dep = queue.tasks.find(t => t.id === depId);
      return dep && dep.status === 'done';
    });
  });

  if (ready.length) {
    console.log('🎯 Доступны для взятия (нет зависимостей):');
    ready.forEach(t => printTask(t, true));
  }
}

function cmdMyTasks(queue, agentName) {
  const myTasks = queue.tasks.filter(t => t.assignee === agentName);
  console.log(`\n🔹 Задачи для ${queue.agents[agentName].name}:\n`);

  const inProgress = myTasks.filter(t => t.status === 'in_progress');
  const pending = myTasks.filter(t => t.status === 'pending');
  const done = myTasks.filter(t => t.status === 'done');
  const blocked = myTasks.filter(t => t.status === 'blocked');

  if (inProgress.length) {
    console.log('🔴 В работе:');
    inProgress.forEach(t => printTask(t));
  }
  if (pending.length) {
    console.log('⏳ Ожидают:');
    pending.forEach(t => printTask(t));
  }
  if (blocked.length) {
    console.log('🚫 Заблокированы:');
    blocked.forEach(t => printTask(t));
  }
  if (done.length) {
    console.log(`✅ Выполнено: ${done.length}`);
  }
}

function cmdTake(queue, agentName, taskId) {
  const task = queue.tasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`❌ Задача ${taskId} не найдена`);
    process.exit(1);
  }
  if (task.assignee !== agentName) {
    console.error(`❌ Задача ${taskId} назначена на ${task.assignee}, а не на ${agentName}`);
    process.exit(1);
  }
  if (task.status !== 'pending') {
    console.error(`❌ Задача ${taskId} уже в статусе ${task.status}`);
    process.exit(1);
  }

  // Check dependencies
  if (task.depends_on?.length) {
    const unmet = task.depends_on.filter(depId => {
      const dep = queue.tasks.find(t => t.id === depId);
      return !dep || dep.status !== 'done';
    });
    if (unmet.length) {
      console.error(`❌ Задача ${taskId} зависит от незавершённых: ${unmet.join(', ')}`);
      process.exit(1);
    }
  }

  task.status = 'in_progress';
  task.started_at = new Date().toISOString();
  writeQueue(queue);
  console.log(`✅ Задача "${task.title}" взята в работу!`);
}

function cmdDone(queue, agentName, taskId) {
  const task = queue.tasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`❌ Задача ${taskId} не найдена`);
    process.exit(1);
  }
  if (task.assignee !== agentName) {
    console.error(`❌ Задача ${taskId} назначена на ${task.assignee}`);
    process.exit(1);
  }
  if (task.status !== 'in_progress') {
    console.error(`❌ Задача ${taskId} не в работе (статус: ${task.status})`);
    process.exit(1);
  }

  task.status = 'done';
  task.completed_at = new Date().toISOString();
  writeQueue(queue);
  console.log(`✅ Задача "${task.title}" завершена!`);

  // Check if any dependent tasks are now ready
  const nowReady = queue.tasks.filter(t =>
    t.status === 'pending' &&
    t.depends_on?.includes(taskId) &&
    t.depends_on.every(depId => {
      const dep = queue.tasks.find(d => d.id === depId);
      return dep && dep.status === 'done';
    })
  );

  if (nowReady.length) {
    console.log(`\n🎯 Освободились задачи:`);
    nowReady.forEach(t => {
      const agent = queue.agents[t.assignee]?.name || t.assignee;
      console.log(`   → ${t.id} [${agent}]: ${t.title}`);
    });
  }
}

function cmdBlock(queue, agentName, taskId, reason) {
  const task = queue.tasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`❌ Задача ${taskId} не найдена`);
    process.exit(1);
  }
  if (task.assignee !== agentName) {
    console.error(`❌ Задача ${taskId} назначена на ${task.assignee}`);
    process.exit(1);
  }

  task.status = 'blocked';
  task.block_reason = reason;
  task.updated_at = new Date().toISOString();
  writeQueue(queue);
  console.log(`🚫 Задача "${task.title}" заблокирована. Причина: ${reason}`);
}

function cmdResume(queue, agentName, taskId) {
  const task = queue.tasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`❌ Задача ${taskId} не найдена`);
    process.exit(1);
  }
  if (task.assignee !== agentName) {
    console.error(`❌ Задача ${taskId} назначена на ${task.assignee}`);
    process.exit(1);
  }
  if (task.status !== 'blocked') {
    console.error(`❌ Задача ${taskId} не заблокирована (статус: ${task.status})`);
    process.exit(1);
  }

  task.status = 'in_progress';
  delete task.block_reason;
  task.updated_at = new Date().toISOString();
  writeQueue(queue);
  console.log(`▶️  Задача "${task.title}" возвращена в работу!`);
}

function cmdNext(queue, agentName) {
  const myPending = queue.tasks.filter(t =>
    t.assignee === agentName && t.status === 'pending'
  );

  // Filter to tasks whose dependencies are met
  const ready = myPending.filter(t => {
    if (!t.depends_on?.length) return true;
    return t.depends_on.every(depId => {
      const dep = queue.tasks.find(d => d.id === depId);
      return dep && dep.status === 'done';
    });
  });

  if (ready.length === 0) {
    console.log(`\n✅ Нет доступных задач для ${queue.agents[agentName].name}`);
    console.log('   Все pending задачи ожидают завершения зависимостей.\n');

    // Show what's blocking
    myPending.forEach(t => {
      const unmet = (t.depends_on || []).filter(depId => {
        const dep = queue.tasks.find(d => d.id === depId);
        return !dep || dep.status !== 'done';
      });
      if (unmet.length) {
        console.log(`   ⏳ ${t.id} — ждёт: ${unmet.join(', ')}`);
      }
    });
    return;
  }

  // Sort by priority (lower = higher)
  ready.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  const next = ready[0];

  console.log(`\n🎯 Следующая задача для ${queue.agents[agentName].name}:\n`);
  printTask(next);
  console.log(`   Чтобы взять: node agent-cli.js ${agentName} take ${next.id}\n`);
}

function cmdSignal(queue, fromAgent, toAgent, message) {
  if (!queue.agents[toAgent]) {
    console.error(`❌ Неизвестный агент: ${toAgent}`);
    process.exit(1);
  }

  // Auto-detect priority from message
  let type = 'info';
  if (message.includes('⚠️') || message.includes('СРОЧНО') || message.includes('URGENT')) type = 'urgent';
  if (message.includes('🚫') || message.includes('BLOCKER') || message.includes('БЛОК')) type = 'blocker';

  const signal = {
    id: `sig-${String(queue.signals.length + 1).padStart(3, '0')}`,
    from: fromAgent,
    to: toAgent,
    type: type,
    message: message,
    created_at: new Date().toISOString(),
    acknowledged: false,
  };

  queue.signals.push(signal);
  writeQueue(queue);
  
  const typeIcon = { info: '📨', urgent: '⚠️', blocker: '🚫' }[type] || '📨';
  console.log(`${typeIcon} Сигнал отправлен ${queue.agents[toAgent].name}: ${message}`);
  
  // Highlight urgent signals
  if (type === 'urgent' || type === 'blocker') {
    console.log(`\n⚠️  ВНИМАНИЕ: Сигнал помечен как ${type === 'urgent' ? 'СРОЧНЫЙ' : 'БЛОКИРУЮЩИЙ'}!`);
    console.log(`   Агент ${toAgent} ОБЯЗАН проверить сигнал немедленно!\n`);
  }
}

function cmdSignals(queue, agentName, showAll = false) {
  let mySignals;
  if (showAll) {
    mySignals = queue.signals.filter(s => s.to === agentName || s.from === agentName);
  } else {
    mySignals = queue.signals.filter(s => s.to === agentName && !s.acknowledged);
  }

  if (mySignals.length === 0) {
    console.log(`\n✅ Нет новых сигналов для ${queue.agents[agentName].name}\n`);
    return;
  }

  console.log(`\n📨 Сигналы для ${queue.agents[agentName].name} (${mySignals.length}):\n`);
  mySignals.forEach(s => printSignal(s, queue));

  if (!showAll) {
    console.log(`   Чтобы подтвердить: node agent-cli.js ${agentName} ack <id>`);
    console.log(`   Чтобы показать все: node agent-cli.js ${agentName} signals --all\n`);
  }
}

function cmdCheck(queue, agentName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 ПРОВЕРКА СОСТОЯНИЯ: ${queue.agents[agentName].name}`);
  console.log(`${'='.repeat(60)}\n`);

  // 1. Check signals
  const mySignals = queue.signals.filter(s => s.to === agentName && !s.acknowledged);
  const urgentSignals = mySignals.filter(s => s.type === 'urgent' || s.type === 'blocker');
  
  if (urgentSignals.length > 0) {
    console.log(`🚨 СРОЧНЫХ СИГНАЛОВ: ${urgentSignals.length}`);
    urgentSignals.forEach(s => {
      const icon = s.type === 'urgent' ? '⚠️' : '🚫';
      console.log(`   ${icon} [${s.id}] от ${s.from}: ${s.message.substring(0, 80)}`);
    });
    console.log('');
  }
  
  if (mySignals.length > 0) {
    console.log(`📨 Непрочитанных сигналов: ${mySignals.length}`);
    mySignals.slice(0, 3).forEach(s => {
      const icon = { info: '📨', urgent: '⚠️', blocker: '🚫' }[s.type] || '📨';
      console.log(`   ${icon} [${s.id}] от ${s.from}: ${s.message.substring(0, 60)}...`);
    });
    if (mySignals.length > 3) console.log(`   ... и ещё ${mySignals.length - 3}`);
    console.log('');
  } else {
    console.log(`✅ Сигналов нет\n`);
  }

  // 2. Check tasks
  const myTasks = queue.tasks.filter(t => t.assignee === agentName);
  const inProgress = myTasks.filter(t => t.status === 'in_progress');
  const pending = myTasks.filter(t => t.status === 'pending');
  const ready = pending.filter(t => {
    if (!t.depends_on?.length) return true;
    return t.depends_on.every(depId => {
      const dep = queue.tasks.find(d => d.id === depId);
      return dep && dep.status === 'done';
    });
  });

  if (inProgress.length > 0) {
    console.log(`🔴 В РАБОТЕ (${inProgress.length}):`);
    inProgress.forEach(t => console.log(`   → ${t.id}: ${t.title}`));
    console.log('');
  }

  if (ready.length > 0) {
    console.log(`🎯 ГОТОВЫ К ВЗЯТИЮ (${ready.length}):`);
    ready.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    ready.slice(0, 3).forEach(t => {
      console.log(`   ⏳ ${t.id} (P${t.priority ?? 99}): ${t.title}`);
    });
    if (ready.length > 3) console.log(`   ... и ещё ${ready.length - 3}`);
    console.log('');
  }

  // 3. Show next action
  console.log(`${'─'.repeat(60)}`);
  if (urgentSignals.length > 0) {
    console.log(`🚨 ПРИОРИТЕТ: ПРОЧИТАЙ СРОЧНЫЕ СИГНАЛЫ!`);
    console.log(`   node agent-cli.js ${agentName} signals`);
  } else if (inProgress.length > 0) {
    console.log(`🔴 ПРИОРИТЕТ: ПРОДОЛЖАЙ ТЕКУЩУЮ ЗАДАЧУ`);
    console.log(`   ${inProgress[0].id}: ${inProgress[0].title}`);
  } else if (ready.length > 0) {
    console.log(`🎯 ПРИОРИТЕТ: ВОЗЬМИ ЗАДАЧУ`);
    console.log(`   node agent-cli.js ${agentName} take ${ready[0].id}`);
  } else {
    console.log(`✅ ВСЁ ГОТОВО. ЖДИ НОВЫХ ЗАДАЧ.`);
    console.log(`   Проверяй: node agent-cli.js ${agentName} check`);
  }
  console.log(`${'─'.repeat(60)}\n`);
}

function cmdAck(queue, agentName, signalId) {
  const signal = queue.signals.find(s => s.id === signalId);
  if (!signal) {
    console.error(`❌ Сигнал ${signalId} не найден`);
    process.exit(1);
  }
  if (signal.to !== agentName) {
    console.error(`❌ Сигнал ${signalId} не адресован ${agentName}`);
    process.exit(1);
  }

  signal.acknowledged = true;
  signal.acknowledged_at = new Date().toISOString();
  writeQueue(queue);
  console.log(`✅ Сигнал ${signalId} подтверждён`);
}

function cmdStatus(queue) {
  const total = queue.tasks.length;
  const done = queue.tasks.filter(t => t.status === 'done').length;
  const inProgress = queue.tasks.filter(t => t.status === 'in_progress').length;
  const pending = queue.tasks.filter(t => t.status === 'pending').length;
  const blocked = queue.tasks.filter(t => t.status === 'blocked').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  console.log(`\n📊 СТАТУС ПРОЕКТА\n`);
  console.log(`   Всего задач: ${total}`);
  console.log(`   ✅ Выполнено: ${done} (${progress}%)`);
  console.log(`   🔴 В работе:  ${inProgress}`);
  console.log(`   ⏳ Ожидают:   ${pending}`);
  console.log(`   🚫 Заблок.:   ${blocked}`);
  console.log('');

  // Progress bar
  const barLen = 30;
  const filled = Math.round((done / total) * barLen);
  console.log(`   [${'█'.repeat(filled)}${'░'.repeat(barLen - filled)}] ${progress}%\n`);

  // Per agent
  for (const [agentId, agentInfo] of Object.entries(queue.agents)) {
    const agentTasks = queue.tasks.filter(t => t.assignee === agentId);
    const agentDone = agentTasks.filter(t => t.status === 'done').length;
    const agentTotal = agentTasks.length;
    console.log(`   ${agentInfo.name}: ${agentDone}/${agentTotal} задач`);
  }
  console.log('');

  // Unacknowledged signals
  const unack = queue.signals.filter(s => !s.acknowledged);
  if (unack.length) {
    console.log(`📨 Непрочитанных сигналов: ${unack.length}`);
    unack.forEach(s => console.log(`   → ${s.from} → ${s.to}: ${s.message.substring(0, 60)}...`));
    console.log('');
  }
}

function cmdValidate(queue) {
  let errors = 0;

  // Check for duplicate IDs
  const ids = queue.tasks.map(t => t.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) {
    console.error(`❌ Дубликаты ID задач: ${[...new Set(duplicates)].join(', ')}`);
    errors++;
  }

  // Check for broken dependencies
  queue.tasks.forEach(t => {
    if (t.depends_on?.length) {
      t.depends_on.forEach(depId => {
        if (!queue.tasks.find(d => d.id === depId)) {
          console.error(`❌ Задача ${t.id} зависит от несуществующей ${depId}`);
          errors++;
        }
      });
    }
  });

  // Check for circular dependencies
  function hasCycle(taskId, visited = new Set()) {
    if (visited.has(taskId)) return true;
    visited.add(taskId);
    const task = queue.tasks.find(t => t.id === taskId);
    if (task?.depends_on?.length) {
      for (const depId of task.depends_on) {
        if (hasCycle(depId, new Set([...visited]))) return true;
      }
    }
    return false;
  }

  queue.tasks.forEach(t => {
    if (hasCycle(t.id)) {
      console.error(`❌ Циклическая зависимость обнаружена для задачи ${t.id}`);
      errors++;
    }
  });

  // Check for signals pointing to unknown agents
  queue.signals.forEach(s => {
    if (!queue.agents[s.to]) {
      console.error(`❌ Сигнал ${s.id} адресован неизвестному агенту ${s.to}`);
      errors++;
    }
    if (!queue.agents[s.from]) {
      console.error(`❌ Сигнал ${s.id} от неизвестного агента ${s.from}`);
      errors++;
    }
  });

  if (errors === 0) {
    console.log('✅ Валидация пройдена — ошибок нет');
  } else {
    console.log(`\n❌ Найдено ${errors} ошибок`);
    process.exit(1);
  }
}

function cmdHelp() {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Agent CLI — Communication Protocol       ║
╚══════════════════════════════════════════════════╝

Использование:
  node agent-cli.js <агент> <команда> [аргументы]

Агенты:
  buffy     — стратегический ассистент
  mimo      — исполнительный агент

Команды:
  check                 — 🔍 ПРОВЕРИТЬ ВСЁ (сигналы + задачи + что делать)
  list                  — все задачи
  pending               — ожидающие задачи
  my-tasks              — мои задачи
  take <id>             — взять задачу
  done <id>             — завершить задачу
  resume <id>           — разблокировать задачу
  block <id> <причина>  — заблокировать задачу
  next                  — следующая задача
  signal <кому> <сообщ> — отправить сигнал
  signals               — непрочитанные сигналы
  signals --all         — все сигналы (включая прочитанные)
  ack <id>              — подтвердить сигнал
  status                — статус проекта
  validate              — проверить целостность
  help                  — эта справка

ПРИОРИТЕТЫ СИГНАЛОВ:
  Обычный:  signal buffy "Текст"
  Срочный:  signal buffy "⚠️ СРОЧНО: ..."
  Блокер:   signal buffy "🚫 БЛОК: ..."

Примеры:
  node agent-cli.js mimo check          ← НАЧНИ С ЭТОГО!
  node agent-cli.js buffy next
  node agent-cli.js mimo take confirm-dialogs
  node agent-cli.js buffy done gantt-chart
  node agent-cli.js buffy signal mimo "⚠️ СРОЧНО: ..."
`);
}

// === MAIN ===

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    cmdHelp();
    return;
  }

  const agentName = args[0];
  const command = args[1];

  if (!command) {
    cmdHelp();
    return;
  }

  const queue = getAgent(agentName);

  switch (command) {
    case 'list':
      cmdList(queue);
      break;
    case 'pending':
      cmdPending(queue);
      break;
    case 'my-tasks':
      cmdMyTasks(queue, agentName);
      break;
    case 'take':
      cmdTake(queue, agentName, args[2]);
      break;
    case 'done':
      cmdDone(queue, agentName, args[2]);
      break;
    case 'resume':
      cmdResume(queue, agentName, args[2]);
      break;
    case 'block':
      cmdBlock(queue, agentName, args[2], args.slice(3).join(' ') || 'Причина не указана');
      break;
    case 'next':
      cmdNext(queue, agentName);
      break;
    case 'signal':
      if (!args[2] || !args[3]) {
        console.error('❌ Использование: node agent-cli.js <агент> signal <кому> <сообщение>');
        process.exit(1);
      }
      cmdSignal(queue, agentName, args[2], args.slice(3).join(' '));
      break;
    case 'signals':
      cmdSignals(queue, agentName, args.includes('--all'));
      break;
    case 'check':
      cmdCheck(queue, agentName);
      break;
    case 'ack':
      cmdAck(queue, agentName, args[2]);
      break;
    case 'status':
      cmdStatus(queue);
      break;
    case 'validate':
      cmdValidate(queue);
      break;
    default:
      console.error(`❌ Неизвестная команда: ${command}`);
      cmdHelp();
      process.exit(1);
  }
}

main();
