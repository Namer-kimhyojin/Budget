import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from budget_mgmt.models import BudgetEntry


HEADERS = [
    "No.",
    "부서명",
    "팀명",
    "장",
    "관",
    "항",
    "목",
    "산출내역1",
    "산출내역2(재원)",
    "단가",
    "단가단위",
    "수량",
    "수량단위",
    "회차",
    "회차단위",
    "금액",
    "금액단위",
]


def _subject_levels(subject):
    levels = {1: "", 2: "", 3: "", 4: ""}
    node = subject
    while node:
        if node.level in levels:
            levels[node.level] = node.name
        node = node.parent
    return levels


class Command(BaseCommand):
    help = "Export budget detail rows to macro-friendly CSV format."

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, required=True, help="Target budget year")
        parser.add_argument(
            "--round",
            type=int,
            default=None,
            help="Supplemental round filter (optional)",
        )
        parser.add_argument(
            "--output",
            type=str,
            default=None,
            help="Output CSV path (default: output/spreadsheet/macro_input_{year}.csv)",
        )

    def handle(self, *args, **options):
        year = options["year"]
        round_no = options["round"]
        output = options["output"] or f"output/spreadsheet/macro_input_{year}.csv"

        qs = (
            BudgetEntry.objects.filter(year=year)
            .select_related("organization", "subject", "subject__parent", "subject__parent__parent", "entrusted_project")
            .prefetch_related("details")
            .order_by("organization__name", "entrusted_project__name", "subject__code", "id")
        )
        if round_no is not None:
            qs = qs.filter(supplemental_round=round_no)

        out_path = Path(output)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        row_no = 0
        with out_path.open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(HEADERS)

            for entry in qs:
                levels = _subject_levels(entry.subject)
                organization_name = entry.organization.name
                team_name = ""
                jang = entry.entrusted_project.name if entry.entrusted_project else ""
                gwan = levels[2]
                hang = levels[3]
                mok = levels[4] or entry.subject.name

                for detail in entry.details.all():
                    row_no += 1
                    writer.writerow(
                        [
                            row_no,
                            organization_name,
                            team_name,
                            jang,
                            gwan,
                            hang,
                            mok,
                            f"[{hang or mok}] {detail.name}",
                            detail.source or "",
                            int(detail.price or 0),
                            "원",
                            detail.qty or 0,
                            detail.unit or "",
                            int(detail.freq or 0),
                            "회",
                            int(detail.total_price or 0),
                            "원",
                        ]
                    )

        self.stdout.write(self.style.SUCCESS(f"Exported {row_no} rows -> {out_path}"))
