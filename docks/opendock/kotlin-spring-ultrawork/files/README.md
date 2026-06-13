# Kotlin Spring Ultrawork

Kotlin/Spring Boot quality gate for Gradle, ktlint, detekt, DTO validation, profiles, transactions, and readiness.

## What It Checks

- Gradle wrapper must exist.
- ktlintCheck, detekt, test, build, and bootJar must be available.
- application.yml must not contain literal secrets.
- Controller DTOs should use validation.
- Transaction boundaries must be explicit around write flows.
- Readiness and health checks should be present.

## Run

```bash
node .opendock/harness/check.mjs
```

Use this dock when the workspace needs a focused quality gate for Kotlin and Spring Boot quality gates.
