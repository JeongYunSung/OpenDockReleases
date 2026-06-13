# Kotlin Spring Ultrawork Harness

Kotlin/Spring Boot quality gate for Gradle, ktlint, detekt, DTO validation, profiles, transactions, and readiness.

## Required Review

- Gradle wrapper must exist.
- ktlintCheck, detekt, test, build, and bootJar must be available.
- application.yml must not contain literal secrets.
- Controller DTOs should use validation.
- Transaction boundaries must be explicit around write flows.
- Readiness and health checks should be present.

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
