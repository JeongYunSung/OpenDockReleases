# Backend Ultrawork

This workspace uses Backend Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Formatter, lint, test, and build must be available for backend services.
- Request bodies must be validated before use.
- Authenticated endpoints need explicit guards.
- Hardcoded secrets and sensitive logging are blocked.
- Database migrations should be dry-runnable and rollback-aware.
- OpenAPI or schema documentation should not drift from routes.
