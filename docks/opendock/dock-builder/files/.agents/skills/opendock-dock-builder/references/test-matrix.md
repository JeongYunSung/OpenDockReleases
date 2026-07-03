# Dock Test Matrix

Use fresh temporary directories. Never test destructive or unreviewed commands in a real project.

## Static

- Manifest parses or is structurally readable.
- Manifest has `opendock: 1` and does not include top-level `id`, `version`, `schema`, `kind`, `lifecycle`, `needs`, `supports`, or `uninstall`.
- Runtime requirements use `requires.runtimes`; removed `requires.packages` and `requires.tools` are absent.
- Project-local CLIs use top-level `tools` with `commands`, not `bin`.
- Copied-folder package installs use top-level `dependencies`, not task commands.
- Dependency declarations use a supported manager/mode pair and a safe project-relative path.
- Dependency paths should point to folders installed by `files`; protected paths such as `.opendock`, `.git`, `.ssh`, and `.env*` are invalid.
- Task `run`, `check`, and `permissions` contain no shell operators or package-manager mutation commands.
- `files.from` exists.
- `files.to` is project-relative and safe.
- No symlink payloads.
- No oversized unexpected files.
- No stale terms: `verify-hook`, `opendock run`, `lifecycle`, removed manifest fields, or top-level `commands`.
- Logo exists and renders.
- `DOCK.md`, installed `README.md`, `AGENTS.md`, and `HARNESS.md` agree.

## Install

- Install into an empty directory.
- Install into an existing project with unrelated files.
- Install multiple docks together when namespacing can collide.
- Confirm expected files are created or managed.
- If `dependencies` are declared, confirm dependency outputs are created inside the copied folder only.
- Confirm dependency install failure does not save a successful dock lock record.
- Confirm user files outside dock ownership are not touched.

## Update

- Update with no user changes.
- Update after user modifies an OpenDock-managed file; expected result should be block unless force is intended.
- Update to a version that removes a file; old managed file should be removed if unchanged.
- Update to a version that adds a file.
- Update when the user added a file inside a managed directory; user file should be preserved.
- If `dependencies` are declared, stale dependency outputs should be removed before reinstall and lock records should be replaced.

## Uninstall

- Uninstall one dock while other docks remain installed.
- Uninstall all installed docks.
- Managed files should be removed when unchanged.
- Empty managed directories should be cleaned up.
- Directories containing user-created files should remain.
- If `dependencies` are declared, generated dependency outputs such as `node_modules`, `.venv`, or `.opendock/python` should be removed without deleting user-owned source files.

## Harness

- Run harness with no target output when the dock should pass as ready.
- Run harness against a valid sample output.
- Run harness against intentional invalid output and verify non-zero exit.
- Confirm failures are scoped to the dock's domain and not unrelated project files.

## Platform

- Test macOS manifest on macOS.
- Test Windows manifest path and PowerShell wrapper shape even if Windows execution is unavailable.
- Verify `--platform` selects the intended manifest.

## Registry/Deploy

- Use exact version in `opendock deploy owner/name@version`.
- Use exact version in `opendock install owner/name@version`.
- Deploy platform-specific artifacts with `--platform macos|windows|linux` and the matching `--file`.
- Verify readme/logo metadata when Registry exposes them separately from archive content.
- Do not assume `latest` unless the current product explicitly supports it.
