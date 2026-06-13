# Backend Ultrawork

Backend quality gate for API contracts, validation, authentication, migrations, logging, and service safety.

## What It Checks

- Formatter, lint, test, and build must be available for backend services.
- Request bodies must be validated before use.
- Authenticated endpoints need explicit guards.
- Hardcoded secrets and sensitive logging are blocked.
- Database migrations should be dry-runnable and rollback-aware.
- OpenAPI or schema documentation should not drift from routes.

## Run

```bash
node .opendock/harness/check.mjs
```

Use this dock when the workspace needs a focused quality gate for backend API and service quality gates.
