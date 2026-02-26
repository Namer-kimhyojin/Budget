import os
import sys


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ibms_backend.settings")

import django  # noqa: E402

django.setup()

from budget_mgmt.models import BudgetEntry, BudgetVersion, Organization  # noqa: E402


def main() -> None:
    target_year = 2026
    target_round = 0
    target_org_codes = ["TEST_DEPT_ALL", "TEST_DEPT_B"]
    target_subject_codes = [
        # Expense samples
        "EXP_04_01_09",
        "EXP_04_01_08",
        "EXP_04_01_05",
        "EXP_01_01_01",
        "EXP_01_02_01",
        "EXP_04_01_14",
        # Income samples
        "INC_03_01",
        "INC_03_02",
        "INC_03_03",
        "INC_03_04",
    ]

    org_ids = list(
        Organization.objects.filter(code__in=target_org_codes).values_list("id", flat=True)
    )
    qs = BudgetEntry.objects.filter(
        year=target_year,
        supplemental_round=target_round,
        organization_id__in=org_ids,
        subject__code__in=target_subject_codes,
        entrusted_project__isnull=True,
    )

    preview = list(
        qs.select_related("organization", "subject")
        .order_by("id")
        .values_list(
            "id",
            "organization__code",
            "subject__code",
            "status",
            "total_amount",
            "executed_amount",
        )
    )
    deleted_count, deleted_map = qs.delete()

    version = BudgetVersion.objects.filter(
        year=target_year, round=target_round, name="2026 Practical Ops Budget"
    ).first()
    version_deleted = False
    if version and not BudgetEntry.objects.filter(
        year=version.year, supplemental_round=version.round
    ).exists():
        version.delete()
        version_deleted = True

    print("=== PRACTICAL SAMPLE CLEANUP DONE ===")
    print(f"target_year_round: {target_year}/{target_round}")
    print(f"target_org_codes: {target_org_codes}")
    print(f"matched_entries_before_delete: {len(preview)}")
    for row in preview:
        print(
            f"entry={row[0]}, org={row[1]}, subject={row[2]}, "
            f"status={row[3]}, total={row[4]}, executed={row[5]}"
        )
    print(f"deleted_rows_total: {deleted_count}")
    print(f"deleted_map: {deleted_map}")
    print(f"version_deleted: {version_deleted}")


if __name__ == "__main__":
    main()
