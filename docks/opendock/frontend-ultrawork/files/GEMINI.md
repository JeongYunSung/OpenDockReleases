# Frontend Ultrawork

This workspace uses Frontend Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Formatter, lint, typecheck, test, and build scripts must exist when package.json exists.
- No console.log, debugger, broad any usage, or href="#" placeholders.
- Images need alt text, form controls need labels, and buttons need explicit type.
- API flows need loading and error states.
- Route or page smoke tests should exist for user-visible surfaces.
- Bundle growth and unnecessary duplicate dependencies require review.
