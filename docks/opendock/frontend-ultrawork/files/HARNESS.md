# Frontend Ultrawork Harness

Frontend quality gate for React, TypeScript, accessibility, route smoke checks, and build readiness.

## Required Review

- Formatter, lint, typecheck, test, and build scripts must exist when package.json exists.
- No console.log, debugger, broad any usage, or href="#" placeholders.
- Images need alt text, form controls need labels, and buttons need explicit type.
- API flows need loading and error states.
- Route or page smoke tests should exist for user-visible surfaces.
- Bundle growth and unnecessary duplicate dependencies require review.

## Commands

```bash
node .opendock/harness/check.mjs
sh .opendock/harness/check.sh
```

On Windows PowerShell:

```powershell
.opendock/harness/check.ps1
```

Treat failures as blockers unless a human owner documents the exception.
