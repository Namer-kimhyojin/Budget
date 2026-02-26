# Multi-Dept UI Validation Checklist

This checklist verifies that real input data flows correctly in the UI.

## 0) Scenario bootstrap

Run this first:

```powershell
python backend\scripts\create_multi_dept_test_data.py
```

Expected scenario data:

- Version: `2026`, round `0`
- Dept A: `TEST_DEPT_ALL` (`Test Collaboration Dept A`)
- Dept B: `TEST_DEPT_B` (`Test Collaboration Dept B`)
- Entries:
- `410` (Dept A, FINALIZED, total 1,200,000)
- `411` (Dept A, REVIEWING, total 1,100,000)
- `412` (Dept B, REVIEWING, total 1,400,000)
- `413` (Dept B, FINALIZED, total 800,000)

Note: entry IDs may change after rerun. Use organization/year/round filters to find them.

## 1) Login and profile context

Login page inputs:

- username field: `#login-username`
- password field: `#login-password`

Test accounts:

- Dept A staff: `demo_staff_a` / `Demo!23456`
- Dept A staff: `demo_staff_b` / `Demo!23456`
- Dept A manager: `demo_manager_c` / `Demo!23456`
- Dept B staff: `demo_staff_d` / `Demo!23456`
- Dept B staff: `demo_staff_e` / `Demo!23456`
- Dept B manager: `demo_manager_f` / `Demo!23456`

Pass criteria:

- All 6 accounts can log in.
- After login, user role/organization in header/profile matches account.

## 2) Planning page data visibility

Route:

- `/planning`

Checks:

- Filter by year `2026`, round `0`.
- Dept A manager sees 2 Dept A entries.
- Dept B manager sees 2 Dept B entries.
- Entry totals match:
- Dept A: `1,200,000`, `1,100,000`
- Dept B: `1,400,000`, `800,000`

## 3) Per-entry detail participation

For each entry, open detail rows and verify contributor mix:

- Dept A entries include details written by both `demo_staff_a` and `demo_staff_b`.
- Dept B entries include details written by both `demo_staff_d` and `demo_staff_e`.

Pass criteria:

- Each entry has 2 detail rows.
- Detail author information reflects mixed participation within same department.

## 4) Workflow/permission validation

### Dept A

1. Login as `demo_staff_a`, open Dept A entry in `REVIEWING/FINALIZED` state.
2. Attempt approve action as staff.
3. Expected: blocked (no permission).
4. Login as `demo_manager_c`.
5. Approve flow works for Dept A entries (PENDING -> REVIEWING -> FINALIZED where applicable).

### Dept B

1. Login as `demo_staff_d`, attempt approve on Dept B entry.
2. Expected: blocked (no permission).
3. Login as `demo_manager_f`.
4. Approve flow works for Dept B entries.

Pass criteria:

- Staff cannot approve.
- Manager can approve.
- Status transitions render correctly in UI badges.

## 5) Cross-department isolation sanity check

Checks:

- Dept A manager view does not accidentally show Dept B entries when dept filter is Dept A.
- Dept B manager view does not accidentally show Dept A entries when dept filter is Dept B.
- Refresh does not duplicate rows.

Pass criteria:

- Dept-scoped filter returns exactly 2 rows per test department.

## 6) Regression quick check

Routes:

- `/dashboard`
- `/planning`
- `/users` (ADMIN only)
- `/audit` (manager/admin)

Pass criteria:

- No infinite loading.
- No 401 loop after valid login.
- No HTML error page shown in API error modal.

