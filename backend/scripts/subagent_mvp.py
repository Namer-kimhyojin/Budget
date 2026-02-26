"""Minimal executable sub-agent orchestrator.

Usage examples:
    python backend/scripts/subagent_mvp.py --goal "api validation, ui feedback" --pretty
    python backend/scripts/subagent_mvp.py --tasks-file backend/scripts/subagent_tasks.sample.json --pretty
    python backend/scripts/subagent_mvp.py --tasks-file backend/scripts/subagent_tasks.sample.json --execute --pretty
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable


DEFAULT_TIMEOUT_MS = 120_000
SUPPORTED_OWNERS = {"backend-worker", "frontend-worker"}
SUPPORTED_ACTIONS = {"run_cmd", "write_file", "append_file", "replace_text"}


@dataclass
class Task:
    task_id: str
    title: str
    detail: str
    owner: str
    actions: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class AgentResult:
    agent: str
    task_id: str
    ok: bool
    summary: str
    output: dict[str, Any] = field(default_factory=dict)
    elapsed_ms: int = 0


class BaseAgent:
    name = "base"

    def run(self, task: Task) -> AgentResult:
        raise NotImplementedError


def parse_goal_into_chunks(goal: str) -> list[str]:
    chunks = [item.strip() for item in re.split(r"[,.]| and ", goal) if item.strip()]
    if chunks:
        return chunks
    value = goal.strip()
    return [value] if value else ["default task"]


def default_tasks_from_goal(goal: str) -> list[Task]:
    tasks: list[Task] = []
    for i, chunk in enumerate(parse_goal_into_chunks(goal), start=1):
        owner = "backend-worker" if i % 2 else "frontend-worker"
        tasks.append(
            Task(
                task_id=f"T{i:02d}",
                title=f"Task {i}",
                detail=chunk,
                owner=owner,
                actions=[],
            )
        )
    return tasks


def load_tasks_file(path: Path) -> tuple[str, list[Task]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except FileNotFoundError as exc:
        raise ValueError(f"tasks file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON in tasks file: {path}") from exc

    raw_tasks = payload.get("tasks")
    if not isinstance(raw_tasks, list) or not raw_tasks:
        raise ValueError("'tasks' must be a non-empty list")

    goal = str(payload.get("goal") or f"tasks file: {path.name}")
    tasks: list[Task] = []
    for idx, raw in enumerate(raw_tasks, start=1):
        if not isinstance(raw, dict):
            raise ValueError(f"task item #{idx} must be an object")
        owner = str(raw.get("owner") or ("backend-worker" if idx % 2 else "frontend-worker"))
        if owner not in SUPPORTED_OWNERS:
            raise ValueError(f"unsupported owner in task #{idx}: {owner}")
        actions = raw.get("actions") or []
        if not isinstance(actions, list):
            raise ValueError(f"'actions' for task #{idx} must be a list")
        tasks.append(
            Task(
                task_id=str(raw.get("task_id") or f"T{idx:02d}"),
                title=str(raw.get("title") or f"Task {idx}"),
                detail=str(raw.get("detail") or ""),
                owner=owner,
                actions=actions,
            )
        )

    return goal, tasks


class PlannerAgent(BaseAgent):
    name = "planner"

    def plan(self, goal: str) -> list[Task]:
        return default_tasks_from_goal(goal)

    def run(self, task: Task) -> AgentResult:
        start = time.perf_counter()
        return AgentResult(
            agent=self.name,
            task_id=task.task_id,
            ok=True,
            summary=f"goal '{task.detail}' converted into executable task units.",
            output={"goal": task.detail},
            elapsed_ms=int((time.perf_counter() - start) * 1000),
        )


class ActionExecutor:
    def __init__(self, repo_root: Path, execute_actions: bool) -> None:
        self.repo_root = repo_root.resolve()
        self.execute_actions = execute_actions

    def _resolve_repo_path(self, raw: str) -> Path:
        candidate = Path(raw)
        path = candidate if candidate.is_absolute() else (self.repo_root / candidate)
        resolved = path.resolve()
        if self.repo_root not in (resolved, *resolved.parents):
            raise ValueError(f"path escapes repository: {raw}")
        return resolved

    def _tail(self, text: str, max_chars: int = 1200) -> str:
        text = text or ""
        if len(text) <= max_chars:
            return text
        return text[-max_chars:]

    def _run_cmd(self, action: dict[str, Any]) -> dict[str, Any]:
        command = str(action.get("command") or "").strip()
        if not command:
            return {"ok": False, "type": "run_cmd", "message": "missing 'command'"}

        cwd_raw = str(action.get("cwd") or ".")
        timeout_ms = int(action.get("timeout_ms") or DEFAULT_TIMEOUT_MS)
        cwd = self._resolve_repo_path(cwd_raw)

        if not self.execute_actions:
            return {
                "ok": True,
                "type": "run_cmd",
                "skipped": True,
                "command": command,
                "cwd": str(cwd.relative_to(self.repo_root)),
            }

        start = time.perf_counter()
        try:
            proc = subprocess.run(
                command,
                cwd=str(cwd),
                shell=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_ms / 1000.0,
            )
        except subprocess.TimeoutExpired:
            return {
                "ok": False,
                "type": "run_cmd",
                "command": command,
                "cwd": str(cwd.relative_to(self.repo_root)),
                "message": f"timeout after {timeout_ms}ms",
            }

        return {
            "ok": proc.returncode == 0,
            "type": "run_cmd",
            "command": command,
            "cwd": str(cwd.relative_to(self.repo_root)),
            "returncode": proc.returncode,
            "stdout_tail": self._tail(proc.stdout),
            "stderr_tail": self._tail(proc.stderr),
            "elapsed_ms": int((time.perf_counter() - start) * 1000),
        }

    def _write_file(self, action: dict[str, Any], append: bool) -> dict[str, Any]:
        raw_path = str(action.get("path") or "").strip()
        if not raw_path:
            return {"ok": False, "type": "append_file" if append else "write_file", "message": "missing 'path'"}
        content = str(action.get("content") or "")
        path = self._resolve_repo_path(raw_path)
        rel = str(path.relative_to(self.repo_root))
        action_type = "append_file" if append else "write_file"

        if not self.execute_actions:
            return {"ok": True, "type": action_type, "skipped": True, "path": rel, "bytes": len(content.encode("utf-8"))}

        path.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if append else "w"
        with path.open(mode, encoding="utf-8") as handle:
            handle.write(content)
        return {"ok": True, "type": action_type, "path": rel, "bytes": len(content.encode("utf-8"))}

    def _replace_text(self, action: dict[str, Any]) -> dict[str, Any]:
        raw_path = str(action.get("path") or "").strip()
        old = str(action.get("old") or "")
        new = str(action.get("new") or "")
        count = int(action.get("count") or 1)

        if not raw_path:
            return {"ok": False, "type": "replace_text", "message": "missing 'path'"}
        if not old:
            return {"ok": False, "type": "replace_text", "message": "missing 'old'"}

        path = self._resolve_repo_path(raw_path)
        rel = str(path.relative_to(self.repo_root))

        if not self.execute_actions:
            found_count = None
            note = "validation skipped"
            if path.exists():
                text = path.read_text(encoding="utf-8")
                found_count = text.count(old)
                if found_count == 0:
                    note = "target text not found in current file"
            return {
                "ok": True,
                "type": "replace_text",
                "skipped": True,
                "path": rel,
                "matches": found_count,
                "count": count,
                "note": note,
            }

        if not path.exists():
            return {"ok": False, "type": "replace_text", "path": rel, "message": "file not found"}

        text = path.read_text(encoding="utf-8")
        found_count = text.count(old)
        if found_count == 0:
            return {"ok": False, "type": "replace_text", "path": rel, "message": "target text not found"}

        replaced = text.replace(old, new, count)
        path.write_text(replaced, encoding="utf-8")
        return {
            "ok": True,
            "type": "replace_text",
            "path": rel,
            "matches": found_count,
            "count": count,
        }

    def run_action(self, action: dict[str, Any]) -> dict[str, Any]:
        action_type = str(action.get("type") or "").strip()
        if action_type not in SUPPORTED_ACTIONS:
            return {"ok": False, "type": action_type or "unknown", "message": f"unsupported action: {action_type}"}
        if action_type == "run_cmd":
            return self._run_cmd(action)
        if action_type == "write_file":
            return self._write_file(action, append=False)
        if action_type == "append_file":
            return self._write_file(action, append=True)
        return self._replace_text(action)

    def run_task_actions(self, task: Task) -> tuple[list[dict[str, Any]], list[str], bool]:
        results: list[dict[str, Any]] = []
        touched_paths: list[str] = []
        ok = True

        for idx, action in enumerate(task.actions, start=1):
            if not isinstance(action, dict):
                result = {"ok": False, "type": "invalid", "message": f"action #{idx} must be an object"}
                results.append(result)
                ok = False
                break

            try:
                result = self.run_action(action)
            except Exception as exc:  # pylint: disable=broad-except
                result = {"ok": False, "type": str(action.get("type") or "unknown"), "message": str(exc)}

            result["index"] = idx
            results.append(result)

            path = result.get("path")
            if isinstance(path, str):
                touched_paths.append(path)

            if not result.get("ok", False):
                ok = False
                break

        return results, sorted(set(touched_paths)), ok


class ExecutingWorkerAgent(BaseAgent):
    def __init__(self, name: str, executor: ActionExecutor) -> None:
        self.name = name
        self.executor = executor

    def run(self, task: Task) -> AgentResult:
        start = time.perf_counter()
        if not task.actions:
            mode = "execute" if self.executor.execute_actions else "dry-run"
            return AgentResult(
                agent=self.name,
                task_id=task.task_id,
                ok=True,
                summary=f"no actions for {task.task_id}; generated planning hints only.",
                output={
                    "mode": mode,
                    "proposed_changes": [
                        f"Implement change for: {task.detail}",
                        "Add tests for changed behavior",
                        "Run lint and regression checks",
                    ],
                    "action_results": [],
                    "touched_paths": [],
                    "risks": ["task has no executable actions"],
                },
                elapsed_ms=int((time.perf_counter() - start) * 1000),
            )

        action_results, touched_paths, ok = self.executor.run_task_actions(task)
        mode = "execute" if self.executor.execute_actions else "dry-run"
        risks = [f"task failed at action #{item['index']}" for item in action_results if not item.get("ok", False)]
        summary = (
            f"{self.name} completed {len(action_results)}/{len(task.actions)} actions"
            if ok
            else f"{self.name} failed while executing actions"
        )
        return AgentResult(
            agent=self.name,
            task_id=task.task_id,
            ok=ok,
            summary=summary,
            output={
                "mode": mode,
                "action_results": action_results,
                "touched_paths": touched_paths,
                "risks": risks,
            },
            elapsed_ms=int((time.perf_counter() - start) * 1000),
        )


class ReviewerAgent(BaseAgent):
    name = "reviewer"

    def review(self, results: Iterable[AgentResult], file_conflicts: list[dict[str, Any]]) -> AgentResult:
        start = time.perf_counter()
        results = list(results)
        checks = [f"{item.task_id}: {item.summary}" for item in results]
        failed_tasks = [item.task_id for item in results if not item.ok]

        risks: list[str] = []
        for item in results:
            for risk in item.output.get("risks", []):
                risks.append(f"{item.task_id} - {risk}")
        for conflict in file_conflicts:
            risks.append(f"file conflict: {conflict['path']} touched by {', '.join(conflict['tasks'])}")

        next_actions: list[str] = []
        if failed_tasks:
            next_actions.append("re-run failed tasks after fixing the failed action")
        if file_conflicts:
            next_actions.append("serialize conflicting tasks or split files per task")
        if not failed_tasks and not file_conflicts:
            next_actions.append("merge and run full test suite")

        return AgentResult(
            agent=self.name,
            task_id="REVIEW",
            ok=not failed_tasks,
            summary="review gate completed",
            output={
                "checks": checks,
                "failed_tasks": failed_tasks,
                "risks": risks,
                "next_actions": next_actions,
            },
            elapsed_ms=int((time.perf_counter() - start) * 1000),
        )

    def run(self, task: Task) -> AgentResult:
        raise NotImplementedError("Use review(results, file_conflicts) instead.")


def detect_file_conflicts(tasks: list[Task]) -> list[dict[str, Any]]:
    touched_by: dict[str, set[str]] = {}
    for task in tasks:
        for action in task.actions:
            if not isinstance(action, dict):
                continue
            path = action.get("path")
            if isinstance(path, str) and path.strip():
                touched_by.setdefault(path.strip(), set()).add(task.task_id)

    conflicts = []
    for path, task_ids in sorted(touched_by.items()):
        if len(task_ids) > 1:
            conflicts.append({"path": path, "tasks": sorted(task_ids)})
    return conflicts


class Orchestrator:
    def __init__(self, repo_root: Path, execute_actions: bool, max_workers: int = 2) -> None:
        self.repo_root = repo_root
        self.execute_actions = execute_actions
        self.max_workers = max(1, max_workers)
        self.planner = PlannerAgent()
        self.reviewer = ReviewerAgent()
        executor = ActionExecutor(repo_root=repo_root, execute_actions=execute_actions)
        self.agents: dict[str, BaseAgent] = {
            "backend-worker": ExecutingWorkerAgent("backend-worker", executor),
            "frontend-worker": ExecutingWorkerAgent("frontend-worker", executor),
        }

    def execute(self, goal: str, tasks: list[Task] | None = None) -> dict[str, Any]:
        started = time.perf_counter()
        plan_task = Task(task_id="PLAN", title="goal", detail=goal, owner="planner")
        plan_summary = self.planner.run(plan_task)
        planned_tasks = tasks if tasks is not None else self.planner.plan(goal)

        file_conflicts = detect_file_conflicts(planned_tasks)
        worker_count = 1 if file_conflicts else min(self.max_workers, len(planned_tasks) or 1)

        worker_results: list[AgentResult] = []
        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            futures = []
            for task in planned_tasks:
                agent = self.agents[task.owner]
                futures.append(executor.submit(agent.run, task))
            for future in as_completed(futures):
                worker_results.append(future.result())

        worker_results.sort(key=lambda item: item.task_id)
        review_result = self.reviewer.review(worker_results, file_conflicts=file_conflicts)

        return {
            "goal": goal,
            "execution_mode": "execute" if self.execute_actions else "dry-run",
            "parallel_workers": worker_count,
            "file_conflicts": file_conflicts,
            "plan": [asdict(task) for task in planned_tasks],
            "planner": asdict(plan_summary),
            "workers": [asdict(item) for item in worker_results],
            "review": asdict(review_result),
            "total_elapsed_ms": int((time.perf_counter() - started) * 1000),
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Executable sub-agent MVP")
    parser.add_argument("--goal", help="high-level goal for the planner")
    parser.add_argument("--tasks-file", help="JSON file containing explicit executable tasks")
    parser.add_argument("--execute", action="store_true", help="run file/command actions (default is dry-run)")
    parser.add_argument("--max-workers", type=int, default=2, help="maximum worker parallelism")
    parser.add_argument("--repo-root", help="repository root path")
    parser.add_argument("--output", help="optional JSON output path")
    parser.add_argument("--pretty", action="store_true", help="pretty-print JSON")
    parser.add_argument("--strict", action="store_true", help="exit with code 1 when review gate fails")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.goal and not args.tasks_file:
        raise SystemExit("provide --goal or --tasks-file")

    repo_root = Path(args.repo_root).resolve() if args.repo_root else Path(__file__).resolve().parents[2]

    tasks: list[Task] | None = None
    goal = args.goal or "sub-agent run"
    if args.tasks_file:
        file_goal, loaded_tasks = load_tasks_file(Path(args.tasks_file))
        tasks = loaded_tasks
        if not args.goal:
            goal = file_goal

    orchestrator = Orchestrator(
        repo_root=repo_root,
        execute_actions=args.execute,
        max_workers=args.max_workers,
    )
    result = orchestrator.execute(goal=goal, tasks=tasks)

    json_text = json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None)
    if args.output:
        output_path = Path(args.output)
        if not output_path.is_absolute():
            output_path = repo_root / output_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json_text, encoding="utf-8")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(json_text)

    if args.strict and not result["review"]["ok"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
