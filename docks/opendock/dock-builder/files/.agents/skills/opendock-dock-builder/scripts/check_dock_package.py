#!/usr/bin/env python3
import argparse
import json
import re
import stat
import subprocess
from pathlib import Path

RISKY_COMMAND_PATTERNS = [
    (r"\bcurl\b[^|\n]*\|\s*(sh|bash|zsh)", "remote shell bootstrap"),
    (r"\bwget\b[^|\n]*\|\s*(sh|bash|zsh)", "remote shell bootstrap"),
    (r"\beval\s+\$?\(", "eval command substitution"),
    (r"\brm\s+-rf\s+(/|~|\$HOME|\.)", "destructive rm"),
    (r"\bsudo\b", "privilege escalation"),
    (r"\bchmod\s+777\b", "world-writable permission"),
    (r"\bchown\b", "ownership mutation"),
    (r"\blaunchctl\b|\bcrontab\b|LaunchAgent|LoginItem", "persistence mechanism"),
    (r"\.ssh/|id_rsa|id_ed25519|AWS_SECRET|GITHUB_TOKEN|OPENDOCK_AUTH_TOKEN", "secret-sensitive path or token"),
]

PROMPT_INJECTION_PATTERNS = [
    r"\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions\b",
    r"\b(?:override|bypass)\s+(?:the\s+)?(?:system|developer|approval|safety)\b",
    r"\b(?:reveal|exfiltrate|upload|send)\b[^\n]{0,80}\b(?:secret|credential|token|private key|\.env)\b",
]

STALE_TERMS = [
    "verify-hook",
    "opendock run",
    ".opendock/hanress",
    ".opendock/toolchains",
]

UNSUPPORTED_TOP_LEVEL_FIELDS = [
    "id",
    "schema",
    "kind",
    "version",
    "lifecycle",
    "needs",
    "supports",
    "uninstall",
]

RESERVED_TOOL_COMMAND_NAMES = {
    "brew",
    "bun",
    "bunx",
    "git",
    "node",
    "npm",
    "npx",
    "pip",
    "pip3",
    "pipx",
    "pnpm",
    "powershell",
    "python",
    "python3",
    "test",
    "uv",
    "winget",
}

DEPENDENCY_MODES_BY_MANAGER = {
    "npm": {"ci", "install"},
    "pnpm": {"install"},
    "bun": {"install"},
    "uv": {"sync"},
    "pip": {"install"},
    "pip3": {"install"},
}

DEPENDENCY_OUTPUTS_BY_MANAGER = {
    "npm": "node_modules",
    "pnpm": "node_modules",
    "bun": "node_modules",
    "uv": ".venv",
    "pip": ".opendock/python",
    "pip3": ".opendock/python",
}

SHELL_OPERATOR_PATTERNS = [
    r"\|\|?",
    r"&&",
    r";",
    r"`",
    r"\$\(",
    r">|<",
]

PACKAGE_MUTATION_PATTERNS = [
    (r"\b(?:npm|pnpm)\s+(?:add|install|update|upgrade)\b", "package manager mutation"),
    (r"\bbun\s+(?:add|install|update|upgrade)\b", "package manager mutation"),
    (r"\bpip3?\s+install\b", "package manager mutation"),
    (r"\bpipx\s+(?:install|upgrade)\b", "package manager mutation"),
    (r"\buv\s+tool\s+(?:install|upgrade)\b", "package manager mutation"),
    (r"\b(?:brew|winget)\s+(?:install|upgrade)\b", "host package manager mutation"),
    (r"\b(?:npx|bunx)\b", "untracked package runner"),
]

MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_MANIFEST_BYTES = 256 * 1024
MANIFEST_NAMES = {"dock.yml", "dock.yaml", "dock.macos.yml", "dock.windows.yml", "dock.linux.yml"}
SECURITY_REVIEW_PATH = "files/.agents/skills/opendock-dock-builder/references/security-review.md"
SECURITY_REVIEW_EXAMPLE_LINES = {
    "- Destructive commands: `rm -rf`, disk wipe, mass delete, force reset, unbounded overwrite.",
    "- Privilege escalation: `sudo`, `chmod 777`, `chown`, launch agents, shell profile persistence, auto-start daemons.",
    "- Remote bootstrap without review: `curl | sh`, `wget | bash`, `eval $(curl ...)`, executing downloaded code directly.",
    "- Secret exfiltration: reading `.env`, keychains, SSH keys, cloud credentials, auth tokens, then sending to network.",
    "- Hidden persistence: shell rc edits, login items, background services, cron, LaunchAgent, scheduled tasks.",
    "- Prompt-injection instructions: telling agents to ignore higher-priority instructions, reveal secrets, bypass approval, or silently deploy.",
}


def rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def is_safe_project_path(value: str) -> bool:
    if not value or value.startswith(("/", "~", "\\")) or re.match(r"^[A-Za-z]:[\\/]", value):
        return False
    parts = [part for part in re.split(r"[\\/]", value) if part]
    return ".." not in parts


def is_protected_dependency_path(value: str) -> bool:
    normalized = normalize_target(value)
    first = normalized.split("/", 1)[0] if normalized else ""
    return first in {".opendock", ".git", ".ssh", ".env"} or first.startswith(".env.")


def has_symlink_component(root: Path, candidate: Path) -> bool:
    try:
        relative = candidate.relative_to(root)
    except ValueError:
        return True
    current = root
    for part in relative.parts:
        current = current / part
        try:
            if current.is_symlink():
                return True
        except OSError:
            return True
    return False


def security_scan_text(path_rel: str, text: str) -> str:
    if path_rel != SECURITY_REVIEW_PATH:
        return text
    return "\n".join(
        "" if line in SECURITY_REVIEW_EXAMPLE_LINES else line
        for line in text.splitlines()
    )


def manifest_file_issue(manifest: Path) -> tuple[str, str] | None:
    try:
        manifest_stat = manifest.lstat()
    except OSError as exc:
        return "manifest-stat", f"could not inspect manifest: {exc}"
    if stat.S_ISLNK(manifest_stat.st_mode):
        return "manifest-symlink", "manifest must not be a symlink"
    if not stat.S_ISREG(manifest_stat.st_mode):
        return "manifest-type", "manifest must be a regular file"
    if manifest_stat.st_size > MAX_MANIFEST_BYTES:
        return "manifest-size", f"manifest exceeds {MAX_MANIFEST_BYTES} bytes"
    return None


def parse_manifest(manifest: Path, results: list[dict], mrel: str) -> dict | None:
    script = (
        'const fs=require("node:fs");'
        'const value=Bun.YAML.parse(fs.readFileSync(process.argv[1],"utf8"));'
        'process.stdout.write(JSON.stringify(value));'
    )
    try:
        parsed = subprocess.run(
            ["bun", "-e", script, str(manifest)],
            check=False,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        add(results, "error", "manifest-parser", mrel, f"could not run the Bun YAML parser: {exc}")
        return None
    if parsed.returncode != 0:
        add(results, "error", "manifest-yaml", mrel, "manifest is not valid YAML")
        return None
    try:
        value = json.loads(parsed.stdout)
    except json.JSONDecodeError:
        add(results, "error", "manifest-parser", mrel, "YAML parser returned invalid structured data")
        return None
    if not isinstance(value, dict):
        add(results, "error", "manifest-shape", mrel, "manifest root must be a mapping")
        return None
    return value


def mapping(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def sequence(value: object) -> list:
    return value if isinstance(value, list) else []


def scalar_string(value: object) -> str | None:
    return value if isinstance(value, str) else None


def manifest_file_pairs(data: dict, results: list[dict], mrel: str) -> list[tuple[str, str | None]]:
    raw_files = data.get("files", [])
    if raw_files is not None and not isinstance(raw_files, list):
        add(results, "error", "manifest-shape", mrel, "`files` must be a list")
        return []
    pairs: list[tuple[str, str | None]] = []
    for index, item in enumerate(sequence(raw_files)):
        if not isinstance(item, dict):
            add(results, "error", "manifest-shape", mrel, f"files[{index}] must be a mapping")
            continue
        source = scalar_string(item.get("from"))
        target = scalar_string(item.get("to"))
        if source is None:
            add(results, "error", "missing-from", mrel, f"files[{index}] is missing a string `from`")
            continue
        if "update" in item:
            add(results, "error", "unsupported-file-update", mrel, "`files[].update` is not supported in the current spec")
        pairs.append((source, target))
    return pairs


def manifest_commands(data: dict) -> tuple[list[str], list[str]]:
    run_commands: list[str] = []
    command_like: list[str] = []
    for phase in ("install", "update", "doctor"):
        for step in sequence(data.get(phase)):
            if not isinstance(step, dict):
                continue
            for key in ("run", "check"):
                value = scalar_string(step.get(key))
                if value is not None:
                    command_like.append(value)
                    if key == "run":
                        run_commands.append(value)
    for key in ("permission", "permissions"):
        value = data.get(key)
        if isinstance(value, str):
            command_like.append(value)
        elif isinstance(value, list):
            command_like.extend(item for item in value if isinstance(item, str))
    return run_commands, command_like


def manifest_task_workdirs(data: dict) -> list[str]:
    values: list[str] = []
    for phase in ("install", "update", "doctor"):
        for step in sequence(data.get(phase)):
            if isinstance(step, dict) and isinstance(step.get("workdir"), str):
                values.append(step["workdir"])
    return values


def normalize_target(value: str) -> str:
    normalized = value.replace("\\", "/")
    while normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def has_top_level_field(text: str, key: str) -> bool:
    return re.search(rf"(?m)^{re.escape(key)}\s*:", text) is not None


def count_agent_rules(path: Path) -> int:
    text = path.read_text("utf-8", errors="replace")
    return sum(1 for line in text.splitlines() if re.match(r"\s*(?:[-*]|\d+[.)])\s+\S", line))


def is_forbidden_root_doc(target: str) -> bool:
    normalized = normalize_target(target)
    if "/" in normalized:
        return False
    upper = normalized.upper()
    return upper in {"README.MD", "HARNESS.MD"} or (upper.endswith(".MD") and "PLAYBOOK" in upper)


def is_quality_gate_target(target: str) -> bool:
    normalized = normalize_target(target).lower()
    return "quality-gate" in normalized and (
        normalized.startswith(".agents/workflows/")
        or normalized.startswith(".claude/commands/")
        or normalized.startswith(".cursor/")
    )


def supports_custom_harness(dock_name: str) -> bool:
    return dock_name.endswith("-ultrawork") or dock_name == "dock-builder"


def add(results: list[dict], level: str, rule: str, path: str, detail: str) -> None:
    results.append({"level": level, "rule": rule, "path": path, "detail": detail})


def scan_manifest(root: Path, manifest: Path, results: list[dict]) -> dict | None:
    mrel = rel(manifest, root)
    issue = manifest_file_issue(manifest)
    if issue:
        add(results, "error", issue[0], mrel, issue[1])
        return

    text = manifest.read_text("utf-8", errors="replace")
    data = parse_manifest(manifest, results, mrel)
    if data is None:
        return

    if data.get("opendock") != 1:
        add(results, "error", "manifest-version", mrel, "manifest must declare `opendock: 1`")

    for field in UNSUPPORTED_TOP_LEVEL_FIELDS:
        if field in data:
            add(
                results,
                "error",
                "unsupported-manifest-field",
                mrel,
                f"`{field}` is not part of current dock.yml; use deploy/install reference or current top-level fields",
            )

    if "commands" in data:
        add(results, "error", "unsupported-commands-field", mrel, "top-level `commands` is not supported; use `tools.<name>.commands`")

    tools = mapping(data.get("tools"))
    for name, spec in tools.items():
        if isinstance(spec, dict) and "bin" in spec:
            add(results, "error", "unsupported-tool-bin", mrel, f"tools.{name} must use `commands`, not `bin`")

    requires = mapping(data.get("requires"))
    for key in ["packages", "tools"]:
        if key in requires:
            add(results, "error", "unsupported-requires-field", mrel, f"`requires.{key}` is not supported; use `requires.runtimes` or top-level `tools`")

    for key in ["readme", "logo"]:
        value = scalar_string(data.get(key))
        if not value:
            continue
        if not is_safe_project_path(value):
            add(results, "error", f"manifest-{key}", mrel, f"{key} must be a package-relative path")
            continue
        candidate = manifest.parent / value
        if not candidate.exists():
            add(results, "error", f"manifest-{key}", mrel, f"{key} target does not exist: {value}")
            continue
        if has_symlink_component(root, candidate):
            add(results, "error", f"manifest-{key}", mrel, f"{key} target must not resolve through a symlink")
            continue
        try:
            candidate.resolve(strict=True).relative_to(root)
        except (OSError, ValueError):
            add(results, "error", f"manifest-{key}", mrel, f"{key} target must stay inside the dock package")
            continue
        if not candidate.is_file():
            add(results, "error", f"manifest-{key}", mrel, f"{key} target must be a regular file")
    if data.get("readme") != "DOCK.md":
        add(results, "error", "registry-readme", mrel, "manifest `readme` must point to the Korean Registry catalog description DOCK.md")

    if not isinstance(data.get("tags"), list) or not data.get("tags"):
        add(results, "warning", "manifest-tags", mrel, "missing tags; catalog discovery may be weaker")

    file_pairs = manifest_file_pairs(data, results, mrel)
    file_targets = {normalize_target(target) for _, target in file_pairs if target}
    file_target_sources = {normalize_target(target): source for source, target in file_pairs if target}
    dock_name = root.name
    expected_readme = f".opendock/docks/{dock_name}/README.md"
    expected_harness_doc = f".opendock/docks/{dock_name}/HARNESS.md"
    expected_harness_script = f".opendock/harness/{dock_name}/check.mjs"

    for source, target in file_pairs:
        if not is_safe_project_path(source):
            add(results, "error", "unsafe-from", mrel, f"unsafe source path: {source}")
        elif not (manifest.parent / source).exists():
            add(results, "error", "missing-from", mrel, f"files.from does not exist: {source}")
        if target is None:
            add(results, "error", "missing-to", mrel, f"files.from has no matching to: {source}")
        elif not is_safe_project_path(target):
            add(results, "error", "unsafe-to", mrel, f"unsafe target path: {target}")
        if target and is_forbidden_root_doc(target):
            add(results, "error", "root-user-doc", mrel, f"install user documentation under `.opendock/docks/{dock_name}/`, not root `{target}`")

    if expected_readme not in file_targets:
        add(results, "error", "namespaced-readme", mrel, f"files must install {expected_readme}")

    for source, target in file_pairs:
        if not target or normalize_target(target) != "AGENTS.md":
            continue
        source_path = manifest.parent / source
        if source_path.is_file():
            rule_count = count_agent_rules(source_path)
            if rule_count > 20:
                add(results, "error", "root-agents-size", mrel, f"root AGENTS.md has {rule_count} routing/safety rules; keep 20 or fewer")

    harness_docs = {target for target in file_targets if target.upper().endswith("/HARNESS.MD") or target.upper() == "HARNESS.MD"}
    harness_scripts = {target for target in file_targets if target.lower().startswith(".opendock/harness/")}
    quality_gates = {target for target in file_targets if is_quality_gate_target(target)}
    is_tool_dock = bool(tools)
    is_quality_dock = supports_custom_harness(dock_name)

    runtime_names = set(mapping(requires.get("runtimes")).keys())
    required_runtimes_by_manager = {
        "npm": {"node", "npm"},
        "pnpm": {"node", "pnpm"},
        "bun": {"bun"},
        "pip": {"python"},
        "pip3": {"python"},
        "uv": {"python", "uv"},
    }
    for spec in tools.values():
        manager = spec.get("manager") if isinstance(spec, dict) else None
        if not isinstance(manager, str):
            continue
        missing = sorted(required_runtimes_by_manager.get(manager, set()) - runtime_names)
        if missing:
            add(results, "error", "tool-manager-runtime", mrel, f"tools manager `{manager}` requires runtimes: {', '.join(missing)}")

    if is_tool_dock:
        for target in sorted(harness_docs | harness_scripts | quality_gates):
            add(results, "error", "tool-dock-custom-harness", mrel, f"Tool Dock should verify install/update/doctor and its real command instead of mapping `{target}`")
    elif is_quality_dock:
        if expected_harness_doc not in file_targets:
            add(results, "error", "quality-dock-harness-required", mrel, f"quality Dock must install harness documentation at {expected_harness_doc}")
        if expected_harness_script not in file_targets:
            add(results, "error", "quality-dock-harness-required", mrel, f"quality Dock must install its objective checker at {expected_harness_script}")
        for target in sorted(harness_docs):
            if target != expected_harness_doc:
                add(results, "error", "custom-harness-doc", mrel, f"unexpected HARNESS path: {target}")
        for target in sorted(harness_scripts):
            expected_prefix = f".opendock/harness/{dock_name}/"
            if not target.startswith(expected_prefix):
                add(results, "error", "custom-harness-script", mrel, f"unexpected harness path: {target}")
    else:
        for target in sorted(harness_docs | harness_scripts | quality_gates):
            add(
                results,
                "error",
                "lightweight-dock-custom-harness",
                mrel,
                f"regular Dock should provide concise guidance and optional templates instead of mapping `{target}`",
            )

    dependencies = mapping(data.get("dependencies"))
    for name, raw_spec in dependencies.items():
        spec = raw_spec if isinstance(raw_spec, dict) else {}
        if not spec:
            add(results, "error", "manifest-shape", mrel, f"dependencies.{name} must be a mapping")
        manager = spec.get("manager")
        path = spec.get("path")
        mode = spec.get("mode")
        if not isinstance(manager, str):
            add(results, "error", "dependency-manager", mrel, f"dependencies.{name} is missing manager")
            continue
        if manager not in DEPENDENCY_MODES_BY_MANAGER:
            add(results, "error", "dependency-manager", mrel, f"dependencies.{name} uses unsupported manager: {manager}")
            continue
        effective_mode = mode or ("sync" if manager == "uv" else "install")
        if effective_mode not in DEPENDENCY_MODES_BY_MANAGER[manager]:
            add(results, "error", "dependency-mode", mrel, f"dependencies.{name} manager `{manager}` does not support mode `{effective_mode}`")
        if not isinstance(path, str):
            add(results, "error", "dependency-path", mrel, f"dependencies.{name} is missing path")
            continue
        if not is_safe_project_path(path):
            add(results, "error", "dependency-path", mrel, f"unsafe dependency path: {path}")
            continue
        if is_protected_dependency_path(path):
            add(results, "error", "dependency-path", mrel, f"protected dependency path: {path}")
        if path not in file_targets:
            add(results, "warning", "dependency-files", mrel, f"dependencies.{name}.path should usually match a files.to copied folder: {path}")
        else:
            source = file_target_sources[path]
            source_path = manifest.parent / source
            if source_path.exists() and source_path.is_dir():
                if manager in {"npm", "pnpm", "bun"} and not (source_path / "package.json").exists():
                    add(results, "warning", "dependency-manifest", mrel, f"dependencies.{name} uses {manager} but source folder has no package.json: {source}")
                if manager == "npm" and effective_mode == "ci" and not (
                    (source_path / "package-lock.json").exists() or (source_path / "npm-shrinkwrap.json").exists()
                ):
                    add(results, "warning", "dependency-lockfile", mrel, f"dependencies.{name} uses npm ci but source folder has no package-lock.json or npm-shrinkwrap.json: {source}")
                if manager in {"pip", "pip3"} and not (source_path / "requirements.txt").exists():
                    add(results, "error", "dependency-requirements", mrel, f"dependencies.{name} uses {manager} but source folder has no requirements.txt: {source}")
                if manager == "uv" and not ((source_path / "pyproject.toml").exists() or (source_path / "uv.lock").exists()):
                    add(results, "warning", "dependency-manifest", mrel, f"dependencies.{name} uses uv but source folder has no pyproject.toml or uv.lock: {source}")
        output = DEPENDENCY_OUTPUTS_BY_MANAGER.get(manager)
        if output and path.endswith(f"/{output}"):
            add(results, "error", "dependency-path", mrel, f"dependencies.{name}.path should point to the package folder, not generated output `{output}`")

    run_commands, command_like = manifest_commands(data)
    for command in run_commands:
        for pattern, reason in RISKY_COMMAND_PATTERNS:
            if re.search(pattern, command, flags=re.IGNORECASE):
                add(results, "error", "risky-command", mrel, f"{reason} detected in a task command")

    for command in command_like:
        for pattern in SHELL_OPERATOR_PATTERNS:
            if re.search(pattern, command):
                add(results, "error", "shell-operator", mrel, "shell operators are not allowed in task commands or permissions")
        for pattern, reason in PACKAGE_MUTATION_PATTERNS:
            if re.search(pattern, command, flags=re.IGNORECASE):
                add(results, "error", "blocked-command", mrel, f"{reason} is not allowed in task commands or permissions")

    for name, spec in tools.items():
        commands = spec.get("commands") if isinstance(spec, dict) else None
        if commands is not None and not isinstance(commands, list):
            add(results, "error", "manifest-shape", mrel, f"tools.{name}.commands must be a list")
            continue
        for command in sequence(commands):
            if not isinstance(command, str):
                add(results, "error", "manifest-shape", mrel, f"tools.{name}.commands must contain strings")
            elif command.lower() in RESERVED_TOOL_COMMAND_NAMES:
                add(results, "error", "reserved-tool-command", mrel, "`tools.commands` cannot reuse an OpenDock default command")

    for workdir in manifest_task_workdirs(data):
        if workdir not in {"root", "dock"}:
            add(results, "error", "unsupported-workdir", mrel, f"task workdir must be `root` or `dock`, not `{workdir}`")

    for term in STALE_TERMS:
        if term in text:
            add(results, "warning", "stale-term", mrel, f"found stale or discouraged term: {term}")

    return data


def scan_files(root: Path, results: list[dict], parsed_manifests: dict[str, dict]) -> None:
    is_tool_dock = any("tools" in data for data in parsed_manifests.values())
    is_quality_dock = supports_custom_harness(root.name)

    for path in root.rglob("*"):
        path_rel = rel(path, root)
        try:
            lst = path.lstat()
        except OSError as exc:
            add(results, "error", "stat", path_rel, str(exc))
            continue
        if stat.S_ISLNK(lst.st_mode):
            add(results, "error", "symlink", path_rel, "dock payload must not contain symlinks")
            continue
        if path.is_file():
            normalized_rel = path_rel.lower()
            is_custom_harness_payload = (
                normalized_rel.startswith("files/.opendock/harness/")
                or normalized_rel.endswith("/harness.md")
                or "quality-gate" in normalized_rel
                and (
                    normalized_rel.startswith("files/.agents/workflows/")
                    or normalized_rel.startswith("files/.claude/commands/")
                    or normalized_rel.startswith("files/.cursor/")
                )
            )
            if is_custom_harness_payload and not is_quality_dock:
                rule = "tool-dock-custom-harness" if is_tool_dock else "lightweight-dock-custom-harness"
                add(results, "error", rule, path_rel, "custom harness payload is reserved for *-ultrawork and dock-builder")
            if path.parent == root / "files":
                upper_name = path.name.upper()
                if upper_name in {"README.MD", "HARNESS.MD"} or (upper_name.endswith(".MD") and "PLAYBOOK" in upper_name):
                    add(results, "error", "root-user-doc-payload", path_rel, "move user documentation under files/.opendock/docks/<dock-name>/")
            if lst.st_size > MAX_FILE_BYTES:
                add(results, "warning", "large-file", path_rel, f"file is {lst.st_size} bytes")
                continue
            if path.name in MANIFEST_NAMES and lst.st_size > MAX_MANIFEST_BYTES:
                continue
            if path.suffix.lower() in {".md", ".txt", ".json", ".yml", ".yaml", ".mjs", ".js", ".ts", ".tsx", ".sh", ".ps1", ".toml", ".mdc"}:
                text = path.read_text("utf-8", errors="replace")
                for term in STALE_TERMS:
                    if term in text:
                        add(results, "warning", "stale-term", path_rel, f"found stale or discouraged term: {term}")
                if not path_rel.startswith("tests/"):
                    scan_text = security_scan_text(path_rel, text)
                    for pattern, reason in RISKY_COMMAND_PATTERNS:
                        if re.search(pattern, scan_text, flags=re.IGNORECASE):
                            add(results, "error", "risky-text", path_rel, reason)
                    for pattern in PROMPT_INJECTION_PATTERNS:
                        if re.search(pattern, scan_text, flags=re.IGNORECASE):
                            add(results, "error", "prompt-injection", path_rel, "payload contains an instruction-hierarchy or data-exfiltration pattern")


def scan_platform_parity(
    root: Path,
    manifests: list[Path],
    results: list[dict],
    parsed_manifests: dict[str, dict],
) -> None:
    by_name = {manifest.name: manifest for manifest in manifests}
    platform_names = {"dock.macos.yml", "dock.windows.yml"}
    if not platform_names.intersection(by_name):
        return
    missing = sorted(platform_names - by_name.keys())
    for name in missing:
        add(results, "error", "platform-parity", rel(root, root.parent), f"missing platform manifest: {name}")
    if missing:
        return

    if any(name not in parsed_manifests for name in platform_names):
        return

    mac_data = parsed_manifests["dock.macos.yml"]
    win_data = parsed_manifests["dock.windows.yml"]
    mac_metadata = tuple(mac_data.get(key) for key in ("summary", "readme", "logo"))
    win_metadata = tuple(win_data.get(key) for key in ("summary", "readme", "logo"))
    if mac_metadata != win_metadata:
        add(results, "error", "platform-parity", rel(root, root.parent), "macOS and Windows catalog metadata differ")

    def file_pairs(data: dict) -> tuple[tuple[str, str], ...]:
        pairs = []
        for item in sequence(data.get("files")):
            if isinstance(item, dict) and isinstance(item.get("from"), str):
                pairs.append((item["from"], item.get("to") if isinstance(item.get("to"), str) else ""))
        return tuple(sorted(pairs))

    def names(data: dict, section: str) -> tuple[str, ...]:
        return tuple(sorted(mapping(data.get(section)).keys()))

    def list_strings(data: dict, section: str) -> tuple[str, ...]:
        return tuple(sorted(item for item in sequence(data.get(section)) if isinstance(item, str)))

    def task_ids(data: dict, section: str) -> tuple[str, ...]:
        return tuple(sorted(item["id"] for item in sequence(data.get(section)) if isinstance(item, dict) and isinstance(item.get("id"), str)))

    comparisons = [
        ("file mappings", file_pairs(mac_data), file_pairs(win_data)),
        ("tags", list_strings(mac_data, "tags"), list_strings(win_data, "tags")),
        ("tools", names(mac_data, "tools"), names(win_data, "tools")),
        ("dependencies", names(mac_data, "dependencies"), names(win_data, "dependencies")),
        ("doctor ids", task_ids(mac_data, "doctor"), task_ids(win_data, "doctor")),
    ]
    for label, mac_value, win_value in comparisons:
        if mac_value != win_value:
            add(results, "error", "platform-parity", rel(root, root.parent), f"macOS and Windows {label} differ")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an OpenDock dock package folder with Bun's structured YAML parser.")
    parser.add_argument("dock_folder", help="Path to a dock folder containing dock manifests and files/")
    parser.add_argument("--json", action="store_true", help="Print JSON instead of human output")
    args = parser.parse_args()

    root = Path(args.dock_folder).expanduser().resolve()
    results: list[dict] = []

    if not root.exists() or not root.is_dir():
        add(results, "error", "dock-folder", str(root), "dock folder does not exist or is not a directory")
    else:
        manifests = [p for p in root.iterdir() if p.is_file() and p.name in MANIFEST_NAMES]
        if not manifests:
            add(results, "error", "manifest", rel(root, root.parent), "no dock manifest found")
        parsed_manifests: dict[str, dict] = {}
        for manifest in manifests:
            parsed = scan_manifest(root, manifest, results)
            if parsed is not None:
                parsed_manifests[manifest.name] = parsed
        scan_platform_parity(root, manifests, results, parsed_manifests)
        if not (root / "files").exists():
            add(results, "warning", "files-dir", rel(root, root.parent), "missing files/ directory")
        dock_readme = root / "DOCK.md"
        if not dock_readme.exists():
            add(results, "error", "dock-readme", rel(root, root.parent), "missing Korean Registry catalog description DOCK.md")
        else:
            try:
                readme_stat = dock_readme.lstat()
            except OSError as exc:
                add(results, "error", "dock-readme", "DOCK.md", f"could not inspect DOCK.md: {exc}")
            else:
                readme_safe = True
                if stat.S_ISLNK(readme_stat.st_mode) or has_symlink_component(root, dock_readme):
                    add(results, "error", "dock-readme-symlink", "DOCK.md", "DOCK.md must not resolve through a symlink")
                    readme_safe = False
                elif not stat.S_ISREG(readme_stat.st_mode):
                    add(results, "error", "dock-readme-type", "DOCK.md", "DOCK.md must be a regular file")
                    readme_safe = False
                elif readme_stat.st_size > MAX_FILE_BYTES:
                    add(results, "error", "dock-readme-size", "DOCK.md", f"DOCK.md exceeds {MAX_FILE_BYTES} bytes")
                    readme_safe = False
                else:
                    try:
                        dock_readme.resolve(strict=True).relative_to(root)
                    except (OSError, ValueError):
                        add(results, "error", "dock-readme-path", "DOCK.md", "DOCK.md must stay inside the dock package")
                        readme_safe = False
                if readme_safe:
                    dock_text = dock_readme.read_text("utf-8", errors="replace")
                    if not re.search(r"[가-힣]", dock_text):
                        add(results, "error", "dock-readme-language", "DOCK.md", "DOCK.md must be a natural Korean Registry catalog description")
        if not (root / "logo.png").exists():
            add(results, "warning", "logo", rel(root, root.parent), "missing logo.png")
        scan_files(root, results, parsed_manifests)

    summary = {
        "dock_folder": str(root),
        "errors": sum(1 for r in results if r["level"] == "error"),
        "warnings": sum(1 for r in results if r["level"] == "warning"),
        "results": results,
    }

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(f"OpenDock dock package check: {root}")
        print(f"Errors: {summary['errors']}  Warnings: {summary['warnings']}")
        for item in results:
            print(f"- {item['level'].upper()} [{item['rule']}] {item['path']}: {item['detail']}")

    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
