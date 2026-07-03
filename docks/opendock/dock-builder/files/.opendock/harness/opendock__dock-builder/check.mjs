#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "OpenDock Dock Builder";
const failures = [];

const requiredFiles = [
  "DOCK_BUILDER.md",
  "HARNESS.md",
  ".agents/skills/opendock-dock-builder/SKILL.md",
  ".agents/skills/opendock-dock-builder/references/dock-quality-gates.md",
  ".agents/skills/opendock-dock-builder/references/security-review.md",
  ".agents/skills/opendock-dock-builder/references/test-matrix.md",
  ".agents/skills/opendock-dock-builder/references/release-checklist.md",
  ".agents/skills/opendock-dock-builder/scripts/check_dock_package.py",
  ".opendock/templates/dock-builder/DOCK_REVIEW.md",
  ".opendock/templates/dock-builder/RELEASE_EVIDENCE.md"
];

const riskyCommandPatterns = [
  [/\bcurl\b[^|\n]*\|\s*(sh|bash|zsh)/i, "remote shell bootstrap"],
  [/\bwget\b[^|\n]*\|\s*(sh|bash|zsh)/i, "remote shell bootstrap"],
  [/\beval\s+\$?\(/i, "eval command substitution"],
  [/\brm\s+-rf\s+(\/|~|\$HOME|\.)/i, "destructive rm"],
  [/\bsudo\b/i, "privilege escalation"],
  [/\bchmod\s+777\b/i, "world-writable permission"],
  [/\blaunchctl\b|\bcrontab\b|LaunchAgent|LoginItem/i, "persistence mechanism"]
];

const staleTerms = ["verify-hook", "opendock run", ".opendock/hanress", ".opendock/toolchains"];
const unsupportedTopLevelFields = [
  "id",
  "schema",
  "kind",
  "version",
  "lifecycle",
  "needs",
  "supports",
  "uninstall"
];
const shellOperatorPatterns = [
  /\|\|?|\&\&|;/,
  /`/,
  /\$\(/,
  />|</
];
const packageMutationPatterns = [
  [/\b(?:npm|pnpm)\s+(?:add|install|update|upgrade)\b/i, "package manager mutation"],
  [/\bbun\s+(?:add|install|update|upgrade)\b/i, "package manager mutation"],
  [/\bpip3?\s+install\b/i, "package manager mutation"],
  [/\bpipx\s+(?:install|upgrade)\b/i, "package manager mutation"],
  [/\buv\s+tool\s+(?:install|upgrade)\b/i, "package manager mutation"],
  [/\b(?:brew|winget)\s+(?:install|upgrade)\b/i, "host package manager mutation"],
  [/\b(?:npx|bunx)\b/i, "untracked package runner"]
];
const reservedToolCommandNames = new Set([
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
  "winget"
]);

function resolve(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(resolve(rel));
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function fail(rule, file, detail) {
  failures.push({ rule, file, detail });
}

function isSafeProjectPath(value) {
  if (!value || value.startsWith("/") || value.startsWith("~")) return false;
  return !value.split(/[\\/]+/).includes("..");
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function findManifestFiles() {
  const base = resolve("docks/opendock");
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const dockName of fs.readdirSync(base)) {
    const dockDir = path.join(base, dockName);
    if (!fs.statSync(dockDir).isDirectory()) continue;
    for (const file of fs.readdirSync(dockDir)) {
      if (/^dock(\.(macos|windows|linux))?\.ya?ml$/i.test(file)) out.push(path.join(dockDir, file));
    }
  }
  return out;
}

function extractFromToPairs(text) {
  const pairs = [];
  let currentFrom = null;
  for (const line of text.split("\n")) {
    const from = line.match(/^\s*-\s*from\s*:\s*['"]?([^'"\n#]+)/);
    if (from) {
      if (currentFrom) pairs.push([currentFrom, null]);
      currentFrom = from[1].trim();
      continue;
    }
    const to = line.match(/^\s*to\s*:\s*['"]?([^'"\n#]+)/);
    if (to && currentFrom) {
      pairs.push([currentFrom, to[1].trim()]);
      currentFrom = null;
    }
  }
  if (currentFrom) pairs.push([currentFrom, null]);
  return pairs;
}

function extractRunLines(text) {
  return text
    .split("\n")
    .map((line) => line.match(/^\s*run\s*:\s*(.+)$/)?.[1]?.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function extractCommandLikeLines(text) {
  const lines = [];
  let inPermissions = false;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (/^permissions?\s*:/.test(rawLine)) {
      inPermissions = true;
      continue;
    }
    if (/^\S/.test(rawLine) && !/^permissions?\s*:/.test(rawLine)) {
      inPermissions = false;
    }
    const inline = rawLine.match(/^\s*(?:run|check)\s*:\s*(.+)$/);
    if (inline) {
      lines.push(inline[1].trim().replace(/^['"]|['"]$/g, ""));
      continue;
    }
    if (inPermissions) {
      const permission = rawLine.match(/^\s*-\s*(.+)$/);
      if (permission) lines.push(permission[1].trim().replace(/^['"]|['"]$/g, ""));
    }
  }
  return lines;
}

function hasNestedRequiresField(text, key) {
  const lines = text.split("\n");
  let inRequires = false;
  for (const rawLine of lines) {
    if (/^requires\s*:/.test(rawLine)) {
      inRequires = true;
      continue;
    }
    if (inRequires && /^\S/.test(rawLine)) {
      inRequires = false;
    }
    if (inRequires && new RegExp(`^\\s{2}${key}\\s*:`).test(rawLine)) {
      return true;
    }
  }
  return false;
}

function extractToolCommands(text) {
  const commands = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\s{4}commands\s*:/.test(lines[index])) continue;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      if (/^\s{0,4}\S/.test(line)) break;
      const command = line.match(/^\s{6,}-\s*['"]?([^'"\n#]+)/)?.[1]?.trim();
      if (command) commands.push(command);
    }
  }
  return commands;
}

function extractTaskWorkdirs(text) {
  return text
    .split("\n")
    .map((line) => line.match(/^\s{4,}workdir\s*:\s*['"]?([^'"\n#]+)/)?.[1]?.trim())
    .filter(Boolean);
}

for (const file of requiredFiles) {
  if (!exists(file)) fail("missing-required-file", file, `${file} is required.`);
}

for (const file of requiredFiles.filter(exists)) {
  const text = readText(resolve(file));
  if (/[ \t]+$/m.test(text)) fail("trailing-whitespace", file, "Remove trailing whitespace.");
  if (/^\t+/m.test(text)) fail("tab-indentation", file, "Use spaces for indentation.");
}

for (const manifest of findManifestFiles()) {
  const text = readText(manifest);
  const manifestRel = rel(manifest);
  const dockDir = path.dirname(manifest);

  if (!/^\s*opendock\s*:\s*1\s*$/m.test(text)) {
    fail("manifest-version", manifestRel, "Manifest must declare opendock: 1.");
  }

  for (const field of unsupportedTopLevelFields) {
    if (new RegExp(`^${field}\\s*:`, "m").test(text)) {
      fail("unsupported-manifest-field", manifestRel, `Remove top-level ${field}; current spec derives identity/version from the OpenDock command reference.`);
    }
  }

  if (/^commands\s*:/m.test(text)) {
    fail("unsupported-commands-field", manifestRel, "Top-level commands is not supported; use tools.<name>.commands.");
  }

  if (/^\s*bin\s*:/m.test(text)) {
    fail("unsupported-tool-bin", manifestRel, "Use tools.<name>.commands, not bin.");
  }

  for (const key of ["packages", "tools"]) {
    if (hasNestedRequiresField(text, key)) {
      fail("unsupported-requires-field", manifestRel, `requires.${key} is not supported; use requires.runtimes or top-level tools.`);
    }
  }

  if (/^\s{4,}update\s*:/m.test(text)) {
    fail("unsupported-file-update", manifestRel, "files[].update is not supported in the current spec.");
  }

  if (!/^\s*tags\s*:/m.test(text)) {
    fail("manifest-tags", manifestRel, "Manifest should include tags for catalog discovery.");
  }

  for (const [source, target] of extractFromToPairs(text)) {
    if (!isSafeProjectPath(source)) fail("unsafe-from", manifestRel, `Unsafe files.from path: ${source}`);
    else if (!fs.existsSync(path.join(dockDir, source))) fail("missing-from", manifestRel, `files.from does not exist: ${source}`);

    if (!target) fail("missing-to", manifestRel, `files.from has no matching to: ${source}`);
    else if (!isSafeProjectPath(target)) fail("unsafe-to", manifestRel, `Unsafe files.to path: ${target}`);
    else if (/^\.opendock\/harness\/check\.(js|mjs|sh|ps1)$/i.test(target)) {
      fail("shared-harness-path", manifestRel, `Use a dock-specific harness path: ${target}`);
    }
  }

  for (const command of extractRunLines(text)) {
    for (const [pattern, reason] of riskyCommandPatterns) {
      if (pattern.test(command)) fail("risky-command", manifestRel, `${reason}: ${command}`);
    }
  }

  for (const command of extractCommandLikeLines(text)) {
    for (const pattern of shellOperatorPatterns) {
      if (pattern.test(command)) fail("shell-operator", manifestRel, `Shell operators are not allowed in task commands or permissions: ${command}`);
    }
    for (const [pattern, reason] of packageMutationPatterns) {
      if (pattern.test(command)) fail("blocked-command", manifestRel, `${reason} is not allowed in task commands or permissions: ${command}`);
    }
  }

  for (const command of extractToolCommands(text)) {
    if (reservedToolCommandNames.has(command.toLowerCase())) {
      fail("reserved-tool-command", manifestRel, `tools.commands cannot reuse OpenDock default command: ${command}`);
    }
  }

  for (const workdir of extractTaskWorkdirs(text)) {
    if (!["root", "dock"].includes(workdir)) {
      fail("unsupported-workdir", manifestRel, `Task workdir must be root or dock, not ${workdir}`);
    }
  }

  for (const term of staleTerms) {
    if (text.includes(term)) fail("stale-term", manifestRel, `Remove stale OpenDock term: ${term}`);
  }
}

if (failures.length) {
  console.error(`OpenDock harness: ${title}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
  process.exit(1);
}

console.log(`OpenDock harness: ${title}`);
console.log(`Required files: ${requiredFiles.length}`);
console.log(`Dock manifests scanned: ${findManifestFiles().length}`);
console.log("Dock builder check passed.");
