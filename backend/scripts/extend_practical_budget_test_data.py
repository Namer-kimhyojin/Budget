import os
import sys
from dataclasses import dataclass
from datetime import date


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ibms_backend.settings")

import django  # noqa: E402

django.setup()

from django.contrib.auth.models import User  # noqa: E402
from rest_framework.authtoken.models import Token  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

from budget_mgmt.models import (  # noqa: E402
    ApprovalLog,
    BudgetDetail,
    BudgetEntry,
    BudgetExecution,
    BudgetSubject,
    BudgetVersion,
    Organization,
)


def expect(condition: bool, label: str, detail: str = "") -> None:
    if not condition:
        raise RuntimeError(f"[FAIL] {label} {detail}")


def make_client(username: str) -> APIClient:
    user = User.objects.get(username=username)
    token, _ = Token.objects.get_or_create(user=user)
    c = APIClient(HTTP_HOST="localhost")
    c.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return c


@dataclass
class DetailSpec:
    name: str
    price: int
    qty: float
    freq: int = 1
    source: str = "SELF"


@dataclass
class IncomeEntrySpec:
    org_code: str
    creator_username: str
    manager_username: str
    subject_code: str
    status_target: str
    details: list[DetailSpec]


def create_entry(client: APIClient, payload: dict) -> int:
    resp = client.post("/api/entries/", payload, format="json")
    expect(resp.status_code == 201, "entry create", f"status={resp.status_code}, payload={getattr(resp, 'data', None)}")
    return int(resp.data["id"])


def create_detail(client: APIClient, payload: dict) -> None:
    resp = client.post("/api/details/", payload, format="json")
    expect(resp.status_code == 201, "detail create", f"status={resp.status_code}, payload={getattr(resp, 'data', None)}")


def transition_entry(entry_id: int, to_status: str, actor: User, reason: str) -> None:
    entry = BudgetEntry.objects.get(id=entry_id)
    from_status = entry.status
    entry.status = to_status
    entry.save(update_fields=["status"])
    ApprovalLog.objects.create(
        entry=entry,
        from_status=from_status,
        to_status=to_status,
        actor=actor,
        reason=reason,
    )


def main() -> None:
    target_year = 2026
    target_round = 0

    version = BudgetVersion.objects.filter(year=target_year, round=target_round).first()
    expect(version is not None, "target version exists", "run practical data script first")

    org_by_code = {
        o.code: o for o in Organization.objects.filter(code__in=["TEST_DEPT_ALL", "TEST_DEPT_B"])
    }
    expect("TEST_DEPT_ALL" in org_by_code, "org exists", "TEST_DEPT_ALL")
    expect("TEST_DEPT_B" in org_by_code, "org exists", "TEST_DEPT_B")

    income_specs = [
        IncomeEntrySpec(
            org_code="TEST_DEPT_ALL",
            creator_username="demo_staff_a",
            manager_username="demo_manager_c",
            subject_code="INC_03_01",  # 임대료수입
            status_target="REVIEWING",
            details=[
                DetailSpec("Startup office lease income", 3_600_000, 1, 12),
                DetailSpec("Conference hall rental", 700_000, 2, 12),
            ],
        ),
        IncomeEntrySpec(
            org_code="TEST_DEPT_ALL",
            creator_username="demo_staff_b",
            manager_username="demo_manager_c",
            subject_code="INC_03_03",  # 이자수입
            status_target="DRAFT",
            details=[
                DetailSpec("Demand deposit interest", 1_200_000, 1, 1),
                DetailSpec("Term deposit interest", 2_800_000, 1, 1),
            ],
        ),
        IncomeEntrySpec(
            org_code="TEST_DEPT_B",
            creator_username="demo_staff_e",
            manager_username="demo_manager_f",
            subject_code="INC_03_02",  # 관리비수입
            status_target="PENDING",
            details=[
                DetailSpec("Facility management fee", 2_100_000, 1, 12),
                DetailSpec("Shared utility reimbursement", 950_000, 1, 12),
            ],
        ),
        IncomeEntrySpec(
            org_code="TEST_DEPT_B",
            creator_username="demo_staff_d",
            manager_username="demo_manager_f",
            subject_code="INC_03_04",  # 장비활용수입
            status_target="FINALIZED",
            details=[
                DetailSpec("3D scanner equipment usage", 450_000, 3, 12),
                DetailSpec("Pilot line consulting fee", 1_500_000, 1, 6),
            ],
        ),
    ]

    subject_by_code = {
        s.code: s for s in BudgetSubject.objects.filter(code__in=[s.subject_code for s in income_specs])
    }
    for spec in income_specs:
        expect(spec.subject_code in subject_by_code, "subject exists", spec.subject_code)

    creator_clients = {}
    manager_clients = {}
    for spec in income_specs:
        creator_clients.setdefault(spec.creator_username, make_client(spec.creator_username))
        manager_clients.setdefault(spec.manager_username, make_client(spec.manager_username))

    # Replace same org/subject combination for deterministic reruns.
    for spec in income_specs:
        org = org_by_code[spec.org_code]
        subject = subject_by_code[spec.subject_code]
        BudgetEntry.objects.filter(
            organization=org,
            subject=subject,
            year=target_year,
            supplemental_round=target_round,
            entrusted_project__isnull=True,
        ).delete()

    created_income_entry_ids: list[int] = []
    for spec in income_specs:
        org = org_by_code[spec.org_code]
        subject = subject_by_code[spec.subject_code]
        creator = creator_clients[spec.creator_username]
        manager = manager_clients[spec.manager_username]
        creator_user = User.objects.get(username=spec.creator_username)
        manager_user = User.objects.get(username=spec.manager_username)

        entry_id = create_entry(
            creator,
            {
                "subject": subject.id,
                "organization": org.id,
                "entrusted_project": None,
                "year": target_year,
                "status": "DRAFT",
                "last_year_amount": 0,
                "budget_category": "ORIGINAL",
                "supplemental_round": target_round,
                "carryover_type": "NONE",
            },
        )
        created_income_entry_ids.append(entry_id)

        for idx, d in enumerate(spec.details):
            create_detail(
                creator,
                {
                    "entry": entry_id,
                    "name": d.name,
                    "price": d.price,
                    "qty": d.qty,
                    "freq": d.freq,
                    "currency_unit": "KRW",
                    "unit": "EA",
                    "freq_unit": "TIME",
                    "source": d.source,
                    "organization": org.id,
                    "sort_order": idx,
                },
            )

        if spec.status_target in ("PENDING", "REVIEWING", "FINALIZED"):
            transition_entry(entry_id, "PENDING", creator_user, "seed submit")
        if spec.status_target in ("REVIEWING", "FINALIZED"):
            transition_entry(entry_id, "REVIEWING", manager_user, "seed approve level1")
        if spec.status_target == "FINALIZED":
            transition_entry(entry_id, "FINALIZED", manager_user, "seed approve level2")

    # Monthly execution pattern expansion (Jan-Jun), deterministic by doc prefix.
    # Targets: existing practical expense entries + new income entries.
    pattern_targets = [
        ("TEST_DEPT_ALL", "EXP_04_01_09", "demo_staff_a"),  # 전기료
        ("TEST_DEPT_B", "EXP_01_01_01", "demo_staff_d"),    # 기본급
        ("TEST_DEPT_ALL", "INC_03_01", "demo_staff_a"),     # 임대료수입
        ("TEST_DEPT_B", "INC_03_04", "demo_staff_d"),       # 장비활용수입
    ]

    month_amounts = {
        "EXP_04_01_09": [2_010_000, 1_980_000, 2_120_000, 1_940_000, 2_080_000, 2_030_000],
        "EXP_01_01_01": [46_500_000, 46_800_000, 46_900_000, 47_100_000, 47_300_000, 47_250_000],
        "INC_03_01": [4_600_000, 4_700_000, 4_550_000, 4_650_000, 4_800_000, 4_750_000],
        "INC_03_04": [2_050_000, 2_120_000, 2_180_000, 2_090_000, 2_240_000, 2_300_000],
    }

    all_pattern_entry_ids: list[int] = []
    for org_code, subject_code, creator_username in pattern_targets:
        org = org_by_code[org_code]
        subject = BudgetSubject.objects.get(code=subject_code)
        entry = BudgetEntry.objects.filter(
            organization=org,
            subject=subject,
            year=target_year,
            supplemental_round=target_round,
            entrusted_project__isnull=True,
        ).first()
        expect(entry is not None, "pattern target entry exists", f"{org_code}/{subject_code}")
        all_pattern_entry_ids.append(entry.id)

        # Remove only monthly pattern rows to avoid wiping non-pattern executions.
        BudgetExecution.objects.filter(
            entry=entry,
            document_no__startswith=f"MTH-26-{subject_code}-",
        ).delete()

        creator = User.objects.get(username=creator_username)
        for month_idx, amount in enumerate(month_amounts[subject_code], start=1):
            BudgetExecution.objects.create(
                entry=entry,
                executed_at=date(2026, month_idx, 25),
                amount=amount,
                description=f"Monthly execution {subject_code} 2026-{month_idx:02d}",
                document_no=f"MTH-26-{subject_code}-{month_idx:02d}",
                created_by=creator,
            )

    # Sync checks.
    for entry_id in all_pattern_entry_ids:
        entry = BudgetEntry.objects.get(id=entry_id)
        detail_total = sum(int(d.total_price or 0) for d in entry.details.all())
        execution_total = sum(int(e.amount or 0) for e in entry.executions.all())
        expect(int(entry.total_amount or 0) == detail_total, "entry total sync", f"entry={entry_id}")
        expect(int(entry.executed_amount or 0) == execution_total, "entry executed sync", f"entry={entry_id}")
        expect(int(entry.remaining_amount or 0) == detail_total - execution_total, "entry remaining sync", f"entry={entry_id}")

    # API list checks for output visibility.
    for manager_username, org_code in [("demo_manager_c", "TEST_DEPT_ALL"), ("demo_manager_f", "TEST_DEPT_B")]:
        cli = manager_clients[manager_username]
        org = org_by_code[org_code]
        resp = cli.get(
            "/api/entries/",
            {"year": target_year, "round": target_round, "org_id": org.id},
        )
        expect(resp.status_code == 200, "entries list", f"org={org_code}")
        rows = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
        expect(len(rows) >= 5, "org has expanded practical sample", f"org={org_code}, count={len(rows)}")

    print("=== INCOME + MONTHLY PATTERN EXTENDED ===")
    print(f"version: {version.id} / {version.year} round {version.round} / {version.name}")
    print(f"created_income_entry_ids: {created_income_entry_ids}")
    for entry in BudgetEntry.objects.filter(id__in=created_income_entry_ids + all_pattern_entry_ids).distinct().select_related("organization", "subject").order_by("id"):
        print(
            f"entry={entry.id}, org={entry.organization.code}, subject={entry.subject.code}, "
            f"status={entry.status}, total={entry.total_amount}, executed={entry.executed_amount}, remaining={entry.remaining_amount}"
        )
    print("checks: income create/workflow/monthly execution/list visibility => OK")


if __name__ == "__main__":
    main()
