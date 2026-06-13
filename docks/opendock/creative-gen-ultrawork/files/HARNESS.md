# Creative Generation Harness

Run:

```bash
node .opendock/harness/check.mjs
```

## What It Checks

- Required documents exist: `GENERATION_BRIEF.md`, `OUTPUT_MANIFEST.md`, and `HARNESS.md`.
- Active generation work declares at least one mode.
- `OUTPUT_MANIFEST.md` records output paths, prompt, tool, model, date, rights, review, and revision history.
- Generated files use safe names, are not temporary files, and stay under size limits.
- Image output has alt text.
- Logo SVG output has `viewBox` and no executable SVG content.
- Favicon output includes a favicon and installable icon metadata.
- Video output includes script/storyboard and captions or a documented exception.
- Audio output includes transcript and source/voice rights.
- Asset analysis includes inventory and report files.

## Passing State

The harness passes when the current work is either:

- still in draft state with no generated outputs, or
- active and fully documented with valid outputs.
