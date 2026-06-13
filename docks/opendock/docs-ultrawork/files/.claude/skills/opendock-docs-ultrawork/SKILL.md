---
name: opendock-docs-ultrawork
description: Use when a workspace needs documentation quality gates before final handoff.
---

# Docs Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Markdown code fences should declare a language.
- OpenDock install examples must include @version.
- Registry URLs must point to registry.opendock.app for API/registry work.
- README quick starts should be followable in under five minutes.
- Old package names and stale versions must be removed.
- Multilingual docs must stay structurally aligned.

## Command

```bash
node .opendock/harness/check.mjs
```
