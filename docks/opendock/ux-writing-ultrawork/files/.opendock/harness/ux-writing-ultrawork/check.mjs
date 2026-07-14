#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runSlug = "ux-writing";
const maxManifestBytes = 256 * 1024;
const maxTargetBytes = 1024 * 1024;
const maxWalkEntries = 20000;
const maxWalkDepth = 32;
const failures = [];
const activeRunStatuses = new Set(["active", "review", "ready", "ready-for-review", "handoff"]);
const contractFiles = [
  ".opendock/docks/ux-writing-ultrawork/README.md",
  ".opendock/docks/ux-writing-ultrawork/HARNESS.md",
  ".opendock/docks/ux-writing-ultrawork/WRITING.md",
  ".opendock/docks/ux-writing-ultrawork/TERMS.md",
  ".opendock/templates/ux-writing/WRITING_RUN.md",
];
const ignoredSegments = new Set([
  ".git",
  ".opendock",
  ".agents",
  ".claude",
  ".codex",
  ".cursor",
  ".gradle",
  ".next",
  ".turbo",
  ".venv",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "venv",
]);
const sensitiveSegments = new Set([
  ".git",
  ".opendock",
  ".agents",
  ".claude",
  ".codex",
  ".cursor",
  ".ssh",
  "node_modules",
]);
const ignoredRootFiles = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md"]);
const textExtensions = new Set([
  "",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".properties",
  ".ps1",
  ".scss",
  ".sh",
  ".svelte",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
]);
const safetyRules = [
  {
    id: "credential-leak",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|\b(?:gh[opusr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{70,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b/i,
    message: "Target contains an obvious credential or private-key value.",
  },
  {
    id: "prompt-injection",
    pattern: /\b(?:ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|reveal\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message)|bypass\s+(?:human\s+)?approval|exfiltrate\s+(?:credentials|secrets|tokens))\b/i,
    message: "Target contains an obvious instruction-hierarchy bypass or exfiltration request.",
  },
  {
    id: "destructive-command",
    pattern: /\b(?:git\s+(?:reset\s+--hard|clean\s+-[A-Za-z]*f[A-Za-z]*d[A-Za-z]*)|terraform\s+destroy|kubectl\s+delete\s+namespace|drop\s+(?:database|schema)|truncate\s+table)\b|\brm\s+(?:-[^\s]*[rR][^\s]*[fF][^\s]*|--recursive\s+--force|--force\s+--recursive)\b|\b(?:curl|wget)\b[^\n|]{0,300}\|\s*(?:sh|bash|zsh)\b/i,
    message: "Target contains an obvious destructive or remote-pipe shell command.",
  },
];

function addFailure(rule, file, detail) {
  if (failures.some((failure) => failure.rule === rule && failure.file === file)) return;
  failures.push({ rule, file, detail });
}

function normalize(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(2, "0");
    return `\\x${code}`;
  });
}

function pathContainsSymlink(relative) {
  let cursor = root;
  for (const segment of relative.split("/")) {
    cursor = path.join(cursor, segment);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) return true;
  }
  return false;
}

function validateContracts() {
  for (const relative of contractFiles) {
    const full = path.join(root, relative);
    if (!fs.existsSync(full)) {
      addFailure("missing-contract", relative, "Required UX Writing Ultrawork contract file is not installed.");
      continue;
    }
    if (pathContainsSymlink(relative)) {
      addFailure("symlink-contract", relative, "Contract files must not use symlinks.");
      continue;
    }
    const stat = fs.lstatSync(full);
    if (!stat.isFile()) {
      addFailure("invalid-contract", relative, "Contract path must be a regular file.");
    } else if (stat.size > maxTargetBytes) {
      addFailure("contract-too-large", relative, `Contract file exceeds ${maxTargetBytes} bytes.`);
    }
  }
}

function safeRelativeTarget(raw) {
  const value = String(raw ?? "")
    .trim()
    .replace(/^["'\x60]|["'\x60]$/g, "")
    .replaceAll("\\", "/");
  const windowsAbsolute = /^[A-Za-z]:\//.test(value) || value.startsWith("//");
  const parts = value.split("/");
  if (
    !value
    || value.includes("\0")
    || value.includes("://")
    || windowsAbsolute
    || path.isAbsolute(value)
    || parts.includes("..")
  ) {
    addFailure("unsafe-target", value || "(empty)", "Target must be a safe project-relative path.");
    return null;
  }

  const full = path.resolve(root, value);
  const relative = normalize(full);
  if (!relative || relative.startsWith("../") || path.isAbsolute(relative)) {
    addFailure("unsafe-target", value, "Target must stay inside the project.");
    return null;
  }
  if (relative.split("/").some((segment) => sensitiveSegments.has(segment))) {
    addFailure("unsafe-target", relative, "Target points to a managed or sensitive path.");
    return null;
  }
  if (pathContainsSymlink(relative)) {
    addFailure("symlink-target", relative, "Target path must not contain symlinks.");
    return null;
  }
  return relative;
}

function filesForTargets(rawTargets) {
  const files = new Set();
  for (const raw of rawTargets) {
    const relative = safeRelativeTarget(raw);
    if (!relative) continue;
    const full = path.join(root, relative);
    if (!fs.existsSync(full)) {
      addFailure("missing-target", relative, "Target does not exist.");
      continue;
    }
    const stat = fs.lstatSync(full);
    if (!stat.isFile()) {
      addFailure("unsupported-target", relative, "Target must be a regular file.");
      continue;
    }
    files.add(full);
  }
  return [...files];
}

function parseTargetSection(text) {
  const section = text.match(/(?:^|\n)##\s+Target Files\s*\n([\s\S]*?)(?=\n##\s+|$)/i)?.[1];
  if (section === undefined) return null;
  const targets = [];
  for (const line of section.split(/\r?\n/)) {
    const match = line.match(/^\s*[-*]\s+(?:\[[ xX]\]\s*)?(?:\x60([^\x60]+)\x60|(.+?))\s*$/);
    const target = (match?.[1] ?? match?.[2] ?? "").trim();
    if (target && !/^(?:none|n\/a|없음)$/i.test(target)) targets.push(target);
  }
  return targets;
}

function currentRunTargets() {
  const relativeRunRoot = `.opendock/runs/${runSlug}`;
  const fullRunRoot = path.join(root, relativeRunRoot);
  if (!fs.existsSync(fullRunRoot)) return [];
  if (pathContainsSymlink(relativeRunRoot) || !fs.lstatSync(fullRunRoot).isDirectory()) {
    addFailure("invalid-run-root", relativeRunRoot, "Run root must be a real directory, not a symlink.");
    return [];
  }

  const runs = [];
  for (const entry of fs.readdirSync(fullRunRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const relativeManifest = `${relativeRunRoot}/${entry.name}/manifest.md`;
    const manifest = path.join(root, relativeManifest);
    if (!fs.existsSync(manifest)) continue;
    if (pathContainsSymlink(relativeManifest)) {
      addFailure("invalid-run-manifest", relativeManifest, "Run manifest must not use symlinks.");
      continue;
    }
    const stat = fs.lstatSync(manifest);
    if (!stat.isFile()) {
      addFailure("invalid-run-manifest", relativeManifest, "Run manifest must be a regular file.");
      continue;
    }
    if (stat.size > maxManifestBytes) {
      addFailure("run-manifest-too-large", relativeManifest, `Run manifest exceeds ${maxManifestBytes} bytes.`);
      continue;
    }

    const text = fs.readFileSync(manifest, "utf8");
    const status = text.match(/^(?:[-*]\s*)?Status\s*:\s*(.+)$/im)?.[1]?.trim().toLowerCase() ?? "";
    if (!activeRunStatuses.has(status)) continue;
    runs.push({ manifest: relativeManifest, targets: parseTargetSection(text), mtime: stat.mtimeMs });
  }

  runs.sort((a, b) => b.mtime - a.mtime);
  const current = runs[0];
  if (!current) return [];
  if (current.targets === null) {
    addFailure("missing-target-section", current.manifest, "Active run manifest must contain a Target Files section.");
    return [];
  }
  if (current.targets.length === 0) {
    addFailure("empty-target-section", current.manifest, "Active run manifest must name at least one target.");
    return [];
  }
  return current.targets;
}

function walk(dir, depth = 0, state = { entries: 0, stopped: false }) {
  const files = [];
  if (state.stopped || !fs.existsSync(dir)) return files;
  if (depth > maxWalkDepth) {
    addFailure("walk-depth-budget", normalize(dir), `Directory traversal exceeded ${maxWalkDepth} levels.`);
    state.stopped = true;
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    state.entries += 1;
    if (state.entries > maxWalkEntries) {
      addFailure("walk-entry-budget", normalize(full), `Directory traversal exceeded ${maxWalkEntries} entries.`);
      state.stopped = true;
      break;
    }
    if (entry.isDirectory()) files.push(...walk(full, depth + 1, state));
    else if (entry.isFile() && !(dir === root && ignoredRootFiles.has(entry.name))) files.push(full);
    if (state.stopped) break;
  }
  return files;
}

function resolveScope() {
  const args = process.argv.slice(2);
  const explicit = [];
  let release = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--release") release = true;
    else if (arg === "--target") {
      if (index + 1 >= args.length) addFailure("missing-target-argument", "--target", "--target requires a path.");
      else explicit.push(args[++index]);
    } else {
      addFailure("unknown-argument", arg, "Use --target <path> or --release.");
    }
  }
  if (explicit.length > 0 && release) {
    addFailure("conflicting-scope", "--release", "Use explicit targets or release scope, not both.");
    return { mode: "invalid", files: [] };
  }
  if (explicit.length > 0) return { mode: "target", files: filesForTargets(explicit) };
  if (release) return { mode: "release", files: walk(root) };
  const current = currentRunTargets();
  return { mode: current.length > 0 ? "current-run" : "no-active-run", files: filesForTargets(current) };
}

function readTarget(file) {
  const relative = normalize(file);
  try {
    const stat = fs.lstatSync(file);
    if (stat.size > maxTargetBytes) {
      addFailure("file-too-large", relative, `Target exceeds ${maxTargetBytes} bytes.`);
      return null;
    }
    const extension = path.extname(file).toLowerCase();
    const base = path.basename(file);
    if (!textExtensions.has(extension) && !["Dockerfile", "Makefile"].includes(base)) return null;
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) return null;
    return buffer.toString("utf8");
  } catch (error) {
    addFailure("unreadable-target", relative, error instanceof Error ? error.message : "Target could not be read.");
    return null;
  }
}

function run() {
  validateContracts();
  const scope = resolveScope();
  let textFilesScanned = 0;
  for (const file of scope.files) {
    const text = readTarget(file);
    if (text === null) continue;
    textFilesScanned += 1;
    for (const rule of safetyRules) {
      if (rule.pattern.test(text)) addFailure(rule.id, normalize(file), rule.message);
    }
  }

  const printSummary = (writer) => {
    writer("OpenDock harness: UX Writing Ultrawork");
    writer("Checks: installed contracts, run structure, target path safety, symlinks, size bounds, and obvious safety patterns");
    writer(`Scope: ${scope.mode}`);
    writer(`Targets checked: ${scope.files.length}`);
    writer(`Text files scanned: ${textFilesScanned}`);
  };

  if (failures.length > 0) {
    printSummary(console.error);
    console.error(`Failures: ${failures.length}`);
    for (const failure of failures.slice(0, 120)) {
      console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
    }
    if (failures.length > 120) console.error(`... ${failures.length - 120} more failures omitted`);
    process.exit(1);
  }

  printSummary(console.log);
  console.log(scope.mode === "no-active-run" ? "Status: ready (no active run target)" : "Status: passed");
  console.log("Objective harness checks passed. Tone, clarity, naturalness, terminology, recovery wording, and bilingual quality require model review against WRITING.md and TERMS.md.");
}

run();
