#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Figma Ultrawork";
const focus = "Figma MCP procedural gate presence, DESIGN.md alignment, and canvas review readiness";
const runRoot = ".opendock/runs/figma";
const maxTextFileBytes = 1024 * 1024;
const failures = [];

const requiredFiles = [
  "DESIGN.md",
  "HARNESS.md",
  ".agents/skills/opendock-figma-ultrawork/SKILL.md",
  ".agents/workflows/opendock-figma-ultrawork/quality-gate.md",
  ".claude/commands/opendock-figma-ultrawork/quality-gate.md",
  ".cursor/rules/opendock-figma-ultrawork.mdc",
];

const requiredHarnessPhrases = [
  "Figma Ultrawork Harness",
  "official Figma MCP",
  "node-specific Figma URL",
  "DESIGN.md",
  "Text layers must not overflow",
  "Frame bounds should be integer-aligned",
  "Auto Layout",
  "focus and disabled states",
  "Apply fixes through Figma MCP only when the user explicitly asks for edits or approves the proposed change list",
  "Keep Figma MCP read-only unless the user requests edits or approves the proposed change list",
];

const requiredSkillPhrases = [
  "official Figma MCP",
  "node-specific Figma URL",
  "Do not ask the user for separate Figma credentials",
  "Figma text layers must not overflow",
  "Figma frames should be integer-aligned",
  "Component-like frames should use Auto Layout",
  "Apply fixes through Figma MCP only when the user explicitly asks for edits or approves the proposed change list",
  "Keep Figma MCP read-only unless the user requests edits or approves the proposed change list",
];

function read(rel) {
  try {
    const full = path.join(root, rel);
    const stats = fs.statSync(full);
    if (stats.size > maxTextFileBytes) {
      failures.push({
        rule: "file-too-large",
        file: rel,
        detail: `File exceeds ${maxTextFileBytes} bytes and was not scanned.`,
      });
      return "";
    }
    return fs.readFileSync(full, "utf8");
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function parseField(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^${escaped}\\s*:\\s*(.+)$`, "im"));
  return match ? match[1].trim() : "";
}

function fileMtime(rel) {
  try {
    return fs.statSync(path.join(root, rel)).mtimeMs;
  } catch {
    return 0;
  }
}

function findRunDocuments() {
  const docs = [];
  const fullRunRoot = path.join(root, runRoot);
  if (!fs.existsSync(fullRunRoot)) return docs;

  for (const entry of fs.readdirSync(fullRunRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const runRel = `${runRoot}/${entry.name}`;
    const manifestRel = `${runRel}/manifest.md`;
    if (!exists(manifestRel)) continue;
    const text = read(manifestRel);
    docs.push({
      label: runRel,
      manifestRel,
      manifestText: text,
      status: parseField(text, "Status").toLowerCase(),
      mtime: fileMtime(manifestRel),
    });
  }

  return docs.sort((a, b) => b.mtime - a.mtime || b.label.localeCompare(a.label));
}

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(2, "0");
    return `\\x${code}`;
  });
}

function hasManagedBlock(text) {
  return /OPENDOCK:START[\s\S]*dock=opendock\/figma-ultrawork[\s\S]*OPENDOCK:END/.test(text);
}

for (const file of requiredFiles) {
  if (!exists(file)) failures.push({ rule: "missing-file", file, detail: "Figma Ultrawork presence gate requires this file." });
}

const harness = read("HARNESS.md");
if (!hasManagedBlock(harness)) {
  failures.push({ rule: "missing-harness-block", file: "HARNESS.md", detail: "HARNESS.md needs an opendock/figma-ultrawork managed block." });
}
for (const phrase of requiredHarnessPhrases) {
  if (!harness.includes(phrase)) {
    failures.push({ rule: "harness-contract", file: "HARNESS.md", detail: `Figma harness must mention: ${phrase}` });
  }
}

const skill = read(".agents/skills/opendock-figma-ultrawork/SKILL.md");
for (const phrase of requiredSkillPhrases) {
  if (!skill.includes(phrase)) {
    failures.push({ rule: "skill-contract", file: ".agents/skills/opendock-figma-ultrawork/SKILL.md", detail: `Figma skill must mention: ${phrase}` });
  }
}

const workflow = read(".agents/workflows/opendock-figma-ultrawork/quality-gate.md");
if (!workflow.includes("Report what passed, what failed, and what was not tested")) {
  failures.push({ rule: "workflow-reporting", file: ".agents/workflows/opendock-figma-ultrawork/quality-gate.md", detail: "Workflow must require final tested/not-tested reporting." });
}

const lock = read(".opendock/dock.lock.yml");
if (!lock.includes("id: opendock/figma-ultrawork")) {
  failures.push({ rule: "lock-entry", file: ".opendock/dock.lock.yml", detail: "dock.lock.yml should include opendock/figma-ultrawork." });
}

const activeStatuses = new Set(["active", "review", "ready", "ready-for-review", "handoff"]);
const inactiveStatuses = new Set(["draft", "none", "paused", "backlog"]);
const runs = findRunDocuments();
const activeRun = runs.find((run) => activeStatuses.has(run.status)) ?? runs[0];

if (activeRun) {
  const isActive = activeStatuses.has(activeRun.status) || !inactiveStatuses.has(activeRun.status);
  const text = activeRun.manifestText;
  const url = parseField(text, "Figma URL") || parseField(text, "URL");
  const node = parseField(text, "Node ID") || parseField(text, "Node");
  if (isActive) {
    if (!/figma\.com\/design\//i.test(url)) {
      failures.push({ rule: "figma-url", file: activeRun.manifestRel, detail: "Active Figma run must include a node-specific Figma design URL." });
    }
    if (!/(node-id=|node id:|Node ID:)/i.test(text) && !node) {
      failures.push({ rule: "figma-node-id", file: activeRun.manifestRel, detail: "Active Figma run must include a node id." });
    }
    for (const section of ["DESIGN.md Alignment", "MCP Evidence", "Findings", "Review"]) {
      if (!new RegExp(`^#{1,6}\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im").test(text)) {
        failures.push({ rule: "figma-run-section", file: activeRun.manifestRel, detail: `Missing run manifest section: ${section}` });
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`OpenDock harness: ${title}`);
  console.error(`Focus: ${focus}`);
  console.error(`Scope: ${activeRun ? activeRun.label : "none"}`);
  console.error(`Files checked: ${requiredFiles.length}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
  process.exit(1);
}

console.log(`OpenDock harness: ${title}`);
console.log(`Focus: ${focus}`);
console.log(`Scope: ${activeRun ? activeRun.label : "none"}`);
console.log(`Files checked: ${requiredFiles.length}`);
if (!activeRun) console.log("No active Figma run detected.");
console.log("Figma MCP canvas inspection still requires a node-specific Figma URL.");
console.log("Ultrawork passed.");
