# Video Ultrawork Quality Gate

1. Create `.opendock/runs/video/<run-id>/`.
2. Read `.opendock/templates/video/VIDEO_RUN.md` and create the run's `manifest.json`.
3. Confirm every source, subtitle, output, and report path is project-relative and not a symlink.
4. Run one of the six helper commands without implicit overwrite.
5. Confirm the helper report has `verification.status: passed`.
6. Record the output, report, expected dimensions, duration tolerance, audio intent, codec, and container.
7. Record source rights and review notes.
8. Run `node .opendock/harness/opendock__video-ultrawork/check.mjs --manifest .opendock/runs/video/<run-id>/manifest.json`.
9. Fix failures and rerun until it passes.
10. Report exact output paths, checks, and platform/license limitations.

Never scan the project or historical runs. Never claim Lanczos upscaling restores detail that is absent from the source.
