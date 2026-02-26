# Split Plan: src/pages/core/SubjectManagementView.jsx

## Why
- Lines: 555
- Non-empty lines: 522
- Function-like blocks: 1
- Hotspot score: 746.0

## Recommended Split
- Extract organization tree operations into hooks/useOrgTreeActions.js.
- Extract subject row editing state into hooks/useSubjectRowDraft.js.
- Move modal orchestration to components/SubjectManagementModals.jsx.
- Keep SubjectManagementView.jsx as container/composer.

## Definition of Done
- [ ] Original behavior preserved
- [ ] File reduced to target size
- [ ] Lint/test/build commands pass
