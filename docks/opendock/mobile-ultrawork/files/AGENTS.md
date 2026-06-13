# Mobile Ultrawork

This workspace uses Mobile Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Mobile permissions require a visible rationale.
- Dart print and debug-only code must not remain.
- Screens need loading, empty, error, and offline states.
- Tap targets and accessibility labels need review.
- Release checklist must cover signing, versioning, and rollback.
- Network and async failures need explicit handling.
