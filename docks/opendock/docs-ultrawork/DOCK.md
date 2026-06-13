# Docs Ultrawork

Documentation quality gate for markdown hygiene, links, headings, code fences, quick starts, CLI drift, and multilingual sync.

## What It Checks

- Markdown code fences should declare a language.
- OpenDock install examples must include @version.
- Registry URLs must point to registry.opendock.app for API/registry work.
- README quick starts should be followable in under five minutes.
- Old package names and stale versions must be removed.
- Multilingual docs must stay structurally aligned.

## Run

```bash
node .opendock/harness/check.mjs
```

Use this dock when the workspace needs a focused quality gate for documentation quality gates.
