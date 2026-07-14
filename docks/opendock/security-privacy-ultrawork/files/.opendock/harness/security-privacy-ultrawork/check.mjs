#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = {
  "title": "Security Privacy Ultrawork",
  "slug": "security-privacy-ultrawork",
  "domainFile": ".opendock/docks/security-privacy-ultrawork/SECURITY_PRIVACY.md",
  "templatePath": ".opendock/templates/security-privacy/SECURITY_PRIVACY_RUN.md",
  "runDir": ".opendock/runs/security-privacy",
  "skillPath": ".agents/skills/opendock-security-privacy-ultrawork/SKILL.md",
  "workflowPath": ".agents/workflows/opendock-security-privacy-ultrawork/quality-gate.md",
  "requiredSections": [
    "데이터 인벤토리",
    "접근 제어",
    "시크릿 처리",
    "프라이버시 리스크",
    "위협 시나리오",
    "수정 계획",
    "다음 행동"
  ],
  "forbidden": [
    {
      "id": "prompt-injection",
      "pattern": "(?i)(ignore\\x20previous\\x20instructions|ignore\\x20all\\x20prior|system\\x20prompt|developer\\x20message|reveal\\x20secrets|bypass\\x20approval)",
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
  ]
};
const maxFileBytes = 512 * 1024;
const failures = [];
const ignoredSegments = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".venv", "venv", "target", ".gradle", "tools", "runtimes"]);

function addFailure(rule, file, detail) { failures.push({ rule, file, detail }); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function isSafeExistingPath(rel) {
  const full = path.resolve(root, rel);
  const relative = path.relative(root, full);
  if (relative === ".." || relative.startsWith(".." + path.sep)) return false;
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current) || fs.lstatSync(current).isSymbolicLink()) return false;
  }
  const real = fs.realpathSync.native(full);
  const realRelative = path.relative(fs.realpathSync.native(root), real);
  return realRelative !== ".." && !realRelative.startsWith(".." + path.sep);
}
function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  if (!isSafeExistingPath(rel)) { addFailure("unsafe-target", rel, "검사 경로에 symlink 또는 workspace 밖 경로가 포함되어 있습니다."); return null; }
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
  if (!isSafeExistingPath(dirRel)) { addFailure("unsafe-run-directory", dirRel, "run 디렉터리에 symlink 또는 workspace 밖 경로가 포함되어 있습니다."); return out; }
  if (depth > 8) { addFailure("run-depth", dirRel, "run 문서 디렉터리가 너무 깊습니다."); return out; }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;
    const rel = path.join(dirRel, entry.name).split(path.sep).join("/");
    if (entry.isDirectory()) walk(rel, depth + 1, out);
    else if (entry.isFile() && rel.endsWith(".md")) out.push(rel);
  }
  return out;
}
function selectRunFiles() {
  const args = process.argv.slice(2);
  const explicit = [];
  let release = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--release" || arg === "--all") release = true;
    else if (arg === "--target" && index + 1 < args.length) explicit.push(args[++index]);
    else if (!arg.startsWith("--")) explicit.push(arg);
    else addFailure("unknown-argument", arg, "Use --target <run-document> or --release.");
  }
  if (release && explicit.length > 0) {
    addFailure("conflicting-scope", "--release", "Use explicit targets or release scope, not both.");
    return { mode: "invalid", files: [] };
  }
  const all = walk(config.runDir);
  if (explicit.length > 0) {
    const selected = [];
    for (const raw of explicit) {
      const rel = String(raw).replaceAll("\\", "/");
      const full = path.resolve(root, rel);
      const safe = path.relative(root, full).split(path.sep).join("/");
      if (!safe.startsWith(config.runDir + "/") || !safe.endsWith(".md") || !exists(safe) || !isSafeExistingPath(safe)) {
        addFailure("unsafe-target", rel, "Target must be a regular Markdown run document inside " + config.runDir + ".");
      } else selected.push(safe);
    }
    return { mode: "target", files: [...new Set(selected)] };
  }
  if (release) return { mode: "release", files: all };
  all.sort((a, b) => fs.statSync(path.join(root, b)).mtimeMs - fs.statSync(path.join(root, a)).mtimeMs);
  return { mode: "current-run", files: all.slice(0, 1) };
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
  const required = [config.domainFile, ".opendock/docks/security-privacy-ultrawork/HARNESS.md", config.templatePath, config.skillPath, config.workflowPath];
  for (const rel of required) if (!exists(rel)) addFailure("missing-installed-file", rel, "OpenDock 설치 파일이 없습니다.");
  const domainText = read(config.domainFile);
  if (domainText) inspectText(config.domainFile, domainText, false);
  const templateText = read(config.templatePath);
  if (templateText) inspectText(config.templatePath, templateText, true);
  const scope = selectRunFiles();
  const runFiles = scope.files;
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
  console.log(config.title + " harness passed (" + runFiles.length + " run files checked; scope: " + scope.mode + ").");
}
main();
