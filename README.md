# OpenDock Dock Repository

This repository is the source workspace for OpenDock catalog docks.

The OpenDock CLI repository should stay focused on the CLI, core engine, tests,
and small fixtures. Full production-ready dock payloads live here so Registry
submissions can be reviewed, reproduced, and updated without bloating the CLI
package.

## Layout

```text
docks/
  opendock/
    codex/
      dock.macos.yml
      dock.windows.yml
      DOCK.md
      logo.png
      files/
    designer-ai/
    designer-ai-pro/
```

Each dock directory is deployable with the OpenDock CLI.

## Deploy

Run deploy from the dock directory:

```bash
opendock deploy opendock/designer-ai@1.0.0 --platform macos --file dock.macos.yml
opendock deploy opendock/designer-ai@1.0.0 --platform windows --file dock.windows.yml
```

Use exact versions. Do not put release versions inside `dock.*.yml`.

## Review Rules

- Keep dock ids in `opendock/<name>` form.
- Keep platform artifacts separate: `dock.macos.yml`, `dock.windows.yml`.
- Keep `DOCK.md` and `logo.png` next to the manifests.
- Keep generated agent files, workflows, and command adapters under `files/`.
- Deploy only from committed source whenever possible.
