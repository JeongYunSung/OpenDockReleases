# Creative Generation Ultrawork

This workspace uses Creative Generation Ultrawork for generated assets and asset-analysis work.

## Before Handoff

1. Read `GENERATION_BRIEF.md` and set a concrete mode before generating.
2. Generate or analyze the asset.
3. Save outputs under `assets/generated/` or the documented target path.
4. Update `OUTPUT_MANIFEST.md` with prompt, tool, model, paths, rights, and review notes.
5. Run `node .opendock/harness/check.mjs`.
6. Fix failures before claiming the work is done.

## Focus

- Generated files must be traceable to a prompt, tool, model, date, and rights note.
- Image work needs alt text and explicit dimensions or aspect ratio.
- Logo work prefers clean SVG with a `viewBox` and no embedded scripts.
- Favicon work needs browser-ready icon paths and a valid web manifest when used.
- Video work needs script/storyboard and captions or a documented exception.
- Audio work needs transcript, voice/source note, and usage rights.
- Asset analysis needs an inventory, risk report, and recommendation.
