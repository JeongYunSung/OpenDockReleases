#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Figma Ultrawork";
const focus = "Figma MCP procedural gate presence, DESIGN.md alignment, and canvas review readiness";
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

if (failures.length > 0) {
  console.error(`OpenDock harness: ${title}`);
  console.error(`Focus: ${focus}`);
  console.error(`Files checked: ${requiredFiles.length}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
  process.exit(1);
}

console.log(`OpenDock harness: ${title}`);
console.log(`Focus: ${focus}`);
console.log(`Files checked: ${requiredFiles.length}`);
console.log("Figma MCP canvas inspection still requires a node-specific Figma URL.");
console.log("Ultrawork passed.");
