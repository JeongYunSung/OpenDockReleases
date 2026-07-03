#!/usr/bin/env python3
import argparse
import json
import os
import re
import stat
import sys
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
MANIFEST_NAMES = {"dock.yml", "dock.yaml", "dock.macos.yml", "dock.windows.yml", "dock.linux.yml"}


def rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def is_safe_project_path(value: str) -> bool:
    if not value or value.startswith("/") or value.startswith("~"):
        return False
    parts = Path(value).parts
    return ".." not in parts


def is_protected_dependency_path(value: str) -> bool:
    first = Path(value).parts[0] if Path(value).parts else ""
    return first in {".opendock", ".git", ".ssh", ".env"} or first.startswith(".env.")


def extract_scalar(text: str, key: str) -> str | None:
    match = re.search(rf"(?m)^\s*{re.escape(key)}\s*:\s*['\"]?([^'\"\n#]+)", text)
    return match.group(1).strip() if match else None


def extract_from_to_pairs(text: str) -> list[tuple[str, str | None]]:
    pairs: list[tuple[str, str | None]] = []
    current_from: str | None = None
    for line in text.splitlines():
        from_match = re.match(r"\s*-\s*from\s*:\s*['\"]?([^'\"\n#]+)", line)
        if from_match:
            if current_from is not None:
                pairs.append((current_from, None))
            current_from = from_match.group(1).strip()
            continue
        to_match = re.match(r"\s*to\s*:\s*['\"]?([^'\"\n#]+)", line)
        if to_match and current_from is not None:
            pairs.append((current_from, to_match.group(1).strip()))
            current_from = None
    if current_from is not None:
        pairs.append((current_from, None))
    return pairs


def strip_yaml_scalar(value: str) -> str:
    return value.strip().strip("'\"").split(" #", 1)[0].strip()


def extract_dependency_specs(text: str) -> dict[str, dict[str, str]]:
    specs: dict[str, dict[str, str]] = {}
    in_dependencies = False
    current_name: str | None = None
    for raw_line in text.splitlines():
        if re.match(r"^dependencies\s*:", raw_line):
            in_dependencies = True
            current_name = None
            continue
        if in_dependencies and re.match(r"^\S", raw_line):
            break
        if not in_dependencies:
            continue

        name_match = re.match(r"\s{2}([A-Za-z0-9._-]+)\s*:\s*(?:#.*)?$", raw_line)
        if name_match:
            current_name = name_match.group(1)
            specs.setdefault(current_name, {})
            continue

        field_match = re.match(r"\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)", raw_line)
        if field_match and current_name is not None:
            specs[current_name][field_match.group(1)] = strip_yaml_scalar(field_match.group(2))
    return specs


def extract_run_lines(text: str) -> list[str]:
    lines = []
    for line in text.splitlines():
        match = re.match(r"\s*run\s*:\s*(.+)", line)
        if match:
            lines.append(match.group(1).strip().strip("'\""))
    return lines


def extract_command_like_lines(text: str) -> list[str]:
    lines: list[str] = []
    in_permissions = False
    for raw_line in text.splitlines():
        if re.match(r"^permissions?\s*:", raw_line):
            in_permissions = True
            continue
        if re.match(r"^\S", raw_line) and not re.match(r"^permissions?\s*:", raw_line):
            in_permissions = False

        command_match = re.match(r"\s*(run|check)\s*:\s*(.+)", raw_line)
        if command_match:
            lines.append(command_match.group(2).strip().strip("'\""))
            continue

        if in_permissions:
            permission_match = re.match(r"\s*-\s*(.+)", raw_line)
            if permission_match:
                lines.append(permission_match.group(1).strip().strip("'\""))
    return lines


def has_nested_requires_field(text: str, key: str) -> bool:
    in_requires = False
    for raw_line in text.splitlines():
        if re.match(r"^requires\s*:", raw_line):
            in_requires = True
            continue
        if in_requires and re.match(r"^\S", raw_line):
            in_requires = False
        if in_requires and re.match(rf"^\s{{2}}{re.escape(key)}\s*:", raw_line):
            return True
    return False


def extract_tool_commands(text: str) -> list[str]:
    commands: list[str] = []
    lines = text.splitlines()
    for index, raw_line in enumerate(lines):
        if not re.match(r"^\s{4}commands\s*:", raw_line):
            continue
        for command_line in lines[index + 1 :]:
            if re.match(r"^\s{0,4}\S", command_line):
                break
            match = re.match(r"\s{6,}-\s*['\"]?([^'\"\n#]+)", command_line)
            if match:
                commands.append(match.group(1).strip())
    return commands


def extract_task_workdirs(text: str) -> list[str]:
    workdirs: list[str] = []
    for raw_line in text.splitlines():
        match = re.match(r"\s{4,}workdir\s*:\s*['\"]?([^'\"\n#]+)", raw_line)
        if match:
            workdirs.append(match.group(1).strip())
    return workdirs


def add(results: list[dict], level: str, rule: str, path: str, detail: str) -> None:
    results.append({"level": level, "rule": rule, "path": path, "detail": detail})


def scan_manifest(root: Path, manifest: Path, results: list[dict]) -> None:
    text = manifest.read_text("utf-8", errors="replace")
    mrel = rel(manifest, root)

    if not re.search(r"(?m)^opendock\s*:\s*1\s*$", text):
        add(results, "error", "manifest-version", mrel, "manifest must declare `opendock: 1`")

    for field in UNSUPPORTED_TOP_LEVEL_FIELDS:
        if re.search(rf"(?m)^{re.escape(field)}\s*:", text):
            add(
                results,
                "error",
                "unsupported-manifest-field",
                mrel,
                f"`{field}` is not part of current dock.yml; use deploy/install reference or current top-level fields",
            )

    if re.search(r"(?m)^commands\s*:", text):
        add(results, "error", "unsupported-commands-field", mrel, "top-level `commands` is not supported; use `tools.<name>.commands`")

    if re.search(r"(?m)^\s*bin\s*:", text):
        add(results, "error", "unsupported-tool-bin", mrel, "use `tools.<name>.commands`, not `bin`")

    for key in ["packages", "tools"]:
        if has_nested_requires_field(text, key):
            add(results, "error", "unsupported-requires-field", mrel, f"`requires.{key}` is not supported; use `requires.runtimes` or top-level `tools`")

    if re.search(r"(?m)^\s{4,}update\s*:", text):
        add(results, "error", "unsupported-file-update", mrel, "`files[].update` is not supported in the current spec")

    for key in ["readme", "logo"]:
        value = extract_scalar(text, key)
        if value and not (manifest.parent / value).exists():
            add(results, "error", f"manifest-{key}", mrel, f"{key} target does not exist: {value}")

    if "tags:" not in text:
        add(results, "warning", "manifest-tags", mrel, "missing tags; catalog discovery may be weaker")

    file_pairs = extract_from_to_pairs(text)
    file_targets = {target for _, target in file_pairs if target}
    file_target_sources = {target: source for source, target in file_pairs if target}

    for source, target in file_pairs:
        if not is_safe_project_path(source):
            add(results, "error", "unsafe-from", mrel, f"unsafe source path: {source}")
        elif not (manifest.parent / source).exists():
            add(results, "error", "missing-from", mrel, f"files.from does not exist: {source}")
        if target is None:
            add(results, "error", "missing-to", mrel, f"files.from has no matching to: {source}")
        elif not is_safe_project_path(target):
            add(results, "error", "unsafe-to", mrel, f"unsafe target path: {target}")
        if target and target in {".opendock/harness/check.js", ".opendock/harness/check.mjs", ".opendock/harness/check.sh"}:
            add(results, "error", "shared-harness-path", mrel, f"use a dock-specific harness directory, not {target}")

    for name, spec in extract_dependency_specs(text).items():
        manager = spec.get("manager")
        path = spec.get("path")
        mode = spec.get("mode")
        if not manager:
            add(results, "error", "dependency-manager", mrel, f"dependencies.{name} is missing manager")
            continue
        if manager not in DEPENDENCY_MODES_BY_MANAGER:
            add(results, "error", "dependency-manager", mrel, f"dependencies.{name} uses unsupported manager: {manager}")
            continue
        effective_mode = mode or ("sync" if manager == "uv" else "install")
        if effective_mode not in DEPENDENCY_MODES_BY_MANAGER[manager]:
            add(results, "error", "dependency-mode", mrel, f"dependencies.{name} manager `{manager}` does not support mode `{effective_mode}`")
        if not path:
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

    for command in extract_run_lines(text):
        for pattern, reason in RISKY_COMMAND_PATTERNS:
            if re.search(pattern, command, flags=re.IGNORECASE):
                add(results, "error", "risky-command", mrel, f"{reason}: {command}")

    for command in extract_command_like_lines(text):
        for pattern in SHELL_OPERATOR_PATTERNS:
            if re.search(pattern, command):
                add(results, "error", "shell-operator", mrel, f"shell operators are not allowed in task commands or permissions: {command}")
        for pattern, reason in PACKAGE_MUTATION_PATTERNS:
            if re.search(pattern, command, flags=re.IGNORECASE):
                add(results, "error", "blocked-command", mrel, f"{reason} is not allowed in task commands or permissions: {command}")

    for command in extract_tool_commands(text):
        if command.lower() in RESERVED_TOOL_COMMAND_NAMES:
            add(results, "error", "reserved-tool-command", mrel, f"`tools.commands` cannot reuse OpenDock default command: {command}")

    for workdir in extract_task_workdirs(text):
        if workdir not in {"root", "dock"}:
            add(results, "error", "unsupported-workdir", mrel, f"task workdir must be `root` or `dock`, not `{workdir}`")

    for term in STALE_TERMS:
        if term in text:
            add(results, "warning", "stale-term", mrel, f"found stale or discouraged term: {term}")


def scan_files(root: Path, results: list[dict]) -> None:
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
            if lst.st_size > MAX_FILE_BYTES:
                add(results, "warning", "large-file", path_rel, f"file is {lst.st_size} bytes")
            if (
                path_rel == "files/DOCK_BUILDER.md"
                or path_rel.startswith("files/.agents/skills/opendock-dock-builder/")
                or path_rel.startswith("files/.opendock/harness/opendock__dock-builder/")
            ):
                continue
            if path.suffix.lower() in {".md", ".txt", ".json", ".yml", ".yaml", ".mjs", ".js", ".ts", ".tsx", ".sh", ".ps1", ".toml", ".mdc"}:
                text = path.read_text("utf-8", errors="replace")
                for term in STALE_TERMS:
                    if term in text:
                        add(results, "warning", "stale-term", path_rel, f"found stale or discouraged term: {term}")
                for pattern, reason in RISKY_COMMAND_PATTERNS:
                    if re.search(pattern, text, flags=re.IGNORECASE):
                        add(results, "warning", "risky-text", path_rel, reason)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an OpenDock dock package folder without external dependencies.")
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
        for manifest in manifests:
            scan_manifest(root, manifest, results)
        if not (root / "files").exists():
            add(results, "warning", "files-dir", rel(root, root.parent), "missing files/ directory")
        if not (root / "DOCK.md").exists():
            add(results, "warning", "dock-readme", rel(root, root.parent), "missing DOCK.md")
        if not (root / "logo.png").exists():
            add(results, "warning", "logo", rel(root, root.parent), "missing logo.png")
        scan_files(root, results)

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
