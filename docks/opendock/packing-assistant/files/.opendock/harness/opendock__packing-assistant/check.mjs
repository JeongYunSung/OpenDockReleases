#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const slug = "packing-assistant";
const title = "Packing Assistant";
const outputRoot = "packing";
const root = fs.realpathSync(process.cwd());
const activeStatuses = new Set(["draft", "active", "in-progress", "review", "ready"]);
const credentialFormat = /\b(?:github_pat_[A-Za-z0-9_]{20,}|npm_[A-Za-z0-9]{36,}|glpat-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{35})\b/;
const blockedSegments = new Set([".git", ".ssh", ".agents", ".opendock", ".codex", ".claude", ".env", "node_modules"]);
const allowedExtensions = new Set([".md", ".txt"]);
const maxManifestBytes = 256 * 1024;
const maxTargetBytes = 1024 * 1024;
const maxTargets = 20;
const targetHeading = "대상 파일 (Target Files)";
const sourceHeading = "날씨·규정 출처 (Weather and Policy Sources)";
const factHeading = "사실·가정·추천 구분 (Facts, Assumptions, Recommendations)";
const requiredSections = [
  "목적지·날짜·날씨 (Destination, Dates, Weather)",
  sourceHeading,
  "활동·숙소·교통 (Activities, Lodging, Transport)",
  "수하물·의료 제약 (Baggage and Medical Constraints)",
  "수량·재착용·세탁 근거 (Quantities, Rewear, Laundry Evidence)",
  "서류·전자·의약품 주의 (Documents, Electronics, Medication Caveats)",
  "출발 직전·현지 구매 (Last-minute and Local Buy)",
  factHeading,
  "개인정보 최소화·가림 (Data Minimization and Redaction)",
  targetHeading,
  "검증 결과 (Validation)",
];
const outputHeadings = [
  ["목적지·날짜·날씨", /목적지.*날짜.*날씨|목적지.*날씨.*날짜|destination.*dates?.*weather|destination.*weather.*dates?/i],
  ["활동·숙소·교통", /활동.*숙소.*교통|활동.*교통.*숙소|activities?.*lodging.*transport|activities?.*transport.*lodging/i],
  ["수하물·의료 제약", /수하물.*의료 제약|의료 제약.*수하물|baggage.*medical constraints?|medical constraints?.*baggage/i],
  ["의류", /의류|clothing/i],
  ["위생", /위생|toiletries|hygiene/i],
  ["서류", /서류|documents/i],
  ["전자기기", /전자기기|전자 기기|electronics/i],
  ["의약품", /의약품|약품|medications?/i],
  ["재착용·세탁", /재착용.*세탁|세탁.*재착용|rewear.*laundry|laundry.*rewear/i],
  ["출발 직전", /출발 직전|last-minute/i],
  ["현지 구매", /현지 구매|local buy|buy locally/i],
  ["출처와 접근일", /출처.*접근일|접근일.*출처|sources?.*access dates?|access dates?.*sources?/i],
  ["사실·가정·추천", /사실.*가정.*추천|사실·가정·추천|facts?.*assumptions?.*recommendations?/i],
  ["개인정보", /개인정보.*(?:최소화|가림)|(?:최소화|가림).*개인정보|data minimization.*redaction|privacy.*redaction/i],
];
const failures = [];

function display(file) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  return relative && !relative.startsWith("..") ? relative : String(file);
}

function terminalSafe(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (character) => {
    return `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
  });
}

function fail(rule, file, detail) {
  if (failures.some((item) => item.rule === rule && item.file === file && item.detail === detail)) return;
  failures.push({ rule, file, detail });
}

function lstat(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function insideProject(file) {
  const relative = path.relative(root, file);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function parseField(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return topLevelText(text).match(new RegExp(`^${escaped}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";
}

function fenceOpening(line) {
  const opening = line.match(/^ {0,3}(?:(?:[-+*]|[0-9]{1,9}[.)])[ \t]+)?(`{3,}|~{3,})(.*)$/);
  if (!opening || (opening[1][0] === "`" && opening[2].includes("`"))) return null;
  return { marker: opening[1][0], length: opening[1].length };
}

function closesFence(line, fence) {
  const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(closing && closing[1][0] === fence.marker && closing[1].length >= fence.length);
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
    const opening = fenceOpening(line);
    if (opening) {
      fence = opening;
      kept.push("");
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function stripManagedBlocks(text) {
  const kept = [];
  let managed = false;
  for (const line of String(text).split(/\r?\n/)) {
    if (!managed && /^\s*<!--\s*OPENDOCK:START\b[^>]*-->\s*$/i.test(line)) {
      managed = true;
      kept.push("");
      continue;
    }
    if (managed) {
      if (/^\s*<!--\s*OPENDOCK:END\b[^>]*-->\s*$/i.test(line)) managed = false;
      kept.push("");
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function stripHtmlComments(text) {
  return String(text).replace(
    /<!--[\s\S]*?(?:-->|$)/g,
    (comment) => comment.replace(/[^\r\n]/g, ""),
  );
}

function structuralText(text) {
  return stripFencedBlocks(stripHtmlComments(stripManagedBlocks(text)));
}

function topLevelText(text) {
  const lines = structuralText(text).split(/\r?\n/);
  const firstHeading = lines.findIndex((line) => /^ {0,3}#{2,6}(?:[ \t]+|$)/.test(line));
  return lines.slice(0, firstHeading < 0 ? lines.length : firstHeading).join("\n");
}

function normalizeHeading(value) {
  return String(value).trim().replace(/\s+#+\s*$/, "").replace(/\s+/g, " ").toLowerCase();
}

function headingAliases(heading) {
  const aliases = new Set();
  for (const value of Array.isArray(heading) ? heading : [heading]) {
    aliases.add(normalizeHeading(value));
    const bilingual = String(value).match(/^(.+?)\s*\(([^()]+)\)\s*$/);
    if (bilingual) {
      aliases.add(normalizeHeading(bilingual[1]));
      aliases.add(normalizeHeading(bilingual[2]));
    }
  }
  return aliases;
}

function sectionBodies(text, heading) {
  const lines = structuralText(text).split(/\r?\n/);
  const wanted = headingAliases(heading);
  const bodies = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^ {0,3}##[ \t]+(.+?)[ \t]*$/);
    if (!match || !wanted.has(normalizeHeading(match[1]))) continue;
    let end = index + 1;
    while (end < lines.length && !/^ {0,3}##(?:[ \t]+|$)/.test(lines[end])) end += 1;
    bodies.push(lines.slice(index + 1, end).join("\n").trim());
  }
  return bodies;
}

function section(text, heading) {
  return sectionBodies(text, heading)[0] ?? "";
}

function analysisText(text) {
  const kept = [];
  let fence = null;
  let activeFence = false;
  let previous = "";
  for (const line of text.split(/\r?\n/)) {
    if (fence !== null) {
      if (closesFence(line, fence)) {
        fence = null;
        activeFence = false;
      } else if (activeFence) {
        kept.push(line);
      }
      continue;
    }
    const opening = fenceOpening(line);
    if (opening) {
      activeFence = /(?:실행|run|execute)[^.\n]{0,40}(?:하세요|하라|해라|명령|command)/i.test(previous)
        && !/(?:금지|실행하지|하지 마|예시|분석|인용|do not|example|quote)/i.test(previous);
      fence = opening;
      continue;
    }
    previous = line;
    if (/^\s*>/.test(line)) continue;
    if (/^\s*(?:인용|원문 인용|분석|안전한 예시|금지 예시|quote|evidence quote|analysis)\s*:/i.test(line)) continue;
    const activeInline = /(?:실행|run|execute)[^.\n]{0,40}(?:하세요|하라|해라|명령|command)/i.test(line)
      && !/(?:금지|실행하지|하지 마|예시|분석|인용|do not|example|quote)/i.test(line);
    kept.push(activeInline ? line.replaceAll("`", "") : line.replace(/`[^`\n]*`/g, ""));
  }
  return kept.join("\n");
}

function hasEvidence(text) {
  const cleaned = analysisText(text).trim();
  return cleaned.length >= 16 && !/(?:\bTODO\b|\bTBD\b|\breplace-me\b|\bpending\b|작성하세요|여기에\s*입력)/i.test(cleaned);
}

function scanActiveContent(text, file) {
  const cleaned = analysisText(text);
  if (/(?:\bTODO\b|\bTBD\b|\breplace-me\b|\bpending\b|작성하세요|여기에\s*입력)/i.test(cleaned)) {
    fail("placeholder", file, "활성 근거 또는 산출물에 미완성 표시가 있습니다.");
  }
  for (const line of cleaned.split(/\r?\n/)) {
    if (credentialFormat.test(line)
      || /^\s*(?:[-*]\s*)?(?:api[_ -]?key|access[_ -]?token|auth[_ -]?token|secret|password|비밀번호|토큰)\s*[:=]\s*(?!(?:가림|삭제|미수집|없음|redacted|\*{3,})\b)["']?[A-Za-z0-9_./+=-]{12,}/i.test(line)
      || /^\s*-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) {
      fail("credential", file, "실제 비밀값처럼 보이는 할당 또는 개인 키가 있습니다.");
    }
    if (/^\s*(?:[-*]\s*)?(?:(?:반드시\s+)?(?:이전|상위|시스템|개발자|사용자)\s*(?:지시|명령|규칙)(?:을|를)?\s*(?:무시|우회|덮어쓰)(?:하라|하세요|해라|한다)|(?:ignore|disregard|override)\s+(?:all\s+)?(?:previous|prior|system|developer|user)\s+(?:instructions|messages))/i.test(line)
      || /^\s*(?:[-*]\s*)?.*(?:비밀|자격 증명|시스템 프롬프트)(?:을|를)?\s*(?:공개|출력|전송)(?:하라|하세요|해라)/i.test(line)) {
      fail("prompt-injection", file, "분석 인용이 아닌 명령형 prompt injection 문구가 있습니다.");
    }
    if (/^\s*(?:[-*]\s*)?(?:실행(?:하라|하세요|해라)?\s*:?\s*)?(?:su(?:do)\s+)?rm\s+(?:-(?=[A-Za-z]*r)(?=[A-Za-z]*f)[A-Za-z]+|-(?=[A-Za-z]*r)[A-Za-z]+\s+-(?=[A-Za-z]*f)[A-Za-z]+|-(?=[A-Za-z]*f)[A-Za-z]+\s+-(?=[A-Za-z]*r)[A-Za-z]+|--recursive\s+--force|--force\s+--recursive)\s+(?:\/|~|\*|\.)/i.test(line)
      || /^\s*(?:[-*]\s*)?git\s+reset\s+--hard\b/i.test(line)
      || /^\s*(?:[-*]\s*)?(?:Remove-Item\b.*-Recurse\b.*-Force\b|format\s+[A-Za-z]:|del\s+\/s\s+\/q\b)/i.test(line)) {
      fail("destructive-command", file, "실행형 파괴 명령이 있습니다.");
    }
    if (/^\s*(?:[-*]\s*)?(?:여권\s*번호|passport number|예약\s*코드|booking reference|주민등록번호)\s*[:=]\s*(?!(?:가림|별도 보관|redacted|\*{3,})\b)[A-Z0-9-]{6,}/i.test(line)) {
      fail("personal-data", file, "공유 산출물에 직접 식별정보 또는 예약 식별자가 있습니다.");
    }
    const privateValue = line.match(/^\s*(?:[-*]\s*)?(?:상세\s*주소|숙소\s*주소|자택\s*주소|home address|lodging address|개인\s*연락처|personal (?:phone|email))\s*[:=]\s*(.{4,})\s*$/i)?.[1]?.trim();
    if (privateValue && !/^(?:가림|미수집|별도 보관|redacted|not collected|\*{3,})(?:\s|$|[.,;:])/i.test(privateValue)) {
      fail("personal-data", file, "공유 산출물에 불필요한 상세 주소 또는 개인 연락처가 있습니다.");
    }
  }
}

function hasSymlinkSegment(relative) {
  let current = root;
  for (const segment of relative.replaceAll("\\", "/").split("/")) {
    if (!segment) continue;
    current = path.join(current, segment);
    const stat = lstat(current);
    if (!stat) return false;
    if (stat.isSymbolicLink()) return true;
  }
  return false;
}

function runRootOrNull() {
  let current = root;
  for (const segment of [".opendock", "runs", slug]) {
    current = path.join(current, segment);
    const stat = lstat(current);
    if (!stat) return null;
    if (stat.isSymbolicLink()) {
      fail("run-root-symlink", display(current), "run 경로에 심볼릭 링크를 사용할 수 없습니다.");
      return null;
    }
    if (!stat.isDirectory()) {
      fail("run-root-type", display(current), "run 경로는 디렉터리여야 합니다.");
      return null;
    }
  }
  return current;
}

function statusPrefix(file, size) {
  const length = Math.min(size, 64 * 1024);
  const buffer = Buffer.alloc(length);
  const descriptor = fs.openSync(file, "r");
  try {
    const bytes = fs.readSync(descriptor, buffer, 0, length, 0);
    return buffer.subarray(0, bytes).toString("utf8");
  } finally {
    fs.closeSync(descriptor);
  }
}

function discoverActiveRuns() {
  const runRoot = runRootOrNull();
  if (!runRoot) return [];
  const runs = [];
  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const runDirectory = path.join(runRoot, entry.name);
    if (entry.isSymbolicLink()) {
      fail("run-directory-symlink", display(runDirectory), "run 디렉터리는 심볼릭 링크일 수 없습니다.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    const manifest = path.join(runDirectory, "manifest.md");
    const stat = lstat(manifest);
    if (!stat) continue;
    if (stat.isSymbolicLink()) {
      fail("run-manifest-symlink", display(manifest), "manifest는 심볼릭 링크일 수 없습니다.");
      continue;
    }
    if (!stat.isFile()) continue;
    const status = parseField(statusPrefix(manifest, stat.size), "Status").toLowerCase();
    if (activeStatuses.has(status)) runs.push({ file: manifest, status });
  }
  return runs;
}

function explicitManifest(argument) {
  if (!argument || argument.includes("\0") || path.isAbsolute(argument) || /^(?:[A-Za-z]:[\\/]|[\\/]{2})/.test(argument)) {
    fail("manifest-path", argument || "<empty>", "manifest 인자는 프로젝트 내부 상대 경로여야 합니다.");
    return null;
  }
  const normalized = argument.replaceAll("\\", "/");
  const parts = normalized.split("/");
  if (parts.length !== 5 || parts[0] !== ".opendock" || parts[1] !== "runs" || parts[2] !== slug
    || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(parts[3]) || parts[3].includes("..") || parts[4] !== "manifest.md") {
    fail("manifest-path", argument, `manifest는 .opendock/runs/${slug}/<run-id>/manifest.md 형식이어야 합니다.`);
    return null;
  }
  if (parts.some((part) => part === "." || part === "..") || hasSymlinkSegment(normalized)) {
    fail("manifest-symlink", argument, "manifest 경로에 상위 이동 또는 심볼릭 링크를 사용할 수 없습니다.");
    return null;
  }
  return path.resolve(root, normalized);
}

function loadManifest(file) {
  const name = display(file);
  const stat = lstat(file);
  if (!stat) {
    fail("run-manifest-missing", name, "manifest 파일이 없습니다.");
    return null;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("run-manifest-type", name, "manifest는 심볼릭 링크가 아닌 일반 파일이어야 합니다.");
    return null;
  }
  if (!insideProject(file) || fs.realpathSync(file) !== file) {
    fail("run-manifest-path", name, "manifest가 프로젝트 경계를 벗어났습니다.");
    return null;
  }
  if (stat.size > maxManifestBytes) {
    fail("run-manifest-size", name, `manifest는 ${maxManifestBytes}바이트 이하여야 합니다.`);
    return null;
  }
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) {
    fail("run-manifest-binary", name, "manifest에 NUL 바이트가 있습니다.");
    return null;
  }
  try {
    return { file, text: new TextDecoder("utf-8", { fatal: true }).decode(buffer) };
  } catch {
    fail("run-manifest-encoding", name, "manifest는 유효한 UTF-8 텍스트여야 합니다.");
    return null;
  }
}

function safeTarget(relative) {
  if (String(relative).includes("\\")) return false;
  if (!relative || relative.includes("\0") || path.isAbsolute(relative) || /^(?:[A-Za-z]:[\\/]|[\\/]{2})/.test(relative)) return false;
  const normalized = relative.replaceAll("\\", "/");
  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || blockedSegments.has(part.toLowerCase()) || part.toLowerCase().startsWith(".env."))) return false;
  if (parts[0] !== outputRoot || !allowedExtensions.has(path.posix.extname(normalized).toLowerCase())) return false;
  const resolved = path.resolve(root, normalized);
  return insideProject(resolved);
}

function extractTargets(text) {
  const targets = [];
  for (const line of section(text, targetHeading).split(/\r?\n/)) {
    const match = line.match(/^\s*[-*]\s+`?([^`]+?)`?\s*$/);
    if (match) targets.push(match[1].trim());
  }
  return [...new Set(targets)];
}

function readTargets(manifest, paths) {
  const targets = [];
  for (const relative of paths) {
    if (!safeTarget(relative)) {
      fail("target-path", display(manifest), `안전하지 않거나 범위를 벗어난 대상 경로: ${relative}`);
      continue;
    }
    if (hasSymlinkSegment(relative)) {
      fail("target-symlink", relative, "대상 경로에 심볼릭 링크를 사용할 수 없습니다.");
      continue;
    }
    const file = path.resolve(root, relative);
    const stat = lstat(file);
    if (!stat) {
      fail("target-missing", relative, "선언된 대상 파일이 없습니다.");
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) {
      fail("target-type", relative, "대상은 심볼릭 링크가 아닌 일반 파일이어야 합니다.");
      continue;
    }
    if (stat.size > maxTargetBytes) {
      fail("target-size", relative, `대상은 ${maxTargetBytes}바이트 이하여야 합니다.`);
      continue;
    }
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) {
      fail("target-binary", relative, "대상 파일에 NUL 바이트가 있습니다.");
      continue;
    }
    try {
      targets.push({ relative, text: new TextDecoder("utf-8", { fatal: true }).decode(buffer) });
    } catch {
      fail("target-encoding", relative, "대상 파일은 유효한 UTF-8 텍스트여야 합니다.");
    }
  }
  return targets;
}

function dayValue(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(value) || new Date(value).toISOString().slice(0, 10) !== date) return null;
  return Math.floor(value / 86400000);
}

function validateFreshDate(date, rule, file, label, maxAgeDays) {
  const value = dayValue(date);
  const today = Math.floor(Date.now() / 86400000);
  if (value === null || value > today + 1 || today - value > maxAgeDays) {
    fail(rule, file, `${label}은 유효하고 최근 ${maxAgeDays}일 이내인 ISO 날짜여야 합니다.`);
  }
}

function validateCreatedDate(date, file) {
  const value = dayValue(date);
  const today = Math.floor(Date.now() / 86400000);
  if (value === null || value > today + 1) fail("run-created", file, "Created는 유효한 미래가 아닌 ISO 날짜여야 합니다.");
}

function validateSources(run) {
  const file = display(run.file);
  const body = section(run.text, sourceHeading);
  const sourceLines = body.split(/\r?\n/).filter((line) => /https:\/\//i.test(line));
  if (sourceLines.length < 2) {
    fail("source-count", file, "날씨와 수하물·반입 규정을 위한 HTTPS 출처가 두 개 이상 필요합니다.");
  }
  for (const line of sourceLines) {
    if (/https:\/\/(?:www\.)?(?:example\.(?:com|org|net)|localhost)(?:[/:]|$)/i.test(line)) {
      fail("source-placeholder", file, "예시 도메인이나 localhost는 실제 출처로 사용할 수 없습니다.");
    }
    const date = line.match(/(?:접근일|accessed)\s*:?\s*(\d{4}-\d{2}-\d{2})/i)?.[1];
    if (!date) fail("source-access-date", file, "각 출처 줄에 접근일 ISO 날짜가 필요합니다.");
    else validateFreshDate(date, "source-freshness", file, "출처 접근일", 90);
  }
}

function hasHeading(text, pattern) {
  return structuralText(text).split(/\r?\n/).some((line) => {
    const heading = line.match(/^ {0,3}#{1,6}[ \t]+(.+?)[ \t]*$/);
    return Boolean(heading && pattern.test(heading[1]));
  });
}

function validateOutput(targets, run) {
  if (targets.length === 0) return;
  const combined = targets.map((target) => target.text).join("\n");
  const cleaned = analysisText(combined);
  for (const [label, pattern] of outputHeadings) {
    if (!hasHeading(combined, pattern)) fail("output-section", targets[0].relative, `산출물 섹션 누락: ${label}`);
  }
  const checkableQuantities = cleaned.match(/^\s*[-*]\s+\[[ xX]\].*\d+(?:\.\d+)?\s*(?:개|벌|장|켤레|세트|병|팩|부|일분|회분|units?|items?|pieces?|pairs?|sets?|bottles?|packs?|copies?|days?)/gim) ?? [];
  if (checkableQuantities.length < 8) {
    fail("packing-quantities", targets[0].relative, "카테고리별로 수량이 있는 체크 항목이 여덟 개 이상 필요합니다.");
  }
  if (!/\b\d+(?:\.\d+)?\s*kg\b/i.test(cleaned) && !/\b\d+\s*cm\b/i.test(cleaned)) {
    fail("baggage-limit", targets[0].relative, "수하물 제약에는 무게 또는 크기 수치가 필요합니다.");
  }
  if (!/(?:재착용|다시 입|rewear)/i.test(cleaned) || !/(?:세탁|빨래|laundry|wash)[^.\n]{0,50}(?:일|날|숙소|건조|day|hotel|lodging|dry)/i.test(cleaned)) {
    fail("rewear-laundry", targets[0].relative, "재착용 항목과 세탁 날짜·장소·건조 계획이 필요합니다.");
  }
  if (!/(?:의료진|약사|기존 처방|clinician|doctor|pharmacist|existing prescription)/i.test(cleaned) || !/(?:원래 용기|공식.*반입|세관|항공사|original container|official.*entry|customs|airline)/i.test(cleaned)) {
    fail("medication-caveat", targets[0].relative, "의약품에는 기존 처방·전문가 및 공식 운반·반입 확인 안내가 필요합니다.");
  }
  if (!/(?:출발 직전|last-minute)[\s\S]{0,500}[-*]\s+\[[ xX]\]/i.test(cleaned)) fail("last-minute-list", targets[0].relative, "출발 직전 체크 항목이 필요합니다.");
  if (!/(?:현지 구매|local buy|buy locally)[\s\S]{0,500}(?:가능|대안|구매하지 않|available|alternative|do not rely)/i.test(cleaned)) fail("local-buy-options", targets[0].relative, "현지 구매 가능 여부와 대안이 필요합니다.");
  if (!/(?:사실|Fact)\s*:/i.test(cleaned) || !/(?:가정|Assumption)\s*:/i.test(cleaned) || !/(?:추천|Recommendation)\s*:/i.test(cleaned)) {
    fail("fact-assumption-recommendation", targets[0].relative, "산출물에서 사실, 가정, 추천을 명시적으로 구분해야 합니다.");
  }
  const outputSources = cleaned.split(/\r?\n/).filter((line) => /https:\/\//i.test(line));
  if (outputSources.length < 2 || outputSources.some((line) => !/(?:접근일|accessed)\s*:?\s*\d{4}-\d{2}-\d{2}/i.test(line))) {
    fail("output-sources", targets[0].relative, "산출물에도 접근일이 대응된 날씨·규정 HTTPS 출처가 두 개 이상 필요합니다.");
  }
  const runUrls = new Set(section(run.text, sourceHeading).match(/https:\/\/[^\s)]+/gi) ?? []);
  for (const line of outputSources) {
    const date = line.match(/(?:접근일|accessed)\s*:?\s*(\d{4}-\d{2}-\d{2})/i)?.[1];
    const url = line.match(/https:\/\/[^\s)]+/i)?.[0];
    if (date) validateFreshDate(date, "output-source-freshness", targets[0].relative, "산출물 출처 접근일", 90);
    if (url && !runUrls.has(url)) fail("source-traceability", targets[0].relative, `산출물 출처가 run 근거에 없습니다: ${url}`);
  }
  if (/(?:복용량|약물?\s*용량)[^.\n]{0,30}(?:늘리|줄이|변경|조절)(?:라|세요|도록\s*하라|어라|한다)|(?:약|복용)[^.\n]{0,20}(?:중단|대체)(?:하라|하세요|해라)|(?:처방한다|prescribe|stop taking|change the dose)/i.test(cleaned)) {
    fail("medical-prescribing", targets[0].relative, "약물 용량 변경·중단·대체 또는 처방을 지시할 수 없습니다.");
  }
  if (/(?:날씨|기온|강수|수하물 규정)[^.\n]{0,35}(?:보장|절대 변하지|확정되어 있)|guaranteed\s+(?:weather|baggage)/i.test(cleaned)) {
    fail("unsupported-guarantee", targets[0].relative, "날씨 또는 수하물 규정의 불변성을 보장할 수 없습니다.");
  }
  const factBody = section(run.text, factHeading);
  for (const [label, pattern] of [["사실", /(?:사실|Fact)\s*:/i], ["가정", /(?:가정|Assumption)\s*:/i], ["추천", /(?:추천|Recommendation)\s*:/i]]) {
    if (!pattern.test(factBody)) fail("run-fact-separation", display(run.file), `${label} 근거가 분리되어 있지 않습니다.`);
  }
}

function validateRun(run) {
  const file = display(run.file);
  scanActiveContent(run.text, file);
  const status = parseField(run.text, "Status");
  if (!status) fail("run-status", file, "Status 필드가 필요합니다.");
  const language = parseField(run.text, "Language").toLowerCase();
  if (!/^(?:ko|en)$/.test(language)) fail("invalid-language", file, "Language는 ko 또는 en이어야 합니다.");
  const mode = parseField(run.text, "Mode");
  if (!mode) fail("run-mode", file, "Mode 필드가 필요합니다.");
  const created = parseField(run.text, "Created");
  validateCreatedDate(created, file);
  for (const heading of requiredSections) {
    const bodies = sectionBodies(run.text, heading);
    if (bodies.length > 1) fail("duplicate-section", file, `단일 실행 기록 섹션이 중복되었습니다: ${heading}`);
    const body = bodies[0] ?? "";
    if (!body) fail("run-section", file, `실행 기록 섹션 누락: ${heading}`);
    else if (heading !== targetHeading && !hasEvidence(body)) fail("run-evidence", file, `실행 근거가 비어 있거나 미완성입니다: ${heading}`);
  }
  validateSources(run);
  const targetPaths = extractTargets(run.text);
  if (targetPaths.length === 0) fail("target-list", file, `${outputRoot}/ 아래 대상 파일을 하나 이상 선언해야 합니다.`);
  if (targetPaths.length > maxTargets) fail("target-count", file, `대상 파일은 ${maxTargets}개 이하여야 합니다.`);
  const targets = readTargets(run.file, targetPaths.slice(0, maxTargets));
  for (const target of targets) scanActiveContent(target.text, target.relative);
  validateOutput(targets, run);
}

function finish(explicit, count) {
  console.log(`OpenDock 하네스: ${title}`);
  console.log(explicit ? "명시적 실행 기록: 1" : `활성 실행: ${count}`);
  if (failures.length > 0) {
    console.error(`${title} 검사 실패: ${failures.length}개`);
    for (const item of failures) console.error(`- [${terminalSafe(item.rule)}] ${terminalSafe(item.file)}: ${terminalSafe(item.detail)}`);
    process.exitCode = 1;
    return;
  }
  if (!explicit && count === 0) console.log("활성 실행이 없습니다. Ready.");
  else console.log(`${title} 검사 통과.`);
}

function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1) {
    fail("usage", "check.mjs", "선택적 manifest 경로 인자는 하나만 허용됩니다.");
    finish(false, 0);
    return;
  }
  if (arguments_.length === 1) {
    const file = explicitManifest(arguments_[0]);
    const run = file ? loadManifest(file) : null;
    if (run) validateRun(run);
    finish(true, run ? 1 : 0);
    return;
  }
  const discovered = discoverActiveRuns();
  if (discovered.length > 1) {
    fail("multiple-active-runs", `.opendock/runs/${slug}`, "활성 실행은 정확히 0개 또는 1개여야 합니다.");
  } else if (discovered.length === 1) {
    const run = loadManifest(discovered[0].file);
    if (run) validateRun(run);
  }
  finish(false, discovered.length);
}

main();
