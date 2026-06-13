# Creative Generation Ultrawork Quality Gate

1. Read `GENERATION_BRIEF.md`.
2. Set `Status` and `Mode` for the current task.
3. Generate or analyze the requested asset.
4. Save outputs in a stable path under `assets/generated/` unless the brief requires another path.
5. Update `OUTPUT_MANIFEST.md` with output paths, prompt, tool, model, date, rights, review, and revision history.
6. Run `node .opendock/harness/check.mjs`.
7. If the harness fails, revise the asset or manifest and run it again.
8. Report passed checks, remaining exceptions, and exact output paths.
