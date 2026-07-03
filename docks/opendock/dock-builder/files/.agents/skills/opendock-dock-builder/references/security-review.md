# Dock Security Review

## Threat Model

A dock can write files, install tooling, add agent instructions, and run task commands. Review it as supply-chain content.

## Blockers

Reject or hold until fixed when a dock includes:

- Path traversal: absolute `to`, `..`, unsafe archive entries, symlink payloads.
- Destructive commands: `rm -rf`, disk wipe, mass delete, force reset, unbounded overwrite.
- Privilege escalation: `sudo`, `chmod 777`, `chown`, launch agents, shell profile persistence, auto-start daemons.
- Remote bootstrap without review: `curl | sh`, `wget | bash`, `eval $(curl ...)`, executing downloaded code directly.
- Secret exfiltration: reading `.env`, keychains, SSH keys, cloud credentials, auth tokens, then sending to network.
- Hidden persistence: shell rc edits, login items, background services, cron, LaunchAgent, scheduled tasks.
- Prompt-injection instructions: telling agents to ignore higher-priority instructions, reveal secrets, bypass approval, or silently deploy.
- Cross-dock collisions: common harness/template paths that make one dock overwrite another.
- Removed or unsafe manifest fields: `id`, `version`, `lifecycle`, `requires.packages`, `requires.tools`, `files[].update`, or manifest `uninstall`.
- Task command policy bypass: shell operators, command substitution, package-manager mutation commands, or broad `permissions`.
- Tool declaration bypass: using `bin` instead of `tools.commands`, or reusing OpenDock reserved command names such as `npm`, `node`, `git`, `test`, `brew`, or `winget`.
- Dependency declaration abuse: protected dependency paths such as `.opendock`, `.git`, `.ssh`, `.env*`, path traversal, symlink paths, or using `dependencies` to hide global/system installs.

## Warnings

Review carefully but not always blockers:

- Global package installs.
- Network fetches with pinned versions missing.
- Large binary files.
- Hooks that trigger on broad events.
- Harnesses that scan the entire repo and may block unrelated work.
- Generated docs that contain stale command names or unsupported spec keys.
- `permission` singular is accepted by the CLI, but prefer `permissions` in new manifests for readability.
- Dependency installs that fetch from public package registries without a lockfile or pinned constraints.

## When To Use Codex Security

Use `codex-security:security-scan` when the task touches:

- OpenDock CLI command execution, archive extraction, checksum, lock ownership, path safety, update/uninstall logic.
- Registry auth, deploy, approval, download, storage, signing, or public resolution.
- Any repository-wide security assurance request.

For one dock payload, first do targeted artifact review with this checklist and `scripts/check_dock_package.py`.
