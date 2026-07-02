#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Agent Security";
const focus = "workspace-local security review quality";
const requiredFiles = ["SECURITY.md", "HARNESS.md"];
const optionalDirs = [".opendock/security", ".opendock/runs/agent-security"];
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
    if (/\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|private[_ -]?key)\b\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{12,}/i.test(text)) {
      failures.push({ rule: "secret-leak", file: name, detail: "Security notes must not contain real-looking secrets." });
    }
    if (/\b(auth|permission|admin|credential|token|webhook|registry|deploy|mcp)\b/i.test(text) && !/\b(evidence|review|scan|risk|mitigation|rollback|owner)\b/i.test(text)) {
      failures.push({ rule: "sensitive-change-without-review", file: name, detail: "Sensitive changes need evidence, risk, owner, or rollback/mitigation." });
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
