# docs/ — Навигатор документации kppdf-5.0

**Проект (одной фразой)**: KPPDF CRM v5.0 — Next.js + Prisma + SQLite приложение, ведущее коммерческое предложение от оформления до отгрузки с Ганттом, складом, снабжением и финансами.

> 🧭 **Открыл этот файл? Грокни проект за 2 минуты.** Это единая точка входа для всей «человекочитаемой» документации — спецификации, бизнес-логика, процессы работы агентов, дизайн-токены, деплой, планы, чек-листы, ADR-записи. Всё, что НЕ в этом `docs/` — runtime/конфиги (см. `README.md` в корне).

---

## 📂 Структура папок

```
docs/
├── README.md                       ← ты здесь
├── CONTRIBUTING.md                 ← Конституция: правила работы для AI-агентов
├── GLOSSARY.md                     ← Глоссарий терминов (КП, договор, Гантт, РНР, МТР...)
├── audit-log.md                    ← Append-only лог разработки (~50 циклов, ~219 KB)
│
├── spec/                           ← Что продукт ДЕЛАЕТ
│   └── SPEC.md
│
├── domain/                         ← Бизнес-логика (mission, workflow, design system v2.1)
│   └── BUSINESS-LOGIC.md
│
├── process/                        ← Как работают агенты и люди (протоколы, дискуссии)
│   ├── AGENT-PROTOCOL.md
│   ├── TEAM-PROTOCOL.md
│   ├── AI_COLLABORATION.md
│   ├── discussion.md
│   ├── discussion-business-logic.md
│   └── DESIGN-COORDINATION-PROPOSAL.md
│
├── design/                         ← Визуальный язык (UI tokens, компоненты)
│   └── UI_KIT.md
│
├── operations/                     ← Деплой, реестры стабильности, live-чеклисты, планы
│   ├── DEPLOY-SYNO.md
│   ├── CURRENT-CHECKLIST.md
│   ├── STABLE-MODULES.md
│   ├── audit-tasks.md
│   ├── audit-tasks-business.md
│   └── business-tasks.md
│
├── analysis/                       ← Аудит-снапшоты и обзоры
│   ├── AUDIT-REVIEW.md
│   └── UI-AUDIT-MAP.md
│
├── checklists/                     ← Цикл-локальные чек-листы (качество / миграция / реализация)
│   ├── QUALITY.md
│   ├── MIGRATION.md
│   └── IMPLEMENTATION.md
│
├── decisions/                      ← Architecture Decision Records (ADR)
│   ├── 001-architecture-boundaries.md
│   ├── ADR-002-foundation-before-critical.md
│   ├── ADR-003-status-workflow-live-query.md
│   ├── ADR-004-business-critical-layer.md
│   ├── ADR-005-proposal-editor-modularization.md
│   ├── ADR-005-rev2-proposal-editor-react-memoization.md
│   └── ADR-TEMPLATE.md
│
├── _archive/                       ← Устаревшее (см. _archive/README.md)
│   └── ...
│
└── _cleanup/                       ← Мета-отчёты текущей уборки (Phase 0-4 cycle)
    ├── AUDIT_REPORT.md
    ├── PROPOSED_STRUCTURE.md
    └── CLEANUP_FINAL_REPORT.md
```

---

## 🚀 Быстрые ссылки по ролям

### Я — новый разработчик / новый AI-агент
1. [`README.md`](../README.md) (в корне) — что это, как запустить, логин.
2. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — правила, которые нельзя нарушать.
3. [`docs/spec/SPEC.md`](./spec/SPEC.md) — что продукт делает.
4. [`docs/domain/BUSINESS-LOGIC.md`](./domain/BUSINESS-LOGIC.md) — как продукт устроен.
5. [`docs/GLOSSARY.md`](./GLOSSARY.md) — термины.
6. [`docs/operations/STABLE-MODULES.md`](./operations/STABLE-MODULES.md) — какие модули стабильны (не трогать).

### Я — архитектор, хочу понять, что уже решено
1. [`docs/decisions/001-architecture-boundaries.md`](./decisions/001-architecture-boundaries.md) — фиксация стека.
2. [`docs/decisions/ADR-TEMPLATE.md`](./decisions/ADR-TEMPLATE.md) — шаблон ADR.
3. Все [`docs/decisions/*.md`](./decisions/) — история архитектурных решений.

### Я — менеджер цикла, ищу чек-листы и статусы
1. [`docs/operations/CURRENT-CHECKLIST.md`](./operations/CURRENT-CHECKLIST.md) — live-статусы циклов.
2. [`docs/operations/audit-tasks.md`](./operations/audit-tasks.md) — технические циклы 39-50.
3. [`docs/operations/audit-tasks-business.md`](./operations/audit-tasks-business.md) — бизнес-циклы 51-58.
4. [`docs/checklists/QUALITY.md`](./checklists/QUALITY.md), [`MIGRATION.md`](./checklists/MIGRATION.md), [`IMPLEMENTATION.md`](./checklists/IMPLEMENTATION.md) — чек-листы по доменам.

### Я — операционный инженер, разворачиваю
1. [`docs/operations/DEPLOY-SYNO.md`](./operations/DEPLOY-SYNO.md) — пошаговое руководство для Synology NAS.
2. [`deploy/Dockerfile`](../deploy/Dockerfile), [`deploy/docker-compose.prod.yml`](../deploy/docker-compose.prod.yml) — production assets.

### Я — AI-агент, ищу свои протоколы
1. [`../AGENTS.md`](../AGENTS.md) (в корне) — стартовая инструкция (ОБЯЗАТЕЛЬНО к прочтению).
2. [`docs/process/AGENT-PROTOCOL.md`](./process/AGENT-PROTOCOL.md) — протокол общения.
3. [`docs/process/TEAM-PROTOCOL.md`](./process/TEAM-PROTOCOL.md) — распределение ролей.
4. [`docs/process/AI_COLLABORATION.md`](./process/AI_COLLABORATION.md) — таскборд + история.

---

## 🗄 Где лежит архив устаревшего

[`docs/_archive/README.md`](./_archive/README.md) — карта архива (планы, снапшоты, стейл-questions). **Ничего не удалено бесследно**: всё устаревшее бережно хранится в `_archive/` с явным объяснением причины.

---

## 📜 История изменений docs/

| Дата | Событие |
|------|---------|
| 2026-06-20 | **Cycle 41: docs cleanup (Phase 0–4)** — корневой `.md` сокращён с 33 до 3 файлов, единая точка входа через `docs/README.md`. См. [`_cleanup/CLEANUP_FINAL_REPORT.md`](./_cleanup/CLEANUP_FINAL_REPORT.md). |

---

**Поддерживай этот файл актуальным**: при добавлении новых крупных директорий или документов — добавь запись в раздел «Структура папок» выше.
