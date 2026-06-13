# QA Ultrawork

This workspace uses QA Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Regression, smoke, and acceptance coverage must be explicit.
- Skipped or focused tests must not remain.
- Security-sensitive changes need scan or review evidence.
- Bug reports need reproduction steps, expected result, actual result, and environment.
- Release handoff must include known risks and rollback notes.
- Final responses should say what was tested and what was not tested.
