# Docs Ultrawork

This workspace uses Docs Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Markdown code fences should declare a language.
- OpenDock install examples must include @version.
- Registry URLs must point to registry.opendock.app for API/registry work.
- README quick starts should be followable in under five minutes.
- Old package names and stale versions must be removed.
- Multilingual docs must stay structurally aligned.
