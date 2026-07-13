#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";

const root = fs.realpathSync(process.cwd());
const title = "Home Setup";
const slug = "home-setup";
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
  ["가구·스타일·제약", ["가구·스타일·제약", "Household, Style, And Constraints", "Household, Style, and Constraints"]],
  ["공간 치수 근거", ["공간 치수 근거", "Room Measurement Evidence"]],
  ["보유·필요 품목 근거", ["보유·필요 품목 근거", "Owned And Needed Inventory Evidence", "Owned and Needed Inventory Evidence"]],
  ["기능 구역 및 우선순위", ["기능 구역 및 우선순위", "Functional Zones And Priorities", "Functional Zones and Priorities"]],
  ["예산 가정", ["예산 가정", "Budget Assumptions"]],
  ["배치·간격 검증", ["배치·간격 검증", "Fit And Clearance Validation", "Fit and Clearance Validation"]],
  ["전원·네트워크·안전", ["전원·네트워크·안전", "Power, Network, And Safety", "Power, Network, and Safety"]],
  ["구매 순서 및 보류", ["구매 순서 및 보류", "Purchase Sequence And Deferrals", "Purchase Sequence and Deferrals"]],
  ["의사결정 기록", ["의사결정 기록", "Decision Log"]],
  ["출처", ["출처", "Sources"]],
  ["사실·가정·권고", ["사실·가정·권고", "Facts, Assumptions, And Recommendations", "Facts, Assumptions, and Recommendations"]],
  ["개인정보 최소화", ["개인정보 최소화", "Data Minimization And Privacy", "Data Minimization and Privacy"]],
  ["검증 결과", ["검증 결과", "Validation Results"]],
];

const outputSections = [
  ["가구·스타일·제약", ["가구·스타일·제약", "Household, Style, And Constraints", "Household, Style, and Constraints"]],
  ["방별 치수", ["방별 치수", "Room Measurements"]],
  ["보유 품목", ["보유 품목", "Owned Inventory"]],
  ["필요 품목", ["필요 품목", "Needed Inventory"]],
  ["기능 구역", ["기능 구역", "Functional Zones"]],
  ["우선순위", ["우선순위", "Priorities"]],
  ["방별·범주별 예산", ["방별·범주별 예산", "Budget By Room And Category", "Budget by Room and Category"]],
  ["구매 순서", ["구매 순서", "Purchase Sequence"]],
  ["적합성 및 간격 검사", ["적합성 및 간격 검사", "Fit And Clearance Checks", "Fit and Clearance Checks"]],
  ["전원·네트워크·안전", ["전원·네트워크·안전", "Power, Network, And Safety", "Power, Network, and Safety"]],
  ["보류 목록", ["보류 목록", "Defer List"]],
  ["의사결정 기록", ["의사결정 기록", "Decision Log"]],
];

const dimensionPattern = /\b\d+(?:\.\d+)?\s*(?:mm|cm|m|in|inch(?:es)?|ft|feet)\b/i;
const moneyPattern = /(?:₩|\bKRW\b|\bUSD\b|\$|€|£|¥|\d[\d,]*(?:\.\d+)?\s*원)/i;

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
  const match = relative.match(/^\.opendock\/runs\/home-setup\/([A-Za-z0-9][A-Za-z0-9._-]{0,79})\/manifest\.md$/);
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
    addFailure("manifest-argument", "check.mjs", "명시 manifest는 .opendock/runs/home-setup/<run-id>/manifest.md 형식의 안전한 상대 경로여야 합니다.");
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
  if (listed.length === 0) addFailure("target-list-empty", run.relative, "Target Files에 home-setup/ 파일을 하나 이상 선언해야 합니다.");
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

function validateReasoningAndSources(run) {
  const sources = section(run.text, ["출처", "Sources"]);
  requirePattern("source-url", run.relative, sources, /https:\/\/[^\s)>]+/i, "제품·안전·추천 근거에 HTTPS 출처 URL이 필요합니다.");
  requirePattern("source-date", run.relative, sources, /\b20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/, "출처에는 YYYY-MM-DD 조회일이 필요합니다.");

  const reasoning = section(run.text, ["사실·가정·권고", "Facts, Assumptions, And Recommendations", "Facts, Assumptions, and Recommendations"]);
  if (!valueFor(reasoning, ["사실", "Fact", "Facts"])) addFailure("facts", run.relative, "사실 항목을 구체적으로 기록해야 합니다.");
  const dimensionAssumption = valueFor(reasoning, ["치수 가정", "Dimension Assumption", "Dimension Assumptions"]);
  if (!dimensionPattern.test(dimensionAssumption)) {
    addFailure("recommendation-dimension-assumption", run.relative, "권고에는 단위가 있는 구체적인 치수 가정이 필요합니다.");
  }
  const budgetAssumption = valueFor(reasoning, ["예산 가정", "Budget Assumption", "Budget Assumptions"]);
  if (!moneyPattern.test(budgetAssumption)) {
    addFailure("recommendation-budget-assumption", run.relative, "권고에는 금액과 통화가 있는 예산 가정이 필요합니다.");
  }
  if (!valueFor(reasoning, ["권고", "Recommendation", "Recommendations"])) addFailure("recommendations", run.relative, "권고 항목과 근거를 기록해야 합니다.");
}

function validateHomeOutput(run, targets) {
  const sections = new Map();
  for (const [label, aliases] of outputSections) {
    const body = outputSection(targets, aliases);
    sections.set(label, body);
    if (!body) addFailure("output-section-missing", run.relative, `선언된 Markdown 결과에 필수 section이 없습니다: ${label}`);
    else if (!hasEvidence(body)) addFailure("output-evidence", run.relative, `결과 section에 구체적인 내용이 없습니다: ${label}`);
  }

  const household = sections.get("가구·스타일·제약") ?? "";
  requirePattern("household", run.relative, household, /가구|성인|아동|반려|household|adult|child|pet/i, "가구 구성과 사용자를 기록해야 합니다.");
  requirePattern("style", run.relative, household, /스타일|재료|색|관리|style|material|color|maintenance/i, "스타일과 관리 조건을 기록해야 합니다.");
  requirePattern("constraints", run.relative, household, /제약|임대|접근성|안전|constraint|rental|accessibility|safety/i, "생활·임대·접근성·안전 제약을 기록해야 합니다.");

  const measurements = sections.get("방별 치수") ?? "";
  requirePattern("room-measurements", run.relative, measurements, dimensionPattern, "방과 출입 경로에 단위가 있는 실측 또는 가정 치수가 필요합니다.");
  requirePattern("measurement-scope", run.relative, measurements, /방|거실|침실|주방|문|복도|room|living|bedroom|kitchen|door|hall/i, "치수가 적용되는 방 또는 출입 경로를 명시해야 합니다.");

  requirePattern("owned-inventory", run.relative, sections.get("보유 품목") ?? "", /(?:^|\n)\s*(?:[-*]|\|).*(?:\d+|수량|quantity)/im, "보유 품목에는 품목과 수량을 확인할 수 있는 목록이 필요합니다.");
  requirePattern("needed-inventory", run.relative, sections.get("필요 품목") ?? "", /(?:^|\n)\s*(?:[-*]|\|).*(?:필요|기능|예산|need|function|budget)/im, "필요 품목에는 해결할 기능이나 예산 기준이 필요합니다.");
  requirePattern("functional-zones", run.relative, sections.get("기능 구역") ?? "", /수면|업무|식사|수납|휴식|동선|sleep|work|dining|storage|rest|flow/i, "방별 기능 구역과 동선을 기록해야 합니다.");
  requirePattern("priorities", run.relative, sections.get("우선순위") ?? "", /\bP[0-3]\b|높음|중간|낮음|필수|안전 우선|high|medium|low|must|safety first/i, "우선순위 수준과 기준을 기록해야 합니다.");

  const budget = sections.get("방별·범주별 예산") ?? "";
  requirePattern("budget-money", run.relative, budget, moneyPattern, "예산에는 금액과 통화가 필요합니다.");
  requirePattern("budget-room", run.relative, budget, /방|거실|침실|주방|room|living|bedroom|kitchen/i, "예산을 방별로 구분해야 합니다.");
  requirePattern("budget-category", run.relative, budget, /범주|가구|조명|수납|네트워크|안전|category|furniture|lighting|storage|network|safety/i, "예산을 범주별로 구분해야 합니다.");

  requirePattern("purchase-sequence", run.relative, sections.get("구매 순서") ?? "", /(?:^|\n)\s*(?:\d+\.|[-*]\s*(?:1단계|2단계|phase|step))/im, "구매·설치 순서와 선행 조건을 단계로 기록해야 합니다.");
  const fit = sections.get("적합성 및 간격 검사") ?? "";
  requirePattern("fit-dimensions", run.relative, fit, dimensionPattern, "fit·clearance 검사에는 단위가 있는 제품·경로 치수가 필요합니다.");
  requirePattern("clearance", run.relative, fit, /여유|통로|문 열림|서랍|회전|반입|clearance|aisle|door swing|drawer|turn|access/i, "사용 간격과 반입·문·서랍 동작 검사가 필요합니다.");

  const safety = sections.get("전원·네트워크·안전") ?? "";
  requirePattern("power", run.relative, safety, /전원|콘센트|접지|부하|power|outlet|ground|load/i, "전원·부하·접지 확인이 필요합니다.");
  requirePattern("network", run.relative, safety, /네트워크|공유기|유선|wi-?fi|network|router|ethernet/i, "네트워크 위치와 경로 계획이 필요합니다.");
  requirePattern("safety", run.relative, safety, /안전|피난|전도|소방|아동|반려|safety|egress|tip[- ]over|fire|child|pet/i, "피난·전도·가구별 안전 검토가 필요합니다.");

  requirePattern("defer-list", run.relative, sections.get("보류 목록") ?? "", /보류|근거|해제 조건|책임자|defer|evidence|release condition|owner/i, "보류 항목에는 부족한 근거와 해제 조건이 필요합니다.");
  const decision = sections.get("의사결정 기록") ?? "";
  requirePattern("decision-date", run.relative, decision, /\b20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/, "결정 기록에는 결정일이 필요합니다.");
  requirePattern("decision-rationale", run.relative, decision, /근거|이유|대안|영향|rationale|reason|alternative|impact/i, "결정 기록에는 대안과 이유 또는 영향을 기록해야 합니다.");
  validateReasoningAndSources(run);
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

  const profile = bodies.get("가구·스타일·제약") ?? "";
  requirePattern("manifest-household", run.relative, profile, /가구|성인|아동|반려|household|adult|child|pet/i, "manifest에 가구 구성이 필요합니다.");
  requirePattern("manifest-style", run.relative, profile, /스타일|재료|색|관리|style|material|color|maintenance/i, "manifest에 스타일과 관리 조건이 필요합니다.");
  requirePattern("manifest-constraints", run.relative, profile, /제약|임대|접근성|안전|constraint|rental|accessibility|safety/i, "manifest에 생활·임대·안전 제약이 필요합니다.");
  requirePattern("manifest-measurements", run.relative, bodies.get("공간 치수 근거") ?? "", dimensionPattern, "manifest에 단위가 있는 방·경로·가구 치수 근거가 필요합니다.");
  requirePattern("manifest-budget", run.relative, bodies.get("예산 가정") ?? "", moneyPattern, "manifest에 금액과 통화가 있는 예산 가정이 필요합니다.");

  const targets = readTargets(run);
  for (const target of targets) scanPolicy(target.relative, target.text);
  if (targets.length > 0) validateHomeOutput(run, targets);
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
