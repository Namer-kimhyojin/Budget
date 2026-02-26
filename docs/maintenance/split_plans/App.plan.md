# Split Plan: src/App.jsx

## Why
- Lines: 535
- Non-empty lines: 489
- Function-like blocks: 18
- Hotspot score: 1002.0

## Recommended Split
- Split route/menu composition into app/AppRoutes.jsx.
- Move bootstrapping state to app/useAppBootstrap.js.
- Move API client/auth glue into app/useSession.js.
- Keep App.jsx as top-level shell with minimal wiring.

## Definition of Done
- [ ] Original behavior preserved
- [ ] File reduced to target size
- [ ] Lint/test/build commands pass
