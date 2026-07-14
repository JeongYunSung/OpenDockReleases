#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const title = "OpenDock Dock Builder";
const failures = [];
const requiredFiles = [
  ".opendock/docks/dock-builder/README.md",
  ".opendock/docks/dock-builder/PLAYBOOK.md",
  ".opendock/docks/dock-builder/HARNESS.md",
  ".agents/skills/opendock-dock-builder/SKILL.md",
  ".agents/skills/opendock-dock-builder/references/dock-quality-gates.md",
  ".agents/skills/opendock-dock-builder/references/security-review.md",
  ".agents/skills/opendock-dock-builder/references/test-matrix.md",
  ".agents/skills/opendock-dock-builder/references/release-checklist.md",
  ".agents/skills/opendock-dock-builder/scripts/check_dock_package.py",
  ".opendock/templates/dock-builder/DOCK_REVIEW.md",
  ".opendock/templates/dock-builder/RELEASE_EVIDENCE.md"
];

function fail(rule, file, detail) {
  failures.push({ rule, file, detail });
}

function normalize(file) {
  return path.relative(root, file).split(path.sep).join("/") || ".";
}

function isInsideRoot(file) {
  const relative = path.relative(root, file);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function hasSymlinkComponent(file) {
  if (!isInsideRoot(file)) return true;
  const relative = path.relative(root, file);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) return false;
    if (fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}

function inspectRequiredFile(relative) {
  const file = path.resolve(root, relative);
  if (!isInsideRoot(file) || !fs.existsSync(file)) {
    fail("missing-builder-file", relative, "Required Dock Builder file is missing.");
    return false;
  }
  if (hasSymlinkComponent(file)) {
    fail("builder-file-symlink", relative, "Dock Builder files must not resolve through symlinks.");
    return false;
  }
  let realFile;
  try {
    realFile = fs.realpathSync(file);
  } catch {
    fail("builder-file-realpath", relative, "Required Dock Builder file could not be resolved safely.");
    return false;
  }
  if (!isInsideRoot(realFile)) {
    fail("builder-file-outside-root", relative, "Required Dock Builder file must stay inside the workspace.");
    return false;
  }
  const stat = fs.lstatSync(file);
  if (!stat.isFile()) {
    fail("builder-file-type", relative, "Required Dock Builder path must be a regular file.");
    return false;
  }
  if (stat.size > 2 * 1024 * 1024) {
    fail("builder-file-size", relative, "Required Dock Builder file is unexpectedly large.");
    return false;
  }
  return true;
}

function allDockDirs() {
  const base = path.resolve(root, "docks/opendock");
  if (!fs.existsSync(base) || hasSymlinkComponent(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => path.join(base, entry.name));
}

function parseArguments() {
  const args = process.argv.slice(2);
  const requested = [];
  let release = false;
  for (const arg of args) {
    if (arg === "--release") release = true;
    else if (arg.startsWith("--")) fail("unknown-argument", arg, "Use a Dock folder path or --release.");
    else requested.push(arg);
  }
  return { release, requested };
}

function requestedDockDirs({ release, requested }) {
  if (release && requested.length) {
    fail("argument-conflict", "--release", "Use either explicit Dock folders or --release, not both.");
    return [];
  }
  if (release) return allDockDirs();
  return requested.map((entry) => path.resolve(root, entry));
}

function runPackageChecker(dockDir) {
  const dockLabel = normalize(dockDir);
  if (!isInsideRoot(dockDir) || hasSymlinkComponent(dockDir) || !fs.existsSync(dockDir) || !fs.lstatSync(dockDir).isDirectory()) {
    fail("dock-folder", dockLabel, "Dock folder must be a real directory inside the current workspace.");
    return;
  }

  const checkerRelative = ".agents/skills/opendock-dock-builder/scripts/check_dock_package.py";
  if (!inspectRequiredFile(checkerRelative)) return;
  const checker = path.resolve(root, checkerRelative);
  const python = process.platform === "win32" ? "python" : "python3";
  const result = spawnSync(python, [checker, dockDir, "--json"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.error) {
    fail("package-checker-runtime", dockLabel, "Could not execute the structured package checker.");
    return;
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    fail("package-checker-output", dockLabel, "Structured package checker returned invalid output.");
    return;
  }
  for (const item of report.results ?? []) {
    if (item.level === "error") fail(item.rule ?? "package-check", `${dockLabel}/${item.path ?? ""}`, item.detail ?? "Package check failed.");
  }
  if (result.status !== 0 && !(report.results ?? []).some((item) => item.level === "error")) {
    fail("package-checker-exit", dockLabel, "Structured package checker failed without a usable error report.");
  }
}

const requiredFilesReady = requiredFiles.map(inspectRequiredFile).every(Boolean);
const parsedArguments = parseArguments();
if (requiredFilesReady && failures.length === 0) {
  for (const dockDir of requestedDockDirs(parsedArguments)) runPackageChecker(dockDir);
}

if (failures.length) {
  console.error(`${title} harness failed (${failures.length})`);
  for (const failure of failures.slice(0, 50)) console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
  if (failures.length > 50) console.error(`... ${failures.length - 50} more`);
  process.exit(1);
}

console.log(`${title} harness passed.`);
