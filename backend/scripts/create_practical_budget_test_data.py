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
    client = APIClient(HTTP_HOST="localhost")
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


def ensure_version(year: int, round_no: int, name: str) -> BudgetVersion:
    version, created = BudgetVersion.objects.get_or_create(
        year=year,
        round=round_no,
        defaults={
            "name": name,
            "status": "DRAFT",
            "start_date": date(year, 1, 1),
            "end_date": date(year, 12, 31),
            "creation_mode": "NEW",
        },
    )
    if not created:
        version.name = name
        if not version.start_date:
            version.start_date = date(year, 1, 1)
        if not version.end_date:
            version.end_date = date(year, 12, 31)
        version.save(update_fields=["name", "start_date", "end_date"])
    return version


@dataclass
class DetailSpec:
    name: str
    price: int
    qty: float
    freq: int = 1
    source: str = "SELF"


@dataclass
class ExecutionSpec:
    executed_at: str
    amount: int
    description: str
    document_no: str


@dataclass
class EntrySpec:
    org_code: str
    creator_username: str
    manager_username: str
    subject_code: str
    status_target: str
    details: list[DetailSpec]
    executions: list[ExecutionSpec]


def create_entry(client: APIClient, payload: dict) -> int:
    resp = client.post("/api/entries/", payload, format="json")
    expect(resp.status_code == 201, "entry create", f"status={resp.status_code}, payload={getattr(resp, 'data', None)}")
    return int(resp.data["id"])


def create_detail(client: APIClient, payload: dict) -> None:
    resp = client.post("/api/details/", payload, format="json")
    expect(resp.status_code == 201, "detail create", f"status={resp.status_code}, payload={getattr(resp, 'data', None)}")


def create_execution(client: APIClient, payload: dict) -> None:
    resp = client.post("/api/executions/", payload, format="json")
    expect(resp.status_code == 201, "execution create", f"status={resp.status_code}, payload={getattr(resp, 'data', None)}")


def submit_entry(client: APIClient, entry_id: int) -> None:
    resp = client.post(f"/api/entries/{entry_id}/submit/", {}, format="json")
    expect(resp.status_code == 200, "submit", f"entry={entry_id}, status={resp.status_code}")


def approve_entry(client: APIClient, entry_id: int) -> None:
    resp = client.post(f"/api/entries/{entry_id}/approve/", {}, format="json")
    expect(resp.status_code == 200, "approve", f"entry={entry_id}, status={resp.status_code}")


def main() -> None:
    target_year = 2026
    target_round = 0
    version = ensure_version(target_year, target_round, "2026 Practical Ops Budget")

    org_by_code = {
        org.code: org
        for org in Organization.objects.filter(code__in=["TEST_DEPT_ALL", "TEST_DEPT_B"])
    }
    expect("TEST_DEPT_ALL" in org_by_code, "org exists", "TEST_DEPT_ALL")
    expect("TEST_DEPT_B" in org_by_code, "org exists", "TEST_DEPT_B")

    subject_codes = [
        "EXP_04_01_09",  # electricity
        "EXP_04_01_08",  # system maintenance
        "EXP_04_01_05",  # repair
        "EXP_01_01_01",  # base salary
        "EXP_01_02_01",  # rent
        "EXP_04_01_14",  # insurance
    ]
    subject_by_code = {
        s.code: s
        for s in BudgetSubject.objects.filter(code__in=subject_codes)
    }
    for code in subject_codes:
        expect(code in subject_by_code, "subject exists", code)

    scenarios = [
        EntrySpec(
            org_code="TEST_DEPT_ALL",
            creator_username="demo_staff_a",
            manager_username="demo_manager_c",
            subject_code="EXP_04_01_09",
            status_target="REVIEWING",
            details=[
                DetailSpec("HQ electric base load", 1_850_000, 1, 12),
                DetailSpec("Data room UPS usage", 420_000, 1, 12),
                DetailSpec("Peak cut program", 300_000, 1, 4),
            ],
            executions=[
                ExecutionSpec("2026-01-31", 1_960_000, "Jan utility settlement", "UTIL-2026-01"),
                ExecutionSpec("2026-02-28", 2_040_000, "Feb utility settlement", "UTIL-2026-02"),
            ],
        ),
        EntrySpec(
            org_code="TEST_DEPT_ALL",
            creator_username="demo_staff_b",
            manager_username="demo_manager_c",
            subject_code="EXP_04_01_08",
            status_target="DRAFT",
            details=[
                DetailSpec("ERP maintenance contract", 4_500_000, 1, 1),
                DetailSpec("Groupware license renewal", 2_100_000, 1, 1),
                DetailSpec("Backup storage service", 650_000, 1, 12),
            ],
            executions=[],
        ),
        EntrySpec(
            org_code="TEST_DEPT_ALL",
            creator_username="demo_staff_a",
            manager_username="demo_manager_c",
            subject_code="EXP_04_01_05",
            status_target="PENDING",
            details=[
                DetailSpec("Office floor repair", 3_200_000, 1, 1),
                DetailSpec("Cooling equipment service", 880_000, 2, 1),
            ],
            executions=[ExecutionSpec("2026-03-15", 1_100_000, "Advance payment", "REPAIR-ADV-01")],
        ),
        EntrySpec(
            org_code="TEST_DEPT_B",
            creator_username="demo_staff_d",
            manager_username="demo_manager_f",
            subject_code="EXP_01_01_01",
            status_target="FINALIZED",
            details=[
                DetailSpec("Full-time payroll", 4_200_000, 8, 12),
                DetailSpec("Contract payroll", 2_600_000, 3, 12),
                DetailSpec("Performance bonus reserve", 15_000_000, 1, 1),
            ],
            executions=[
                ExecutionSpec("2026-01-25", 46_500_000, "Jan payroll", "PAY-2026-01"),
                ExecutionSpec("2026-02-25", 46_800_000, "Feb payroll", "PAY-2026-02"),
            ],
        ),
        EntrySpec(
            org_code="TEST_DEPT_B",
            creator_username="demo_staff_e",
            manager_username="demo_manager_f",
            subject_code="EXP_01_02_01",
            status_target="REVIEWING",
            details=[
                DetailSpec("Main office rent", 8_500_000, 1, 12),
                DetailSpec("Satellite office rent", 2_200_000, 1, 12),
            ],
            executions=[ExecutionSpec("2026-01-05", 10_700_000, "January rent", "RENT-2026-01")],
        ),
        EntrySpec(
            org_code="TEST_DEPT_B",
            creator_username="demo_staff_d",
            manager_username="demo_manager_f",
            subject_code="EXP_04_01_14",
            status_target="DRAFT",
            details=[
                DetailSpec("Facility liability insurance", 5_800_000, 1, 1),
                DetailSpec("Cyber security insurance", 2_900_000, 1, 1),
            ],
            executions=[],
        ),
    ]

    creator_clients = {}
    manager_clients = {}
    for spec in scenarios:
        if spec.creator_username not in creator_clients:
            creator_clients[spec.creator_username] = make_client(spec.creator_username)
        if spec.manager_username not in manager_clients:
            manager_clients[spec.manager_username] = make_client(spec.manager_username)

    # Cleanup only target scenario combinations for deterministic reruns.
    for spec in scenarios:
        org = org_by_code[spec.org_code]
        subject = subject_by_code[spec.subject_code]
        BudgetEntry.objects.filter(
            organization=org,
            subject=subject,
            year=target_year,
            supplemental_round=target_round,
            entrusted_project__isnull=True,
        ).delete()

    created_entry_ids = []
    for spec in scenarios:
        org = org_by_code[spec.org_code]
        subject = subject_by_code[spec.subject_code]
        creator = creator_clients[spec.creator_username]
        creator_user_id = User.objects.only("id").get(username=spec.creator_username).id
        manager = manager_clients[spec.manager_username]

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
        created_entry_ids.append(entry_id)

        for idx, detail in enumerate(spec.details):
            create_detail(
                creator,
                {
                    "entry": entry_id,
                    "name": detail.name,
                    "price": detail.price,
                    "qty": detail.qty,
                    "freq": detail.freq,
                    "currency_unit": "KRW",
                    "unit": "EA",
                    "freq_unit": "TIME",
                    "source": detail.source,
                    "organization": org.id,
                    "sort_order": idx,
                },
            )

        # Workflow to target state.
        if spec.status_target in ("PENDING", "REVIEWING", "FINALIZED"):
            submit_entry(creator, entry_id)
        if spec.status_target in ("REVIEWING", "FINALIZED"):
            approve_entry(manager, entry_id)
        if spec.status_target == "FINALIZED":
            approve_entry(manager, entry_id)

        # Add execution records after creation.
        for ex in spec.executions:
            create_execution(
                creator,
                {
                    "entry": entry_id,
                    "executed_at": ex.executed_at,
                    "amount": ex.amount,
                    "description": ex.description,
                    "document_no": ex.document_no,
                    "created_by": creator_user_id,
                },
            )

        # DB-level checks per entry.
        entry = BudgetEntry.objects.get(id=entry_id)
        detail_total = sum(int(d.total_price or 0) for d in entry.details.all())
        execution_total = sum(int(e.amount or 0) for e in BudgetExecution.objects.filter(entry_id=entry_id))
        expect(int(entry.total_amount or 0) == detail_total, "entry total synced", f"entry={entry_id}")
        expect(int(entry.executed_amount or 0) == execution_total, "entry executed synced", f"entry={entry_id}")
        expect(
            int(entry.remaining_amount or 0) == detail_total - execution_total,
            "entry remaining synced",
            f"entry={entry_id}",
        )

    # API output checks by org.
    for manager_username, org_code in [("demo_manager_c", "TEST_DEPT_ALL"), ("demo_manager_f", "TEST_DEPT_B")]:
        client = manager_clients[manager_username]
        org = org_by_code[org_code]
        resp = client.get(
            "/api/entries/",
            {"year": target_year, "round": target_round, "org_id": org.id},
        )
        expect(resp.status_code == 200, "entries list", f"org={org_code}")
        rows = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
        expect(len(rows) >= 3, "entries list has practical samples", f"org={org_code}, count={len(rows)}")

    print("=== PRACTICAL SAMPLE DATA READY ===")
    print(f"version: {version.id} / {version.year} round {version.round} / {version.name}")
    print(f"created_entry_ids: {created_entry_ids}")
    for entry in BudgetEntry.objects.filter(id__in=created_entry_ids).select_related("organization", "subject").order_by("id"):
        print(
            f"entry={entry.id}, org={entry.organization.code}, subject={entry.subject.code}, "
            f"status={entry.status}, total={entry.total_amount}, executed={entry.executed_amount}, remaining={entry.remaining_amount}"
        )
    print("checks: create/details/executions/workflow/list/aggregation => OK")


if __name__ == "__main__":
    main()
