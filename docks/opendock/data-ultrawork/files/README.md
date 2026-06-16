# Data Ultrawork

Data quality gate for SQL safety, destructive queries, timezone clarity, metric definitions, PII masking, and dashboard cost.

## What It Checks

- SQL should avoid select * in shared analytics.
- Destructive queries require review and rollback notes.
- Date and timezone assumptions must be explicit.
- Metric definitions should be documented before dashboard use.
- PII columns must be masked or excluded.
- Dashboard query cost and cardinality need review.

Use this dock when the workspace needs a focused quality gate for data and analytics quality gates.
