# Mobile Ultrawork Harness

Mobile quality gate for Flutter, React Native, Swift, Android, permissions, accessibility, release readiness, and runtime safety.

## Required Review

- Mobile permissions require a visible rationale.
- Dart print and debug-only code must not remain.
- Screens need loading, empty, error, and offline states.
- Tap targets and accessibility labels need review.
- Release checklist must cover signing, versioning, and rollback.
- Network and async failures need explicit handling.

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
