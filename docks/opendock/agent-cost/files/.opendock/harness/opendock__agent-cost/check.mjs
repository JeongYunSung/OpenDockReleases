#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Agent Cost";
const focus = "workspace-local agent usage and cost tracking";
const requiredFiles = ["COST.md", "HARNESS.md"];
const optionalDirs = [".opendock/cost", ".opendock/runs/agent-cost"];
const failures = [];

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function walk(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const next = path.join(full, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel(next)));
    else if (entry.isFile()) out.push(next);
  }
  return out;
}

for (const file of requiredFiles) {
  if (!exists(file)) failures.push({ rule: "missing-required-file", file, detail: `${file} is required.` });
}

const files = [
  ...requiredFiles.filter(exists).map((file) => path.join(root, file)),
  ...optionalDirs.flatMap(walk),
].filter((file) => /\.(md|txt|json|ya?ml)$/i.test(file));

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const name = rel(file);
  if (/[ \t]+$/m.test(text)) failures.push({ rule: "trailing-whitespace", file: name, detail: "Remove trailing whitespace." });
  if (/^\t+/m.test(text)) failures.push({ rule: "tab-indentation", file: name, detail: "Use spaces for indentation." });
  if (optionalDirs.some((dir) => name.startsWith(`${dir}/`))) {
    if (/\b(api[_ -]?key|access[_ -]?token|invoice|payment|card)\b\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{8,}/i.test(text)) {
      failures.push({ rule: "sensitive-billing-data", file: name, detail: "Do not store keys, invoice originals, or payment details." });
    }
    if (/\b(cost|budget|usage|token|model)\b/i.test(text) && !/\b(provider|model|task|owner|date|source|estimate|reason)\b/i.test(text)) {
      failures.push({ rule: "cost-entry-incomplete", file: name, detail: "Cost notes need provider/model/task/owner/date/source or estimate context." });
    }
  }
}

if (failures.length) {
  console.error(`OpenDock harness: ${title}`);
  console.error(`Focus: ${focus}`);
  console.error(`Files scanned: ${files.length}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
  process.exit(1);
}

console.log(`OpenDock harness: ${title}`);
console.log(`Focus: ${focus}`);
console.log(`Files scanned: ${files.length}`);
console.log("Capability check passed.");
