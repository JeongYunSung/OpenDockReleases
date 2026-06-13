# Creative Generation Ultrawork

This dock prepares a workspace for repeatable generation work:

- image generation
- logo generation
- favicon generation
- video generation
- audio generation
- asset and resource analysis

## Quick Start

1. Open `GENERATION_BRIEF.md`.
2. Set `Status` to `active` and choose one or more modes.
3. Generate or analyze the asset.
4. Put outputs in the expected folder:
   - `assets/generated/images/`
   - `assets/generated/logos/`
   - `assets/generated/favicons/`
   - `assets/generated/videos/`
   - `assets/generated/audio/`
5. Update `OUTPUT_MANIFEST.md`.
6. Run:

```bash
node .opendock/harness/check.mjs
```

## Loop

```text
brief -> generate -> record -> check -> revise -> handoff
```

If the harness fails, fix the output or the manifest, then run it again.
