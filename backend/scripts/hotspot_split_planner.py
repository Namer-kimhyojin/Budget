"""Detect oversized files and generate split-task assignments.

This script creates:
1) A hotspot report (markdown)
2) A sub-agent task JSON file for refactor assignments

Usage:
    py -3 backend/scripts/hotspot_split_planner.py --pretty
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


JS_EXTS = {".js", ".jsx", ".ts", ".tsx"}
PY_EXTS = {".py"}
TARGET_EXTS = JS_EXTS | PY_EXTS
EXCLUDED_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "dist",
    "backup",
    "__pycache__",
    "migrations",
}


@dataclass
class FileMetric:
    path: Path
    rel_path: str
    lines: int
    non_empty_lines: int
    import_lines: int
    function_like_count: int
    hook_count: int
    score: float
    owner: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Hotspot finder and split-task generator")
    parser.add_argument("--repo-root", help="Repository root path")
    parser.add_argument("--top", type=int, default=6, help="Maximum hotspot count")
    parser.add_argument("--min-lines", type=int, default=450, help="Minimum lines for hotspot candidates")
    parser.add_argument(
        "--report",
        default="docs/maintenance/hotspot_report.md",
        help="Output markdown report path (relative to repo root)",
    )
    parser.add_argument(
        "--tasks-file",
        default="backend/scripts/subagent_tasks.split_hotspots.json",
        help="Output sub-agent tasks json path (relative to repo root)",
    )
    parser.add_argument("--pretty", action="store_true", help="Pretty-print stdout JSON")
    return parser.parse_args()


def is_excluded(path: Path) -> bool:
    return any(part in EXCLUDED_DIRS for part in path.parts)


def iter_target_files(repo_root: Path) -> Iterable[Path]:
    for path in repo_root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in TARGET_EXTS:
            continue
        rel = path.relative_to(repo_root)
        if is_excluded(rel):
            continue
        # Focus hotspot detection on product code, not automation scripts.
        if rel.parts[:2] == ("backend", "scripts"):
            continue
        yield path


def calc_metric(repo_root: Path, path: Path) -> FileMetric:
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()
    line_count = len(lines)
    non_empty = sum(1 for line in lines if line.strip())

    if path.suffix in PY_EXTS:
        import_lines = sum(1 for line in lines if re.match(r"^\s*(import |from .+ import )", line))
        function_like = sum(1 for line in lines if re.match(r"^\s*(def |class )", line))
        hook_count = 0
    else:
        import_lines = sum(1 for line in lines if re.match(r"^\s*import\s", line))
        function_like = sum(
            1
            for line in lines
            if re.match(
                r"^\s*(export\s+default\s+function|function\s+[A-Za-z_]\w*|const\s+[A-Za-z_]\w*\s*=\s*(async\s*)?\()",
                line,
            )
        )
        hook_count = text.count("useState(") + text.count("useEffect(") + text.count("useMemo(") + text.count("useCallback(")

    base = float(line_count)
    size_penalty = max(0, line_count - 350) * 0.6
    shape_penalty = function_like * 14 + import_lines * 2 + hook_count * 4
    score = round(base + size_penalty + shape_penalty, 2)
    rel = str(path.relative_to(repo_root)).replace("\\", "/")
    owner = "backend-worker" if rel.startswith("backend/") else "frontend-worker"

    return FileMetric(
        path=path,
        rel_path=rel,
        lines=line_count,
        non_empty_lines=non_empty,
        import_lines=import_lines,
        function_like_count=function_like,
        hook_count=hook_count,
        score=score,
        owner=owner,
    )


def recommendation_for(metric: FileMetric) -> list[str]:
    rel = metric.rel_path
    if rel == "backend/budget_mgmt/views.py":
        return [
            "Split by domain into package: views/auth.py, views/organization.py, views/subjects.py, views/entries.py, views/versions.py, views/details.py, views/dashboard.py.",
            "Move shared helper functions to views/common.py.",
            "Keep API class names unchanged to avoid URL router churn.",
            "After split, switch imports in backend/budget_mgmt/urls.py to package-level exports.",
        ]
    if rel == "src/pages/core/TraditionalLedgerView.jsx":
        return [
            "Extract state/effects into hooks/useTraditionalLedgerState.js.",
            "Extract workflow/log behavior into hooks/useTraditionalLedgerWorkflow.js.",
            "Extract large UI blocks into components: LedgerToolbar.jsx, LedgerTable.jsx, LogPopover.jsx, HierarchyActionMenu.jsx.",
            "Keep TraditionalLedgerView.jsx as composition layer only (<400 lines target).",
        ]
    if rel == "src/pages/menu/pages/DepartmentApproval/index.jsx":
        return [
            "Extract filtering and scope logic to hooks/useDepartmentScope.js.",
            "Extract log loading/tracking to hooks/useEntryLogs.js.",
            "Extract modal/draft handlers to hooks/useDetailDraft.js.",
            "Keep page component focused on layout wiring and data flow.",
        ]
    if rel == "src/pages/menu/pages/DepartmentApproval/EntryDetailEditor.jsx":
        return [
            "Split editor table rows into components/EntryDetailRow.jsx.",
            "Extract edit state transitions into hooks/useEntryDetailDraft.js.",
            "Extract validation/format helpers into helpers/detailValidation.js.",
            "Keep rendering component simple and declarative.",
        ]
    if rel == "src/pages/core/SubjectManagementView.jsx":
        return [
            "Extract organization tree operations into hooks/useOrgTreeActions.js.",
            "Extract subject row editing state into hooks/useSubjectRowDraft.js.",
            "Move modal orchestration to components/SubjectManagementModals.jsx.",
            "Keep SubjectManagementView.jsx as container/composer.",
        ]
    if rel == "src/App.jsx":
        return [
            "Split route/menu composition into app/AppRoutes.jsx.",
            "Move bootstrapping state to app/useAppBootstrap.js.",
            "Move API client/auth glue into app/useSession.js.",
            "Keep App.jsx as top-level shell with minimal wiring.",
        ]
    if metric.owner == "backend-worker":
        return [
            "Split by endpoint domain into multiple view modules.",
            "Extract shared validations/helpers into a common module.",
            "Retain public class names and URL behavior.",
        ]
    return [
        "Split state/effects into one or more custom hooks.",
        "Split render-heavy sections into dedicated components.",
        "Keep the page/container file focused on data wiring.",
    ]


def make_task(metric: FileMetric, task_id: str) -> dict:
    base_name = Path(metric.rel_path).stem
    plan_doc = f"docs/maintenance/split_plans/{base_name}.plan.md"
    checklist = "\n".join(f"- {line}" for line in recommendation_for(metric))
    content = (
        f"# Split Plan: {metric.rel_path}\n\n"
        f"## Why\n"
        f"- Lines: {metric.lines}\n"
        f"- Non-empty lines: {metric.non_empty_lines}\n"
        f"- Function-like blocks: {metric.function_like_count}\n"
        f"- Hotspot score: {metric.score}\n\n"
        f"## Recommended Split\n"
        f"{checklist}\n\n"
        f"## Definition of Done\n"
        f"- [ ] Original behavior preserved\n"
        f"- [ ] File reduced to target size\n"
        f"- [ ] Lint/test/build commands pass\n"
    )
    return {
        "task_id": task_id,
        "title": f"Split hotspot: {metric.rel_path}",
        "detail": (
            f"Refactor overloaded file {metric.rel_path}. "
            f"Current lines={metric.lines}, score={metric.score}. "
            f"Follow split plan and keep behavior unchanged."
        ),
        "owner": metric.owner,
        "actions": [
            {
                "type": "write_file",
                "path": plan_doc,
                "content": content,
            }
        ],
    }


def make_verify_task(task_id: str, owner: str) -> dict:
    if owner == "backend-worker":
        return {
            "task_id": task_id,
            "title": "Verification: backend tests",
            "detail": "Run backend test suite after hotspot refactor tasks.",
            "owner": "backend-worker",
            "actions": [
                {
                    "type": "run_cmd",
                    "cwd": "backend",
                    "command": "py -3 manage.py test",
                    "timeout_ms": 300000,
                }
            ],
        }
    return {
        "task_id": task_id,
        "title": "Verification: frontend lint/build",
        "detail": "Run frontend lint/build after hotspot refactor tasks.",
        "owner": "frontend-worker",
        "actions": [
            {
                "type": "run_cmd",
                "cwd": ".",
                "command": "npm run lint && npm run build",
                "timeout_ms": 300000,
            }
        ],
    }


def build_report(metrics: list[FileMetric], report_rel: str) -> str:
    lines = [
        "# Hotspot Report",
        "",
        "This report lists overloaded files that should be split for maintainability.",
        "",
        "| Rank | File | Lines | Non-empty | Func/Class blocks | Hooks | Score | Owner |",
        "|---:|---|---:|---:|---:|---:|---:|---|",
    ]
    for idx, m in enumerate(metrics, start=1):
        lines.append(
            f"| {idx} | `{m.rel_path}` | {m.lines} | {m.non_empty_lines} | "
            f"{m.function_like_count} | {m.hook_count} | {m.score} | {m.owner} |"
        )
    lines.append("")
    lines.append(f"Generated task file: `{report_rel}`")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve() if args.repo_root else Path(__file__).resolve().parents[2]

    metrics = [calc_metric(repo_root, path) for path in iter_target_files(repo_root)]
    hotspots = [m for m in metrics if m.lines >= args.min_lines]
    hotspots.sort(key=lambda x: (x.score, x.lines), reverse=True)
    hotspots = hotspots[: max(1, args.top)]

    tasks = [make_task(m, f"T{i:02d}") for i, m in enumerate(hotspots, start=1)]
    next_idx = len(tasks) + 1
    if any(m.owner == "backend-worker" for m in hotspots):
        tasks.append(make_verify_task(f"T{next_idx:02d}", "backend-worker"))
        next_idx += 1
    if any(m.owner == "frontend-worker" for m in hotspots):
        tasks.append(make_verify_task(f"T{next_idx:02d}", "frontend-worker"))
    tasks_payload = {
        "goal": "split overloaded files for maintainability",
        "tasks": tasks,
    }

    report_path = repo_root / args.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_text = build_report(hotspots, args.tasks_file)
    report_path.write_text(report_text, encoding="utf-8")

    tasks_path = repo_root / args.tasks_file
    tasks_path.parent.mkdir(parents=True, exist_ok=True)
    tasks_path.write_text(json.dumps(tasks_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    stdout_payload = {
        "repo_root": str(repo_root),
        "hotspot_count": len(hotspots),
        "report": str(report_path.relative_to(repo_root)).replace("\\", "/"),
        "tasks_file": str(tasks_path.relative_to(repo_root)).replace("\\", "/"),
        "hotspots": [
            {
                "path": m.rel_path,
                "lines": m.lines,
                "score": m.score,
                "owner": m.owner,
            }
            for m in hotspots
        ],
    }
    if args.pretty:
        print(json.dumps(stdout_payload, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(stdout_payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
