# Sub-Agent Quickstart

## 0) Auto-detect hotspot files (recommended)

```powershell
py -3 backend/scripts/hotspot_split_planner.py --pretty
```

Generated outputs:

- `docs/maintenance/hotspot_report.md`
- `backend/scripts/subagent_tasks.split_hotspots.json`

## 1) Start from template

Edit:

- `backend/scripts/subagent_tasks.budget_template.json`
- Replace placeholders:
  - `__OLD_BACKEND_SNIPPET__`
  - `__NEW_BACKEND_SNIPPET__`
  - `__OLD_FRONTEND_SNIPPET__`
  - `__NEW_FRONTEND_SNIPPET__`

Tip:

- `old` must match exact text in the target file.
- Keep each task scoped to one area.

## 2) Dry-run (no file changes)

```powershell
py -3 backend/scripts/subagent_mvp.py `
  --tasks-file backend/scripts/subagent_tasks.budget_template.json `
  --pretty
```

## 3) Execute actions

```powershell
py -3 backend/scripts/subagent_mvp.py `
  --tasks-file backend/scripts/subagent_tasks.budget_template.json `
  --execute --pretty
```

## 4) CI-style fail on review gate

```powershell
py -3 backend/scripts/subagent_mvp.py `
  --tasks-file backend/scripts/subagent_tasks.budget_template.json `
  --execute --strict
```
