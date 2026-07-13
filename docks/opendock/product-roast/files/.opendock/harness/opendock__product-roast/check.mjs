#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";

const config = {
  title: "Product Roast",
  slug: "product-roast",
  runRoot: ".opendock/runs/product-roast",
  outputPrefix: "reviews/product-roast/",
  activeStatuses: new Set(["draft", "active", "in-progress", "review", "ready"]),
  maxManifestBytes: 256 * 1024,
  maxTargetBytes: 1024 * 1024,
  maxTargets: 24,
};

const root = path.resolve(process.cwd());
const rootReal = fs.realpathSync(root);
const failures = [];
const textExtensions = new Set([".md", ".mdx", ".txt"]);
const blockedSegments = new Set([".git", ".ssh", ".agents", ".opendock", "node_modules"]);
const decoder = new TextDecoder("utf-8", { fatal: true });

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
    return `\\x${char.charCodeAt(0).toString(16).padStart(2, "0")}`;
  });
}

function addFailure(rule, file, detail) {
  if (failures.some((item) => item.rule === rule && item.file === file && item.detail === detail)) return;
  failures.push({ rule, file, detail });
}

function parseField(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(text).match(new RegExp(`^${escaped}\\s*:\\s*(.*)$`, "im"));
  return match ? match[1].trim() : "";
}

function parseTopLevelField(text, name) {
  const lines = structuralText(text).split(/\r?\n/);
  const firstSection = lines.findIndex((line) => sectionHeading(line) !== "");
  return parseField(lines.slice(0, firstSection < 0 ? lines.length : firstSection).join("\n"), name);
}

function parseFenceOpening(line) {
  const value = String(line);
  const opening = value.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    ?? value.match(/^ {0,3}(?:[-+*]|\d{1,9}[.)])[ \t]{1,4}(`{3,}|~{3,})(.*)$/);
  if (!opening || (opening[1][0] === "`" && opening[2].includes("`"))) return null;
  return { marker: opening[1][0], length: opening[1].length };
}

function isFenceClosing(line, fence) {
  const closing = String(line).match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(closing && closing[1][0] === fence.marker && closing[1].length >= fence.length);
}

function stripFencedBlocks(text) {
  const kept = [];
  let fence = null;
  for (const line of String(text).split(/\r?\n/)) {
    if (fence !== null) {
      if (isFenceClosing(line, fence)) fence = null;
      kept.push("");
      continue;
    }

    const opening = parseFenceOpening(line);
    if (opening) {
      fence = opening;
      kept.push("");
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function hasManagedEnd(line, owner) {
  return [...String(line).matchAll(/<!--\s*(OPENDOCK|OMA):END\b[^>]*-->/gi)].some(
    (match) => match[1].toUpperCase() === owner,
  );
}

function stripManagedBlocks(text) {
  const kept = [];
  let owner = null;
  for (const line of String(text).split(/\r?\n/)) {
    if (owner !== null) {
      if (hasManagedEnd(line, owner)) owner = null;
      kept.push("");
      continue;
    }

    const opening = line.match(/<!--\s*(OPENDOCK|OMA):START\b[^>]*-->/i);
    if (!opening) {
      kept.push(line);
      continue;
    }
    const candidate = opening[1].toUpperCase();
    const remainder = line.slice((opening.index ?? 0) + opening[0].length);
    if (!hasManagedEnd(remainder, candidate)) owner = candidate;
    kept.push("");
  }
  return kept.join("\n");
}

function stripHtmlComments(text) {
  return String(text).replace(/<!--[\s\S]*?(?:-->|$)/g, (comment) => comment.replace(/[^\r\n]/g, ""));
}

function structuralText(text) {
  return stripFencedBlocks(stripHtmlComments(stripManagedBlocks(text)));
}

function canonicalSectionHeading(value) {
  const normalized = String(value)
    .trim()
    .replace(/\s+#+\s*$/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const targetAlias = normalized.replace(/\s*\((?:target files|대상 파일)\)\s*$/i, "").trim();
  return targetAlias === "target files" || targetAlias === "대상 파일" ? "target files" : normalized;
}

function sectionHeading(line) {
  const match = String(line).match(/^ {0,3}##[ \t]+(.+?)[ \t]*$/);
  return match ? canonicalSectionHeading(match[1]) : "";
}

function sectionText(text, heading) {
  const lines = structuralText(text).split(/\r?\n/);
  const wanted = canonicalSectionHeading(heading);
  const sections = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (sectionHeading(lines[index]) !== wanted) continue;
    const content = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (sectionHeading(lines[cursor]) !== "") break;
      content.push(lines[cursor]);
    }
    sections.push(content.join("\n"));
  }
  return sections.join("\n");
}

function sectionCount(text, heading) {
  const wanted = canonicalSectionHeading(heading);
  return structuralText(text)
    .split(/\r?\n/)
    .filter((line) => sectionHeading(line) === wanted).length;
}

function plainText(value) {
  return String(value)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, " ")
    .replace(/[`*_#>|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasValue(value, minimum = 3) {
  const cleaned = plainText(value);
  return cleaned.length >= minimum && !containsPlaceholder(value);
}

function hasEvidence(value) {
  return hasValue(value, 16);
}

function containsPlaceholder(text) {
  return /\b(?:TODO|TBD|replace-me)\b|(?:^|\n)\s*(?:[-*]\s*)?(?:[^:\n]{1,40}:\s*)?pending\s*$|작성하세요|여기에\s*입력|\[\[[^\]\n]+\]\]/im.test(
    String(text),
  );
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function stripQuotedEvidence(text) {
  const kept = [];
  let fence = null;
  let activeFence = false;
  let previous = "";
  for (const line of String(text).split(/\r?\n/)) {
    if (fence !== null) {
      if (isFenceClosing(line, fence)) {
        fence = null;
        activeFence = false;
      } else if (activeFence) {
        kept.push(line);
      }
      continue;
    }

    const opening = parseFenceOpening(line);
    if (opening) {
      activeFence = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
        && !/(?:실행하지|따르지|금지|분석|인용|예시|do not|never|example|quote)/i.test(previous);
      fence = opening;
      continue;
    }
    const activeContext = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
      && !/(?:실행하지|따르지|금지|분석|인용|예시|do not|never|example|quote)/i.test(previous);
    if (/^\s*>/.test(line)) {
      if (activeContext) kept.push(line.replace(/^\s*>\s?/, ""));
      previous = line;
      continue;
    }
    kept.push(
      line
        .replace(/`[^`\n]*`/g, " ")
        .replace(/"[^"\n]{1,500}"/g, " ")
        .replace(/“[^”\n]{1,500}”/g, " ")
        .replace(/‘[^’\n]{1,500}’/g, " ")
        .replace(/「[^」\n]{1,500}」/g, " "),
    );
    previous = line;
  }
  return kept.join("\n");
}

function looksLikeSecret(text) {
  const value = String(text);
  const fixedPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
    /\bnpm_[A-Za-z0-9]{36,}\b/,
    /\bglpat-[A-Za-z0-9_-]{20,}\b/,
    /\bsk-[A-Za-z0-9_-]{24,}\b/,
    /\bAIza[0-9A-Za-z_-]{35}\b/,
    /\bsk_live_[A-Za-z0-9]{20,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
    /\bBearer\s+[A-Za-z0-9._~+\/-]{24,}=*\b/i,
  ];
  if (fixedPatterns.some((pattern) => pattern.test(value))) return true;

  const assignment = /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|token|client[_-]?secret|private[_-]?key|aws[_-]?secret[_-]?access[_-]?key|password|secret)\b\s*[:=]\s*["']?([^\s"'#]{16,})/gi;
  for (const match of value.matchAll(assignment)) {
    const candidate = match[1];
    if (/redacted|example|dummy|sample|placeholder|changeme|\$\{|\[\[|<[^>]+>/i.test(candidate)) continue;
    const classes = [/[a-z]/.test(candidate), /[A-Z]/.test(candidate), /\d/.test(candidate), /[^A-Za-z0-9]/.test(candidate)];
    if (classes.filter(Boolean).length >= 2) return true;
  }
  return false;
}

function validateSafety(text, file) {
  const raw = String(text);
  if (containsPlaceholder(raw)) addFailure("placeholder", file, "Active evidence and output must not contain unfinished placeholders.");
  if (looksLikeSecret(raw)) addFailure("credential-leak", file, "Secret-looking credential material is not allowed.");

  const actionable = stripQuotedEvidence(raw);
  const injectionPatterns = [
    /(?:^|\n)\s*(?:[-*]\s*)?(?:please\s+)?(?:ignore|disregard|override)\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|higher[- ]priority|system|developer|user)\s+instructions?\b/im,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:reveal|print|expose|send|upload|exfiltrate)\s+(?:the\s+)?(?:system prompt|developer message|credentials?|secrets?|tokens?|api keys?)\b/im,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:you|the\s+agent|the\s+assistant)\s+(?:must|should)\s+(?:ignore|disregard|override|reveal|send|upload|exfiltrate)\b/im,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:이전|상위|시스템|개발자|사용자)\s*(?:지시|명령)(?:를|을)?\s*(?:무시|덮어쓰|우회)(?:하라|하세요|해라)(?:[.!]|$)/m,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:비밀|토큰|API\s*키|시스템\s*프롬프트).{0,40}(?:공개하라|보내라|출력하라|노출하라)(?:[.!]|$)/m,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:에이전트|AI|어시스턴트)(?:는|가)?\s*(?:상위|이전|시스템).{0,40}(?:무시해야|우회해야|공개해야)\s*(?:한다|합니다)?(?:[.!]|$)/m,
  ];
  if (injectionPatterns.some((pattern) => pattern.test(actionable))) {
    addFailure("prompt-injection", file, "Active imperative instruction override or secret-exposure request is not allowed.");
  }

  const destructivePatterns = [
    /(?:^|\n)\s*(?:[-*]\s*)?(?:(?:command|run|execute|명령|실행)\s*:\s*)?(?:\$\s*)?(?:sudo\s+)?(?:rm[ \t]+(?:-(?=[a-z]*r)(?=[a-z]*f)[a-z]+|(?:-r|--recursive)[ \t]+(?:-f|--force)|(?:-f|--force)[ \t]+(?:-r|--recursive))|git\s+reset\s+--hard|git\s+clean\s+-(?=[a-z]*f)[a-z]+|remove-item\b[^\n]*(?:-recurse[^\n]*-force|-force[^\n]*-recurse)|diskpart\s+clean|format\s+[a-z]:)\b/im,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:delete\s+all\s+files|wipe\s+(?:the\s+)?disk|force\s+reset\s+(?:the\s+)?repository)\b/im,
    /(?:^|\n)\s*(?:[-*]\s*)?(?:모든|전체)\s*(?:파일|데이터|저장소).{0,30}(?:삭제하라|지워라|초기화하라)(?:[.!]|$)/m,
  ];
  if (destructivePatterns.some((pattern) => pattern.test(actionable))) {
    addFailure("destructive-instruction", file, "Active destructive command or imperative is not allowed.");
  }

  const guaranteePatterns = [
    /\bguarantee(?:d|s)?\s+(?:success|results?|conversion|revenue|growth)\b/i,
    /\bguarantee(?:d|s)?\s+(?:to\s+)?(?:increase|grow|convert|succeed|deliver)\b/i,
    /\bguarantee(?:d|s)?\s+(?:a\s+)?\d+(?:\.\d+)?%\s+(?:increase|growth|conversion)\b/i,
    /\b(?:will|must)\s+(?:definitely|certainly)\s+(?:succeed|increase|convert|grow)\b/i,
    /(?:성공|매출|수익|전환율|성장)(?:을|를)?\s*(?:확실히\s*)?보장(?!하지|되지|할\s*수\s*없)/,
    /100%\s*(?:성공|보장|증가|전환)/i,
    /(?:반드시|확실히).{0,20}(?:성공한다|증가한다|상승한다|달성한다|오른다)/,
  ];
  if (guaranteePatterns.some((pattern) => pattern.test(actionable))) {
    addFailure("unsupported-guarantee", file, "Unsupported guaranteed outcome claim is not allowed.");
  }

  const abusivePatterns = [
    /\b(?:you|users?|designer|team|founder|product)\s+(?:are|is)\s+(?:an?\s+)?(?:idiot|moron|stupid|pathetic|garbage|trash)\b/i,
    /(?:너|사용자|팀|디자이너|창업자|제품).{0,16}(?:멍청|바보|한심|쓰레기|형편없)/,
  ];
  if (abusivePatterns.some((pattern) => pattern.test(actionable))) {
    addFailure("abusive-language", file, "A direct review may not use abusive language.");
  }

  for (const line of actionable.split(/\r?\n/)) {
    if (!/(?:conversion(?:\s+rate)?|전환율).{0,80}\d+(?:\.\d+)?\s*%/i.test(line)) continue;
    if (/\[(?:E|S)\d+\]|source|evidence|analytics|experiment|measured|observed|근거|출처|분석|실험|측정|관찰/i.test(line)) continue;
    addFailure("unsupported-conversion-claim", file, "A numeric conversion claim needs same-line evidence or measurement context.");
    break;
  }
}

function hasSymlinkSegment(relativePath) {
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) return false;
    if (fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}

function isInsideProject(absolutePath) {
  const relative = path.relative(rootReal, absolutePath);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function decodeText(buffer, file, rule) {
  if (buffer.includes(0)) {
    addFailure(rule, file, "NUL bytes are not allowed in text evidence.");
    return null;
  }
  try {
    return decoder.decode(buffer);
  } catch {
    addFailure(rule, file, "File must be valid UTF-8 text.");
    return null;
  }
}

function readPrefix(file, bytes = 16 * 1024) {
  const handle = fs.openSync(file, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const count = fs.readSync(handle, buffer, 0, bytes, 0);
    return buffer.subarray(0, count).toString("latin1");
  } finally {
    fs.closeSync(handle);
  }
}

function normalizeExplicitManifest(argument) {
  const value = String(argument).trim();
  if (!value || value.includes("\0") || value.includes("://")) return null;
  let slashPath;
  if (path.isAbsolute(value)) {
    const absoluteSlash = path.resolve(value).split(path.sep).join("/");
    const marker = `/${config.runRoot}/`;
    const markerIndex = absoluteSlash.lastIndexOf(marker);
    if (markerIndex < 0) return null;
    const projectCandidate = absoluteSlash.slice(0, markerIndex) || path.parse(root).root;
    try {
      if (fs.realpathSync(projectCandidate) !== rootReal) return null;
    } catch {
      return null;
    }
    slashPath = absoluteSlash.slice(markerIndex + 1);
  } else {
    slashPath = value.replaceAll("\\", "/");
    if (/^[A-Za-z]:\//.test(slashPath) || slashPath.startsWith("//")) return null;
  }
  const segments = slashPath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  const normalized = path.posix.normalize(slashPath);
  const prefix = `${config.runRoot}/`;
  if (!normalized.startsWith(prefix)) return null;
  const rest = normalized.slice(prefix.length).split("/");
  if (rest.length !== 2 || rest[0].length === 0 || rest[1] !== "manifest.md") return null;
  return normalized;
}

function readManifest(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (hasSymlinkSegment(relativePath)) {
    addFailure("unsafe-run-manifest", relativePath, "Run manifest path must not contain symlinks.");
    return null;
  }
  if (!fs.existsSync(fullPath)) {
    addFailure("missing-run-manifest", relativePath, "Run manifest does not exist.");
    return null;
  }
  const stats = fs.lstatSync(fullPath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    addFailure("unsafe-run-manifest", relativePath, "Run manifest must be a regular non-symlink file.");
    return null;
  }
  if (stats.size > config.maxManifestBytes) {
    addFailure("run-manifest-too-large", relativePath, `Run manifest exceeds ${config.maxManifestBytes} bytes.`);
    return null;
  }
  const real = fs.realpathSync(fullPath);
  if (!isInsideProject(real)) {
    addFailure("unsafe-run-manifest", relativePath, "Run manifest resolves outside the project.");
    return null;
  }
  const text = decodeText(fs.readFileSync(fullPath), relativePath, "invalid-run-manifest");
  return text === null ? null : { relativePath, text };
}

function discoverActiveManifestPaths() {
  const runRootPath = path.join(root, config.runRoot);
  if (!fs.existsSync(runRootPath)) return [];
  if (hasSymlinkSegment(config.runRoot)) {
    addFailure("unsafe-run-root", config.runRoot, "Run root must not contain symlinks.");
    return [];
  }
  const rootStats = fs.lstatSync(runRootPath);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    addFailure("unsafe-run-root", config.runRoot, "Run root must be a regular directory.");
    return [];
  }

  const active = [];
  const entries = fs.readdirSync(runRootPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const runRelative = `${config.runRoot}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      addFailure("unsafe-run-directory", runRelative, "Run directory must not be a symlink.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    const manifestRelative = `${runRelative}/manifest.md`;
    const manifestPath = path.join(root, manifestRelative);
    if (!fs.existsSync(manifestPath)) continue;
    const stats = fs.lstatSync(manifestPath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      addFailure("unsafe-run-manifest", manifestRelative, "Run manifest must be a regular non-symlink file.");
      continue;
    }
    let prefix;
    try {
      prefix = readPrefix(manifestPath);
    } catch (error) {
      addFailure("unreadable-run-manifest", manifestRelative, `Cannot read run status: ${error.message}`);
      continue;
    }
    const status = parseTopLevelField(prefix, "Status").toLowerCase();
    if (!hasValue(status) || /[\x00-\x1f\x7f-\x9f]/.test(status)) {
      addFailure("missing-run-status", manifestRelative, "Run manifest must declare a concrete top-level Status near the beginning.");
      continue;
    }
    if (config.activeStatuses.has(status)) active.push(manifestRelative);
  }
  return active;
}

function requireTopField(text, file, name, minimum = 3) {
  const value = parseTopLevelField(text, name);
  if (!hasValue(value, minimum)) addFailure("missing-run-field", file, `${name} needs a concrete top-level value.`);
  return value;
}

function requireSection(text, file, heading) {
  const value = sectionText(text, heading);
  if (!hasEvidence(value)) addFailure("missing-section", file, `${heading} needs concrete evidence.`);
  return value;
}

function requireSectionField(text, file, heading, name, minimum = 16) {
  const section = sectionText(text, heading);
  const value = parseField(section, name);
  if (!hasValue(value, minimum)) addFailure("missing-evidence-field", file, `${heading} requires ${name}.`);
  return value;
}

function validateRunManifest(run) {
  const { relativePath: file, text } = run;
  validateSafety(text, file);
  const targetSectionCount = sectionCount(text, "Target Files");
  if (targetSectionCount > 1) {
    addFailure("duplicate-section", file, `Target Files/대상 파일 must appear once; found ${targetSectionCount}.`);
  }
  requireTopField(text, file, "Status");
  const language = requireTopField(text, file, "Language", 2).toLowerCase();
  if (language && !/^(?:ko|en)$/.test(language)) addFailure("invalid-language", file, "Language must be ko or en.");
  requireTopField(text, file, "Product");
  requireTopField(text, file, "Scope", 8);
  const date = requireTopField(text, file, "Review Date");
  if (date && !isIsoDate(date)) addFailure("invalid-date", file, "Review Date must be a valid YYYY-MM-DD date.");
  const tone = requireTopField(text, file, "Selected Tone").toLowerCase();
  if (tone && !/^(supportive|balanced|direct)$/.test(tone)) {
    addFailure("invalid-tone", file, "Selected Tone must be supportive, balanced, or direct.");
  }

  for (const heading of [
    "Target Files",
    "Review Evidence",
    "Facts",
    "Assumptions",
    "Recommendations",
    "Evidence / Sources",
    "Severity Evidence",
    "Keep / Change Evidence",
    "Prioritization Evidence",
    "Validation Evidence",
    "Safety / Limitations",
  ]) {
    requireSection(text, file, heading);
  }

  requireSectionField(text, file, "Review Evidence", "Evidence Basis");
  requireSectionField(text, file, "Review Evidence", "Scope Coverage");
  requireSectionField(text, file, "Facts", "Facts Basis");
  requireSectionField(text, file, "Assumptions", "Assumptions Basis");
  requireSectionField(text, file, "Recommendations", "Recommendation Basis");
  const sourceUrl = requireSectionField(text, file, "Evidence / Sources", "Source URL");
  if (sourceUrl && !isHttpUrl(sourceUrl)) addFailure("invalid-source-url", file, "Source URL must be an absolute HTTP or HTTPS URL.");
  const accessDate = requireSectionField(text, file, "Evidence / Sources", "Access Date", 3);
  if (accessDate && !isIsoDate(accessDate)) addFailure("invalid-access-date", file, "Access Date must be a valid YYYY-MM-DD date.");
  requireSectionField(text, file, "Evidence / Sources", "Source Use");
  requireSectionField(text, file, "Severity Evidence", "Severity Scale");
  requireSectionField(text, file, "Keep / Change Evidence", "Keep Decision");
  requireSectionField(text, file, "Keep / Change Evidence", "Change Decision");
  requireSectionField(text, file, "Prioritization Evidence", "Priority Method");
  requireSectionField(text, file, "Validation Evidence", "Validation Method");
  const validation = requireSectionField(text, file, "Validation Evidence", "Validation Result");
  if (validation && !/(?:pass|passed|통과|확인|완료)/i.test(validation)) {
    addFailure("invalid-validation-result", file, "Validation Result must record a passing or completed check.");
  }
  requireSectionField(text, file, "Safety / Limitations", "Limitations");
  requireSectionField(text, file, "Safety / Limitations", "Claim Discipline");
  requireSectionField(text, file, "Safety / Limitations", "Redaction");
}

function extractTargetCandidates(text) {
  const targets = [];
  for (const line of sectionText(text, "Target Files").split(/\r?\n/)) {
    if (!/^\s*[-*]\s+/.test(line)) continue;
    const inline = [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    targets.push(...(inline.length > 0 ? inline : [line.replace(/^\s*[-*]\s+/, "").trim()]));
  }
  return [...new Set(targets)];
}

function normalizeTarget(candidate) {
  const value = String(candidate).trim().replace(/^["'`]+|["'`]+$/g, "");
  if (!value || value.length > 240 || value.includes("\0") || value.includes("://") || /[*?\[\]]/.test(value)) return null;
  if (path.isAbsolute(value)) return null;
  const slashPath = value.replaceAll("\\", "/");
  if (/^[A-Za-z]:\//.test(slashPath) || slashPath.startsWith("//")) return null;
  const segments = slashPath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  if (segments.some((segment) => blockedSegments.has(segment.toLowerCase()) || segment.toLowerCase().startsWith(".env"))) return null;
  const normalized = path.posix.normalize(slashPath);
  if (!normalized.startsWith(config.outputPrefix) || normalized.length === config.outputPrefix.length) return null;
  if (!textExtensions.has(path.posix.extname(normalized).toLowerCase())) return null;
  const absolute = path.resolve(root, normalized);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null;
  return normalized;
}

function readTargets(run) {
  const candidates = extractTargetCandidates(run.text);
  if (candidates.length === 0) {
    addFailure("missing-target-files", run.relativePath, "Target Files must declare at least one output file.");
    return [];
  }
  if (candidates.length > config.maxTargets) {
    addFailure("too-many-target-files", run.relativePath, `Target Files exceeds ${config.maxTargets} entries.`);
  }

  const targets = [];
  for (const candidate of candidates.slice(0, config.maxTargets)) {
    const relativePath = normalizeTarget(candidate);
    if (!relativePath) {
      addFailure("unsafe-target-path", run.relativePath, `Unsafe, unsupported, or out-of-scope target: ${candidate}`);
      continue;
    }
    const fullPath = path.join(root, relativePath);
    if (!fs.existsSync(fullPath)) {
      addFailure("missing-target", relativePath, "Declared target does not exist.");
      continue;
    }
    if (hasSymlinkSegment(relativePath)) {
      addFailure("target-symlink", relativePath, "Target path must not contain symlinks.");
      continue;
    }
    const stats = fs.lstatSync(fullPath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      addFailure("unsafe-target-file", relativePath, "Target must be a regular non-symlink file.");
      continue;
    }
    if (stats.size > config.maxTargetBytes) {
      addFailure("target-too-large", relativePath, `Target exceeds ${config.maxTargetBytes} bytes.`);
      continue;
    }
    const real = fs.realpathSync(fullPath);
    if (!isInsideProject(real)) {
      addFailure("unsafe-target-path", relativePath, "Target resolves outside the project.");
      continue;
    }
    const text = decodeText(fs.readFileSync(fullPath), relativePath, "binary-target");
    if (text === null) continue;
    targets.push({ relativePath, text });
  }
  return targets;
}

function requireOutputTopField(text, file, name, minimum = 3) {
  const value = parseTopLevelField(text, name);
  if (!hasValue(value, minimum)) addFailure("missing-output-field", file, `${name} needs a concrete top-level value.`);
  return value;
}

function requireOutputSection(text, file, heading) {
  const value = sectionText(text, heading);
  if (!hasEvidence(value)) addFailure("missing-output-section", file, `${heading} needs concrete review content.`);
  return value;
}

function requireOutputSectionField(text, file, heading, name, minimum = 16) {
  const value = parseField(sectionText(text, heading), name);
  if (!hasValue(value, minimum)) addFailure("missing-output-evidence", file, `${heading} requires ${name}.`);
  return value;
}

function validateProductOutput(targets, runFile) {
  for (const target of targets) validateSafety(target.text, target.relativePath);
  const combined = targets.map((target) => target.text).join("\n\n");
  const file = runFile;
  requireOutputTopField(combined, file, "Product");
  requireOutputTopField(combined, file, "Scope", 8);
  const date = requireOutputTopField(combined, file, "Review Date");
  if (date && !isIsoDate(date)) addFailure("invalid-output-date", file, "Output Review Date must be a valid YYYY-MM-DD date.");
  const tone = requireOutputTopField(combined, file, "Selected Tone").toLowerCase();
  if (tone && !/^(supportive|balanced|direct)$/.test(tone)) addFailure("invalid-output-tone", file, "Output tone must be supportive, balanced, or direct.");

  for (const heading of [
    "First Impression",
    "Value Proposition",
    "Information Architecture",
    "CTA",
    "Trust",
    "Copy",
    "Pricing",
    "Onboarding",
    "Mobile",
    "Evidence",
    "Facts",
    "Assumptions",
    "Recommendations",
    "Evidence / Sources",
    "Findings",
    "Keep / Change",
    "Prioritized Action Plan",
  ]) {
    requireOutputSection(combined, file, heading);
  }

  requireOutputSectionField(combined, file, "Evidence", "Evidence Item");
  requireOutputSectionField(combined, file, "Evidence", "Evidence Method");
  requireOutputSectionField(combined, file, "Facts", "Fact");
  requireOutputSectionField(combined, file, "Assumptions", "Assumption");
  requireOutputSectionField(combined, file, "Recommendations", "Recommendation");
  const sourceUrl = requireOutputSectionField(combined, file, "Evidence / Sources", "Source URL");
  if (sourceUrl && !isHttpUrl(sourceUrl)) addFailure("invalid-output-source-url", file, "Output Source URL must be an absolute HTTP or HTTPS URL.");
  const accessDate = requireOutputSectionField(combined, file, "Evidence / Sources", "Access Date", 3);
  if (accessDate && !isIsoDate(accessDate)) addFailure("invalid-output-access-date", file, "Output Access Date must be a valid YYYY-MM-DD date.");
  requireOutputSectionField(combined, file, "Evidence / Sources", "Supported Fact");
  const severity = requireOutputSectionField(combined, file, "Findings", "Severity").toLowerCase();
  if (severity && !/^(critical|high|medium|low|치명|높음|중간|낮음)\b/.test(severity)) {
    addFailure("invalid-severity", file, "Severity must begin with critical, high, medium, or low.");
  }
  requireOutputSectionField(combined, file, "Keep / Change", "Keep");
  requireOutputSectionField(combined, file, "Keep / Change", "Change");
  requireOutputSectionField(combined, file, "Prioritized Action Plan", "Priority 1");
  requireOutputSectionField(combined, file, "Prioritized Action Plan", "Priority 2");
}

function printFailureSummary(activeRun, targetCount) {
  console.error(`OpenDock harness: ${config.title}`);
  console.error("Status: Failed");
  console.error(`Run manifest: ${activeRun ?? "none"}`);
  console.error(`Targets scanned: ${targetCount}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures.slice(0, 100)) {
    console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
  }
  if (failures.length > 100) console.error(`... ${failures.length - 100} more failures omitted`);
}

function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1) {
    addFailure("invalid-arguments", "command-line", "Provide zero arguments or one project-internal run manifest path.");
    printFailureSummary(null, 0);
    process.exit(1);
  }

  let manifestPath = null;
  if (arguments_.length === 1) {
    manifestPath = normalizeExplicitManifest(arguments_[0]);
    if (!manifestPath) addFailure("unsafe-manifest-path", "command-line", "Explicit manifest must resolve inside the dock run directory in this project.");
  } else {
    const activePaths = discoverActiveManifestPaths();
    if (activePaths.length > 1) {
      addFailure("multiple-active-runs", config.runRoot, `Expected zero or one active run, found ${activePaths.length}: ${activePaths.join(", ")}`);
    } else if (activePaths.length === 1) {
      manifestPath = activePaths[0];
    }
    if (manifestPath === null && failures.length === 0) {
      console.log(`OpenDock harness: ${config.title}`);
      console.log("Status: Ready");
      console.log("Run manifest: none");
      console.log("Targets scanned: 0");
      return;
    }
  }

  if (failures.length > 0 || manifestPath === null) {
    printFailureSummary(manifestPath, 0);
    process.exit(1);
  }

  const run = readManifest(manifestPath);
  if (run === null) {
    printFailureSummary(manifestPath, 0);
    process.exit(1);
  }
  validateRunManifest(run);
  const targets = readTargets(run);
  validateProductOutput(targets, run.relativePath);

  if (failures.length > 0) {
    printFailureSummary(run.relativePath, targets.length);
    process.exit(1);
  }

  console.log(`OpenDock harness: ${config.title}`);
  console.log("Status: Passed");
  console.log(`Run manifest: ${run.relativePath}`);
  console.log(`Targets scanned: ${targets.length}`);
}

main();
