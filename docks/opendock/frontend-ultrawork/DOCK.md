# Frontend Ultrawork

Frontend quality gate for React, TypeScript, accessibility, route smoke checks, and build readiness.

## What It Checks

- Formatter, lint, typecheck, test, and build scripts must exist when package.json exists.
- No console.log, debugger, broad any usage, or href="#" placeholders.
- Images need alt text, form controls need labels, and buttons need explicit type.
- API flows need loading and error states.
- Route or page smoke tests should exist for user-visible surfaces.
- Bundle growth and unnecessary duplicate dependencies require review.

## Run

```bash
opendock verify-hook opendock/frontend-ultrawork .opendock/harness/opendock__frontend-ultrawork/check.mjs
```

Use this dock when the workspace needs a focused quality gate for frontend implementation quality gates.
