# Failed Items Recovery Plan (T07, T08)

## Scope

- Failed item `T07`: backend verification (`py -3 manage.py test`) failed due to missing Django in active interpreter.
- Failed item `T08`: frontend verification (`npm run lint && npm run build`) failed; lint scanned `.venv` and also hit existing project-wide lint debt.

## Objective

- Make verification steps deterministic and repeatable.
- Separate "environment/setup failure" from "real code-quality failure".
- Re-run failed checks with strict pass/fail criteria.

## Phase 1: Environment Stabilization (Highest Priority)

### T07 Recovery

1. Ensure backend venv and dependencies are installed:
   - `powershell -ExecutionPolicy Bypass -File backend/scripts/venv.ps1`
2. Run tests with explicit venv Python (avoid global Python):
   - `backend\\.venv\\Scripts\\python.exe backend/manage.py test`
3. Update sub-agent verification command for backend to explicit interpreter:
   - from: `py -3 manage.py test`
   - to: `..\\.venv\\Scripts\\python.exe manage.py test` (with `cwd=backend`)

### Exit Criteria

- `backend\\.venv\\Scripts\\python.exe backend/manage.py test` exits with code `0`.

## Phase 2: Frontend Verification Stabilization

### T08 Recovery

1. Restrict lint scope to project source only:
   - temporary command: `npx eslint src`
2. Add ignore rules for local virtualenv and generated folders in `eslint.config.js`:
   - `.venv/**`
   - `**/.venv/**`
   - `backend/.venv/**`
3. Keep build as separate gate:
   - `npm run build`
4. Use staged policy:
   - Stage A (immediate): `eslint src` + `build` must pass for changed areas.
   - Stage B (debt cleanup): gradually expand to full-repo lint.

### Exit Criteria

- `npx eslint src` exits with code `0` for the target branch policy.
- `npm run build` exits with code `0`.

## Phase 3: Sub-agent Pipeline Hardening

1. Re-run failed tasks only:
   - `T07` backend verify
   - `T08` frontend verify
2. Run orchestrator in strict mode:
   - `py -3 backend/scripts/subagent_mvp.py --tasks-file backend/scripts/subagent_tasks.split_hotspots.json --execute --strict --pretty`
3. If strict run fails, classify cause:
   - setup issue (env/path/encoding)
   - genuine code issue (test/lint/build)

### Exit Criteria

- `review.ok = true`
- process exit code is `0` in strict mode.

## Risk Notes

- Existing lint debt can block verification even when hotspot split work is correct.
- Using global Python for Django commands is non-deterministic across machines.
- Long command output may include encoding edge cases on Windows consoles.

## Ownership

- Backend-worker: T07 and backend interpreter pinning.
- Frontend-worker: T08 lint scope policy and build pass.
- Reviewer: strict-mode rerun and final gate decision.
