# Agent Communication Protocol v2

## Как это работает

Вместо того чтобы писать друг другу в `AI_COLLABORATION.md`, агенты используют:

1. **`agent-queue.json`** — машиночитаемая очередь задач с чёткими статусами
2. **`agent-cli.js`** — CLI-утилита для управления очередью
3. **Сигналы** — асинхронные уведомления от одного агента другому

## Стартовый ритуал

Каждый раз, когда агент начинает сессию:

```bash
# 1. Проверить сигналы от другого агента
node agent-cli.js buffy signals

# 2. Посмотреть статус проекта
node agent-cli.js buffy status

# 3. Проверить свою очередь
node agent-cli.js buffy my-tasks

# 4. Узнать следующую задачу
node agent-cli.js buffy next

# 5. Взять задачу
node agent-cli.js buffy take finance-module
```

## Статусы задач

| Статус | Значение | Команда |
|--------|----------|---------|
| `pending` | Готова к выполнению | (по умолчанию) |
| `in_progress` | В работе | `take <id>` |
| `done` | Выполнена | `done <id>` |
| `blocked` | Заблокирована | `block <id> <причина>` |
| `cancelled` | Отменена | (редактировать JSON) |

## Поток работы

```
Агент A берёт задачу:
  $ node agent-cli.js buffy take finance-module

Агент A завершает задачу:
  $ node agent-cli.js buffy done finance-module
  ✅ Задача завершена!
  🎯 Освободились задачи:
     → warehouse-module [Buffy]: Склад (дашборд, заявки...)

Агент A сигналит агенту B:
  $ node agent-cli.js buffy signal mimo "Проверь proposal-block-builder.ts"
  📨 Сигнал отправлен MiMo Code Agent

Агент B проверяет сигналы:
  $ node agent-cli.js mimo signals
  📨 Сигналы (1):
     [sig-001] 🆕 НОВОЕ
     От: Buffy → Кому: MiMo
     Проверь proposal-block-builder.ts

Агент B подтверждает сигнал:
  $ node agent-cli.js mimo ack sig-001
```

## Правила

1. **Бери задачу** — `take <id>` — перед тем как начать работать
2. **Завершай задачу** — `done <id>` — когда всё готово
3. **Не бери чужую задачу** — CLI проверит, что задача назначена на тебя
4. **Зависимости проверяются автоматически** — CLI не даст взять задачу, если её зависимости не выполнены
5. **Сигналы — для срочного** — когда нужно что-то сказать другому агенту
6. **Не пиши в AI_COLLABORATION.md** — используй очередь и сигналы
7. **Проверяй сигналы при старте** — `signals` — не игнорируй их

## Валидация

Периодически проверяй целостность очереди:

```bash
node agent-cli.js buffy validate
```

## Когда добавлять новую задачу

1. Не добавляй задачи вручную — напиши сигнал Buffy с описанием
2. Buffy обновит очередь с правильными зависимостями и приоритетами
3. Или редактируй `agent-queue.json` напрямую, если уверен

## Структура agent-queue.json

```json
{
  "version": 2,
  "last_updated": "2026-06-15T19:00:00.000Z",
  "agents": { "buffy": {...}, "mimo": {...} },
  "tasks": [
    {
      "id": "unique-task-id",
      "title": "Название задачи",
      "assignee": "buffy|mimo",
      "status": "pending|in_progress|done|blocked",
      "priority": 1-5,
      "depends_on": ["other-task-id"],
      "description": "Описание задачи"
    }
  ],
  "signals": [
    {
      "id": "sig-001",
      "from": "buffy",
      "to": "mimo",
      "type": "info|urgent|blocker",
      "message": "Текст сообщения",
      "acknowledged": false
    }
  ]
}
```
