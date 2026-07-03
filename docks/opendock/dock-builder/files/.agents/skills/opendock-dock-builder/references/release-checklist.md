# Release Checklist

Before saying a dock is release-ready, collect evidence.

## Required Evidence

- Dock deploy reference (`owner/name@version`), platform manifests, and target Registry.
- Static package check result.
- Manifest `files.from` and `files.to` safety result.
- Manifest spec check: no embedded `id`/`version`, no `lifecycle`, no manifest `uninstall`, no removed `requires.packages`/`requires.tools`, and no package-manager mutation task.
- Dependency spec check when present: safe `dependencies.<name>.path`, supported manager/mode, expected package manifest or requirements file, and install/update/uninstall cleanup evidence.
- Security review result with blockers/warnings.
- Harness direct run result.
- Positive and negative harness case result when the dock has a harness.
- Install simulation result.
- Update simulation result when updating existing dock behavior.
- Uninstall simulation result when uninstall is relevant.
- Dependency install/update/uninstall result when `dependencies` is present.
- Multi-dock collision test when paths overlap or shared concepts exist.
- Documentation sync result across `DOCK.md`, installed `README.md`, `AGENTS.md`, `HARNESS.md`, skill/workflow files, and repo catalog.

## Handoff Format

Use this shape:

```text
Dock: opendock/name
Version: x.y.z
Platforms: macos, windows
Decision: ready | hold | blocked
Changed: short summary
Tests:
- static: pass
- harness valid case: pass
- harness invalid case: pass
- install: pass
- update: pass/not applicable
- uninstall: pass/not applicable
Security:
- blockers: none
- warnings: ...
Residual risk:
- ...
```

## Do Not Claim Ready If

- Any install source is missing.
- The manifest uses removed OpenDock fields or task command shapes rejected by the current CLI.
- The harness exits zero on known bad input.
- Security review has unresolved blockers.
- A managed path collision appears between docks.
- Docs describe commands/spec fields the current implementation does not support.
- Only happy-path install was tested while update/uninstall behavior changed.
