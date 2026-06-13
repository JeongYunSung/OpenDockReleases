# Docs Ultrawork Harness

Documentation quality gate for markdown hygiene, links, headings, code fences, quick starts, CLI drift, and multilingual sync.

## Required Review

- Markdown code fences should declare a language.
- OpenDock install examples must include @version.
- Registry URLs must point to registry.opendock.app for API/registry work.
- README quick starts should be followable in under five minutes.
- Old package names and stale versions must be removed.
- Multilingual docs must stay structurally aligned.

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
