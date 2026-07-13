#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";

const root = fs.realpathSync(process.cwd());
const title = "Moving";
const slug = "moving";
const runRoot = `.opendock/runs/${slug}`;
const activeStatuses = new Set(["draft", "active", "in-progress", "review", "ready"]);
const inactiveStatuses = new Set(["inactive", "completed", "done", "archived", "cancelled", "canceled", "superseded", "closed"]);
const allowedExtensions = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".csv"]);
const blockedSegments = new Set([".git", ".ssh", ".agents", ".opendock", "node_modules"]);
const maxManifestBytes = 256 * 1024;
const maxStatusBytes = 64 * 1024;
const maxTargetBytes = 1024 * 1024;
const maxTargets = 24;
const failures = [];
const decoder = new TextDecoder("utf-8", { fatal: true });
const targetSectionAliases = [
  "Target Files",
  "Target File",
  "대상 파일",
  "대상 파일 목록",
  "대상 파일 (Target Files)",
  "Target Files (대상 파일)",
  "대상 파일 / Target Files",
];

const manifestSections = [
  ["Target Files", targetSectionAliases],
  ["이사 기본 정보", ["이사 기본 정보", "Move Basics"]],
  ["가구 및 제약", ["가구 및 제약", "Household Constraints"]],
  ["일정 증거", ["일정 증거", "Timeline Evidence"]],
  ["업체 및 견적 증거", ["업체 및 견적 증거", "Vendor And Quote Evidence", "Vendor and Quote Evidence"]],
  ["서비스 및 주소 변경 증거", ["서비스 및 주소 변경 증거", "Utilities And Address Evidence", "Utilities and Address Evidence"]],
  ["재고·치수·처분 증거", ["재고·치수·처분 증거", "Inventory, Measurement, And Disposal Evidence", "Inventory, Measurement, and Disposal Evidence"]],
  ["예산·귀중품·비상 계획 증거", ["예산·귀중품·비상 계획 증거", "Budget, Valuables, And Contingency Evidence", "Budget, Valuables, and Contingency Evidence"]],
  ["법률 및 지역 요건 근거", ["법률 및 지역 요건 근거", "Legal And Local Requirements", "Legal and Local Requirements"]],
  ["사실·가정·권고", ["사실·가정·권고", "Facts, Assumptions, And Recommendations", "Facts, Assumptions, and Recommendations"]],
  ["개인정보 최소화", ["개인정보 최소화", "Data Minimization And Privacy", "Data Minimization and Privacy"]],
  ["검증 결과", ["검증 결과", "Validation Results"]],
];

const outputSections = [
  ["이사 개요", ["이사 개요", "Move Overview"]],
  ["가구 및 제약", ["가구 및 제약", "Household Constraints"]],
  ["마일스톤 일정", ["마일스톤 일정", "Milestone Timeline"]],
  ["업체 및 견적", ["업체 및 견적", "Vendors And Quotes", "Vendors and Quotes"]],
  ["공과금 및 서비스", ["공과금 및 서비스", "Utilities And Services", "Utilities and Services"]],
  ["주소 변경", ["주소 변경", "Address Changes"]],
  ["재고", ["재고", "Inventory"]],
  ["치수 및 반입", ["치수 및 반입", "Measurements And Access", "Measurements and Access"]],
  ["처분 및 기부", ["처분 및 기부", "Disposal And Donation", "Disposal and Donation"]],
  ["예산", ["예산", "Budget"]],
  ["귀중품", ["귀중품", "Valuables"]],
  ["비상 계획", ["비상 계획", "Contingency Plan"]],
  ["법률 및 지역 요건", ["법률 및 지역 요건", "Legal And Local Requirements", "Legal and Local Requirements"]],
  ["완료 체크리스트", ["완료 체크리스트", "Completion Checklist"]],
];

function addFailure(rule, file, detail) {
  if (!failures.some((item) => item.rule === rule && item.file === file && item.detail === detail)) {
    failures.push({ rule, file, detail });
  }
}

function safeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (character) => {
    return `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
  });
}

function posix(value) {
  return String(value).replace(/\\/g, "/");
}

function lstatIfPresent(full) {
  try {
    return fs.lstatSync(full);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return null;
    throw error;
  }
}

function fullPath(relative) {
  return path.join(root, ...posix(relative).split("/"));
}

function isInsideProject(full) {
  const relative = path.relative(root, full);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function hasSymlinkSegment(relative) {
  let current = root;
  for (const segment of posix(relative).split("/")) {
    current = path.join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) return false;
    if (stat.isSymbolicLink()) return true;
  }
  return false;
}

function inspectRunRoot() {
  let current = root;
  for (const segment of runRoot.split("/")) {
    current = path.join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) return false;
    const relative = posix(path.relative(root, current));
    if (stat.isSymbolicLink()) {
      addFailure("run-root-symlink", relative, "run 경로의 ancestry에 symlink가 있습니다.");
      return false;
    }
    if (!stat.isDirectory()) {
      addFailure("run-root-type", relative, "run 경로의 ancestry는 실제 디렉터리여야 합니다.");
      return false;
    }
  }
  return true;
}

function readText(relative, maximum, kind) {
  const full = fullPath(relative);
  if (hasSymlinkSegment(relative)) {
    addFailure(`${kind}-symlink`, relative, "경로에 symlink segment가 있습니다.");
    return null;
  }
  const stat = lstatIfPresent(full);
  if (!stat) {
    addFailure(`${kind}-missing`, relative, "파일이 존재하지 않습니다.");
    return null;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    addFailure(`${kind}-type`, relative, "regular non-symlink 파일이어야 합니다.");
    return null;
  }
  if (stat.size > maximum) {
    addFailure(`${kind}-size`, relative, `파일 크기가 ${maximum} bytes를 초과합니다.`);
    return null;
  }
  const real = fs.realpathSync(full);
  if (!isInsideProject(real)) {
    addFailure(`${kind}-path`, relative, "파일이 프로젝트 외부로 해석됩니다.");
    return null;
  }
  const buffer = fs.readFileSync(real);
  if (buffer.includes(0)) {
    addFailure(`${kind}-binary`, relative, "NUL byte가 있는 binary 파일은 지원하지 않습니다.");
    return null;
  }
  try {
    return decoder.decode(buffer);
  } catch {
    addFailure(`${kind}-encoding`, relative, "유효한 UTF-8 텍스트 파일이어야 합니다.");
    return null;
  }
}

function fields(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...topLevelText(text).matchAll(new RegExp(`^${escaped}:\\s*([^\\r\\n]+)$`, "gim"))]
    .map((match) => match[1].trim());
}

function field(text, name) {
  return fields(text, name)[0] ?? "";
}

function stripManagedBlocks(text) {
  return String(text).replace(
    /<!-- OPENDOCK:START\b[^>]*-->[\s\S]*?(?:<!-- OPENDOCK:END\b[^>]*-->|$)/g,
    (block) => block.replace(/[^\r\n]/g, ""),
  );
}

function stripHtmlComments(text) {
  return String(text).replace(
    /<!--[\s\S]*?(?:-->|$)/g,
    (block) => block.replace(/[^\r\n]/g, ""),
  );
}

function openingFence(line) {
  const match = String(line).match(
    /^ {0,3}(?:(?:[-+*]|\d{1,9}[.)])[ \t]{1,4})?(`{3,}|~{3,})(.*)$/,
  );
  if (!match || (match[1][0] === "`" && match[2].includes("`"))) return null;
  return { marker: match[1][0], length: match[1].length };
}

function closesFence(line, fence) {
  const match = String(line).match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(match && match[1][0] === fence.marker && match[1].length >= fence.length);
}

function stripFencedBlocks(text) {
  const kept = [];
  let fence = null;
  for (const line of String(text).split(/\r?\n/)) {
    if (fence !== null) {
      if (closesFence(line, fence)) fence = null;
      kept.push("");
      continue;
    }
    const opening = openingFence(line);
    if (opening) {
      fence = opening;
      kept.push("");
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function structuralText(text) {
  return stripFencedBlocks(stripHtmlComments(stripManagedBlocks(text)));
}

function parseAtxHeading(line) {
  return String(line).match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*$/);
}

function topLevelText(text) {
  const lines = structuralText(text).split(/\r?\n/);
  const firstHeading = lines.findIndex((line) => {
    const heading = parseAtxHeading(line);
    return Boolean(heading && heading[1].length >= 2);
  });
  return lines.slice(0, firstHeading < 0 ? lines.length : firstHeading).join("\n");
}

function normalizeHeading(value) {
  return value.trim().replace(/\s+#+\s*$/, "").replace(/\s+/g, " ").toLowerCase();
}

function section(text, aliases) {
  const wanted = new Set(aliases.map(normalizeHeading));
  const lines = structuralText(text).split(/\r?\n/);
  let start = -1;
  let level = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = parseAtxHeading(lines[index]);
    if (start === -1) {
      if (heading && wanted.has(normalizeHeading(heading[2]))) {
        start = index + 1;
        level = heading[1].length;
      }
      continue;
    }
    if (heading && heading[1].length <= level) return lines.slice(start, index).join("\n").trim();
  }
  return start === -1 ? "" : lines.slice(start).join("\n").trim();
}

function sectionCount(text, aliases) {
  const wanted = new Set(aliases.map(normalizeHeading));
  return structuralText(text).split(/\r?\n/).reduce((count, line) => {
    const heading = parseAtxHeading(line);
    return count + (heading && wanted.has(normalizeHeading(heading[2])) ? 1 : 0);
  }, 0);
}

function stripQuotedExamples(text) {
  const kept = [];
  let fence = null;
  let activeFence = false;
  let previous = "";
  for (const line of text.split(/\r?\n/)) {
    if (fence) {
      if (closesFence(line, fence)) {
        fence = null;
        activeFence = false;
      } else if (activeFence) {
        kept.push(line);
      }
      continue;
    }
    const opening = openingFence(line);
    if (opening) {
      activeFence = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
        && !safeAnalysisContext(previous);
      fence = opening;
      continue;
    }
    const activeContext = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
      && !safeAnalysisContext(previous);
    if (/^\s*>/.test(line)) {
      if (activeContext) kept.push(line.replace(/^\s*>\s?/, ""));
      previous = line;
      continue;
    }
    kept.push(line.replace(/`[^`\r\n]*`/g, ""));
    previous = line;
  }
  return kept.join("\n");
}

function safeAnalysisContext(line) {
  return /(금지|차단|탐지|분석|증거|인용|예시|문자열|언급|실행하지|따르지|무시해야|하지 않는다|위험|forbidden|block(?:ed)?|detect|analysis|evidence|quot(?:e|ed)|example|do not execute|must not follow|unsafe string)/i.test(line);
}

function hasEvidence(body) {
  if (!body) return false;
  const actionable = stripQuotedExamples(body);
  const substantive = actionable
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter((line) => line && !/^[^:]{1,80}:\s*$/.test(line))
    .join(" ");
  return substantive.length >= 8 && !/(\bTODO\b|\bTBD\b|replace-me|\bpending\b|작성하세요|여기에\s*입력)/i.test(substantive);
}

function valueFor(body, labels) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = body.match(new RegExp(`(?:^|\\n)\\s*[-*]?\\s*(?:${escaped})\\s*:\\s*([^\\r\\n]+)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function scanSecrets(relative, text) {
  const highConfidence = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}(?![A-Za-z0-9_])/,
    /\bnpm_[A-Za-z0-9]{36,}\b/,
    /\bglpat-[A-Za-z0-9_-]{20,}(?![A-Za-z0-9_-])/,
    /\bAIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  ];
  if (highConfidence.some((pattern) => pattern.test(text))) {
    addFailure("credential-leak", relative, "실제 credential 또는 private key처럼 보이는 값이 있습니다.");
  }

  const assignment = /\b(api[_-]?key|access[_-]?token|auth[_-]?token|secret(?:[_-]?key)?|password|passwd|wi-?fi[_-]?password|aws_access_key_id|aws_secret_access_key)\b\s*[:=]\s*["']?([^\s"'`;,#]{6,})/gi;
  for (const line of text.split(/\r?\n/)) {
    let match;
    while ((match = assignment.exec(line)) !== null) {
      const value = match[2].replace(/[),.]+$/, "");
      const fake = /^(?:redacted|masked|example|dummy|sample|changeme|your[-_].*|x+|\*+|none|null|not[-_]?set|\[[^\]]+\]|<[^>]+>|\$\{[^}]+\})$/i.test(value);
      if (!fake && !safeAnalysisContext(line)) {
        addFailure("credential-assignment", relative, `${match[1]}에 실제 secret처럼 보이는 값이 할당되어 있습니다.`);
      }
    }
    assignment.lastIndex = 0;
  }
}

function scanPrivacy(relative, text) {
  if (/\b\d{6}-[1-4]\d{6}\b/.test(text)) {
    addFailure("sensitive-personal-data", relative, "주민등록번호처럼 보이는 개인 식별값을 제거하거나 마스킹해야 합니다.");
  }
  const accessValue = /(?:공동현관|현관|출입|door|gate|wi-?fi)\s*(?:비밀번호|암호|코드|password|passcode)\s*[:=]\s*([^\s,;]+)/i.exec(text);
  if (accessValue && !/(redacted|masked|마스킹|비공개|\*+|x+|\[[^\]]+\]|<[^>]+>)/i.test(accessValue[1])) {
    addFailure("access-secret", relative, "출입 또는 네트워크 비밀번호는 실제 값을 기록하지 말고 마스킹해야 합니다.");
  }
}

function scanPolicy(relative, text) {
  const actionable = stripQuotedExamples(text);
  if (/(\bTODO\b|\bTBD\b|replace-me|\bpending\b|작성하세요|여기에\s*입력)/i.test(actionable)) {
    addFailure("placeholder", relative, "활성 증거 또는 결과에 미완성 placeholder가 있습니다.");
  }
  const promptInjection = /\b(?:ignore|disregard)\s+(?:all\s+)?(?:previous|prior|system|developer)\s+(?:instructions?|messages?)\b|\b(?:reveal|show|print|expose)\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message)\b|\bbypass\s+(?:approval|safety|policy)\b|(?:이전|기존|상위|시스템|개발자)\s*(?:지시|메시지|프롬프트)(?:를|을)?\s*무시|(?:시스템|개발자)\s*(?:프롬프트|메시지)(?:를|을)?\s*(?:공개|출력|노출)|(?:승인|안전|정책)(?:을|를)?\s*우회/i;
  const destructive = /\brm\b(?=[^\r\n;&|]*\s(?:--recursive\b|-[A-Za-z]*r[A-Za-z]*\b))(?=[^\r\n;&|]*\s(?:--force\b|-[A-Za-z]*f[A-Za-z]*\b))|\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-[^\s]*f|\bchmod\s+777\b|\bsudo\s+|\b(?:curl|wget)\b[^\r\n|]*\|\s*(?:sh|bash)\b|\b(?:format|diskpart)\s+(?:c:|disk)|\bRemove-Item\b[^\r\n]*-(?:Recurse|Force)/i;
  const guarantee = /\b100%\s+guaranteed\b|\bzero[- ]risk\b|\bnever\s+fail(?:s|ed)?\b|무조건\s*(?:성공|가능)|완벽히\s*보장|절대\s*실패하지\s*않|위험이\s*전혀\s*없/i;
  for (const line of actionable.split(/\r?\n/)) {
    if (!line.trim() || safeAnalysisContext(line)) continue;
    if (promptInjection.test(line)) addFailure("prompt-injection", relative, "상위 지시나 승인을 우회하는 능동형 지시가 있습니다.");
    if (destructive.test(line)) addFailure("destructive-command", relative, "파괴적 명령 또는 권한 상승 지시가 있습니다.");
    if (guarantee.test(line)) addFailure("unsupported-guarantee", relative, "검증할 수 없는 절대 보장 표현이 있습니다.");
  }
  scanSecrets(relative, text);
  scanPrivacy(relative, text);
}

function normalizeExplicitManifest(argument) {
  if (typeof argument !== "string" || argument.includes("\0") || /[\x00-\x1f\x7f]/.test(argument)) return null;
  const relative = posix(argument);
  if (path.isAbsolute(argument) || relative.startsWith("/") || /^[A-Za-z]:\//.test(relative) || relative.startsWith("//")) return null;
  if (path.posix.normalize(relative) !== relative) return null;
  const match = relative.match(/^\.opendock\/runs\/moving\/([A-Za-z0-9][A-Za-z0-9._-]{0,79})\/manifest\.md$/);
  if (!match || match[1].includes("..")) return null;
  return relative;
}

function parseArguments(argumentsList) {
  if (argumentsList.length === 0) return { mode: "discover" };
  if (argumentsList.length === 1) return { mode: "explicit", manifest: argumentsList[0] };
  if (argumentsList.length === 2 && argumentsList[0] === "--manifest") return { mode: "explicit", manifest: argumentsList[1] };
  addFailure("usage", "check.mjs", "사용법: check.mjs [<manifest-relative-path>] 또는 check.mjs --manifest <manifest-relative-path>");
  return { mode: "invalid" };
}

function readRun(relative) {
  const text = readText(relative, maxManifestBytes, "manifest");
  if (text === null) return null;
  const statusValues = fields(text, "Status").map((value) => value.toLowerCase());
  const status = statusValues[0] ?? "";
  if (statusValues.length !== 1 || (!activeStatuses.has(status) && !inactiveStatuses.has(status))) {
    addFailure("manifest-status", relative, "Status가 없거나 지원하지 않는 값입니다.");
  }
  return { relative, text, status };
}

function readRunStatus(relative) {
  const full = fullPath(relative);
  if (hasSymlinkSegment(relative)) {
    addFailure("manifest-symlink", relative, "경로에 symlink segment가 있습니다.");
    return "";
  }
  const stat = lstatIfPresent(full);
  if (!stat) {
    addFailure("manifest-missing", relative, "파일이 존재하지 않습니다.");
    return "";
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    addFailure("manifest-type", relative, "regular non-symlink 파일이어야 합니다.");
    return "";
  }
  const real = fs.realpathSync(full);
  if (!isInsideProject(real)) {
    addFailure("manifest-path", relative, "파일이 프로젝트 외부로 해석됩니다.");
    return "";
  }

  const buffer = Buffer.alloc(Math.min(stat.size, maxStatusBytes));
  const descriptor = fs.openSync(real, "r");
  let bytesRead;
  try {
    bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  const statusValues = fields(buffer.subarray(0, bytesRead).toString("utf8"), "Status")
    .map((value) => value.toLowerCase());
  const status = statusValues[0] ?? "";
  if (statusValues.length !== 1 || (!activeStatuses.has(status) && !inactiveStatuses.has(status))) {
    addFailure("manifest-status", relative, "Status가 없거나 지원하지 않는 값입니다.");
    return "";
  }
  return status;
}

function discoverActiveRuns() {
  if (!inspectRunRoot()) return [];
  const entries = fs.readdirSync(fullPath(runRoot), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const active = [];
  for (const entry of entries) {
    const runRelative = `${runRoot}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      addFailure("run-directory-symlink", runRelative, "run 디렉터리는 symlink일 수 없습니다.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(entry.name) || entry.name.includes("..")) {
      addFailure("run-id", runRelative, "run id는 안전한 단일 경로 segment여야 합니다.");
      continue;
    }
    const manifestRelative = `${runRelative}/manifest.md`;
    if (!lstatIfPresent(fullPath(manifestRelative))) continue;
    const status = readRunStatus(manifestRelative);
    if (activeStatuses.has(status)) active.push(readRun(manifestRelative));
  }
  return active;
}

function explicitRun(argument) {
  const relative = normalizeExplicitManifest(argument);
  if (!relative) {
    addFailure("manifest-argument", "check.mjs", "명시 manifest는 .opendock/runs/moving/<run-id>/manifest.md 형식의 안전한 상대 경로여야 합니다.");
    return null;
  }
  return readRun(relative);
}

function extractTargets(text) {
  const body = section(text, targetSectionAliases);
  const targets = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (!match) continue;
    let value = match[1].trim();
    if (value.startsWith("`") && value.endsWith("`") && value.length > 2) value = value.slice(1, -1).trim();
    targets.push(value);
  }
  return [...new Set(targets)];
}

function normalizeTarget(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 240 || value.includes("\0") || /[\x00-\x1f\x7f]/.test(value)) return null;
  const relative = posix(value);
  if (path.isAbsolute(value) || relative.startsWith("/") || /^[A-Za-z]:\//.test(relative) || relative.startsWith("//")) return null;
  if (path.posix.normalize(relative) !== relative) return null;
  const segments = relative.split("/");
  if (segments.length < 2 || segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  if (segments[0] !== slug || segments.some((segment) => blockedSegments.has(segment.toLowerCase()))) return null;
  if (!allowedExtensions.has(path.posix.extname(relative).toLowerCase())) return null;
  const resolved = fullPath(relative);
  if (!isInsideProject(path.resolve(resolved))) return null;
  return relative;
}

function readTargets(run) {
  const listed = extractTargets(run.text);
  if (listed.length === 0) addFailure("target-list-empty", run.relative, "Target Files에 moving/ 파일을 하나 이상 선언해야 합니다.");
  if (listed.length > maxTargets) addFailure("target-list-size", run.relative, `Target Files는 ${maxTargets}개를 초과할 수 없습니다.`);
  const targets = [];
  for (const listedPath of listed.slice(0, maxTargets)) {
    const relative = normalizeTarget(listedPath);
    if (!relative) {
      addFailure("target-path", run.relative, `안전하지 않거나 범위를 벗어난 target 경로입니다: ${listedPath}`);
      continue;
    }
    const text = readText(relative, maxTargetBytes, "target");
    if (text !== null) targets.push({ relative, text });
  }
  if (targets.length > 0 && !targets.some((target) => path.posix.extname(target.relative).toLowerCase() === ".md")) {
    addFailure("plan-document", run.relative, "필수 section을 담은 Markdown 계획 파일을 하나 이상 선언해야 합니다.");
  }
  return targets;
}

function outputSection(targets, aliases) {
  return targets.map((target) => section(target.text, aliases)).filter(Boolean).join("\n");
}

function requirePattern(rule, file, body, pattern, detail) {
  if (!pattern.test(body)) addFailure(rule, file, detail);
}

function validateSources(run, legalBody) {
  const legalEvidence = section(run.text, ["법률 및 지역 요건 근거", "Legal And Local Requirements", "Legal and Local Requirements"]);
  const combined = `${legalEvidence}\n${legalBody}`;
  requirePattern("source-url", run.relative, combined, /https:\/\/[^\s)>]+/i, "법률·지역·시점 의존 근거에 HTTPS 출처 URL이 필요합니다.");
  requirePattern("source-date", run.relative, combined, /\b20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/, "출처에는 YYYY-MM-DD 조회일이 필요합니다.");

  const reasoning = section(run.text, ["사실·가정·권고", "Facts, Assumptions, And Recommendations", "Facts, Assumptions, and Recommendations"]);
  if (!valueFor(reasoning, ["사실", "Fact", "Facts"])) addFailure("facts", run.relative, "사실 항목을 구체적으로 기록해야 합니다.");
  if (!valueFor(reasoning, ["가정", "Assumption", "Assumptions"])) addFailure("assumptions", run.relative, "가정 항목을 구체적으로 기록해야 합니다.");
  if (!valueFor(reasoning, ["권고", "Recommendation", "Recommendations"])) addFailure("recommendations", run.relative, "권고 항목과 근거를 기록해야 합니다.");
}

function validateMovingOutput(run, targets) {
  const sections = new Map();
  for (const [label, aliases] of outputSections) {
    const body = outputSection(targets, aliases);
    sections.set(label, body);
    if (!body) addFailure("output-section-missing", run.relative, `선언된 Markdown 결과에 필수 section이 없습니다: ${label}`);
    else if (!hasEvidence(body)) addFailure("output-evidence", run.relative, `결과 section에 구체적인 내용이 없습니다: ${label}`);
  }

  const timeline = sections.get("마일스톤 일정") ?? "";
  const milestones = [
    ["D-30", /\bD-30\b/i],
    ["D-14", /\bD-14\b/i],
    ["D-7", /\bD-7\b/i],
    ["D-1", /\bD-1\b/i],
    ["당일", /당일|day[- ]of/i],
    ["이사 후", /이사\s*후|after (?:the )?move|post[- ]move/i],
  ];
  for (const [label, pattern] of milestones) {
    if (!pattern.test(timeline)) addFailure("timeline-milestone", run.relative, `일정에 ${label} 단계가 필요합니다.`);
  }

  const money = /(?:₩|\bKRW\b|\bUSD\b|\$|€|£|¥|\d[\d,]*(?:\.\d+)?\s*원)/i;
  requirePattern("vendor-quote", run.relative, sections.get("업체 및 견적") ?? "", money, "업체·대안 견적에 금액과 통화가 필요합니다.");
  requirePattern("utilities", run.relative, sections.get("공과금 및 서비스") ?? "", /전기|수도|가스|인터넷|통신|electric|water|gas|internet|telecom/i, "공과금 또는 생활 서비스 이전 항목이 필요합니다.");
  requirePattern("address-change", run.relative, sections.get("주소 변경") ?? "", /주소|우편|금융|보험|고용|학교|의료|address|mail|bank|insurance|employer|school|medical/i, "주소 변경 대상과 확인 방법이 필요합니다.");
  requirePattern("inventory", run.relative, sections.get("재고") ?? "", /(?:^|\n)\s*(?:[-*]|\|).*(?:\d+|수량|quantity)/im, "재고에는 품목과 수량을 확인할 수 있는 목록이 필요합니다.");
  requirePattern("measurements", run.relative, sections.get("치수 및 반입") ?? "", /\b\d+(?:\.\d+)?\s*(?:mm|cm|m|in|inch(?:es)?|ft|feet)\b/i, "가구와 반입 경로의 실제 또는 가정 치수와 단위가 필요합니다.");
  requirePattern("disposal", run.relative, sections.get("처분 및 기부") ?? "", /처분|기부|재활용|폐기|dispose|donat|recycl|discard/i, "처분·기부 방법과 책임을 기록해야 합니다.");
  requirePattern("budget", run.relative, sections.get("예산") ?? "", money, "예산에는 범주별 금액과 통화가 필요합니다.");
  requirePattern("valuables", run.relative, sections.get("귀중품") ?? "", /담당|책임|인계|직접 운반|owner|responsib|handoff|carry/i, "귀중품의 책임자와 인계 방법이 필요합니다.");
  requirePattern("contingency-trigger", run.relative, sections.get("비상 계획") ?? "", /trigger|트리거|발생 조건|경우|지연|취소|파손|실패/i, "비상 계획에는 trigger 또는 발생 조건이 필요합니다.");
  requirePattern("contingency-action", run.relative, sections.get("비상 계획") ?? "", /대체|대응|연락|action|alternative|contact/i, "비상 계획에는 대체 행동과 연락 순서가 필요합니다.");
  requirePattern("completion-checklist", run.relative, sections.get("완료 체크리스트") ?? "", /^\s*[-*]\s+\[[ xX]\]\s+\S/m, "완료 검증에는 Markdown 체크박스가 필요합니다.");
  validateSources(run, sections.get("법률 및 지역 요건") ?? "");
}

function validateRun(run) {
  scanPolicy(run.relative, run.text);
  const language = field(run.text, "Language").toLowerCase();
  if (!/^(?:ko|en)$/.test(language)) addFailure("invalid-language", run.relative, "Language는 ko 또는 en이어야 합니다.");
  const bodies = new Map();
  for (const [label, aliases] of manifestSections) {
    if (sectionCount(run.text, aliases) > 1) {
      addFailure("duplicate-section", run.relative, `singleton section이 중복되었습니다: ${label}`);
    }
    const body = section(run.text, aliases);
    bodies.set(label, body);
    if (!body) addFailure("manifest-section-missing", run.relative, `필수 section이 없습니다: ${label}`);
    else if (label !== "Target Files" && !hasEvidence(body)) addFailure("manifest-evidence", run.relative, `구체적인 증거가 없습니다: ${label}`);
  }

  const basics = bodies.get("이사 기본 정보") ?? "";
  const moveDate = valueFor(basics, ["이사일", "Move Date"]);
  const origin = valueFor(basics, ["출발지", "Origin"]);
  const destination = valueFor(basics, ["도착지", "Destination"]);
  if (!/\b20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/.test(moveDate)) addFailure("move-date", run.relative, "이사일은 YYYY-MM-DD 형식으로 기록해야 합니다.");
  if (origin.length < 2) addFailure("origin", run.relative, "출발지를 구체적으로 기록해야 합니다.");
  if (destination.length < 2) addFailure("destination", run.relative, "도착지를 구체적으로 기록해야 합니다.");

  const constraints = bodies.get("가구 및 제약") ?? "";
  requirePattern("household-constraints", run.relative, constraints, /가구|성인|아동|반려|접근성|엘리베이터|계단|household|adult|child|pet|accessibility|elevator|stairs/i, "가구 구성과 이사 제약을 기록해야 합니다.");

  const timelineEvidence = bodies.get("일정 증거") ?? "";
  for (const [label, pattern] of [["D-30", /\bD-30\b/i], ["D-14", /\bD-14\b/i], ["D-7", /\bD-7\b/i], ["D-1", /\bD-1\b/i], ["당일", /당일|day[- ]of/i], ["이사 후", /이사\s*후|after (?:the )?move|post[- ]move/i]]) {
    if (!pattern.test(timelineEvidence)) addFailure("timeline-evidence", run.relative, `manifest 일정 증거에 ${label}가 필요합니다.`);
  }

  const targets = readTargets(run);
  for (const target of targets) scanPolicy(target.relative, target.text);
  if (targets.length > 0) validateMovingOutput(run, targets);
}

function reportAndExit(mode, runCount) {
  if (failures.length > 0) {
    console.error(`${title} harness 실패 (${failures.length}건)`);
    for (const failure of failures) {
      console.error(`- [${safeTerminal(failure.rule)}] ${safeTerminal(failure.file)}: ${safeTerminal(failure.detail)}`);
    }
    process.exitCode = 1;
    return;
  }
  if (mode === "discover" && runCount === 0) console.log(`${title} harness: 활성 run 없음. Ready.`);
  else console.log(`${title} harness: 통과.`);
}

function main() {
  const argumentsResult = parseArguments(process.argv.slice(2));
  if (argumentsResult.mode === "invalid") return reportAndExit("invalid", 0);

  if (argumentsResult.mode === "explicit") {
    const run = explicitRun(argumentsResult.manifest);
    if (run) validateRun(run);
    return reportAndExit("explicit", run ? 1 : 0);
  }

  const runs = discoverActiveRuns();
  if (runs.length > 1) {
    addFailure("multiple-active-runs", runRoot, `활성 run은 0개 또는 1개여야 하지만 ${runs.length}개입니다.`);
  } else if (runs.length === 1 && runs[0]) {
    validateRun(runs[0]);
  }
  reportAndExit("discover", runs.length);
}

main();
