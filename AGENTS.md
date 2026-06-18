<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ПРАВИЛА ДЛЯ ВСЕХ АГЕНТОВ

## ⚠️ ОБЯЗАТЕЛЬНО ПЕРЕД ЛЮБОЙ РАБОТОЙ

**ПЕРВАЯ КОМАНДА ПРИ СТАРТЕ СЕССИИ:**

```bash
node agent-cli.js <agent> check
```

**Если не сделаешь — пропустишь задачи от другого агента!**

## Ключевые файлы

| Файл | Назначение |
|------|------------|
| `AI_COLLABORATION.md` | Доска задач и история диалогов |
| `AGENT-PROTOCOL.md` | Протокол коммуникации агентов |
| `agent-queue.json` | Очередь задач (машиночитаемая) |
| `agent-cli.js` | CLI для управления очередью |
| `КРИТИЧЕСКИЙ-АНАЛИЗ.md` | Анализ проблем проекта |
| `ЧЕК-ЛИСТ-РЕАЛИЗАЦИИ.md` | Детальный план реализации |
