# Data Ultrawork

This workspace uses Data Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- SQL should avoid select * in shared analytics.
- Destructive queries require review and rollback notes.
- Date and timezone assumptions must be explicit.
- Metric definitions should be documented before dashboard use.
- PII columns must be masked or excluded.
- Dashboard query cost and cardinality need review.
