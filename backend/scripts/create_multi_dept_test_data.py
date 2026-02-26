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
    BudgetSubject,
    BudgetVersion,
    Organization,
    UserProfile,
)


@dataclass
class DemoUser:
    username: str
    password: str
    first_name: str
    role: str
    org_code: str


def expect(status: int, expected: int, label: str, payload=None) -> None:
    if status != expected:
        raise RuntimeError(
            f"[{label}] expected={expected} got={status} payload={payload}"
        )


def ensure_org(code: str, name: str, sort_order: int) -> Organization:
    org, _ = Organization.objects.get_or_create(
        code=code,
        defaults={
            "name": name,
            "org_type": "dept",
            "parent": None,
            "sort_order": sort_order,
        },
    )
    org.name = name
    org.org_type = "dept"
    org.parent = None
    org.sort_order = sort_order
    org.save()
    return org


def ensure_user(profile_spec: DemoUser, org_by_code: dict[str, Organization]) -> User:
    user, created = User.objects.get_or_create(
        username=profile_spec.username,
        defaults={
            "first_name": profile_spec.first_name,
            "email": f"{profile_spec.username}@example.com",
        },
    )
    if not created:
        user.first_name = profile_spec.first_name
        user.email = f"{profile_spec.username}@example.com"
    user.is_active = True
    user.set_password(profile_spec.password)
    user.save()

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "role": profile_spec.role,
            "organization": org_by_code[profile_spec.org_code],
        },
    )
    profile.role = profile_spec.role
    profile.organization = org_by_code[profile_spec.org_code]
    profile.team = None
    profile.save()
    return user


def make_client(user: User) -> APIClient:
    token, _ = Token.objects.get_or_create(user=user)
    client = APIClient(HTTP_HOST="localhost")
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


def create_entry(
    client: APIClient,
    *,
    subject_id: int,
    org_id: int,
    year: int,
    round_no: int,
    last_year_amount: int,
) -> int:
    payload = {
        "subject": subject_id,
        "organization": org_id,
        "entrusted_project": None,
        "year": year,
        "status": "DRAFT",
        "last_year_amount": last_year_amount,
        "budget_category": "ORIGINAL",
        "supplemental_round": round_no,
        "carryover_type": "NONE",
    }
    resp = client.post("/api/entries/", payload, format="json")
    expect(resp.status_code, 201, "entry create", getattr(resp, "data", None))
    return int(resp.data["id"])


def create_detail(
    client: APIClient,
    *,
    entry_id: int,
    org_id: int,
    name: str,
    price: int,
    qty: float,
    freq: int = 1,
) -> None:
    payload = {
        "entry": entry_id,
        "name": name,
        "price": price,
        "qty": qty,
        "freq": freq,
        "currency_unit": "KRW",
        "unit": "EA",
        "freq_unit": "TIME",
        "source": "SELF",
        "organization": org_id,
    }
    resp = client.post("/api/details/", payload, format="json")
    expect(resp.status_code, 201, "detail create", getattr(resp, "data", None))


def submit_entry(client: APIClient, entry_id: int) -> None:
    resp = client.post(f"/api/entries/{entry_id}/submit/", {}, format="json")
    expect(resp.status_code, 200, "submit", getattr(resp, "data", None))


def approve_entry(client: APIClient, entry_id: int, expected_status_code: int = 200) -> None:
    resp = client.post(f"/api/entries/{entry_id}/approve/", {}, format="json")
    expect(resp.status_code, expected_status_code, "approve", getattr(resp, "data", None))


def verify_login(username: str, password: str, expected_role: str, expected_org_id: int) -> None:
    client = APIClient(HTTP_HOST="localhost")
    resp = client.post(
        "/api/auth/login/",
        {"username": username, "password": password},
        format="json",
    )
    expect(resp.status_code, 200, f"login:{username}", getattr(resp, "data", None))
    token = resp.data.get("token")
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    me = client.get("/api/auth/me/")
    expect(me.status_code, 200, f"me:{username}", getattr(me, "data", None))
    role = me.data.get("profile", {}).get("role")
    org_id = me.data.get("profile", {}).get("organization")
    if role != expected_role or org_id != expected_org_id:
        raise RuntimeError(
            f"[me:{username}] expected role/org={expected_role}/{expected_org_id}, got={role}/{org_id}"
        )


def main() -> None:
    org_a = ensure_org("TEST_DEPT_ALL", "Test Collaboration Dept A", 9999)
    org_b = ensure_org("TEST_DEPT_B", "Test Collaboration Dept B", 10000)
    org_by_code = {org_a.code: org_a, org_b.code: org_b}

    demo_users = [
        DemoUser("demo_staff_a", "Demo!23456", "StaffA", "STAFF", "TEST_DEPT_ALL"),
        DemoUser("demo_staff_b", "Demo!23456", "StaffB", "STAFF", "TEST_DEPT_ALL"),
        DemoUser("demo_manager_c", "Demo!23456", "ManagerC", "MANAGER", "TEST_DEPT_ALL"),
        DemoUser("demo_staff_d", "Demo!23456", "StaffD", "STAFF", "TEST_DEPT_B"),
        DemoUser("demo_staff_e", "Demo!23456", "StaffE", "STAFF", "TEST_DEPT_B"),
        DemoUser("demo_manager_f", "Demo!23456", "ManagerF", "MANAGER", "TEST_DEPT_B"),
    ]

    users = {}
    for spec in demo_users:
        users[spec.username] = ensure_user(spec, org_by_code)

    version, _ = BudgetVersion.objects.get_or_create(
        year=2026,
        round=0,
        defaults={
            "name": "2026 Main Budget (Scenario)",
            "status": "DRAFT",
            "start_date": date(2026, 1, 1),
            "end_date": date(2026, 12, 31),
        },
    )
    # Keep scenario labels deterministic and ASCII-only to avoid console/codepage corruption.
    version.name = "2026 Main Budget (Scenario)"
    if not version.start_date:
        version.start_date = date(2026, 1, 1)
    if not version.end_date:
        version.end_date = date(2026, 12, 31)
    if not version.status:
        version.status = "DRAFT"
    version.save(update_fields=["name", "start_date", "end_date", "status"])

    subjects = list(
        BudgetSubject.objects.filter(level=4, subject_type="expense").order_by("id")[:4]
    )
    if len(subjects) < 4:
        raise RuntimeError("Need at least 4 expense leaf subjects (level=4).")

    # Reset entries for this scenario so reruns stay deterministic.
    BudgetEntry.objects.filter(
        organization__in=[org_a, org_b],
        year=version.year,
        supplemental_round=version.round,
    ).delete()

    c_a = make_client(users["demo_staff_a"])
    c_b = make_client(users["demo_staff_b"])
    c_m1 = make_client(users["demo_manager_c"])
    c_d = make_client(users["demo_staff_d"])
    c_e = make_client(users["demo_staff_e"])
    c_m2 = make_client(users["demo_manager_f"])

    # Dept A: two entries created by different staff members.
    e1 = create_entry(
        c_a,
        subject_id=subjects[0].id,
        org_id=org_a.id,
        year=version.year,
        round_no=version.round,
        last_year_amount=1_200_000,
    )
    e2 = create_entry(
        c_b,
        subject_id=subjects[1].id,
        org_id=org_a.id,
        year=version.year,
        round_no=version.round,
        last_year_amount=900_000,
    )

    # Dept B: two entries created by different staff members.
    e3 = create_entry(
        c_d,
        subject_id=subjects[2].id,
        org_id=org_b.id,
        year=version.year,
        round_no=version.round,
        last_year_amount=1_400_000,
    )
    e4 = create_entry(
        c_e,
        subject_id=subjects[3].id,
        org_id=org_b.id,
        year=version.year,
        round_no=version.round,
        last_year_amount=700_000,
    )

    # All members participate in each dept entry (two details each entry).
    create_detail(c_a, entry_id=e1, org_id=org_a.id, name="Infra Maintenance", price=300_000, qty=2)
    create_detail(c_b, entry_id=e1, org_id=org_a.id, name="Security Audit", price=150_000, qty=4)
    create_detail(c_b, entry_id=e2, org_id=org_a.id, name="Workspace Upgrade", price=500_000, qty=1)
    create_detail(c_a, entry_id=e2, org_id=org_a.id, name="Training Program", price=200_000, qty=3)

    create_detail(c_d, entry_id=e3, org_id=org_b.id, name="Cloud Service", price=400_000, qty=2)
    create_detail(c_e, entry_id=e3, org_id=org_b.id, name="Endpoint Protection", price=120_000, qty=5)
    create_detail(c_e, entry_id=e4, org_id=org_b.id, name="Office Supplies", price=250_000, qty=2)
    create_detail(c_d, entry_id=e4, org_id=org_b.id, name="Team Workshop", price=100_000, qty=3)

    # Submit by creators.
    submit_entry(c_a, e1)
    submit_entry(c_b, e2)
    submit_entry(c_d, e3)
    submit_entry(c_e, e4)

    # Staff approval should be blocked.
    approve_entry(c_a, e2, expected_status_code=403)
    approve_entry(c_d, e4, expected_status_code=403)

    # Manager approvals.
    approve_entry(c_m1, e1)  # PENDING -> REVIEWING
    approve_entry(c_m1, e1)  # REVIEWING -> FINALIZED
    approve_entry(c_m1, e2)  # PENDING -> REVIEWING

    approve_entry(c_m2, e3)  # PENDING -> REVIEWING
    approve_entry(c_m2, e4)  # PENDING -> REVIEWING
    approve_entry(c_m2, e4)  # REVIEWING -> FINALIZED

    # Verify totals and author mix.
    expected_totals = {
        e1: 1_200_000,
        e2: 1_100_000,
        e3: 1_400_000,
        e4: 800_000,
    }
    expected_author_sets = {
        e1: {"demo_staff_a", "demo_staff_b"},
        e2: {"demo_staff_a", "demo_staff_b"},
        e3: {"demo_staff_d", "demo_staff_e"},
        e4: {"demo_staff_d", "demo_staff_e"},
    }
    for entry_id, expected_total in expected_totals.items():
        entry = BudgetEntry.objects.get(id=entry_id)
        if int(entry.total_amount) != expected_total:
            raise RuntimeError(
                f"[total] entry={entry_id} expected={expected_total} got={entry.total_amount}"
            )
        authors = set(
            BudgetDetail.objects.filter(entry_id=entry_id).values_list(
                "author__username", flat=True
            )
        )
        if authors != expected_author_sets[entry_id]:
            raise RuntimeError(
                f"[authors] entry={entry_id} expected={sorted(expected_author_sets[entry_id])} got={sorted(authors)}"
            )

    # API filter checks per department and submitted_by tracking.
    for client, org, expected_count in [(c_m1, org_a, 2), (c_m2, org_b, 2)]:
        resp = client.get(
            "/api/entries/",
            {"org_id": org.id, "year": version.year, "round": version.round},
        )
        expect(resp.status_code, 200, f"entries-list:{org.code}", getattr(resp, "data", None))
        rows = (
            resp.data.get("results")
            if isinstance(resp.data, dict) and "results" in resp.data
            else resp.data
        )
        if len(rows) != expected_count:
            raise RuntimeError(
                f"[entries-list:{org.code}] expected={expected_count} got={len(rows)}"
            )

    # Verify login + profile context for all demo users.
    verify_login("demo_staff_a", "Demo!23456", "STAFF", org_a.id)
    verify_login("demo_staff_b", "Demo!23456", "STAFF", org_a.id)
    verify_login("demo_manager_c", "Demo!23456", "MANAGER", org_a.id)
    verify_login("demo_staff_d", "Demo!23456", "STAFF", org_b.id)
    verify_login("demo_staff_e", "Demo!23456", "STAFF", org_b.id)
    verify_login("demo_manager_f", "Demo!23456", "MANAGER", org_b.id)

    # Print summary.
    rows = BudgetEntry.objects.filter(
        organization__in=[org_a, org_b],
        year=version.year,
        supplemental_round=version.round,
    ).select_related("organization", "subject").order_by("organization_id", "id")

    print("=== MULTI-DEPT SCENARIO READY ===")
    print(f"version: year={version.year}, round={version.round}, name={version.name}")
    print(f"orgA: id={org_a.id}, code={org_a.code}, name={org_a.name}")
    print(f"orgB: id={org_b.id}, code={org_b.code}, name={org_b.name}")
    for row in rows:
        print(
            f"entry id={row.id}, org={row.organization.code}, subject={row.subject.code}, "
            f"status={row.status}, total={row.total_amount}"
        )
    print("users:")
    for spec in demo_users:
        print(f"  {spec.username} / {spec.password} / {spec.role} / {spec.org_code}")
    print("checks: login/me, role-based approve, totals, per-org filters => OK")


if __name__ == "__main__":
    main()
