#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const config = {
  title: "Website Genome",
  runDir: ".opendock/runs/website-genome",
  outputPrefix: "analysis/website-genome/",
  extensions: new Set([".md", ".mdx", ".txt", ".json", ".yml", ".yaml", ".csv", ".css", ".html"]),
  reportSections: [
    ["URL / Scope", "URL 및 범위", "URL/범위"],
    ["Capture Date", "캡처 날짜"],
    ["Sources", "출처"],
    ["Facts", "사실"],
    ["Assumptions", "가정"],
    ["Recommendations", "추천", "권고"],
    ["Typography", "타이포그래피"],
    ["Color Roles", "색상 역할"],
    ["Spacing / Grid", "간격 / 그리드", "간격과 그리드"],
    ["Components", "컴포넌트"],
    ["Responsive Behavior", "반응형 동작"],
    ["Motion", "모션"],
    ["Accessibility", "접근성"],
    ["Technology Evidence", "기술 근거"],
    ["Uncertainties", "불확실성"],
    ["Reusable Tokens / Inventory", "재사용 토큰 / 인벤토리", "재사용 토큰과 인벤토리"],
    ["Privacy / Rights", "개인정보 / 권리", "개인정보와 권리"]
  ],
  manifestSections: [
    ["URL / Scope", "URL 및 범위", "URL/범위"],
    ["Capture Date", "캡처 날짜"],
    ["Sources", "출처"],
    ["Facts", "사실"],
    ["Assumptions", "가정"],
    ["Recommendations", "추천", "권고"],
    ["Typography", "타이포그래피"],
    ["Color Roles", "색상 역할"],
    ["Spacing / Grid", "간격 / 그리드", "간격과 그리드"],
    ["Components", "컴포넌트"],
    ["Responsive Behavior", "반응형 동작"],
    ["Motion", "모션"],
    ["Accessibility", "접근성"],
    ["Technology Evidence", "기술 근거"],
    ["Uncertainties", "불확실성"],
    ["Reusable Tokens / Inventory", "재사용 토큰 / 인벤토리", "재사용 토큰과 인벤토리"],
    ["Privacy / Rights", "개인정보 / 권리", "개인정보와 권리"]
  ]
};

const root = process.cwd();
const activeStatuses = new Set(["draft", "active", "in-progress", "review", "ready"]);
const protectedSegments = new Set([".git", ".ssh", ".agents", ".opendock", "node_modules"]);
const maxManifestBytes = 256 * 1024;
const maxOutputBytes = 1024 * 1024;
const failures = [];
const placeholderPattern = /(?:\bTODO\b|\bTBD\b|\breplace-me\b|\bpending\b|작성하세요|여기에\s*입력)/i;

function fail(rule, file, detail) {
  failures.push({ rule, file: safeLabel(file), detail });
}

function safeLabel(value) {
  return String(value).replace(/[\u0000-\u001f\u007f]/g, "?").slice(0, 300);
}

function normalizeHeading(value) {
  return value.trim().replace(/\s+#+\s*$/, "").replace(/\s+/g, " ").toLowerCase();
}

function parseFenceOpening(line) {
  const opening = line.match(/^ {0,3}(?:(?:[-+*]|\d{1,9}[.)])[ \t]{1,4})?(`{3,}|~{3,})(.*)$/);
  if (!opening || (opening[1][0] === "`" && opening[2].includes("`"))) return null;
  return { marker: opening[1][0], length: opening[1].length };
}

function isFenceClosing(line, fence) {
  const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(closing && closing[1][0] === fence.marker && closing[1].length >= fence.length);
}

function stripFencedBlocks(text) {
  const kept = [];
  let fence = null;
  for (const line of String(text).split(/\r?\n/)) {
    if (fence === null) {
      const opening = parseFenceOpening(line);
      if (opening === null) {
        kept.push(line);
        continue;
      }
      fence = opening;
      kept.push("");
      continue;
    }

    if (isFenceClosing(line, fence)) {
      fence = null;
    }
    kept.push("");
  }
  return kept.join("\n");
}

function stripManagedBlocks(text) {
  return String(text).replace(
    /<!-- OPENDOCK:START\b[^>]*-->[\s\S]*?<!-- OPENDOCK:END\b[^>]*-->/g,
    ""
  );
}

function stripHtmlComments(text) {
  return String(text).replace(/<!--[\s\S]*?-->/g, "");
}

function structuralText(text) {
  return stripFencedBlocks(stripHtmlComments(stripManagedBlocks(text)));
}

function topLevelText(text) {
  const lines = structuralText(text).split(/\r?\n/);
  const firstHeading = lines.findIndex((line) => /^ {0,3}#{2,6}\s+/.test(line));
  return lines.slice(0, firstHeading < 0 ? lines.length : firstHeading).join("\n");
}

function getSections(text, aliases) {
  const wanted = new Set(aliases.map(normalizeHeading));
  const lines = structuralText(text).split(/\r?\n/);
  const sections = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^ {0,3}(#{2,6})\s+(.+?)\s*$/);
    if (!match || !wanted.has(normalizeHeading(match[2]))) continue;
    const level = match[1].length;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);
      if (next && next[1].length <= level) {
        end = cursor;
        break;
      }
    }
    sections.push(lines.slice(index + 1, end).join("\n").trim());
  }
  return sections;
}

function getSection(text, aliases) {
  return getSections(text, aliases)[0] ?? null;
}

function hasMeaningfulContent(value) {
  if (value === null || placeholderPattern.test(value)) return false;
  const plain = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[`*_#|>:\-\s]/g, "")
    .trim();
  return plain.length >= 4;
}

function checkSections(file, text, sections) {
  for (const aliases of sections) {
    const content = getSection(text, aliases);
    if (content === null) fail("missing-section", file, `필수 section이 없습니다: ${aliases[0]}`);
    else if (!hasMeaningfulContent(content)) fail("empty-section", file, `필수 section에 구체적인 근거가 없습니다: ${aliases[0]}`);
  }
}

function parseStatus(text) {
  const match = topLevelText(text).match(/^Status\s*:\s*([A-Za-z-]+)\s*$/im);
  return match ? match[1].toLowerCase() : "";
}

function normalizeRelative(raw, allowRunPath = false) {
  let value = String(raw).trim().replace(/^['"`]+|['"`]+$/g, "");
  if (!value) return { error: "빈 경로입니다." };
  if (/[\u0000-\u001f\u007f]/.test(value)) return { error: "NUL을 포함한 제어문자를 사용할 수 없습니다." };
  value = value.replace(/\\/g, "/");
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || value.includes(":")) {
    return { error: "절대 경로나 URI를 사용할 수 없습니다." };
  }
  if (/%(?:00|2e|2f|5c)/i.test(value)) return { error: "인코딩된 traversal 문자를 사용할 수 없습니다." };
  if (value.length > 300) return { error: "경로가 너무 깁니다." };
  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return { error: "빈 segment, 현재 경로 또는 상위 경로 segment를 사용할 수 없습니다." };
  }
  if (segments.some((segment) => /[. ]$/.test(segment))) {
    return { error: "dot 또는 공백으로 끝나는 path segment를 사용할 수 없습니다." };
  }
  if (segments.some((segment) => /[<>"|?*]/.test(segment) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))) {
    return { error: "Windows에서 안전하지 않은 path segment를 사용할 수 없습니다." };
  }
  if (!allowRunPath && segments.some((segment) => protectedSegments.has(segment.toLowerCase()))) {
    return { error: "보호된 directory segment를 사용할 수 없습니다." };
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized.startsWith("../")) return { error: "정규화되지 않은 상대 경로입니다." };
  return { value: normalized };
}

function normalizeManifestPath(raw) {
  const result = normalizeRelative(raw, true);
  if (result.error) return result;
  const escaped = config.runDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^${escaped}/[^/]+/manifest\\.md$`).test(result.value)) {
    return { error: `manifest는 ${config.runDir}/<run-id>/manifest.md 형식이어야 합니다.` };
  }
  const runId = result.value.slice(config.runDir.length + 1, -"/manifest.md".length);
  if (protectedSegments.has(runId.toLowerCase())) {
    return { error: "run id에 보호된 directory 이름을 사용할 수 없습니다." };
  }
  return result;
}

function inspectRegularFile(rel, maxBytes, kind) {
  const segments = rel.split("/");
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch {
      fail(`missing-${kind}`, rel, "파일 또는 상위 directory가 없습니다.");
      return null;
    }
    if (stat.isSymbolicLink()) {
      fail(`${kind}-symlink`, rel, "symlink segment를 사용할 수 없습니다.");
      return null;
    }
    if (index < segments.length - 1 && !stat.isDirectory()) {
      fail(`invalid-${kind}-path`, rel, "중간 segment가 directory가 아닙니다.");
      return null;
    }
    if (index === segments.length - 1 && !stat.isFile()) {
      fail(`invalid-${kind}`, rel, "일반 파일만 검사할 수 있습니다.");
      return null;
    }
    if (index === segments.length - 1 && stat.size > maxBytes) {
      fail(`${kind}-too-large`, rel, `${maxBytes} byte를 초과합니다.`);
      return null;
    }
  }
  const buffer = fs.readFileSync(current);
  if (buffer.includes(0)) {
    fail(`${kind}-binary`, rel, "NUL을 포함한 binary 파일은 지원하지 않습니다.");
    return null;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    fail(`${kind}-binary`, rel, "유효한 UTF-8 text 파일만 지원합니다.");
    return null;
  }
}

function extractTargets(text, file) {
  const sections = getSections(text, ["Target Files", "대상 파일"]);
  if (sections.length === 0) {
    fail("missing-target-files", file, "Target Files section이 없습니다.");
    return [];
  }
  if (sections.length > 1) {
    fail("duplicate-target-files", file, "Target Files/대상 파일 section은 하나만 허용됩니다.");
    return [];
  }
  const content = sections[0];
  const targets = [];
  for (const line of content.split(/\r?\n/)) {
    if (!/^\s*[-*]\s+/.test(line)) continue;
    const codeMatches = [...line.matchAll(/`([^`]+)`/g)];
    if (codeMatches.length > 0) targets.push(...codeMatches.map((match) => match[1].trim()));
    else targets.push(line.replace(/^\s*[-*]\s+/, "").trim());
  }
  if (targets.length === 0) fail("missing-target-files", file, "Target Files에 하나 이상의 파일을 bullet로 선언해야 합니다.");
  if (targets.length > 32) fail("too-many-targets", file, "한 run에서 target은 32개를 초과할 수 없습니다.");
  return targets.slice(0, 32);
}

function quotedAwareInstructionText(text) {
  const kept = [];
  let fence = null;
  let activeFence = false;
  let previous = "";
  for (const line of text.split(/\r?\n/)) {
    if (fence === null) {
      const opening = parseFenceOpening(line);
      if (opening !== null) {
        activeFence = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
          && !/(?:실행하지|따르지|금지|분석|인용|예시|do not|never|example|quote)/i.test(previous);
        fence = opening;
        continue;
      }
    } else {
      if (isFenceClosing(line, fence)) {
        fence = null;
        activeFence = false;
        continue;
      }
      if (activeFence) kept.push(line);
      continue;
    }
    const activeContext = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
      && !/(?:실행하지|따르지|금지|분석|인용|예시|do not|never|example|quote)/i.test(previous);
    if (/^\s*>/.test(line)) {
      if (activeContext) kept.push(line.replace(/^\s*>\s?/, ""));
      previous = line;
      continue;
    }
    if (/^\s{4}\S/.test(line)) {
      if (activeContext) kept.push(line.trimStart());
      previous = line;
      continue;
    }
    const cleaned = line.replace(/`[^`]*`/g, "");
    if (/(?:실행하지|따르지|금지|위험\s*문자열|안전한\s*인용|예시|탐지|do not|never execute|quoted?\s+string|example|detection)/i.test(cleaned)) continue;
    kept.push(cleaned);
    previous = line;
  }
  return kept.join("\n");
}

function checkTextSafety(file, text) {
  if (placeholderPattern.test(text)) fail("placeholder", file, "미완성 placeholder가 남아 있습니다.");

  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|npm_[A-Za-z0-9]{36,}|glpat-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{20,}|sk-(?:live|prod)?[-_A-Za-z0-9]{20,})\b/,
    /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i,
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|client[_-]?secret|secret(?:[_-]?key)?|aws[_-]?secret[_-]?access[_-]?key|password|passwd)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{20,}/i,
    /https?:\/\/[^\s/:]+:[^\s/@]+@/i
  ];
  if (secretPatterns.some((pattern) => pattern.test(text))) {
    fail("credential-leak", file, "실제 credential처럼 보이는 값이 포함되어 있습니다. 값은 출력하지 않습니다.");
  }

  const instructionText = quotedAwareInstructionText(text);
  const promptInjection = [
    /^\s*(?:[-*]\s*)?(?:please\s+)?(?:ignore|disregard|override)\s+(?:all\s+)?(?:previous|prior|system|developer)\s+(?:instructions?|messages?)/im,
    /^\s*(?:[-*]\s*)?(?:reveal|print|show|expose)\s+(?:the\s+)?(?:system prompt|developer message|secrets?|credentials?)/im,
    /^\s*(?:[-*]\s*)?(?:이전|상위|시스템|개발자)\s*(?:지시|메시지|명령).{0,24}(?:무시|우회|덮어쓰)/im,
    /^\s*(?:[-*]\s*)?(?:시스템\s*프롬프트|개발자\s*메시지|비밀|자격\s*증명).{0,24}(?:공개|출력|노출)/im
  ];
  if (promptInjection.some((pattern) => pattern.test(instructionText))) {
    fail("prompt-injection", file, "상위 지시를 우회하거나 비밀을 요구하는 실행형 문장이 있습니다.");
  }

  const destructive = [
    /^\s*(?:[-*]\s*)?(?:(?:run|execute|실행(?:하세요|하라)?|명령)\s*[:：]?\s*)?(?:s[u]do\s+)?rm\b(?:(?:\s+-(?=[A-Za-z]*r)(?=[A-Za-z]*f)[A-Za-z]+\b)|(?=[^\r\n]*[ \t](?:-r|--recursive)(?=[ \t]|$))(?=[^\r\n]*[ \t](?:-f|--force)(?=[ \t]|$))[^\r\n]*)/im,
    /^\s*(?:[-*]\s*)?(?:(?:run|execute|실행(?:하세요|하라)?)\s*[:：]?\s*)?git\s+reset\s+--hard\b/im,
    /^\s*(?:[-*]\s*)?(?:(?:run|execute|실행(?:하세요|하라)?)\s*[:：]?\s*)?git\s+clean\s+-(?=[A-Za-z]*f)(?=[A-Za-z]*d)[A-Za-z]+\b/im,
    /^\s*(?:[-*]\s*)?(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash|zsh|powershell)\b/im,
    /^\s*(?:[-*]\s*)?(?:chmod\s+777|format\s+[A-Za-z]:|rmdir\s+\/s\s+\/q|Remove-Item\b(?=[^\n]*-Recurse)(?=[^\n]*-Force)[^\n]*)/im
  ];
  if (destructive.some((pattern) => pattern.test(instructionText))) {
    fail("destructive-instruction", file, "실행형 파괴 명령이 포함되어 있습니다.");
  }

  const guaranteeText = instructionText
    .split(/\r?\n/)
    .filter((line) => !/(?:보장하지|보장할\s*수\s*없|not\s+guaranteed|cannot\s+guarantee)/i.test(line))
    .join("\n");
  if (/(?:100\s*%\s*(?:보장|guaranteed)|무조건\s*(?:성공|개선|통과)|완벽히\s*보장|절대\s*실패하지)/i.test(guaranteeText)) {
    fail("unsupported-guarantee", file, "근거와 한계를 벗어난 보장 표현이 있습니다.");
  }
}

function countTerms(text, terms) {
  return terms.filter((term) => new RegExp(term, "i").test(text)).length;
}

function checkWebsiteEvidence(file, text) {
  const sources = getSection(text, ["Sources", "출처"]) ?? "";
  if (!/https?:\/\/[^\s<>)]+/i.test(sources)) {
    fail("missing-source-url", file, "Sources에는 하나 이상의 source URL이 필요합니다.");
  }
  if (!/(?:Accessed|Access Date|접근일)\s*[:：]?\s*\d{4}-\d{2}-\d{2}/i.test(sources)) {
    fail("missing-access-date", file, "각 분석에는 ISO 형식 access date가 필요합니다.");
  }

  const captureDate = getSection(text, ["Capture Date", "캡처 날짜"]) ?? "";
  if (!/\b\d{4}-\d{2}-\d{2}\b/.test(captureDate)) {
    fail("missing-capture-date", file, "Capture Date에는 ISO 날짜가 필요합니다.");
  }

  const colors = getSection(text, ["Color Roles", "색상 역할"]) ?? "";
  const roleCount = countTerms(colors, [
    "\\bcanvas\\b", "\\bsurface\\b", "\\btext\\b", "\\bborder\\b",
    "\\bprimary\\b", "\\bfocus\\b", "배경", "캔버스", "표면", "본문", "텍스트", "테두리", "주요 액션", "초점", "포커스"
  ]);
  if (roleCount < 3) {
    fail("missing-color-roles", file, "Color Roles에는 raw 값이 아니라 세 가지 이상의 semantic role이 필요합니다.");
  }

  const technology = getSection(text, ["Technology Evidence", "기술 근거"]) ?? "";
  if (!/(?:\bEvidence\b|근거|증거)/i.test(technology) || !/(?:\bConfidence\b|신뢰도|확신도)/i.test(technology)) {
    fail("unverified-technology", file, "기술 주장은 evidence와 confidence를 함께 기록해야 합니다.");
  }
  const technologyTerms = /(?:React|Vue|Angular|Next\.js|Nuxt|Svelte|WordPress|Shopify|CMS|framework|hosting|analytics|server|CDN)/i;
  for (const block of technology.split(/\n\s*\n/)) {
    if (technologyTerms.test(block) && (!/(?:\bEvidence\b|근거|증거)/i.test(block) || !/(?:\bConfidence\b|신뢰도|확신도)/i.test(block))) {
      fail("unverified-technology-claim", file, "각 technology claim block에는 evidence와 confidence가 필요합니다.");
      break;
    }
  }

  const rights = getSection(text, ["Privacy / Rights", "개인정보 / 권리", "개인정보와 권리"]) ?? "";
  if (!/(?:no\s+proprietary|proprietary.{0,24}(?:not|excluded)|복사하지|미복제|원본.{0,16}포함하지)/i.test(rights)) {
    fail("missing-rights-boundary", file, "proprietary asset을 복사하지 않았다는 권리 경계를 기록해야 합니다.");
  }
  const assetActions = quotedAwareInstructionText(text)
    .split(/\r?\n/)
    .filter((line) => !/(?:not\s+(?:copy|download|scrape)|do\s+not|복사하지|다운로드하지|수집하지|미복제)/i.test(line))
    .join("\n");
  if (/(?:copy|download|scrape|복사|다운로드|추출).{0,40}(?:proprietary|asset|logo|image|font|원본 자산|로고|이미지|폰트)/i.test(assetActions)) {
    fail("proprietary-asset-copy", file, "proprietary asset을 복사하거나 추출한 기록이 있습니다.");
  }
}

function validateManifest(manifestRel) {
  const text = inspectRegularFile(manifestRel, maxManifestBytes, "manifest");
  if (text === null) return;
  checkTextSafety(manifestRel, text);
  if (!parseStatus(text)) fail("missing-status", manifestRel, "Status field가 없습니다.");
  const language = topLevelText(text).match(/^Language\s*:\s*([^\r\n]+)$/im)?.[1]?.trim().toLowerCase() ?? "";
  if (!/^(?:ko|en)$/.test(language)) fail("invalid-language", manifestRel, "Language는 ko 또는 en이어야 합니다.");
  checkSections(manifestRel, text, config.manifestSections);
  checkWebsiteEvidence(manifestRel, text);

  const rawTargets = extractTargets(text, manifestRel);
  const targets = [];
  const seen = new Set();
  for (const rawTarget of rawTargets) {
    const result = normalizeRelative(rawTarget);
    if (result.error) {
      fail("unsafe-target-path", rawTarget, result.error);
      continue;
    }
    const rel = result.value;
    if (!rel.startsWith(config.outputPrefix) || rel === config.outputPrefix.slice(0, -1)) {
      fail("target-out-of-scope", rel, `target은 ${config.outputPrefix} 아래에 있어야 합니다.`);
      continue;
    }
    if (!config.extensions.has(path.posix.extname(rel).toLowerCase())) {
      fail("unsupported-target-type", rel, "지원하지 않는 확장자입니다.");
      continue;
    }
    if (seen.has(rel)) {
      fail("duplicate-target", rel, "중복 target입니다.");
      continue;
    }
    seen.add(rel);
    targets.push(rel);
  }

  const targetTexts = new Map();
  for (const rel of targets) {
    const targetText = inspectRegularFile(rel, maxOutputBytes, "target");
    if (targetText === null) continue;
    targetTexts.set(rel, targetText);
    checkTextSafety(rel, targetText);
  }

  if (targets.length === 0) return;
  const primary = targets[0];
  if (![".md", ".mdx"].includes(path.posix.extname(primary).toLowerCase())) {
    fail("missing-primary-report", primary, "첫 target은 기준 Markdown 보고서여야 합니다.");
    return;
  }
  const report = targetTexts.get(primary);
  if (report !== undefined) {
    checkSections(primary, report, config.reportSections);
    checkWebsiteEvidence(primary, report);
  }
}

function readStatusPrefix(rel) {
  const full = path.join(root, ...rel.split("/"));
  const stat = fs.lstatSync(full);
  if (stat.isSymbolicLink() || !stat.isFile()) return "";
  const length = Math.min(stat.size, 64 * 1024);
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(full, "r");
  try {
    fs.readSync(fd, buffer, 0, length, 0);
  } finally {
    fs.closeSync(fd);
  }
  return parseStatus(buffer.toString("utf8"));
}

function discoverActiveManifest() {
  let runRoot = root;
  let traversed = "";
  for (const segment of config.runDir.split("/")) {
    traversed = traversed ? `${traversed}/${segment}` : segment;
    runRoot = path.join(runRoot, segment);
    let stat;
    try {
      stat = fs.lstatSync(runRoot);
    } catch {
      return null;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      fail("unsafe-run-root", traversed, "run root의 모든 segment는 symlink가 아닌 directory여야 합니다.");
      return null;
    }
  }

  const active = [];
  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const runRel = `${config.runDir}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      fail("run-symlink", runRel, "run directory symlink를 사용할 수 없습니다.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    const manifestRel = `${runRel}/manifest.md`;
    const full = path.join(root, ...manifestRel.split("/"));
    if (!fs.existsSync(full)) continue;
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) {
      fail("manifest-symlink", manifestRel, "manifest symlink를 사용할 수 없습니다.");
      continue;
    }
    if (!stat.isFile()) continue;
    if (activeStatuses.has(readStatusPrefix(manifestRel))) active.push(manifestRel);
  }

  if (active.length > 1) {
    fail("multiple-active-runs", config.runDir, `active run이 ${active.length}개입니다. 0개 또는 1개만 허용됩니다.`);
    return null;
  }
  return active[0] ?? null;
}

function printFailures() {
  console.error(`${config.title} harness 실패 (${failures.length})`);
  for (const item of failures) console.error(`- [${item.rule}] ${item.file}: ${item.detail}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    fail("usage", "command", "run manifest 경로는 하나만 전달할 수 있습니다.");
    printFailures();
    process.exitCode = 1;
    return;
  }

  let manifestRel = null;
  if (args.length === 1) {
    const result = normalizeManifestPath(args[0]);
    if (result.error) fail("unsafe-manifest-path", args[0], result.error);
    else manifestRel = result.value;
  } else {
    manifestRel = discoverActiveManifest();
  }

  if (failures.length === 0 && manifestRel === null) {
    console.log(`${config.title} harness: Ready (active run 없음).`);
    return;
  }
  if (manifestRel !== null) validateManifest(manifestRel);

  if (failures.length > 0) {
    printFailures();
    process.exitCode = 1;
    return;
  }
  console.log(`${config.title} harness 통과: ${manifestRel}와 선언 target만 검사했습니다.`);
}

main();
