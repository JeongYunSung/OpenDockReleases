# Backend Ultrawork Harness

Backend quality gate for API contracts, validation, authentication, migrations, logging, and service safety.

## Required Review

- Formatter, lint, test, and build must be available for backend services.
- Request bodies must be validated before use.
- Authenticated endpoints need explicit guards.
- Hardcoded secrets and sensitive logging are blocked.
- Database migrations should be dry-runnable and rollback-aware.
- OpenAPI or schema documentation should not drift from routes.

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
