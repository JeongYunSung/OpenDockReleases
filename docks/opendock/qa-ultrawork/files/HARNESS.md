# QA Ultrawork Harness

QA quality gate for regression coverage, smoke tests, security checks, release confidence, and final handoff discipline.

## Required Review

- Regression, smoke, and acceptance coverage must be explicit.
- Skipped or focused tests must not remain.
- Security-sensitive changes need scan or review evidence.
- Bug reports need reproduction steps, expected result, actual result, and environment.
- Release handoff must include known risks and rollback notes.
- Final responses should say what was tested and what was not tested.

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
