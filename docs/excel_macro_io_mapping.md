# Excel Macro I/O Mapping

This document aligns the legacy Excel macro format with IBMS data fields.

## 1) Export command

Run:

```powershell
cd backend
python manage.py export_macro_input_data --year 2026
```

Optional:

```powershell
python manage.py export_macro_input_data --year 2026 --round 0 --output output/spreadsheet/macro_input_2026_r0.csv
```

Output is UTF-8 BOM CSV for direct Excel open.

## 2) Column mapping (macro layout)

| Excel column | Header | Source in IBMS |
|---|---|---|
| A | `No.` | Sequential row number |
| B | `부서명` | `BudgetEntry.organization.name` |
| C | `팀명` | (currently blank; extend with team model if needed) |
| D | `장` | `BudgetEntry.entrusted_project.name` |
| E | `관` | Subject level 2 name |
| F | `항` | Subject level 3 name |
| G | `목` | Subject level 4 name (or entry subject name) |
| H | `산출내역1` | `[{항 or 목}] {BudgetDetail.name}` |
| I | `산출내역2(재원)` | `BudgetDetail.source` |
| J | `단가` | `BudgetDetail.price` |
| K | `단가단위` | fixed `원` |
| L | `수량` | `BudgetDetail.qty` |
| M | `수량단위` | `BudgetDetail.unit` |
| N | `회차` | `BudgetDetail.freq` |
| O | `회차단위` | fixed `회` |
| P | `금액` | `BudgetDetail.total_price` (`price * qty * freq`) |
| Q | `금액단위` | fixed `원` |

## 3) Macro behavior reflected

- The export is row-based by `BudgetDetail`, which matches your legacy output sheet shape.
- `금액(P)` is pre-calculated in IBMS with the same formula basis as macro logic.
- Grouping/merge behavior (`관/항/목` repeated rows, later merged in macro) is intentionally preserved.

## 4) Notes

- Your macro uses columns through `U`. Current system output provides core columns through `Q`.
- If `R~U` are mandatory in your workbook template, we can extend export with reserved columns.
- If you share your real `입력데이터` table schema, we can add a reverse import command with upsert rules.
