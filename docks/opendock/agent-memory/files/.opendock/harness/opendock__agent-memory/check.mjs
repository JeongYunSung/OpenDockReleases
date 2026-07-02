#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Agent Memory";
const focus = "workspace-local project memory quality";
const requiredFiles = ["MEMORY.md", "HARNESS.md"];
const optionalDirs = [".opendock/memory", ".opendock/runs/agent-memory"];
const failures = [];
const maxBytes = 1024 * 1024;

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

function readText(file) {
  const stat = fs.statSync(file);
  if (stat.size > maxBytes) {
    failures.push({ rule: "file-too-large", file: rel(file), detail: "File is too large to scan." });
    return "";
  }
  const buf = fs.readFileSync(file);
  if (buf.includes(0)) return "";
  return buf.toString("utf8");
}

for (const file of requiredFiles) {
  if (!exists(file)) failures.push({ rule: "missing-required-file", file, detail: `${file} is required.` });
}

const files = [
  ...requiredFiles.filter(exists).map((file) => path.join(root, file)),
  ...optionalDirs.flatMap(walk),
].filter((file) => /\.(md|txt|json|ya?ml)$/i.test(file));

for (const file of files) {
  const text = readText(file);
  const name = rel(file);
  if (/[ \t]+$/m.test(text)) failures.push({ rule: "trailing-whitespace", file: name, detail: "Remove trailing whitespace." });
  if (/^\t+/m.test(text)) failures.push({ rule: "tab-indentation", file: name, detail: "Use spaces for indentation." });
  if (optionalDirs.some((dir) => name.startsWith(`${dir}/`))) {
    if (/\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|private[_ -]?key)\b\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{12,}/i.test(text)) {
      failures.push({ rule: "secret-in-memory", file: name, detail: "Do not store secrets in memory notes." });
    }
    if (/\b(done|complete|완료)\b/i.test(text) && !/\b(evidence|근거|verified|검증|source|출처)\b/i.test(text)) {
      failures.push({ rule: "completion-without-evidence", file: name, detail: "Completion notes need evidence." });
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
