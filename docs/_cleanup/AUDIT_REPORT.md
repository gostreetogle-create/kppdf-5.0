# AUDIT_REPORT — Состояние документации kppdf-5.0 до уборки (docs-cleanup cycle)

**Дата**: 2026-06-20
**Аудитор**: Агент A (Buffy)
**Цель**: зафиксировать состояние ДО любых перемещений, чтобы каждое решение Phase 3 было обосновано и обратимо.
**Связанные артефакты**: [`PROPOSED_STRUCTURE.md`](./PROPOSED_STRUCTURE.md) (что хотим получить) → [`CLEANUP_FINAL_REPORT.md`](./CLEANUP_FINAL_REPORT.md) (что получили).

---

## 1. Объём аудита (CORRECTED — повторно измерено после Phase-0 verification)

| Метрика | Значение |
|---------|----------|
| Корневых `*.md` файлов (real, excl. pre-toc/bak) | **33** ⚠️ _уточнено после ручной верификации: первоначальная оценка 23 была неверной_ |
| Корневых `*.md-pre-toc` артефактов | **6** |
| Корневых `audit-log.md.*bak*` + `*.c2[6-9]bak` + `*.c3[0-3]bak` | **9** (1×.bak, 1×.bak3, 7×.c*bak) |
| Корневых `questions.md.bak` | **1** |
| Корневых `agent-queue.json.bak*` (JSON, не в MD-scope но мусор) | **~10** |
| Корневых `.txt` scratch-файлов | **4** |
| Корневых `.tmp-{name}.md` scratch-файлов | **1** (`.tmp-glass-cycle-audit-entry.md`) |
| **Точных и семантических дубликатов в скоупе cleanup** | **16** (6 pre-toc + 9 audit bak + 1 questions bak) |
| **Устаревших цикл-локальных планов** | **4** (3 `PLAN-*` + 1 `ESLINT-10-UPGRADE-PLAN`) |
| **Циклических / append-only логов** | **1** (`audit-log.md`, ~219 KB) |
| **Точек сращивания (merge candidates)** | **0** (SPEC-ДОРАБОТКА «Завершено», archive as-is) |
| **Файлов в `docs/` до уборки** | **8** (1 CONTRIBUTING + 7 в decisions/) |

---

## 2. Корень проекта — `*.md` инвентаризация (33 файла)

### 2.1 KEEP в корне (3) — must stay tooling-readable

| № | Путь | Назначение |
|---|------|------------|
| 1 | `README.md` | Корневой указатель проекта (GitHub/npm-standard) |
| 2 | `CLAUDE.md` | Мета-инструкции для Claude (Anthropic-конвенция) |
| 3 | `AGENTS.md` | Стартовая инструкция для AI-агентов; читается `agent-cli.js check` |

### 2.2 SPEC — корневой pair

| № | Путь | Строк | Куда |
|---|------|-------|------|
| 4 | `SPEC.md` | large (17 headings) | → `docs/spec/SPEC.md` (MOVE) |
| 5 | `SPEC-ДОРАБОТКА.md` | large (15 headings, «Статус: 🟢 Завершено», всё `[x]`) | → `docs/_archive/SPEC-ДОРАБОТКА.md` (ARCHIVE — нет merge, контент исторический) |

### 2.3 PROCESS — дискуссии и координация (3 → move)

| № | Путь | Назначение |
|---|------|------------|
| 6 | `AGENT-PROTOCOL.md` | Протокол общения агентов |
| 7 | `TEAM-PROTOCOL.md` | Роли под-агентов (Buffy / MiMo / человек) |
| 8 | `AI_COLLABORATION.md` | Таскборд + история диалогов (append-only) |
| 9 | `discussion.md` | Техническая дискуссия агентов |
| 10 | `discussion-business-logic.md` | Бизнес-дискуссия |
| 11 | `DESIGN-COORDINATION-PROPOSAL.md` | Координационный документ по дизайну |

→ **Все** в `docs/process/` (MOVE).

### 2.4 DOMAIN — бизнес-логика (1)

| № | Путь | Назначение |
|---|------|------------|
| 12 | `BUSINESS-LOGIC.md` | 12 глав: миссия, workflow, дизайн-система v2.1 |

→ `docs/domain/BUSINESS-LOGIC.md` (MOVE).

### 2.5 DESIGN — UI/визуальный язык (1)

| № | Путь | Назначение |
|---|------|------------|
| 13 | `UI_KIT.md` | Референс UI-токенов |

→ `docs/design/UI_KIT.md` (MOVE).

### 2.6 OPERATIONS — деплой, реестры, планы статуса (6)

| № | Путь | Назначение |
|---|------|------------|
| 14 | `DEPLOY-SYNO.md` | DevOps-tutorial для Synology NAS |
| 15 | `CURRENT-CHECKLIST.md` | Live статусы циклов |
| 16 | `STABLE-MODULES.md` | Реестр Tier-A/B модулей |
| 17 | `audit-tasks.md` | Технический план (cycles 39-50) |
| 18 | `audit-tasks-business.md` | Бизнес-план (cycles 51-58) |
| 19 | `business-tasks.md` | Бизнес-задачи |

→ **Все** в `docs/operations/` (MOVE).

### 2.7 ANALYSIS — снапшоты и audit-reports (3)

| № | Путь | Назначение |
|---|------|------------|
| 20 | `AUDIT-REVIEW.md` | Полный аудит-отчёт (для внешнего ревьюера) |
| 21 | `UI-AUDIT-MAP.md` | UI-audit (v2.1 debug map) |
| 22 | `КРИТИЧЕСКИЙ-АНАЛИЗ.md` | Снапшот-аудит 2026-06-18, оценка «6/10» |

→ `docs/analysis/AUDIT-REVIEW.md`, `docs/analysis/UI-AUDIT-MAP.md` (MOVE); `КРИТИЧЕСКИЙ-АНАЛИЗ.md` (MOVE → `docs/_archive/analysis/КРИТИЧЕСКИЙ-АНАЛИЗ-2026-06-18.md` ARCHIVE).

### 2.8 APPEND-ONLY — runtime log (1)

| № | Путь | Назначение |
|---|------|------------|
| 23 | `audit-log.md` (~219KB) | Append-only лог разработки |

→ `docs/audit-log.md` (MOVE). Требует апдейта cross-refs.

### 2.9 CHECKLISTS — чек-листы (3 → rename Cyrillic → Latin)

| № | Путь | → Куда |
|---|------|---------|
| 24 | `ЧЕК-ЛИСТ-КАЧЕСТВА.md` | `docs/checklists/QUALITY.md` |
| 25 | `ЧЕК-ЛИСТ-МИГРАЦИИ.md` | `docs/checklists/MIGRATION.md` |
| 26 | `ЧЕРЖ-ЛИСТ-РЕАЛИЗАЦИИ.md` | `docs/checklists/IMPLEMENTATION.md` |

### 2.10 ARCHIVE snapshots (1)

| № | Путь | → Куда |
|---|------|---------|
| 27 | `PROJECT_READY.md` | `docs/_archive/PROJECT_READY-2026.md` |
| 28 | `questions.md` | `docs/_archive/questions-2026.md` |

### 2.11 ARCHIVE plans (4)

| № | Путь | → Куда |
|---|------|---------|
| 29 | `ESLINT-10-UPGRADE-PLAN.md` | `docs/_archive/plans/ESLINT-10-UPGRADE-PLAN.md` |
| 30 | `PLAN-ESLINT-10-RETRY.md` | `docs/_archive/plans/PLAN-ESLINT-10-RETRY.md` |
| 31 | `PLAN-LINT-WARNINGS-CYCLE-16.md` | `docs/_archive/plans/PLAN-LINT-WARNINGS-CYCLE-16.md` |
| 32 | `PLAN-TYPESCRIPT-6.md` | `docs/_archive/plans/PLAN-TYPESCRIPT-6.md` |

### 2.12 TMP / scratch (DELETE, не архив) — 1

| № | Путь | Действие |
|---|------|----------|
| 33 | `.tmp-glass-cycle-audit-entry.md` | **DELETE** (tmp-файл, `.tmp-` prefix) |

---

## 3. Точные дубликаты (Phase-3 → DELETE)

| Источник | Копия | Происхождение |
|----------|-------|--------------|
| 6 `*.md` файлов | `*.md-pre-toc` | Perl-скрипт `scripts/inject-md-toc.pl` сохранял pre-injection state. Устарело (TOC теперь встроен внутрь `.md`). |
| `audit-log.md` | 9 bak/c*bak копий | Ручной backup при цикл-сетапах |
| `questions.md` | `questions.md.bak` | Ручной backup |

**Вердикт**: удалить (не архивировать — копии не добавляют информации и восстановлению не подлежат).

---

## 4. Семантические дубликаты / merge-кандидаты

### 4.1 `SPEC.md` ↔ `SPEC-ДОРАБОТКА.md` — **НЕ merge**

`SPEC-ДОРАБОТКА.md` имеет пометку `Статус: 🟢 Завершено` и все `[x]`. Его содержание — это **исторический список доработок**, которые УЖЕ воплощены в код и зафиксированы в `audit-log.md`. Merge не нужен — активная спека это `SPEC.md`, `SPEC-ДОРАБОТКА.md` идёт в `_archive/` как справка о пройденном пути.

### 4.2 `PROJECT_READY.md` ↔ `DEPLOY-SYNO.md` — **НЕ дубликаты**

Разные домены: `PROJECT_READY.md` — executive wrap-up с метриками; `DEPLOY-SYNO.md` — DevOps-tutorial. Не мержить.

### 4.3 `audit-tasks.md` ↔ `audit-tasks-business.md` ↔ `business-tasks.md` — **разные планы**

`audit-tasks.md` — технические циклы 39-50. `audit-tasks-business.md` — бизнес-циклы 51-58. `business-tasks.md` — бизнес-задачи (без циклов). Разные scopes. Не мержить.

---

## 5. Устаревшее (intra-cycle scratch → ARCHIVE)

| Файл | Причина |
|------|---------|
| `ESLINT-10-UPGRADE-PLAN.md` | Цикл-локальный план, выполнен |
| `PLAN-ESLINT-10-RETRY.md` | retry-план, выполнен |
| `PLAN-LINT-WARNINGS-CYCLE-16.md` | Cycle 16 plan, выполнен |
| `PLAN-TYPESCRIPT-6.md` | Отложенный TS 6 upgrade, не выполнен — оставлен для возможного возобновления |
| `КРИТИЧЕСКИЙ-АНАЛИЗ.md` | Снапшот-аудит 2026-06-18 (6/10) — для исторической валидации роста |
| `questions.md` | Все вопросы resolved (Cycle 25) — стейл |
| `PROJECT_READY.md` | Wrap-up v5.0, метрики устарели |
| `SPEC-ДОРАБОТКА.md` | «Статус: Завершено», исторический |

---

## 6. Риски и зависимости

### 6.1 Tool-зависимости от корневых файлов

| Файл | Кто читает | Действие |
|------|------------|----------|
| `AGENTS.md` | `agent-cli.js` (CLI agents стартуют с `node agent-cli.js <agent> check`) | **ОСТАВИТЬ в корне** |
| `agent-queue.json` | `agent-cli.js` | Не в скоупе (но backup-chain `.bak*` — мусор) |
| `CLAUDE.md` | Anthropic Claude по конвенции | **ОСТАВИТЬ в корне** |
| `README.md` | GitHub / `npm install` / другие | **ОСТАВИТЬ в корне** (slim pointer) |

### 6.2 Cross-reference breakage (CONTRIBUTING.md)

CONTRIBUTING.md использует относительные пути `../*.md`. После перемещения файлов из корня в `docs/{process,operations}/` нужно обновить на `../docs/{process,operations}/*.md`:

| Старое (в CONTRIBUTING.md) | Новое |
|----------------------------|-------|
| `../STABLE-MODULES.md` | `../docs/operations/STABLE-MODULES.md` |
| `../audit-tasks.md` | `../docs/operations/audit-tasks.md` |
| `../audit-tasks-business.md` | `../docs/operations/audit-tasks-business.md` |
| `../discussion.md` | `../docs/process/discussion.md` |
| `../discussion-business-logic.md` | `../docs/process/discussion-business-logic.md` |
| `../CURRENT-CHECKLIST.md` | `../docs/operations/CURRENT-CHECKLIST.md` |
| `../AUDIT-REVIEW.md` | `../docs/analysis/AUDIT-REVIEW.md` |
| `decisions/ADR-001-architecture-boundaries.md` | **ИСПРАВИТЬ** — файл на самом деле называется `001-architecture-boundaries.md` (нет префикса `ADR-` — нужно поправить или уточнить) |

### 6.3 Cross-reference breakage (README.md)

| Старое (в README.md) | Новое |
|----------------------|-------|
| `./AUDIT-REVIEW.md` | `./docs/analysis/AUDIT-REVIEW.md` |
| `./BUSINESS-LOGIC.md` | `./docs/domain/BUSINESS-LOGIC.md` |
| `./DEPLOY-SYNO.md` | `./docs/operations/DEPLOY-SYNO.md` |

### 6.4 Git dirty state (pre-cycle)

`git status` показывает **uncommitted changes** в `src/`, `prisma/`, в корне — это SCRAM-блокер-фикс из предыдущего шага цикла v3.1.1:
- `src/lib/db.ts` (dual-adapter)
- `prisma/schema.prisma` (provider: postgresql → sqlite)

**Resolution**: коммит SCRAM-fix **отдельно** от docs cleanup, согласно `docs/CONTRIBUTING.md` Правило 6 (один цикл = один тематический коммит). Документы этого цикла не коммитят SRC-изменения — и наоборот.

### 6.5 TOC-инжектор (Perl)

`scripts/inject-md-toc.pl` глобит `*.md` в корне. После перемещения файлов в `docs/**/*.md`: TODO для будущего цикла — глоб расширить до рекурсивного `find docs -name '*.md'`. **Не** ломать в этом цикле.

---

## 7. Решение ABORT/GO

**GO** ✅ — очистка обоснована:
- 33 корневых `.md` файла хаотично разбросаны в корне — нет единой точки входа для нового члена команды.
- 16+ точных/семантических дубликатов → безусловное удаление.
- 4 цикл-локальных плана + 2 снапшота + 2 стейл-questions → архивация.
- 11 операционных doc-ов (CONTRIBUTING, AI_COLLABORATION, AUDIT-REVIEW, etc.) логически группируются в `docs/{process,operations,analysis,domain,design}/`.

**Итог после уборки**:
- Удалено навсегда: 16 файлов (+ ~10 JSON bak и 4 txt)
- В `_archive/`: 9 файлов (планы + снапшоты + questions + PROJECT_READY + SPEC-ДОРАБОТКА + КРИТИЧЕСКИЙ-АНАЛИЗ)
- Перенесено (MOVE+RENAME): 22 файла
- Остаётся в корне: 3 файла (`README.md`, `CLAUDE.md`, `AGENTS.md`)
- Остаётся в `docs/`: `CONTRIBUTING.md` + `decisions/ADR-*.md` (без изменений)

Детальный план целевой структуры — в [`PROPOSED_STRUCTURE.md`](./PROPOSED_STRUCTURE.md).
