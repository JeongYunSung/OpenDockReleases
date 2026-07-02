#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Prompt Eval";
const requiredFiles = ["PROMPT_EVAL.md", "HARNESS.md"];
const runDir = ".opendock/runs/prompt-eval";
const templateFile = ".opendock/templates/prompt-eval/PROMPT_EVAL_RUN.md";
const failures = [];

function exists(file) { return fs.existsSync(path.join(root, file)); }
function rel(file) { return path.relative(root, file).split(path.sep).join("/"); }
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
function fail(rule, file, detail) { failures.push({ rule, file, detail }); }

for (const file of requiredFiles) {
  if (!exists(file)) fail("missing-required-file", file, `${file} is required.`);
}
if (!exists(templateFile)) fail("missing-template", templateFile, "Run template is required.");

const files = [
  ...requiredFiles.filter(exists).map((file) => path.join(root, file)),
  ...(exists(templateFile) ? [path.join(root, templateFile)] : []),
  ...walk(runDir).filter((file) => /\.md$/i.test(file)),
];

const secretPattern = /\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|private[_ -]?key|secret)\b\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{12,}/i;
const approvalPattern = /\b(approval|approved|승인|human|owner)\b/i;
const evidencePattern = /\b(evidence|result|결과|근거|screenshot|log|failure|passed|failed)\b/i;
const requiredFieldPattern = /(Objective|Dataset|Pass\s+criteria|Models\s+or\s+agents)\s*:/i;

for (const file of files) {
  const name = rel(file);
  const text = fs.readFileSync(file, "utf8");
  if (/[ \t]+$/m.test(text)) fail("trailing-whitespace", name, "Remove trailing whitespace.");
  if (/^\t+/m.test(text)) fail("tab-indentation", name, "Use spaces for indentation.");
  if (secretPattern.test(text)) fail("secret-like-value", name, "Do not store real-looking secrets in dock run docs.");
  if (name.startsWith(`${runDir}/`)) {
    if (!requiredFieldPattern.test(text)) fail("missing-run-fields", name, "Run doc must keep the required template fields.");
    if (!evidencePattern.test(text)) fail("missing-evidence", name, "Run doc needs result or evidence notes.");
    if (/\b(delete|payment|login|deploy|credential|access[_ -]?token|refresh[_ -]?token|private[_ -]?key|password|destructive|계정|결제|삭제|배포)\b/i.test(text) && !approvalPattern.test(text)) {
      fail("sensitive-action-without-approval", name, "Sensitive action needs explicit human approval note.");
    }
  }
}

if (failures.length) {
  console.error(`OpenDock harness: ${title}`);
  console.error(`Files scanned: ${files.length}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
  process.exit(1);
}

console.log(`OpenDock harness: ${title}`);
console.log(`Files scanned: ${files.length}`);
console.log("Capability check passed.");
