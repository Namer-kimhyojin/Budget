# Hotspot Split Execution Plan

Date: 2026-02-25

## Scope
- Analyze only product code under `src/` and `backend/`.
- Exclude generated/vendor paths: `backend/staticfiles/`, `backend/output/`, `backend/scripts/`, `*/migrations/`, `dist/`, `node_modules/`, `backup/`.
- Hotspot score combines file size and structural concentration (function-like blocks and hook usage).

## Top Hotspots
1. `backend/budget_mgmt/views.py` (2599 lines, score 5660.4)
2. `backend/budget_mgmt/tests.py` (1160 lines, score 2454.0)
3. `src/pages/core/traditionalLedger/components/LedgerSheetSection.jsx` (1184 lines, score 2076.4)
4. `backend/budget_mgmt/services/budget_book_export.py` (928 lines, score 1900.8)
5. `src/App.jsx` (686 lines, score 1299.6)
6. `src/pages/core/traditionalLedger/hooks/useTraditionalLedgerController.js` (732 lines, score 1215.2)
7. `src/pages/menu/pages/DepartmentApproval/EntryDetailEditor.jsx` (738 lines, score 1212.8)
8. `backend/budget_mgmt/serializers.py` (417 lines, score 1205.2)
9. `src/pages/core/SubjectManagementView.jsx` (699 lines, score 1100.4)
10. `src/pages/core/traditionalLedger/hooks/useTraditionalLedgerDerivedData.js` (635 lines, score 958.0)

## Wave Plan
### Wave 1 (Highest Risk)
- Split `backend/budget_mgmt/views.py` into `views/` package by domain.
- Split `src/pages/core/traditionalLedger/components/LedgerSheetSection.jsx` into header, hierarchy rows, detail rows, and DnD hook.
- Split `src/pages/core/traditionalLedger/hooks/useTraditionalLedgerController.js` into orchestration hook + side-effect hooks.

### Wave 2 (High Impact)
- Split `backend/budget_mgmt/services/budget_book_export.py` into collector, aggregators, worksheet writers, template overrides.
- Split `src/App.jsx` into app shell, session/bootstrap hook, route composition.
- Split `src/pages/core/SubjectManagementView.jsx` into container and feature modules.

### Wave 3 (Medium Risk)
- Split `src/pages/menu/pages/DepartmentApproval/EntryDetailEditor.jsx` into row/editor pieces + draft state hook.
- Split `backend/budget_mgmt/serializers.py` by domain serializers.
- Split `src/pages/core/traditionalLedger/hooks/useTraditionalLedgerDerivedData.js` into scope, totals, and tree derivation modules.

## Acceptance Criteria
- No route/API behavior changes.
- Public component contracts preserved.
- Per-wave verification passes:
- Backend: `python backend/manage.py test`
- Frontend: `npm run lint && npm run build`

## Artifacts
- Filtered hotspot data: `backend/output/subagent/hotspot_filtered_top20.json`
- Sub-agent task template: `backend/output/subagent/subagent_tasks.filtered_hotspots.json`
- Sub-agent dry-run result: `backend/output/subagent/subagent_run.filtered_hotspots.json`
