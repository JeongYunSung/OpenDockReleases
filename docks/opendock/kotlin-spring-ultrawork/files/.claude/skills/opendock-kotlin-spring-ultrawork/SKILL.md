---
name: opendock-kotlin-spring-ultrawork
description: Use when a workspace needs Kotlin and Spring Boot quality gates before final handoff.
---

# Kotlin Spring Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Gradle wrapper must exist.
- ktlintCheck, detekt, test, build, and bootJar must be available.
- application.yml must not contain literal secrets.
- Controller DTOs should use validation.
- Transaction boundaries must be explicit around write flows.
- Readiness and health checks should be present.

## Command

```bash
node .opendock/harness/check.mjs
```
