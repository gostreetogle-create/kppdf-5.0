# PROPOSED_STRUCTURE — Целевая структура `docs/` для kppdf-5.0 (docs-cleanup cycle, REVISED)

**Дата**: 2026-06-20 (REVISED — учтены 10 ранее пропущенных файлов)
**Автор**: Агент A (Buffy) после Phase-0 verification
**Базируется на**: [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) (CORRECTED)
**Связь**: после физической реализации → [`CLEANUP_FINAL_REPORT.md`](./CLEANUP_FINAL_REPORT.md) с финальной статистикой.

---

## 1. Принципы

1. **Корень остаётся чистым и тонким**. Только `README.md` + `CLAUDE.md` + `AGENTS.md` + манифесты (`package.json`, `agent-queue.json`).
2. **`docs/` — единая точка входа** для всех «человекочитаемых» артефактов.
3. **Каждый файл имеет одно назначение** (single-responsibility для docs):
   - Root: identity / tooling entrypoints.
   - `docs/spec/`: что продукт ДЕЛАЕТ.
   - `docs/domain/`: что продукт ИЗ СЕБЯ ПРЕДСТАВЛЯЕТ.
   - `docs/process/`: как РАБОТАЮТ люди и агенты (протоколы, дискуссии, координация).
   - `docs/design/`: визуальный язык (UI tokens).
   - `docs/operations/`: как РАЗВОРАЧИВАЕТСЯ и КОНТРОЛИРУЕТСЯ (deploy, реестры, планы).
   - `docs/analysis/`: снапшоты и audit-репорты.
   - `docs/checklists/`: чек-листы качества / миграции / реализации.
   - `docs/decisions/`: ADRs.
   - `docs/audit-log.md`: append-only история циклов.
   - `docs/_archive/`: всё устаревшее — с явным `README.md`-объяснением.
   - `docs/_cleanup/`: мета-отчёты этого цикла (временные).
4. **Cyrillic → Latin** для канонических имён (ASCII лучше для tooling / git / CI).
5. **Append-only sources остаются append-only** (audit-log, AI_COLLABORATION, ADR history — никогда не переписываем поверх).
6. **Git-history preservation**: используем `git mv` (не `mv`+`git add`), чтобы blame и log сохранились.

---

## 2. Целевое дерево (REVISED)

```
/ (root)
├── README.md                              ← KEEP: slim pointer → docs/README.md
├── CLAUDE.md                              ← KEEP: conventions for Claude AI
├── AGENTS.md                              ← KEEP: startup rules for AI agents
│
└── docs/
    ├── README.md                          ← NEW: 1-page nav (Phase-3 deliverable)
    ├── CONTRIBUTING.md                    ← KEEP: Constitution (update path-refs)
    ├── GLOSSARY.md                        ← NEW: consolidated terms
    ├── audit-log.md                       ← MOVE from /: append-only dev log
    │
    ├── spec/
    │   └── SPEC.md                        ← MOVE from /
    │
    ├── domain/
    │   └── BUSINESS-LOGIC.md              ← MOVE from /
    │
    ├── process/
    │   ├── AGENT-PROTOCOL.md              ← MOVE from /
    │   ├── TEAM-PROTOCOL.md               ← MOVE from /
    │   ├── AI_COLLABORATION.md            ← MOVE from /
    │   ├── discussion.md                  ← MOVE from /
    │   ├── discussion-business-logic.md   ← MOVE from /
    │   └── DESIGN-COORDINATION-PROPOSAL.md ← MOVE from /
    │
    ├── design/
    │   └── UI_KIT.md                      ← MOVE from /
    │
    ├── operations/
    │   ├── DEPLOY-SYNO.md                 ← MOVE from /
    │   ├── CURRENT-CHECKLIST.md           ← MOVE from /
    │   ├── STABLE-MODULES.md              ← MOVE from /
    │   ├── audit-tasks.md                 ← MOVE from /
    │   ├── audit-tasks-business.md        ← MOVE from /
    │   └── business-tasks.md              ← MOVE from /
    │
    ├── analysis/
    │   ├── AUDIT-REVIEW.md                ← MOVE from /
    │   └── UI-AUDIT-MAP.md                ← MOVE from /
    │
    ├── checklists/
    │   ├── QUALITY.md                     ← MOVE+RENAME from /ЧЕК-ЛИСТ-КАЧЕСТВА.md
    │   ├── MIGRATION.md                   ← MOVE+RENAME from /ЧЕК-ЛИСТ-МИГРАЦИИ.md
    │   └── IMPLEMENTATION.md              ← MOVE+RENAME from /ЧЕК-ЛИСТ-РЕАЛИЗАЦИИ.md
    │
    ├── decisions/                         ← KEEP: ADR chain (без изменений)
    │   ├── 001-architecture-boundaries.md ⚠️ filename: no "ADR-" prefix
    │   ├── ADR-002-foundation-before-critical.md
    │   ├── ADR-003-status-workflow-live-query.md
    │   ├── ADR-004-business-critical-layer.md
    │   ├── ADR-005-proposal-editor-modularization.md
    │   ├── ADR-005-rev2-proposal-editor-react-memoization.md
    │   └── ADR-TEMPLATE.md
    │
    ├── _archive/
    │   ├── README.md                      ← NEW: что здесь и почему
    │   ├── SPEC-ДОРАБОТКА.md              ← ARCHIVE
    │   ├── PROJECT_READY-2026.md          ← ARCHIVE
    │   ├── questions-2026.md              ← ARCHIVE
    │   ├── analysis/
    │   │   └── КРИТИЧЕСКИЙ-АНАЛИЗ-2026-06-18.md  ← ARCHIVE
    │   └── plans/
    │       ├── ESLINT-10-UPGRADE-PLAN.md
    │       ├── PLAN-ESLINT-10-RETRY.md
    │       ├── PLAN-LINT-WARNINGS-CYCLE-16.md
    │       └── PLAN-TYPESCRIPT-6.md
    │
    └── _cleanup/                          ← NEW: meta metadata этого цикла
        ├── AUDIT_REPORT.md                ← (just REVISED)
        ├── PROPOSED_STRUCTURE.md          ← (this file, REVISED)
        └── CLEANUP_FINAL_REPORT.md        ← (Phase-4 deliverable)
```

**Пост-цикловое состояние (прогноз)**:

| Метрика | До | После | Δ |
|---------|-----|---------|---|
| Корневых `.md` | 33 | 3 | -30 |
| `docs/_archive/` файлов | 0 | 9 (+ README) | +10 |
| `docs/` файлов (без `_archive/`, `_cleanup/`) | 8 | ~30 | +22 |
| Точных дубликатов в репо | 16 | 0 | -16 |
| Устаревших `.bak*` chains | 9 + ~10 | 0 | -19+ |
| Стейл `.txt` и `.tmp-` файлов | 4 + 1 | 0 | -5 |

---

## 3. Per-file action map (REVISED — 33 файла)

### 3.1 DELETE (permanent) — ~21 файл

| Действие | Файл(ы) | Кол-во |
|----------|----------|--------|
| `git rm` | `*.md-pre-toc` (6: SPEC, SPEC-ДОРАБОТКА, КРИТИЧЕСКИЙ-АНАЛИЗ, 3× чек-листов) | 6 |
| `git rm` | `audit-log.md.bak`, `audit-log.md.bak3`, `audit-log.md.c2[6-9]bak`, `audit-log.md.c3[0-3]bak` | 9 |
| `git rm` | `questions.md.bak` | 1 |
| `git rm` | `agent-queue.json.bak*` (JSON, не MD-scope, но мусор) | ~10 |
| `git rm` | `PP_01.txt`, `ПП.txt`, `ежедневный промпт.txt`, `комп.txt` | 4 |
| `git rm` | `.tmp-glass-cycle-audit-entry.md` | 1 |

Итого ~21.

### 3.2 MOVE + RENAME — 22 файла

Через `git mv` (сохраняет git history):

| Source | Destination |
|--------|-------------|
| `AGENT-PROTOCOL.md` | `docs/process/AGENT-PROTOCOL.md` |
| `TEAM-PROTOCOL.md` | `docs/process/TEAM-PROTOCOL.md` |
| `AI_COLLABORATION.md` | `docs/process/AI_COLLABORATION.md` |
| `discussion.md` | `docs/process/discussion.md` |
| `discussion-business-logic.md` | `docs/process/discussion-business-logic.md` |
| `DESIGN-COORDINATION-PROPOSAL.md` | `docs/process/DESIGN-COORDINATION-PROPOSAL.md` |
| `BUSINESS-LOGIC.md` | `docs/domain/BUSINESS-LOGIC.md` |
| `SPEC.md` | `docs/spec/SPEC.md` |
| `UI_KIT.md` | `docs/design/UI_KIT.md` |
| `DEPLOY-SYNO.md` | `docs/operations/DEPLOY-SYNO.md` |
| `CURRENT-CHECKLIST.md` | `docs/operations/CURRENT-CHECKLIST.md` |
| `STABLE-MODULES.md` | `docs/operations/STABLE-MODULES.md` |
| `audit-tasks.md` | `docs/operations/audit-tasks.md` |
| `audit-tasks-business.md` | `docs/operations/audit-tasks-business.md` |
| `business-tasks.md` | `docs/operations/business-tasks.md` |
| `AUDIT-REVIEW.md` | `docs/analysis/AUDIT-REVIEW.md` |
| `UI-AUDIT-MAP.md` | `docs/analysis/UI-AUDIT-MAP.md` |
| `audit-log.md` | `docs/audit-log.md` |
| `ЧЕК-ЛИСТ-КАЧЕСТВА.md` | `docs/checklists/QUALITY.md` |
| `ЧЕК-ЛИСТ-МИГРАЦИИ.md` | `docs/checklists/MIGRATION.md` |
| `ЧЕК-ЛИСТ-РЕАЛИЗАЦИИ.md` | `docs/checklists/IMPLEMENTATION.md` |
| `КРИТИЧЕСКИЙ-АНАЛИЗ.md` | `docs/_archive/analysis/КРИТИЧЕСКИЙ-АНАЛИЗ-2026-06-18.md` |

### 3.3 ARCHIVE — 7 файлов

`git mv` для сохранения истории:

| Source | Destination |
|--------|-------------|
| `SPEC-ДОРАБОТКА.md` | `docs/_archive/SPEC-ДОРАБОТКА.md` |
| `PROJECT_READY.md` | `docs/_archive/PROJECT_READY-2026.md` |
| `questions.md` | `docs/_archive/questions-2026.md` |
| `ESLINT-10-UPGRADE-PLAN.md` | `docs/_archive/plans/ESLINT-10-UPGRADE-PLAN.md` |
| `PLAN-ESLINT-10-RETRY.md` | `docs/_archive/plans/PLAN-ESLINT-10-RETRY.md` |
| `PLAN-LINT-WARNINGS-CYCLE-16.md` | `docs/_archive/plans/PLAN-LINT-WARNINGS-CYCLE-16.md` |
| `PLAN-TYPESCRIPT-6.md` | `docs/_archive/plans/PLAN-TYPESCRIPT-6.md` |

### 3.4 KEEP в корне — 3 файла

`README.md`, `CLAUDE.md`, `AGENTS.md` — НЕ ТРОГАТЬ (только path-refs в `README.md` обновить).

### 3.5 KEEP в `docs/` — 8 файлов

`CONTRIBUTING.md` (c path-refs fix) + `decisions/*.md` (7).

---

## 4. Cross-reference update plan

### 4.1 `CONTRIBUTING.md` (в `docs/`)

После перемещения файлов из корня в `docs/{process,operations,analysis}/` нужно обновить относительные пути:

| Старое | Новое |
|--------|-------|
| `../STABLE-MODULES.md` | `../docs/operations/STABLE-MODULES.md` |
| `../audit-tasks.md` | `../docs/operations/audit-tasks.md` |
| `../audit-tasks-business.md` | `../docs/operations/audit-tasks-business.md` |
| `../discussion.md` | `../docs/process/discussion.md` |
| `../discussion-business-logic.md` | `../docs/process/discussion-business-logic.md` |
| `../CURRENT-CHECKLIST.md` | `../docs/operations/CURRENT-CHECKLIST.md` |
| `../AUDIT-REVIEW.md` | `../docs/analysis/AUDIT-REVIEW.md` |
| `decisions/ADR-001-architecture-boundaries.md` | **ПОПРАВИТЬ** — реальный файл `001-architecture-boundaries.md` |

### 4.2 `README.md` (в корне)

| Старое | Новое |
|--------|-------|
| `./AUDIT-REVIEW.md` | `./docs/analysis/AUDIT-REVIEW.md` |
| `./BUSINESS-LOGIC.md` | `./docs/domain/BUSINESS-LOGIC.md` |
| `./DEPLOY-SYNO.md` | `./docs/operations/DEPLOY-SYNO.md` |

Также добавить pointer на `docs/README.md` (создаётся в Phase 3).

### 4.3 `CLAUDE.md`, `AGENTS.md`

CLAUDE.md — единственная строка `@AGENTS.md` re-export. Оба остаются в корне, путь не меняется.

AGENTS.md таблица «Ключевые файлы» упоминает:
- `AI_COLLABORATION.md` (станет `docs/process/AI_COLLABORATION.md`)
- `AGENT-PROTOCOL.md` (станет `docs/process/AGENT-PROTOCOL.md`)
- `КРИТИЧЕСКИЙ-АНАЛИЗ.md` (станет `docs/_archive/analysis/КРИТИЧЕСКИЙ-АНАЛИЗ-2026-06-18.md`)
- `ЧЕК-ЛИСТ-РЕАЛИЗАЦИИ.md` (станет `docs/checklists/IMPLEMENTATION.md`)

→ AGENTS.md — это «tooling startup file», я **предпочитаю НЕ трогать его содержимое** в этом цикле (минимизировать риск для `agent-cli.js`). Текстовые упоминания в табличке оставлю как есть — это не cross-refs, а скорее «документы для чтения». Однако если критично — добавлю замечание в `_archive/README.md`.

### 4.4 Docs внутри `docs/`

Новые файлы: `docs/README.md`, `docs/GLOSSARY.md`, `docs/_archive/README.md` — указывают только на существующие после уборки пути. После создания — никаких TODO о broken refs.

---

## 5. Execution order (Phase 3 — REVISED)

Строгий порядок — каждое действие атомарно и обратимо:

1. **Create target dirs** (single bash command):
   `mkdir -p docs/spec docs/domain docs/process docs/design docs/operations docs/checklists docs/analysis docs/_archive docs/_archive/plans docs/_archive/analysis docs/_cleanup`
2. **MOVE+RENAME** по таблице 3.2 (одна большая bash-команда с `git mv`).
3. **MOVE archive** по таблице 3.3 (одна большая bash-команда).
4. **DELETE мусор** по таблице 3.1 (`git rm` — одна большая bash-команда).
5. **Update path-refs** в `docs/CONTRIBUTING.md` (через `str_replace`).
6. **Update path-refs** в `README.md` (через `str_replace` + добавить pointer на `docs/README.md`).
7. **Write новые docs**:
   - `docs/README.md` (1-page nav)
   - `docs/_archive/README.md` (архивная навигация)
   - `docs/GLOSSARY.md` (термины)
8. **Append `audit-log`** (последняя запись в `docs/audit-log.md`: «cycle 41: docs cleanup»).
9. **Phase 4 validation**:
   - Проверить, что `find . -name '*.md' -not -path './node_modules/*'` показывает только ожидаемые файлы.
   - Пройти grep по всем `.md` на предмет ссылок на старые пути → ноль или явные TODO.
10. **Write `CLEANUP_FINAL_REPORT.md`**.
11. **Commit**:
    - `git add -A` (но только doc-changes — не SRC-изменения SCRAM-fix!).
    - `git commit -m "v3.1.2: docs cleanup (Phase 0-4) — корневой .md 33→3, single docs/ entry-point"`.
12. **Note**, что SCRAM-fix (db.ts + schema.prisma) — отдельный коммит, не включён в этот docs cycle (per docs/CONTRIBUTING.md Правило 6).

---

## 6. Аборт-критерии

Если на любом этапе Phase 3:
- > 5 непредвиденных cross-refs, которые я не могу обновить без потери контекста → PAUSE, спросить юзера.
- `git mv` падает на Cyrillic имени (Windows shell quirk) → fallback на per-file `mv` + `git add`.
- Tooling (`agent-cli.js`), читающий `AGENTS.md`, обнаружит другие root-файлы, которые я хочу переместить → не перемещать.

---

## 7. Out of scope

- `agent-queue.json` — runtime config, не doc.
- `package.json`, `tsconfig.json`, `eslint.config.mjs`, `playwright.config.ts` — config-файлы.
- `prisma/schema.prisma` — schema, описывается в `BUSINESS-LOGIC.md`.
- `scripts/inject-md-toc.pl` — если он сломается, фиксим в **Cycle 2 / 3** (не этот цикл).
- SCRAM-fix commit (`db.ts` + `schema.prisma` + `dev.db push`) — отдельный коммит от предыдущего шага cycle v3.1.1, не включён в этот docs cycle.

Детальный план исполнения Phase 3 + статистика результата → [`CLEANUP_FINAL_REPORT.md`](./CLEANUP_FINAL_REPORT.md) (Phase 4).
