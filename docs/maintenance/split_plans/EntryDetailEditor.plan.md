# Split Plan: src/pages/menu/pages/DepartmentApproval/EntryDetailEditor.jsx

## Why
- Lines: 738
- Non-empty lines: 696
- Function-like blocks: 14
- Hotspot score: 1212.8

## Recommended Split
- Split editor table rows into components/EntryDetailRow.jsx.
- Extract edit state transitions into hooks/useEntryDetailDraft.js.
- Extract validation/format helpers into helpers/detailValidation.js.
- Keep rendering component simple and declarative.

## Definition of Done
- [ ] Original behavior preserved
- [ ] File reduced to target size
- [ ] Lint/test/build commands pass
