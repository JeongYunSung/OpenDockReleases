---
name: opendock-frontend-ultrawork
description: Use when a workspace needs frontend implementation quality gates before final handoff.
---

# Frontend Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Formatter, lint, typecheck, test, and build scripts must exist when package.json exists.
- No console.log, debugger, broad any usage, or href="#" placeholders.
- Images need alt text, form controls need labels, and buttons need explicit type.
- API flows need loading and error states.
- Route or page smoke tests should exist for user-visible surfaces.
- Bundle growth and unnecessary duplicate dependencies require review.

## Command

```bash
node .opendock/harness/check.mjs
```
