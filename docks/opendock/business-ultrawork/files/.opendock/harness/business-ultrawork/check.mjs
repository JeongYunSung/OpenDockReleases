#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runSlug = "business-ultrawork";
const maxManifestBytes = 256 * 1024;
const maxTextFileBytes = 1024 * 1024;
const maxWalkEntries = 20000;
const maxWalkDepth = 32;
const failures = [];
const activeRunStatuses = new Set(["active", "review", "ready", "ready-for-review", "handoff"]);
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
  ".dart",
  ".dbt",
  ".html",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".kt",
  ".kts",
  ".md",
  ".mdx",
  ".plist",
  ".properties",
  ".ps1",
  ".py",
  ".scss",
  ".sh",
  ".sql",
  ".tf",
  ".tfvars",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);
const safetyRules = [
  {
    id: "credential-leak",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|\b(?:gh[opusr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{70,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})\b/i,
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

function safeRelativeTarget(raw) {
  const value = String(raw ?? "")
    .trim()
    .replace(/^["'\x60]|["'\x60]$/g, "")
    .replaceAll("\\", "/");
  const parts = value.split("/");
  const windowsAbsolute = /^[A-Za-z]:\//.test(value) || value.startsWith("//");
  if (!value || value.includes("\0") || windowsAbsolute || path.isAbsolute(value) || parts.includes("..")) {
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

  let cursor = root;
  for (const segment of relative.split("/")) {
    cursor = path.join(cursor, segment);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) {
      addFailure("unsafe-target", relative, "Target path must not contain symlinks.");
      return null;
    }
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
    if (stat.isDirectory()) {
      for (const nested of walk(full)) files.add(nested);
    } else if (stat.isFile()) {
      files.add(full);
    } else {
      addFailure("unsupported-target", relative, "Target must be a regular file or directory.");
    }
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

function manifestTargets() {
  const runRoot = path.join(root, ".opendock", "runs", runSlug);
  if (!fs.existsSync(runRoot)) return [];
  if (!fs.statSync(runRoot).isDirectory()) {
    addFailure("invalid-run-root", `.opendock/runs/${runSlug}`, "Run root must be a directory.");
    return [];
  }

  const runs = [];
  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const relativeManifest = `.opendock/runs/${runSlug}/${entry.name}/manifest.md`;
    const manifest = path.join(root, relativeManifest);
    if (!fs.existsSync(manifest)) continue;
    const stat = fs.lstatSync(manifest);
    if (!stat.isFile() || stat.isSymbolicLink()) continue;
    if (stat.size > maxManifestBytes) {
      const descriptor = fs.openSync(manifest, "r");
      const prefixBuffer = Buffer.alloc(Math.min(stat.size, 8192));
      fs.readSync(descriptor, prefixBuffer, 0, prefixBuffer.length, 0);
      fs.closeSync(descriptor);
      const prefix = prefixBuffer.toString("utf8");
      const status = prefix.match(/^(?:[-*]\s*)?Status\s*:\s*(.+)$/im)?.[1]?.trim().toLowerCase() ?? "";
      if (status && !activeRunStatuses.has(status)) continue;
      addFailure("run-manifest-too-large", relativeManifest, `Run manifest exceeds ${maxManifestBytes} bytes.`);
      continue;
    }

    const text = fs.readFileSync(manifest, "utf8");
    const status = text.match(/^(?:[-*]\s*)?Status\s*:\s*(.+)$/im)?.[1]?.trim().toLowerCase() ?? "";
    const targets = parseTargetSection(text);
    const active = activeRunStatuses.has(status) || (!status && (targets?.length ?? 0) > 0);
    if (!active) continue;
    if (targets === null) {
      addFailure("missing-target-section", relativeManifest, "Active run manifest must contain a Target Files section.");
      continue;
    }
    if (targets.length === 0) {
      addFailure("empty-target-section", relativeManifest, "Active run manifest must name at least one target.");
      continue;
    }
    runs.push({ targets, mtime: stat.mtimeMs });
  }
  runs.sort((a, b) => b.mtime - a.mtime);
  return runs[0]?.targets ?? [];
}

function resolveScope() {
  const args = process.argv.slice(2);
  const explicit = [];
  let release = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--release" || arg === "--all") release = true;
    else if (arg === "--target") {
      if (index + 1 >= args.length) addFailure("missing-target-argument", "--target", "--target requires a path.");
      else explicit.push(args[++index]);
    } else if (arg.startsWith("--")) {
      addFailure("unknown-argument", arg, "Use --target <path> or --release.");
    } else {
      explicit.push(arg);
    }
  }
  if (release && explicit.length > 0) {
    addFailure("conflicting-scope", "--release", "Use explicit targets or release scope, not both.");
    return { mode: "invalid", files: [] };
  }
  if (explicit.length > 0) return { mode: "target", files: filesForTargets(explicit) };
  if (release) return { mode: "release", files: walk(root) };
  const current = manifestTargets();
  if (current.length > 0) return { mode: "run-manifest", files: filesForTargets(current) };
  return { mode: "current-task", files: [] };
}

function readText(file) {
  const extension = path.extname(file).toLowerCase();
  const base = path.basename(file);
  if (!textExtensions.has(extension) && !["Dockerfile", "Makefile"].includes(base)) return null;
  const relative = normalize(file);
  try {
    const stat = fs.statSync(file);
    if (stat.size > maxTextFileBytes) {
      addFailure("file-too-large", relative, `Text target exceeds ${maxTextFileBytes} bytes.`);
      return null;
    }
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) return null;
    return buffer.toString("utf8");
  } catch (error) {
    addFailure("unreadable-target", relative, error instanceof Error ? error.message : "Target could not be read.");
    return null;
  }
}

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(2, "0");
    return `\\x${code}`;
  });
}

function run() {
  const scope = resolveScope();
  const files = scope.files
    .map((full) => ({ rel: normalize(full), text: readText(full) }))
    .filter((file) => file.text !== null);

  for (const file of files) {
    for (const rule of safetyRules) {
      if (rule.pattern.test(file.text)) addFailure(rule.id, file.rel, rule.message);
    }
  }

  const printSummary = (writer) => {
    writer("OpenDock harness: Business Ultrawork");
    writer("Checks: target scope, path safety, existence, size bounds, and obvious safety patterns");
    writer(`Scope: ${scope.mode}`);
    writer(`Files scanned: ${files.length}`);
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
  if (files.length === 0) console.log("Status: ready (no active targets)");
  console.log("Objective harness checks passed. Semantic business quality requires model review.");
}

run();
