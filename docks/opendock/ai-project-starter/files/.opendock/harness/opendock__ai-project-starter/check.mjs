#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const RUN_ROOT = ".opendock/runs/ai-project-starter";
const ACTIVE_STATUSES = new Set(["draft", "active", "in-progress", "review", "ready"]);
const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_TARGET_BYTES = 512 * 1024;
const MAX_TARGETS = 64;
const BLOCKED_SEGMENTS = new Set([".git", ".ssh", ".agents", ".opendock", "node_modules"]);
const ALLOWED_EXTENSIONS = new Set([".md", ".json", ".yaml", ".yml", ".toml"]);
const HEADING_ALIASES = new Map([
  ["대상 파일", "target files"],
  ["프로젝트 근거", "project evidence"],
  ["구조 결정", "structure decisions"],
  ["커버리지 근거", "coverage evidence"],
  ["검증 근거", "validation evidence"],
  ["개인정보 및 마스킹 근거", "privacy and redaction evidence"],
  ["예외", "exceptions"],
  ["맥락", "context"],
  ["목표", "goals"],
  ["비목표", "non-goals"],
  ["역할", "roles"],
  ["규칙", "rules"],
  ["도구", "tools"],
  ["워크플로", "workflows"],
  ["품질 게이트", "quality gates"],
  ["결정", "decisions"],
  ["보안 및 개인정보", "security/privacy"],
  ["온보딩", "onboarding"],
]);
const REQUIRED_TOPICS = [
  "Context",
  "Goals",
  "Non-Goals",
  "Roles",
  "Rules",
  "Tools",
  "Workflows",
  "Quality Gates",
  "Decisions",
  "Security/Privacy",
  "Onboarding",
];
const PLACEHOLDER_PATTERN = /(?:\bTODO\b|\bTBD\b|\breplace-me\b|\bpending\b|작성하세요|여기에\s*입력)/iu;
const failures = [];

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (character) => {
    return `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
  });
}

function fail(rule, file, detail) {
  if (failures.some((item) => item.rule === rule && item.file === file && item.detail === detail)) return;
  failures.push({ rule, file, detail });
}

function normalizeSlashes(value) {
  return String(value).replaceAll("\\", "/");
}

function parseField(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = structuralText(text).match(new RegExp(`^${escaped}\\s*:\\s*(.*)$`, "im"));
  return match ? match[1].trim() : "";
}

function parseTopLevelField(text, name) {
  const lines = structuralText(text).split(/\r?\n/);
  const firstSection = lines.findIndex((line) => isLevelTwoHeading(line));
  return parseField(lines.slice(0, firstSection < 0 ? lines.length : firstSection).join("\n"), name);
}

function openingFence(line) {
  const opening = String(line).match(
    /^ {0,3}(?:(?:[-+*]|\d{1,9}[.)])[ \t]{1,4})?(`{3,}|~{3,})(.*)$/,
  );
  if (!opening || (opening[1][0] === "`" && opening[2].includes("`"))) return null;
  return { marker: opening[1][0], length: opening[1].length };
}

function closesFence(line, fence) {
  const closing = String(line).match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(closing && closing[1][0] === fence.marker && closing[1].length >= fence.length);
}

function stripFencedBlocks(text) {
  const kept = [];
  let fence = null;
  for (const line of String(text).split(/\r?\n/)) {
    if (!fence) {
      const opening = openingFence(line);
      if (!opening) {
        kept.push(line);
        continue;
      }
      fence = opening;
      kept.push("");
      continue;
    }

    if (closesFence(line, fence)) fence = null;
    kept.push("");
  }
  return kept.join("\n");
}

function canonicalHeading(value) {
  const normalized = String(value).replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
  return HEADING_ALIASES.get(normalized) ?? normalized;
}

function isLevelTwoHeading(line) {
  return /^ {0,3}##(?:[ \t]+|$)/.test(String(line));
}

function normalizedHeading(line) {
  const match = String(line).match(/^ {0,3}##[ \t]+(.+?)[ \t]*$/);
  return match ? canonicalHeading(match[1]) : "";
}

function sectionText(text, heading) {
  const visibleText = stripHtmlComments(stripManagedBlocks(text));
  const rawLines = visibleText.split(/\r?\n/);
  const lines = stripFencedBlocks(visibleText).split(/\r?\n/);
  const wanted = canonicalHeading(heading);
  const start = lines.findIndex((line) => normalizedHeading(line) === wanted);
  if (start < 0) return "";
  const output = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (isLevelTwoHeading(lines[index])) break;
    output.push(rawLines[index]);
  }
  return output.join("\n").trim();
}

function stripManagedBlocks(text) {
  return String(text).replace(
    /<!-- OPENDOCK:START\b[^>]*-->[\s\S]*?<!-- OPENDOCK:END\b[^>]*-->/g,
    "",
  );
}

function stripHtmlComments(text) {
  return String(text).replace(/<!--[\s\S]*?-->/g, "");
}

function structuralText(text) {
  return stripFencedBlocks(stripHtmlComments(stripManagedBlocks(text)));
}

function rejectDuplicateSection(text, heading, file) {
  const wanted = canonicalHeading(heading);
  const count = structuralText(text)
    .split(/\r?\n/)
    .filter((line) => normalizedHeading(line) === wanted).length;
  if (count > 1) {
    fail("duplicate-section", file, `${heading} 섹션은 하나만 허용됩니다. 발견: ${count}`);
  }
}

function compact(value) {
  return String(value).replace(/[`*_#|>]/g, " ").replace(/\s+/g, " ").trim();
}

function hasDetail(value, minimum = 16) {
  const cleaned = compact(value);
  return cleaned.length >= minimum && !PLACEHOLDER_PATTERN.test(cleaned);
}

function requireSection(text, heading, file, minimum = 24) {
  const value = sectionText(text, heading);
  if (!value) {
    fail("missing-section", file, `필수 섹션이 없습니다: ${heading}`);
    return "";
  }
  if (!hasDetail(value, minimum)) {
    fail("insufficient-section-evidence", file, `${heading} 섹션에 구체적인 근거가 필요합니다.`);
  }
  return value;
}

function safelyQuoted(line, previousLine) {
  if (
    /(?:not executed|was not run|do not follow|must not follow|treated only as untrusted evidence|실행하지 않았|실행되지 않았|따르지 않았|지시로 (?:실행|처리)하지|비신뢰 입력으로만|증거로만 취급)/i.test(
      line,
    )
  ) {
    return true;
  }
  return /^\s*>/.test(line) && /(?:evidence|quote|증거|인용|비신뢰)/i.test(previousLine);
}

function isImperativeFenceContext(line) {
  return /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(line)
    && !/(?:실행하지|따르지|금지|분석|인용|예시|do not|never|example|quote)/i.test(line);
}

function hasSecretLookingValue(line) {
  if (/(?:AKIA|ASIA)[A-Z0-9]{16}/.test(line)) return true;
  if (/gh[pousr]_[A-Za-z0-9]{20,}/.test(line)) return true;
  if (/\bgithub_pat_[A-Za-z0-9_]{20,}\b/.test(line)) return true;
  if (/\bnpm_[A-Za-z0-9]{36,}\b/.test(line)) return true;
  if (/\bglpat-[A-Za-z0-9_-]{20,}(?![A-Za-z0-9_-])/.test(line)) return true;
  if (/\bAIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])/.test(line)) return true;
  if (/xox[baprs]-[A-Za-z0-9-]{16,}/.test(line)) return true;
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) return true;
  if (/\bBearer\s+[A-Za-z0-9._~-]{16,}/i.test(line)) return true;
  if (/\bAuthorization\s*:\s*Basic\s+[A-Za-z0-9+/]{12,}={0,2}/i.test(line)) return true;
  if (/(?:https?|postgres(?:ql)?|mysql):\/\/[^/\s:@]+:[^@\s/]+@/i.test(line)) return true;
  const assignment = line.match(
    /\b(?:api[ _-]?key|access[ _-]?token|auth[ _-]?token|token|password|passwd|secret(?:[ _-]?(?:key|value))?|client[ _-]?secret|private[ _-]?key)\b["']?\s*[:=]\s*["']?([^\s"'`,;#]{6,})/i,
  );
  if (!assignment) return false;
  const value = assignment[1];
  return !(
    /^(?:\[?redacted\]?|\[?masked\]?|\*+|<redacted>|<masked>|not-collected|미수집|마스킹)$/i.test(value) ||
    /^\$\{[A-Z][A-Z0-9_]*\}$/.test(value) ||
    /^env:[A-Z][A-Z0-9_]*$/i.test(value)
  );
}

function containsPromptInjection(line) {
  return [
    /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
    /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
    /reveal\s+(?:the\s+)?(?:system prompt|secrets?|credentials?)/i,
    /(?:이전|기존|상위)\s*지시.{0,30}무시/,
    /(?:시스템 프롬프트|비밀|자격 증명).{0,30}(?:공개|출력)/,
  ].some((pattern) => pattern.test(line));
}

function containsRecursiveForceRm(line) {
  const match = String(line).match(/\brm\b((?:[ \t]+--?[A-Za-z]+)+)/i);
  if (!match) return false;

  let recursive = false;
  let force = false;
  for (const option of match[1].trim().split(/[ \t]+/)) {
    const normalized = option.toLowerCase();
    if (normalized === "--recursive") recursive = true;
    else if (normalized === "--force") force = true;
    else if (/^-[a-z]+$/.test(normalized)) {
      recursive ||= normalized.includes("r");
      force ||= normalized.includes("f");
    }
  }
  return recursive && force;
}

function containsDestructiveCommand(line) {
  if (containsRecursiveForceRm(line)) return true;
  return [
    /\bgit\s+reset\s+--hard\b/i,
    /\bgit\s+clean\s+-[a-z]*f[a-z]*\b/i,
    /\bRemove-Item\b.*\b-Recurse\b.*\b-Force\b/i,
    /\bmkfs(?:\.[a-z0-9]+)?\b/i,
    /\bdd\s+if=/i,
    /\bformat\s+[a-z]:/i,
    /\bDROP\s+(?:DATABASE|SCHEMA)\b/i,
    /\bsu[d]o\b/i,
  ].some((pattern) => pattern.test(line));
}

function isImperativeCommand(line) {
  const trimmed = line.replace(/^\s*(?:[-*]\s+|\d+\.\s+)?/, "");
  if (
    /^(?:(?:command|rollback(?:\s+command)?|명령|롤백(?:\s+명령)?)\s*:\s*)?(?:\$\s*|PS>\s*)?(?:git\s+(?:reset|clean)|rm\s+-|Remove-Item|mkfs|dd\s+if=|format\s+[a-z]:|DROP\s+(?:DATABASE|SCHEMA)|su[d]o\b)/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return /(?:run|execute|type|실행|입력|사용)\s*(?:this|the following|다음|명령)?\s*[:：]/i.test(trimmed);
}

function hasUnsupportedGuarantee(line) {
  if (/(?:보장하지|보장할 수 없|not guaranteed|cannot guarantee|no guarantee)/i.test(line)) return false;
  return [
    /\bguarantee(?:d|s)?\b/i,
    /\b(?:zero|0)\s+risk\b/i,
    /100%\s*(?:safe|secure|accurate|complete|correct|안전|정확|완벽|보장)/i,
    /(?:무조건|완벽히?)\s*(?:안전|성공|정확|보장)/,
    /(?:모든|전부)\s*(?:오류|버그|위험).{0,20}(?:없음|해결|제거)/,
  ].some((pattern) => pattern.test(line));
}

function scanActiveContent(text, file) {
  const content = String(text);
  let previousLine = "";
  let fence = null;
  let activeFence = false;
  for (const line of content.split(/\r?\n/)) {
    if (hasSecretLookingValue(line)) fail("credential-leak", file, "실제 credential로 보이는 할당 또는 값이 있습니다.");

    let inspectInstructions = true;
    if (fence) {
      if (closesFence(line, fence)) {
        fence = null;
        activeFence = false;
        continue;
      }
      inspectInstructions = activeFence;
    } else {
      const opening = openingFence(line);
      if (opening) {
        fence = opening;
        activeFence = isImperativeFenceContext(previousLine);
        continue;
      }
    }

    const quoted = safelyQuoted(line, previousLine);
    if (inspectInstructions && containsPromptInjection(line) && !quoted) {
      fail("prompt-injection", file, "상위 지시를 바꾸거나 비밀 공개를 요구하는 문구가 실행 지시로 기록되어 있습니다.");
    }
    if (inspectInstructions && containsDestructiveCommand(line) && isImperativeCommand(line) && !quoted) {
      fail("destructive-command", file, "파괴적이거나 권한 상승을 유발하는 명령이 실행 지시로 기록되어 있습니다.");
    }
    if (hasUnsupportedGuarantee(line)) fail("unsupported-guarantee", file, "검증 범위를 넘는 절대적 보장 표현이 있습니다.");
    if (!fence && line.trim()) previousLine = line;
  }

  if (PLACEHOLDER_PATTERN.test(structuralText(content))) {
    fail("placeholder", file, "활성 evidence 또는 산출물에 미완성 placeholder가 있습니다.");
  }
}

function pathHasSymlink(rel) {
  let current = ROOT;
  for (const segment of normalizeSlashes(rel).split("/")) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) return false;
    if (fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}

function safeManifestArgument(raw) {
  const value = String(raw ?? "").trim();
  if (!value || value.includes("\0") || /[\x00-\x1f\x7f]/.test(value)) return null;
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || /^[\\/]{2}/.test(value)) return null;
  const slash = normalizeSlashes(value).replace(/^\.\//, "");
  const parts = slash.split("/");
  if (parts.some((segment) => !segment || segment === "." || segment === "..")) return null;
  const prefix = `${RUN_ROOT}/`;
  if (!slash.startsWith(prefix) || !slash.endsWith("/manifest.md")) return null;
  const runId = slash.slice(prefix.length, -"/manifest.md".length);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(runId) || runId.includes("..")) return null;
  const absolute = path.resolve(ROOT, slash);
  return absolute.startsWith(`${ROOT}${path.sep}`) ? slash : null;
}

function readManifest(rel, statusOnly = false) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    fail("missing-run-manifest", rel, "run manifest가 존재하지 않습니다.");
    return null;
  }
  if (pathHasSymlink(rel)) {
    fail("unsafe-run-manifest", rel, "run manifest 경로에는 symlink segment를 사용할 수 없습니다.");
    return null;
  }
  const stats = fs.lstatSync(full);
  if (!stats.isFile()) {
    fail("unsafe-run-manifest", rel, "run manifest는 regular file이어야 합니다.");
    return null;
  }
  if (statusOnly) {
    const length = Math.min(stats.size, MAX_MANIFEST_BYTES);
    const buffer = Buffer.alloc(length);
    const descriptor = fs.openSync(full, "r");
    let bytesRead;
    try {
      bytesRead = fs.readSync(descriptor, buffer, 0, length, 0);
    } finally {
      fs.closeSync(descriptor);
    }
    return { rel, status: parseTopLevelField(buffer.subarray(0, bytesRead).toString("utf8"), "Status").toLowerCase() };
  }
  if (stats.size > MAX_MANIFEST_BYTES) {
    fail("run-manifest-too-large", rel, `run manifest는 ${MAX_MANIFEST_BYTES} bytes 이하여야 합니다.`);
    return null;
  }
  const buffer = fs.readFileSync(full);
  if (buffer.includes(0)) {
    fail("binary-run-manifest", rel, "run manifest는 UTF-8 text여야 합니다.");
    return null;
  }
  const text = buffer.toString("utf8");
  if (text.includes("\uFFFD")) {
    fail("invalid-run-encoding", rel, "run manifest에 올바르지 않은 UTF-8이 있습니다.");
    return null;
  }
  return { rel, text, status: parseTopLevelField(text, "Status").toLowerCase() };
}

function discoverRunManifests() {
  const fullRoot = path.join(ROOT, RUN_ROOT);
  if (!fs.existsSync(fullRoot)) return [];
  if (pathHasSymlink(RUN_ROOT)) {
    fail("unsafe-run-root", RUN_ROOT, "run root에는 symlink segment를 사용할 수 없습니다.");
    return [];
  }
  if (!fs.lstatSync(fullRoot).isDirectory()) {
    fail("unsafe-run-root", RUN_ROOT, "run root는 regular directory여야 합니다.");
    return [];
  }
  const runs = [];
  const entries = fs.readdirSync(fullRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      fail("unsafe-run-entry", `${RUN_ROOT}/${entry.name}`, "run directory에 symlink를 사용할 수 없습니다.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(entry.name) || entry.name.includes("..")) {
      fail("unsafe-run-entry", `${RUN_ROOT}/${entry.name}`, "run id가 안전한 형식이 아닙니다.");
      continue;
    }
    const rel = `${RUN_ROOT}/${entry.name}/manifest.md`;
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    const run = readManifest(rel, true);
    if (run) runs.push(run);
  }
  return runs;
}

function extractTargets(text) {
  const targets = [];
  for (const line of sectionText(text, "Target Files").split(/\r?\n/)) {
    if (!/^\s*[-*]\s+/.test(line)) continue;
    const inline = [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    targets.push(...(inline.length ? inline : [line.replace(/^\s*[-*]\s+/, "").trim()]));
  }
  return targets;
}

function safeTargetPath(raw) {
  const value = String(raw ?? "").trim().replace(/^["'`]+|["'`]+$/g, "");
  if (!value || value.length > 240 || value.includes("\0") || /[\x00-\x1f\x7f]/.test(value)) return null;
  if (value.includes("://") || path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || /^[\\/]{2}/.test(value)) return null;
  const slash = normalizeSlashes(value);
  const parts = slash.split("/");
  if (parts.some((segment) => !segment || segment === "." || segment === "..")) return null;
  if (parts[0] !== ".ai" || parts.length < 2) return null;
  if (
    parts.slice(1).some((segment) => {
      const lower = segment.toLowerCase();
      return BLOCKED_SEGMENTS.has(lower) || lower.startsWith(".env");
    })
  ) {
    return null;
  }
  if (!ALLOWED_EXTENSIONS.has(path.posix.extname(slash).toLowerCase())) return null;
  const resolved = path.resolve(ROOT, slash);
  return resolved.startsWith(`${ROOT}${path.sep}`) ? slash : null;
}

function readTargets(run) {
  const candidates = extractTargets(run.text);
  if (candidates.length === 0) {
    fail("missing-target-files", run.rel, "Target Files에 .ai/ starter 산출물을 선언해야 합니다.");
    return [];
  }
  if (candidates.length > MAX_TARGETS) fail("too-many-target-files", run.rel, `Target Files는 최대 ${MAX_TARGETS}개입니다.`);
  const seen = new Set();
  const targets = [];
  for (const candidate of candidates.slice(0, MAX_TARGETS)) {
    if (seen.has(candidate)) {
      fail("duplicate-target", run.rel, `중복 Target File: ${candidate}`);
      continue;
    }
    seen.add(candidate);
    const rel = safeTargetPath(candidate);
    if (!rel) {
      fail("unsafe-target-path", run.rel, `허용되지 않은 Target File 경로: ${candidate}`);
      continue;
    }
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      fail("missing-target", rel, "선언된 AI starter 산출물이 존재하지 않습니다.");
      continue;
    }
    if (pathHasSymlink(rel)) {
      fail("target-symlink", rel, "Target File 경로에는 symlink segment를 사용할 수 없습니다.");
      continue;
    }
    const stats = fs.lstatSync(full);
    if (!stats.isFile()) {
      fail("unsafe-target-path", rel, "Target File은 regular file이어야 합니다.");
      continue;
    }
    if (stats.size > MAX_TARGET_BYTES) {
      fail("target-too-large", rel, `Target File은 ${MAX_TARGET_BYTES} bytes 이하여야 합니다.`);
      continue;
    }
    const buffer = fs.readFileSync(full);
    if (buffer.includes(0)) {
      fail("binary-target", rel, "Target File은 지원되는 UTF-8 text여야 합니다.");
      continue;
    }
    const text = buffer.toString("utf8");
    if (text.includes("\uFFFD")) {
      fail("invalid-target-encoding", rel, "Target File에 올바르지 않은 UTF-8이 있습니다.");
      continue;
    }
    scanActiveContent(text, rel);
    const extension = path.posix.extname(rel).toLowerCase();
    if (extension === ".json") {
      try {
        JSON.parse(stripManagedBlocks(text));
      } catch {
        fail("invalid-json", rel, "JSON target은 올바른 JSON 문법이어야 합니다.");
        continue;
      }
    }
    targets.push({ rel, text, extension });
  }
  return targets;
}

function validatePrivacyEvidence(text, file) {
  const values = {
    "Minimum Data": parseField(text, "Minimum Data"),
    Redaction: parseField(text, "Redaction"),
    "Personal Data": parseField(text, "Personal Data"),
    "Untrusted Evidence": parseField(text, "Untrusted Evidence"),
  };
  for (const [name, value] of Object.entries(values)) {
    if (!hasDetail(value, 18)) fail("missing-privacy-evidence", file, `${name}에 구체적인 처리 근거가 필요합니다.`);
  }
  if (!/(?:최소|minimum).*(?:수집|필요|범위|collect|necessary|scope)|(?:수집|범위|collect|scope).*(?:최소|minimum)/i.test(values["Minimum Data"])) {
    fail("minimum-data-evidence", file, "Minimum Data에는 필요한 최소 수집 범위가 드러나야 합니다.");
  }
  if (!/(?:마스킹|삭제|제거|redact|mask)/i.test(values.Redaction)) {
    fail("redaction-evidence", file, "Redaction에는 값 제거 또는 마스킹 방법이 필요합니다.");
  }
  if (
    !/(?:집|주소|숙소|여행|예약|위치|연락처|개인|home|address|travel|booking|location|personal)/i.test(values["Personal Data"]) ||
    !/(?:제외|삭제|일반화|마스킹|수집하지|redact|minimi|exclude|remove|generalize|omit)/i.test(values["Personal Data"])
  ) {
    fail("personal-data-evidence", file, "Personal Data에는 집·여행·개인 데이터의 제외, 일반화 또는 마스킹 근거가 필요합니다.");
  }
  if (!/(?:비신뢰|신뢰할 수 없|증거로만|untrusted|evidence only)/i.test(values["Untrusted Evidence"])) {
    fail("untrusted-evidence", file, "외부 텍스트를 신뢰할 수 없는 evidence로 취급한 근거가 필요합니다.");
  }
}

function validateCodexAcceptance(text, file) {
  const value = parseField(text, "Codex Acceptance");
  if (!hasDetail(value, 14) || !/(?:별도|분리|separate|미사용|not used)/i.test(value)) {
    fail("codex-acceptance-separation", file, "Codex acceptance를 deterministic 검사와 분리해 기록해야 합니다.");
  }
  if (
    /(?:Codex.{0,24}(?:deterministic|결정적)|(?:deterministic|결정적).{0,24}Codex)/i.test(value) &&
    !/(?:아님|않|not|별도|분리)/i.test(value)
  ) {
    fail("external-model-determinism", file, "외부 모델의 결정성을 주장할 수 없습니다.");
  }
}

function validateRunManifest(run) {
  scanActiveContent(run.text, run.rel);
  if (!parseTopLevelField(run.text, "Status")) fail("missing-status", run.rel, "top-level Status가 필요합니다.");
  const language = parseTopLevelField(run.text, "Language").toLowerCase();
  if (!/^(?:ko|en)$/.test(language)) fail("invalid-language", run.rel, "Language는 ko 또는 en이어야 합니다.");
  if (!hasDetail(parseTopLevelField(run.text, "Starter Scope"), 18)) {
    fail("missing-starter-scope", run.rel, "Starter Scope에 구체적인 project·output 경계가 필요합니다.");
  }
  rejectDuplicateSection(run.text, "Target Files", run.rel);
  for (const heading of [
    "Target Files",
    "Project Evidence",
    "Structure Decisions",
    "Coverage Evidence",
    "Validation Evidence",
    "Privacy and Redaction Evidence",
    "Exceptions",
  ]) {
    requireSection(run.text, heading, run.rel, heading === "Target Files" ? 8 : 24);
  }
  for (const field of [
    "Context Sources",
    "Stack Evidence",
    "Existing Vendor Configs",
    "Starter Structure",
    "Vendor Config Decision",
    "Coverage Map",
    "Validation Commands",
    "Validation Result",
  ]) {
    if (!hasDetail(parseField(run.text, field), 12)) fail("missing-run-evidence", run.rel, `${field}에 구체적인 evidence가 필요합니다.`);
  }
  if (!/(?:pass|passed|통과|성공)/i.test(parseField(run.text, "Validation Result"))) {
    fail("validation-not-passed", run.rel, "Validation Result에는 실제 통과 결과가 필요합니다.");
  }
  const vendorDecision = parseField(run.text, "Vendor Config Decision");
  if (!/(?:덮어쓰지|변경하지|유지|제안|proposal|do not overwrite|unchanged|명시적.*요청)/i.test(vendorDecision)) {
    fail("vendor-config-decision", run.rel, "Vendor Config Decision에는 기존 설정 비덮어쓰기 또는 .ai/ 제안 정책이 필요합니다.");
  }
  const coverage = parseField(run.text, "Coverage Map");
  for (const topic of REQUIRED_TOPICS) {
    const pattern = new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (!pattern.test(coverage)) fail("coverage-map", run.rel, `Coverage Map에 ${topic} mapping이 필요합니다.`);
  }
  validatePrivacyEvidence(run.text, run.rel);
  validateCodexAcceptance(run.text, run.rel);
}

function countMatches(text, pattern) {
  return [...String(text).matchAll(pattern)].length;
}

function validateVendorConfigSafety(target) {
  for (const line of target.text.split(/\r?\n/)) {
    const namesVendorConfig = /(?:CLAUDE\.md|AGENTS\.md|GEMINI\.md|\.claude\/|\.codex\/|\.cursor\/|\.gemini\/|copilot-instructions\.md)/i.test(line);
    const mutates = /(?:overwrite|replace|write to|edit|덮어쓰|교체|직접\s*수정|직접\s*생성)/i.test(line);
    const safePolicy = /(?:do not|must not|without.*request|not overwrite|proposal|덮어쓰지|변경하지|수정하지|요청 없이는|제안|검토용)/i.test(line);
    if (namesVendorConfig && mutates && !safePolicy) {
      fail("vendor-config-overwrite", target.rel, "기존 vendor 설정을 직접 덮어쓰는 지시가 있습니다. .ai/ 안의 검토용 제안으로 바꾸세요.");
    }
  }
}

function topicSection(markdownTargets, heading) {
  for (const target of markdownTargets) {
    const value = sectionText(target.text, heading);
    if (value) return { target, value };
  }
  return null;
}

function validateOutputs(targets, run) {
  for (const target of targets) {
    scanActiveContent(target.text, target.rel);
    if (!hasDetail(stripManagedBlocks(target.text), 8)) {
      fail("empty-target", target.rel, "선언된 .ai/ target에는 실제 project 내용이 필요합니다.");
    }
    validateVendorConfigSafety(target);
  }
  const markdownTargets = targets.filter((target) => target.extension === ".md");
  if (markdownTargets.length === 0) {
    fail("missing-markdown-contract", run.rel, ".ai/ 아래 필수 topic을 담은 Markdown target이 하나 이상 필요합니다.");
    return;
  }

  const sections = {};
  for (const topic of REQUIRED_TOPICS) {
    const found = topicSection(markdownTargets, topic);
    if (!found) {
      fail("missing-section", run.rel, `Markdown targets에 필수 섹션이 없습니다: ${topic}`);
      sections[topic] = { target: markdownTargets[0], value: "" };
      continue;
    }
    if (!hasDetail(found.value, 28)) {
      fail("insufficient-section-evidence", found.target.rel, `${topic} 섹션에 구체적인 project 근거가 필요합니다.`);
    }
    sections[topic] = found;
  }

  const context = sections.Context.value;
  if (!/OpenDock/i.test(context) || !/(?:starter|시작 구조)/i.test(context) || !/(?:업계 표준이 아님|업계 표준은 아니|not an? industry standard)/i.test(context)) {
    fail("starter-disclaimer", sections.Context.target.rel, "Context에는 OpenDock starter이며 업계 표준이 아니라는 설명이 필요합니다.");
  }
  if (countMatches(sections.Goals.value, /^\s*[-*]\s+/gm) < 2 || !/(?:측정|검증|완료 조건|outcome|measure|verify)/i.test(sections.Goals.value)) {
    fail("goals-evidence", sections.Goals.target.rel, "Goals에는 둘 이상의 검증 가능한 결과가 필요합니다.");
  }
  if (countMatches(sections["Non-Goals"].value, /^\s*[-*]\s+/gm) < 2) {
    fail("non-goals-evidence", sections["Non-Goals"].target.rel, "Non-Goals에는 범위 밖 항목이 둘 이상 필요합니다.");
  }
  for (const label of ["Role", "Responsibility", "Escalation"]) {
    const korean = label === "Role" ? "역할" : label === "Responsibility" ? "책임" : "승인|에스컬레이션";
    if (!new RegExp(`(?:${label}|${korean})\\s*[:：]`, "i").test(sections.Roles.value)) {
      fail("roles-evidence", sections.Roles.target.rel, `Roles에 ${label} 항목이 필요합니다.`);
    }
  }
  if (!/(?:Priority|우선순위)\s*[:：]/i.test(sections.Rules.value) || !/(?:Untrusted|비신뢰)\s*[:：]/i.test(sections.Rules.value) || !/(?:Approval|승인)\s*[:：]/i.test(sections.Rules.value)) {
    fail("rules-evidence", sections.Rules.target.rel, "Rules에는 우선순위, 비신뢰 input, 승인 경계가 필요합니다.");
  }
  if (!/(?:Allowed Tools|허용 도구)\s*[:：]/i.test(sections.Tools.value) || !/(?:Source|출처)\s*[:：]/i.test(sections.Tools.value) || !/(?:Approval|승인)\s*[:：]/i.test(sections.Tools.value)) {
    fail("tools-evidence", sections.Tools.target.rel, "Tools에는 허용 도구, source, 승인 조건이 필요합니다.");
  }
  if (countMatches(sections.Workflows.value, /^\s*\d+\.\s+/gm) < 2 || !/(?:Entry|입력)\s*[:：]/i.test(sections.Workflows.value) || !/(?:Exit|완료)\s*[:：]/i.test(sections.Workflows.value)) {
    fail("workflow-evidence", sections.Workflows.target.rel, "Workflows에는 entry, 둘 이상의 단계, exit criteria가 필요합니다.");
  }
  if (!/(?:Check|검사)\s*[:：]/i.test(sections["Quality Gates"].value) || !/(?:Pass Criteria|통과 기준)\s*[:：]/i.test(sections["Quality Gates"].value) || !/(?:Remediation|수정 절차)\s*[:：]/i.test(sections["Quality Gates"].value)) {
    fail("quality-gate-evidence", sections["Quality Gates"].target.rel, "Quality Gates에는 check, pass criteria, remediation이 필요합니다.");
  }
  for (const label of ["Decision ID", "Date", "Rationale", "Tradeoff"]) {
    if (!new RegExp(`${label}\\s*[:：]`, "i").test(sections.Decisions.value)) {
      fail("decision-evidence", sections.Decisions.target.rel, `Decisions에 ${label} 항목이 필요합니다.`);
    }
  }
  validatePrivacyEvidence(sections["Security/Privacy"].value, sections["Security/Privacy"].target.rel);
  if (countMatches(sections.Onboarding.value, /^\s*\d+\.\s+/gm) < 3 || !/(?:First Task|첫 작업)\s*[:：]/i.test(sections.Onboarding.value) || !/(?:Verification|검증)\s*[:：]/i.test(sections.Onboarding.value)) {
    fail("onboarding-evidence", sections.Onboarding.target.rel, "Onboarding에는 세 단계 이상, 첫 작업, 검증 방법이 필요합니다.");
  }
}

function printResult(status, run, targetCount) {
  const stream = status === "failed" ? console.error : console.log;
  stream("OpenDock harness: AI Project Starter");
  stream(`Status: ${status}`);
  stream(`Run manifest: ${run ? escapeTerminal(run.rel) : "none"}`);
  stream(`Targets scanned: ${targetCount}`);
  if (status === "ready") return void stream("Ready: 활성 AI Project Starter run이 없습니다.");
  if (status === "passed") return void stream("AI Project Starter 품질 게이트를 통과했습니다.");
  stream(`Failures: ${failures.length}`);
  for (const item of failures.slice(0, 120)) {
    stream(`- [${escapeTerminal(item.rule)}] ${escapeTerminal(item.file)}: ${escapeTerminal(item.detail)}`);
  }
  if (failures.length > 120) stream(`... ${failures.length - 120}개 실패 생략`);
}

function main() {
  if (process.argv.length > 3) {
    fail("usage", "check.mjs", "manifest path 인자는 하나만 사용할 수 있습니다.");
    printResult("failed", null, 0);
    process.exitCode = 1;
    return;
  }
  const argument = process.argv[2];
  let run = null;
  if (argument !== undefined) {
    const rel = safeManifestArgument(argument);
    if (!rel) fail("unsafe-manifest-path", "argument", "명시 manifest는 dock run root 안의 안전한 project-relative manifest.md 경로여야 합니다.");
    else run = readManifest(rel);
  } else {
    const activeCandidates = discoverRunManifests().filter((candidate) => ACTIVE_STATUSES.has(candidate.status));
    if (activeCandidates.length > 1) {
      fail("multiple-active-runs", RUN_ROOT, `활성 run은 최대 하나여야 합니다. 발견: ${activeCandidates.map((item) => item.rel).join(", ")}`);
    }
    run = activeCandidates[0] ? readManifest(activeCandidates[0].rel) : null;
    if (!run && failures.length === 0) {
      printResult("ready", null, 0);
      return;
    }
  }
  if (!run) {
    printResult("failed", null, 0);
    process.exitCode = 1;
    return;
  }
  validateRunManifest(run);
  const targets = readTargets(run);
  validateOutputs(targets, run);
  if (failures.length > 0) {
    printResult("failed", run, targets.length);
    process.exitCode = 1;
    return;
  }
  printResult("passed", run, targets.length);
}

main();
