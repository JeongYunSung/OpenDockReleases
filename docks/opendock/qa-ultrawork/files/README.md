# QA Ultrawork

QA quality gate for regression coverage, smoke tests, security checks, release confidence, and final handoff discipline.

## What It Checks

- Regression, smoke, and acceptance coverage must be explicit.
- Skipped or focused tests must not remain.
- Security-sensitive changes need scan or review evidence.
- Bug reports need reproduction steps, expected result, actual result, and environment.
- Release handoff must include known risks and rollback notes.
- Final responses should say what was tested and what was not tested.

## Run

```bash
node .opendock/harness/check.mjs
```

Use this dock when the workspace needs a focused quality gate for QA, test, security, and release quality gates.
