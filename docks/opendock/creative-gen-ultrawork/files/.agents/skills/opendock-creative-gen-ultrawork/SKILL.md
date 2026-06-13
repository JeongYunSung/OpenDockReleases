---
name: opendock-creative-gen-ultrawork
description: Use when generating or analyzing images, logos, favicons, videos, audio, or reusable asset files.
---

# Creative Generation Ultrawork

Use this skill when the user asks for generated creative output or resource analysis.

## Core Loop

1. Read `GENERATION_BRIEF.md`.
2. If the brief is vague, infer the smallest useful scope and record it.
3. Set `Status: active` and set `Mode` to one or more supported modes.
4. Generate or analyze the asset.
5. Save outputs in the expected folder.
6. Update `OUTPUT_MANIFEST.md`.
7. Run `node .opendock/harness/check.mjs`.
8. Fix failures and rerun until the harness passes.

## Supported Modes

- `image`: raster or SVG image output, with alt text and output specs.
- `logo`: brand mark, wordmark, or lockup, preferably SVG with `viewBox`.
- `favicon`: favicon.ico, PNG app icons, and web manifest metadata.
- `video`: video file with script or storyboard and captions.
- `audio`: voice, music, or sound output with transcript and rights note.
- `asset-analysis`: inventory and report for existing resource files.

## Output Rules

- Never leave generated assets undocumented.
- Never fabricate tool, model, rights, or source information.
- Use lowercase, hyphenated, extension-bearing filenames.
- Keep temporary files out of handoff folders.
- Record rejected drafts if they influenced the final output.
- If a requirement is intentionally skipped, document the owner and reason in `OUTPUT_MANIFEST.md`.

## Command

```bash
node .opendock/harness/check.mjs
```
