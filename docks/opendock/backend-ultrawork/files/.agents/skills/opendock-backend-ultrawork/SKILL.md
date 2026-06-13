---
name: opendock-backend-ultrawork
description: Use when a workspace needs backend API and service quality gates before final handoff.
---

# Backend Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Formatter, lint, test, and build must be available for backend services.
- Request bodies must be validated before use.
- Authenticated endpoints need explicit guards.
- Hardcoded secrets and sensitive logging are blocked.
- Database migrations should be dry-runnable and rollback-aware.
- OpenAPI or schema documentation should not drift from routes.

## Command

```bash
node .opendock/harness/check.mjs
```
