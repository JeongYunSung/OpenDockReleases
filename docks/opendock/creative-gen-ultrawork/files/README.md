# Creative Generation Ultrawork

This dock prepares a workspace for repeatable generation work:

- image generation
- logo generation
- favicon generation
- video generation
- audio generation
- asset and resource analysis

## Quick Start

1. Create a run folder: `.opendock/runs/creative-gen/<run-id>/`.
2. Copy `.opendock/templates/creative-gen/GENERATION_BRIEF.md` to `brief.md`.
3. Copy `.opendock/templates/creative-gen/OUTPUT_MANIFEST.md` to `manifest.md`.
4. Set `Status` to `active` and choose one or more modes in the run brief.
5. Generate or analyze the asset.
6. Put outputs in the expected folder:
   - `assets/generated/images/`
   - `assets/generated/logos/`
   - `assets/generated/favicons/`
   - `assets/generated/videos/`
   - `assets/generated/audio/`
7. Update the run manifest.
8. Run:

```bash
opendock verify-hook opendock/creative-gen-ultrawork .opendock/harness/opendock__creative-gen-ultrawork/check.mjs
```

## Loop

```text
brief -> generate -> record -> check -> revise -> handoff
```

If the harness fails, fix the output or the manifest, then run it again.

The templates are OpenDock-managed. The run docs are project work products and are safe to edit for each generated asset.
