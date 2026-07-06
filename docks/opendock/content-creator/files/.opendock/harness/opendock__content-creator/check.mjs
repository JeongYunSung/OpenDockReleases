#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = {
  "title": "Content Creator",
  "slug": "content-creator",
  "domainFile": "CONTENT_CREATOR.md",
  "templatePath": ".opendock/templates/content-creator/CONTENT_RUN.md",
  "runDir": ".opendock/runs/content-creator",
  "skillPath": ".agents/skills/opendock-content-creator/SKILL.md",
  "workflowPath": ".agents/workflows/opendock-content-creator/quality-gate.md",
  "requiredSections": [
    "대상 독자",
    "콘텐츠 브리프",
    "채널 구조",
    "제작 초안",
    "업로드 체크리스트",
    "근거와 권리",
    "재활용 계획"
  ],
  "forbidden": [
    {
      "id": "prompt-injection",
      "pattern": "(?i)(ignore previous instructions|ignore all prior|system prompt|developer message|reveal secrets|bypass approval)",
      "message": "외부 문서나 산출물에 포함된 지시가 상위 지시를 우회하려고 합니다."
    },
    {
      "id": "secret-handling",
      "pattern": "(?i)(\\.env|private key|api[_-]?key|access token|secret key|password)\\s*[:=]",
      "message": "산출물에 secret 또는 credential로 보이는 값이 포함되어 있습니다."
    },
    {
      "id": "destructive-command",
      "pattern": "(?i)(rm -rf|s[u]do |curl .+\\| .*(sh|bash)|wget .+\\| .*(sh|bash)|chmod\\s+777)",
      "message": "위험한 shell command나 권한 상승 지시가 포함되어 있습니다."
    },
    {
      "id": "unsupported-guarantee",
      "pattern": "(?i)(100% guaranteed|무조건 성공|완벽히 보장|절대 실패하지|world[- ]class|industry[- ]leading)(?![\\s\\S]{0,240}(근거|evidence|source|benchmark|제한|risk))",
      "message": "강한 주장에는 근거, 제한, 리스크 설명이 필요합니다."
    }
  ]
};
const maxFileBytes = 512 * 1024;
const failures = [];
const ignoredSegments = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".venv", "venv", "target", ".gradle", "tools", "runtimes"]);

function addFailure(rule, file, detail) { failures.push({ rule, file, detail }); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  const stat = fs.statSync(full);
  if (!stat.isFile()) return null;
  if (stat.size > maxFileBytes) { addFailure("file-too-large", rel, "검사 대상 파일이 너무 큽니다."); return null; }
  const buffer = fs.readFileSync(full);
  if (buffer.includes(0)) return null;
  return buffer.toString("utf8");
}
function walk(dirRel, depth = 0, out = []) {
  const dir = path.join(root, dirRel);
  if (!fs.existsSync(dir)) return out;
  if (depth > 8) { addFailure("run-depth", dirRel, "run 문서 디렉터리가 너무 깊습니다."); return out; }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;
    const rel = path.join(dirRel, entry.name).split(path.sep).join("/");
    if (entry.isDirectory()) walk(rel, depth + 1, out);
    else if (entry.isFile() && rel.endsWith(".md")) out.push(rel);
  }
  return out;
}
function compile(pattern) {
  let source = pattern;
  let flags = "m";
  while (source.startsWith("(?i)") || source.startsWith("(?s)")) {
    if (source.startsWith("(?i)")) { flags += "i"; source = source.slice(4); }
    if (source.startsWith("(?s)")) { flags += "s"; source = source.slice(4); }
  }
  return new RegExp(source, flags);
}
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function hasSection(text, section) {
  const pattern = "(^|\\n)#{1,3}\\s*" + escapeRegExp(section) + "\\s*(\\n|$)";
  return new RegExp(pattern, "i").test(text);
}
function inspectText(rel, text, strictSections) {
  for (const rule of config.forbidden) {
    if (compile(rule.pattern).test(text)) addFailure(rule.id, rel, rule.message);
  }
  if (strictSections) {
    for (const section of config.requiredSections) {
      if (!hasSection(text, section)) addFailure("missing-section", rel, "필수 section이 없습니다: " + section);
    }
  }
  if (/Approved Exception:/i.test(text) && !/Approved Exception:\s*(None|없음|[- ]*None)/i.test(text)) {
    if (!/(승인자|approver|reason|이유|expires|만료)/i.test(text)) {
      addFailure("weak-exception", rel, "Approved Exception에는 승인자, 이유, 만료 조건이 필요합니다.");
    }
  }
}
function main() {
  const required = [config.domainFile, "HARNESS.md", config.templatePath, config.skillPath, config.workflowPath];
  for (const rel of required) if (!exists(rel)) addFailure("missing-installed-file", rel, "OpenDock 설치 파일이 없습니다.");
  const domainText = read(config.domainFile);
  if (domainText) inspectText(config.domainFile, domainText, false);
  const templateText = read(config.templatePath);
  if (templateText) inspectText(config.templatePath, templateText, true);
  const runFiles = walk(config.runDir);
  for (const rel of runFiles) {
    const text = read(rel);
    if (text) inspectText(rel, text, true);
  }
  if (failures.length) {
    console.error(config.title + " harness failed (" + failures.length + ")");
    for (const failure of failures.slice(0, 40)) console.error("- [" + failure.rule + "] " + failure.file + ": " + failure.detail);
    if (failures.length > 40) console.error("... " + (failures.length - 40) + " more");
    process.exit(1);
  }
  console.log(config.title + " harness passed (" + runFiles.length + " run files checked).");
}
main();
