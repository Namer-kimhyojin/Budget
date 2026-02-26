# Split Plan: backend/budget_mgmt/views.py

## Why
- Lines: 1953
- Non-empty lines: 1682
- Function-like blocks: 97
- Hotspot score: 4318.8

## Recommended Split
- Split by domain into package: views/auth.py, views/organization.py, views/subjects.py, views/entries.py, views/versions.py, views/details.py, views/dashboard.py.
- Move shared helper functions to views/common.py.
- Keep API class names unchanged to avoid URL router churn.
- After split, switch imports in backend/budget_mgmt/urls.py to package-level exports.

## Definition of Done
- [ ] Original behavior preserved
- [ ] File reduced to target size
- [ ] Lint/test/build commands pass
