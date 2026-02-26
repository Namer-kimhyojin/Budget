# Split Plan: src/pages/menu/pages/DepartmentApproval/index.jsx

## Why
- Lines: 503
- Non-empty lines: 462
- Function-like blocks: 5
- Hotspot score: 866.8

## Recommended Split
- Extract filtering and scope logic to hooks/useDepartmentScope.js.
- Extract log loading/tracking to hooks/useEntryLogs.js.
- Extract modal/draft handlers to hooks/useDetailDraft.js.
- Keep page component focused on layout wiring and data flow.

## Definition of Done
- [ ] Original behavior preserved
- [ ] File reduced to target size
- [ ] Lint/test/build commands pass
