# Split Plan: src/pages/core/TraditionalLedgerView.jsx

## Why
- Lines: 689
- Non-empty lines: 634
- Function-like blocks: 5
- Hotspot score: 1140.4

## Recommended Split
- Extract state/effects into hooks/useTraditionalLedgerState.js.
- Extract workflow/log behavior into hooks/useTraditionalLedgerWorkflow.js.
- Extract large UI blocks into components: LedgerToolbar.jsx, LedgerTable.jsx, LogPopover.jsx, HierarchyActionMenu.jsx.
- Keep TraditionalLedgerView.jsx as composition layer only (<400 lines target).

## Definition of Done
- [ ] Original behavior preserved
- [ ] File reduced to target size
- [ ] Lint/test/build commands pass
