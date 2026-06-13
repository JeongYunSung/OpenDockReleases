# Business Ultrawork Harness

Business quality gate for PRDs, user stories, GTM, ICP, pricing, marketing claims, evidence, and release notes.

## Required Review

- PRDs need problem, goals, non-goals, success metrics, risks, and requirements.
- User stories need acceptance criteria.
- GTM docs need ICP, channel, pricing, and positioning.
- Marketing copy needs a clear CTA.
- Claims need evidence or source notes.
- Release notes need breaking changes and migration notes when relevant.

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
