# Creative Generation Ultrawork

Skill, workflow, and harness loop for image, logo, favicon, video, audio, and asset analysis work.

## What It Provides

- Managed templates that turn vague requests into reviewable output requirements.
- Run-scoped brief and manifest workflow for each generated asset.
- Agent instructions for Codex, Claude Code, Gemini, and Cursor.
- A workflow that loops through create, document, check, and revise.
- A Node-based harness that validates output files, metadata, rights notes, and review records.

## Supported Modes

- `image`
- `logo`
- `favicon`
- `video`
- `audio`
- `asset-analysis`

Use this dock when a workspace needs generated creative assets to be repeatable, documented, and ready for handoff instead of ad hoc files dropped into a folder.

New generation tasks should create `.opendock/runs/creative-gen/<run-id>/brief.md` and `manifest.md` from the installed templates. Root-level `GENERATION_BRIEF.md` and `OUTPUT_MANIFEST.md` are legacy-compatible only.
