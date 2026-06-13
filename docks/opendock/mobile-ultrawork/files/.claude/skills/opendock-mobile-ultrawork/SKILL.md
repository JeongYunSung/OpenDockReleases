---
name: opendock-mobile-ultrawork
description: Use when a workspace needs mobile app quality gates before final handoff.
---

# Mobile Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Mobile permissions require a visible rationale.
- Dart print and debug-only code must not remain.
- Screens need loading, empty, error, and offline states.
- Tap targets and accessibility labels need review.
- Release checklist must cover signing, versioning, and rollback.
- Network and async failures need explicit handling.

## Command

```bash
node .opendock/harness/check.mjs
```
