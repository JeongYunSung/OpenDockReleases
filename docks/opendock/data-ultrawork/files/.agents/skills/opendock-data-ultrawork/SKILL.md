---
name: opendock-data-ultrawork
description: Use when a workspace needs data and analytics quality gates before final handoff.
---

# Data Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- SQL should avoid select * in shared analytics.
- Destructive queries require review and rollback notes.
- Date and timezone assumptions must be explicit.
- Metric definitions should be documented before dashboard use.
- PII columns must be masked or excluded.
- Dashboard query cost and cardinality need review.

## Command

```bash
node .opendock/harness/check.mjs
```
