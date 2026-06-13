---
name: opendock-qa-ultrawork
description: Use when a workspace needs QA, test, security, and release quality gates before final handoff.
---

# QA Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Regression, smoke, and acceptance coverage must be explicit.
- Skipped or focused tests must not remain.
- Security-sensitive changes need scan or review evidence.
- Bug reports need reproduction steps, expected result, actual result, and environment.
- Release handoff must include known risks and rollback notes.
- Final responses should say what was tested and what was not tested.

## Command

```bash
node .opendock/harness/check.mjs
```
