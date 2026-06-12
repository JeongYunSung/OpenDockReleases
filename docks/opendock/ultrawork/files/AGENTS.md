# Ultrawork

Ultrawork is the OpenDock all-in-one quality resolver. It defines what must be true before work is called done.

Before final handoff:

- Design/UI changes must pass typography, spacing, responsive layout, state, and accessibility checks.
- Frontend changes must pass formatter, lint, typecheck, test, build, accessibility, route smoke, and UI state expectations when applicable.
- Backend changes must pass formatter, lint, test, build, API contract, validation, migration, auth, logging, and readiness expectations when applicable.
- Kotlin/Spring changes must pass Gradle wrapper, ktlint, detekt, test, build, bootJar, config, DTO validation, transaction, and blocking-call checks when applicable.
- Data work must avoid destructive queries, SELECT *, ambiguous timezone/null handling, undocumented metrics, costly dashboards, and unmasked PII.
- DevOps/Infra work must pass Terraform/Kubernetes/Helm safety expectations, secret scan, no latest tags, resource limits, rollback, and runbook checks.
- Docs must stay linkable, current, language-tagged, command-accurate, quick-startable, and synchronized across translations.
- Product, founder, and marketing work must include measurable outcomes, acceptance criteria, GTM/ICP/pricing/channel/CTA/proof where relevant.
- Mobile work must review permissions, offline/error/loading states, dynamic text, platform lint/test, signing, and release readiness.
- Security and QA gates must block secrets, unsafe commands, auth gaps, injection risks, sensitive logs, skipped tests, missing repro notes, and weak release evidence.

Run the harness when Node.js is available:

```bash
node .opendock/harness/check.mjs
```

Fix root causes. If a gate does not apply, document the exception, reason, and owner.
