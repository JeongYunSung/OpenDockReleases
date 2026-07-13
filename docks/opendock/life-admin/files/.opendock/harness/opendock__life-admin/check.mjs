#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const config = {
  title: "Life Admin",
  runSlug: "life-admin",
  outputRoot: "life-admin",
  maxManifestBytes: 256 * 1024,
  maxTargetBytes: 512 * 1024,
  maxTargets: 12,
};

const root = fs.realpathSync(process.cwd());
const runRootRel = `.opendock/runs/${config.runSlug}`;
const runRoot = path.join(root, ...runRootRel.split("/"));
const activeStatuses = new Set(["draft", "active", "in-progress", "review", "ready"]);
const blockedSegments = new Set([".git", ".ssh", ".agents", ".opendock", "node_modules"]);
const placeholderPattern = /(?:\bTODO\b|\bTBD\b|replace-me|\bpending\b|작성하세요|여기에\s*입력)/i;
const failures = [];

const domainSections = [
  ["범위와 기간", "Scope and Period"],
  ["구독", "Subscriptions"],
  ["갱신", "Renewals"],
  ["문서 메타데이터", "Document Metadata"],
  ["보증", "Warranties"],
  ["반복 업무", "Recurring Tasks"],
  ["담당자·날짜·상태", "Owners, Dates, and Status"],
  ["알림", "Reminders"],
  ["연간 체크리스트", "Annual Checklist"],
  ["출처와 확인일", "Sources and Access Dates"],
  ["사실·가정·제안", "Facts, Assumptions, and Recommendations"],
  ["개인정보와 가림", "Privacy and Redaction"],
];

function display(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  return relative && !relative.startsWith("../") ? relative : String(file);
}

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (character) => {
    return `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
  });
}

function addFailure(rule, file, detail) {
  const item = { rule, file: typeof file === "string" ? file : display(file), detail };
  if (!failures.some((candidate) => candidate.rule === item.rule && candidate.file === item.file && candidate.detail === item.detail)) {
    failures.push(item);
  }
}

function lstatIfPresent(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function isInsideProject(file) {
  const relative = path.relative(root, file);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function hasSymlinkSegment(relative) {
  let current = root;
  for (const segment of relative.replace(/\\/g, "/").split("/").filter(Boolean)) {
    current = path.join(current, segment);
    const stat = lstatIfPresent(current);
    if (stat?.isSymbolicLink()) return true;
  }
  return false;
}

function readUtf8(file, stat, kind) {
  const limit = kind === "manifest" ? config.maxManifestBytes : config.maxTargetBytes;
  if (stat.size > limit) {
    addFailure(`${kind}-size`, display(file), `${kind} exceeds ${limit} bytes.`);
    return null;
  }
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) {
    addFailure(`${kind}-encoding`, display(file), `${kind} must be UTF-8 text without NUL bytes.`);
    return null;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    addFailure(`${kind}-encoding`, display(file), `${kind} must be valid UTF-8 text.`);
    return null;
  }
}

function parseStatus(text) {
  return topLevelText(text).match(/^(?:Status|상태):\s*([^\r\n]+)$/im)?.[1]?.trim().toLowerCase() ?? "";
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
      if (opening) {
        fence = opening;
        kept.push("");
        continue;
      }
      kept.push(line);
      continue;
    }

    if (isFenceClosing(line, fence)) fence = null;
    kept.push("");
  }
  return kept.join("\n");
}

function structuralText(text) {
  return stripFencedBlocks(stripHtmlComments(stripManagedBlocks(text)));
}

function sectionLocations(text, aliases) {
  const lines = structuralText(text).split(/\r?\n/);
  const wanted = new Set(aliases.map((alias) => alias.trim().toLowerCase()));
  const indices = [];
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^ {0,3}##\s+(.+?)\s*$/)?.[1]?.trim().toLowerCase();
    if (heading && wanted.has(heading)) indices.push(index);
  }
  return { lines, indices };
}

function validateSingletonSections(text, file) {
  const aliases = ["대상 파일", "Target Files"];
  const count = sectionLocations(text, aliases).indices.length;
  if (count > 1) {
    addFailure("duplicate-target-files", file, `Target Files / 대상 파일 must appear once; found ${count} sections.`);
  }
}

function topLevelText(text) {
  const lines = structuralText(text).split(/\r?\n/);
  const firstHeading = lines.findIndex((line) => /^#{2,6}\s+/.test(line.trim()));
  return lines.slice(0, firstHeading < 0 ? lines.length : firstHeading).join("\n");
}

function section(text, aliases) {
  const { lines, indices } = sectionLocations(text, aliases);
  if (indices.length === 0) return "";
  const start = indices[0] + 1;
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    if (/^ {0,3}##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function hasEvidence(body) {
  return body.trim().length >= 12 && !placeholderPattern.test(body);
}

function validateSections(text, file, sections, rulePrefix) {
  for (const aliases of sections) {
    const body = section(text, aliases);
    if (!body) addFailure(`${rulePrefix}-section-missing`, file, `Missing section: ${aliases.join(" / ")}.`);
    else if (!hasEvidence(body)) addFailure(`${rulePrefix}-evidence`, file, `Section lacks concrete evidence: ${aliases[0]}.`);
  }
}

function extractTargets(text) {
  const body = section(text, ["대상 파일", "Target Files"]);
  const targets = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*[-*]\s+`?([^`]+?)`?\s*$/);
    if (match) targets.push(match[1].trim());
  }
  return [...new Set(targets)];
}

function isSafeTarget(relative) {
  if (!relative || relative.length > 240 || relative.includes("\0") || /[\x00-\x1f\x7f]/.test(relative)) return false;
  if (path.isAbsolute(relative) || /^[A-Za-z]:[\\/]/.test(relative)) return false;
  const normalized = relative.replace(/\\/g, "/");
  if (normalized !== path.posix.normalize(normalized) || normalized.startsWith("./")) return false;
  const segments = normalized.split("/");
  if (segments[0] !== config.outputRoot || segments.length < 2) return false;
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || blockedSegments.has(segment.toLowerCase()))) return false;
  if (path.posix.extname(normalized).toLowerCase() !== ".md") return false;
  return isInsideProject(path.resolve(root, ...segments));
}

function inspectManifest(file, relative) {
  if (hasSymlinkSegment(relative)) {
    addFailure("run-manifest-symlink", relative, "Run manifest path must not contain symlinks.");
    return null;
  }
  const stat = lstatIfPresent(file);
  if (!stat) {
    addFailure("run-manifest-missing", relative, "Run manifest does not exist.");
    return null;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    addFailure("run-manifest-type", relative, "Run manifest must be a regular non-symlink file.");
    return null;
  }
  if (!isInsideProject(file)) {
    addFailure("run-manifest-path", relative, "Run manifest must resolve inside the project.");
    return null;
  }
  return { file, relative, stat };
}

function readStatusPrefix(manifest) {
  const length = Math.min(manifest.stat.size, 64 * 1024);
  const buffer = Buffer.alloc(length);
  const descriptor = fs.openSync(manifest.file, "r");
  try {
    fs.readSync(descriptor, buffer, 0, length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return parseStatus(buffer.toString("utf8"));
}

function readManifest(file, relative, inspected = null) {
  const manifest = inspected ?? inspectManifest(file, relative);
  if (!manifest) return null;
  const text = readUtf8(file, manifest.stat, "manifest");
  return text === null ? null : { file, relative, text, status: parseStatus(text) };
}

function explicitRun(argument) {
  if (!argument || argument.includes("\0") || path.isAbsolute(argument) || /^[A-Za-z]:[\\/]/.test(argument)) {
    addFailure("explicit-run-path", argument || "<empty>", "Explicit run manifest must be a project-relative path.");
    return null;
  }
  const normalized = argument.replace(/\\/g, "/");
  const pattern = /^\.opendock\/runs\/life-admin\/([A-Za-z0-9._-]+)\/manifest\.md$/;
  const match = normalized.match(pattern);
  if (!match || match[1] === "." || match[1] === "..") {
    addFailure("explicit-run-path", normalized, `Explicit manifest must match ${runRootRel}/<run-id>/manifest.md.`);
    return null;
  }
  return readManifest(path.resolve(root, ...normalized.split("/")), normalized);
}

function discoverActiveRuns() {
  if (hasSymlinkSegment(runRootRel)) {
    addFailure("run-root-symlink", runRootRel, "Run root path must not contain symlinks.");
    return [];
  }
  const rootStat = lstatIfPresent(runRoot);
  if (!rootStat) return [];
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    addFailure("run-root-type", runRootRel, "Run root must be a regular directory.");
    return [];
  }
  if (!isInsideProject(runRoot)) {
    addFailure("run-root-path", runRootRel, "Run root must resolve inside the project.");
    return [];
  }

  const active = [];
  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true })) {
    const runRel = `${runRootRel}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      addFailure("run-directory-symlink", runRel, "Run directory must not be a symlink.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (!/^[A-Za-z0-9._-]+$/.test(entry.name) || entry.name === "." || entry.name === "..") {
      addFailure("run-directory-name", runRel, "Run directory name is unsafe.");
      continue;
    }
    const manifestRel = `${runRel}/manifest.md`;
    const manifestFile = path.join(runRoot, entry.name, "manifest.md");
    if (!lstatIfPresent(manifestFile)) continue;
    const inspected = inspectManifest(manifestFile, manifestRel);
    if (!inspected || !activeStatuses.has(readStatusPrefix(inspected))) continue;
    const run = readManifest(manifestFile, manifestRel, inspected);
    if (run) active.push(run);
  }
  return active.sort((a, b) => a.relative.localeCompare(b.relative));
}

function readTargets(run, targetPaths) {
  const targets = [];
  for (const relative of targetPaths) {
    if (!isSafeTarget(relative)) {
      addFailure("target-path", run.relative, `Unsafe, unsupported, or out-of-scope target: ${relative}`);
      continue;
    }
    if (hasSymlinkSegment(relative)) {
      addFailure("target-symlink", relative, "Target path must not contain symlinks.");
      continue;
    }
    const file = path.resolve(root, ...relative.replace(/\\/g, "/").split("/"));
    const stat = lstatIfPresent(file);
    if (!stat) {
      addFailure("target-missing", relative, "Declared target does not exist.");
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) {
      addFailure("target-type", relative, "Target must be a regular non-symlink file.");
      continue;
    }
    if (!isInsideProject(file)) {
      addFailure("target-path", relative, "Target must resolve inside the project.");
      continue;
    }
    const text = readUtf8(file, stat, "target");
    if (text !== null) targets.push({ relative, file, text });
  }
  return targets;
}

function actionableText(text) {
  let fence = null;
  let activeFence = false;
  let previous = "";
  const safeContext = /(실행하지\s*(?:않|말)|따르지\s*(?:않|말)|(?:명령|문구).{0,12}(?:금지|차단)|(?:금지|차단)(?:됨|한다|했다)|do not (?:run|execute|follow)|don't (?:run|execute|follow)|never (?:run|execute|follow)|must not (?:run|execute|follow)|prohibited command|blocked instruction)/i;
  return text.split(/\r?\n/).map((line) => {
    if (fence === null) {
      const opening = parseFenceOpening(line);
      if (opening) {
        activeFence = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
          && !safeContext.test(previous);
        fence = opening;
        return "";
      }
    } else {
      if (isFenceClosing(line, fence)) {
        fence = null;
        activeFence = false;
        return "";
      }
      return activeFence ? line : "";
    }
    const activeContext = /(?:run|execute|follow|obey|실행|수행|따르|명령)/i.test(previous)
      && !safeContext.test(previous);
    if (/^\s*>/.test(line)) {
      const quotedEvidence = /(?:증거|인용|분석|evidence|quote)/i.test(previous);
      return activeContext && !quotedEvidence ? line.replace(/^\s*>\s?/, "") : "";
    }
    const value = safeContext.test(line) ? "" : line;
    previous = line;
    return value;
  }).join("\n");
}

function validateCommonText(text, file) {
  if (placeholderPattern.test(text)) addFailure("placeholder", file, "Active evidence and output must not contain placeholders.");

  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[opusr]_[A-Za-z0-9]{30,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bnpm_[A-Za-z0-9]{36,}\b/,
    /\bglpat-[A-Za-z0-9_-]{20,}\b/,
    /\bAIza[A-Za-z0-9_-]{35}\b/,
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
    /(?:password|passwd|pwd|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|secret|비밀번호|암호|토큰|API\s*키)\s*[:=]\s*(?!\[?(?:redacted|masked|none|없음|미저장|가림|omitted|not stored)\]?)["']?[^\s"'`]{8,}/i,
    /(?:account(?:\s+(?:number|no\.?))?|routing(?:\s+number)?|card\s+number|계좌번호|카드번호|주민등록번호|주민번호|여권번호|운전면허번호|보험증권번호)\s*[:=]\s*(?!\[?(?:redacted|masked|none|없음|미저장|가림|omitted|not stored)\]?)[A-Z0-9][A-Z0-9 -]{5,}/i,
  ];
  if (secretPatterns.some((pattern) => pattern.test(text))) {
    addFailure("secret-value", file, "Remove credential, account, or full personal identifier values.");
  }

  const actionable = actionableText(text);
  const destructive = /\brm[ \t]+(?:-[A-Za-z]*[rR][A-Za-z]*f[A-Za-z]*|-[A-Za-z]*f[A-Za-z]*[rR][A-Za-z]*|(?:-[rR]|--recursive)[ \t]+(?:-f|--force)|(?:-f|--force)[ \t]+(?:-[rR]|--recursive))(?=[ \t\r\n]|$)|\bgit\s+reset\s+--hard\b|\bdel\s+\/s\s+\/q\b|\bformat\s+[A-Za-z]:|\bRemove-Item\b[^\n]*-Recurse[^\n]*-Force/i;
  const injection = /(?:ignore|disregard).{0,40}(?:previous|prior|higher[- ]priority|system|developer).{0,40}(?:instruction|message)|(?:reveal|expose).{0,30}(?:secret|credential|system prompt)|(?:bypass|skip).{0,30}(?:approval|permission)|(?:이전|상위|시스템|개발자).{0,30}지시.{0,20}무시|(?:비밀|자격 증명|시스템 프롬프트).{0,20}(?:공개|출력)|승인.{0,20}우회/is;
  if (destructive.test(actionable)) addFailure("unsafe-instruction", file, "Active imperative destructive command detected.");
  if (injection.test(actionable)) addFailure("prompt-injection", file, "Active instruction-hierarchy bypass or secret disclosure request detected.");

  const guarantee = /(?:모든|어떤)\s*(?:갱신|마감|업무).{0,20}(?:절대|완벽히).{0,20}(?:놓치지|보장)|guaranteed\s+(?:no missed renewals|complete life administration)/i;
  if (guarantee.test(actionable)) addFailure("unsupported-guarantee", file, "Do not guarantee complete or error-free life administration.");
}

function validateSourcesAndDistinctions(text, file) {
  const sources = section(text, ["출처와 확인일", "Sources and Access Dates"]);
  if (!/https:\/\/[^\s)\]>]+/i.test(sources) || !/(조회일|확인일|accessed|access date)/i.test(sources) || !/\b20\d{2}-\d{2}-\d{2}\b/.test(sources)) {
    addFailure("source-url-date", file, "Time-sensitive evidence needs an HTTPS URL and YYYY-MM-DD access date.");
  }
  const distinctions = section(text, ["사실·가정·제안", "Facts, Assumptions, and Recommendations"]);
  const labels = [/(?:^|\n)\s*[-*]?\s*(?:사실|Fact)s?\s*:/im, /(?:^|\n)\s*[-*]?\s*(?:가정|Assumption)s?\s*:/im, /(?:^|\n)\s*[-*]?\s*(?:제안|Recommendation)s?\s*:/im];
  if (!labels.every((pattern) => pattern.test(distinctions))) {
    addFailure("facts-assumptions-recommendations", file, "Facts, assumptions, and recommendations must be explicitly separated.");
  }
}

function hasListOrNone(body) {
  return /^\s*[-*]\s+\S/m.test(body) || /(없음|해당 없음|none|not applicable)/i.test(body);
}

function validateLifeAdmin(text, file) {
  validateSourcesAndDistinctions(text, file);

  const scope = section(text, ["범위와 기간", "Scope and Period"]);
  if (!/\b20\d{2}(?:-\d{2}-\d{2})?\b/.test(scope) || !/(기간|시작|종료|포함|제외|period|start|end|include|exclude)/i.test(scope)) {
    addFailure("scope-period", file, "Scope needs a concrete period and inclusion or exclusion boundary.");
  }

  for (const aliases of [["구독", "Subscriptions"], ["갱신", "Renewals"], ["보증", "Warranties"], ["반복 업무", "Recurring Tasks"]]) {
    if (!hasListOrNone(section(text, aliases))) addFailure("inventory-structure", file, `${aliases[0]} must use concrete list items or explicitly state none.`);
  }

  const documents = section(text, ["문서 메타데이터", "Document Metadata"]);
  const metadataFields = [/(문서 유형|document type)/i, /(발급기관|issuer)/i, /(발급일|만료일|issue date|expiry date)/i, /(보관 위치|storage location)/i];
  const metadataOnly = /(본문|원문|전체 식별번호|full (?:document|identifier)|document contents).{0,40}(저장하지|미포함|제외|not stored|omitted|excluded)/is;
  if (!metadataFields.every((pattern) => pattern.test(documents)) || !metadataOnly.test(documents)) {
    addFailure("document-metadata-only", file, "Document inventory needs metadata fields and an explicit no-content/no-full-ID boundary.");
  }

  const ownership = section(text, ["담당자·날짜·상태", "Owners, Dates, and Status"]);
  const ownershipHeaders = [/(담당자|owner)/i, /(날짜|date)/i, /(상태|status)/i];
  const tableLines = ownership.split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
  if (!ownershipHeaders.every((pattern) => pattern.test(ownership)) || tableLines.length < 3) {
    addFailure("owner-date-status", file, "Use a table with owner, date, and status for actionable items.");
  }

  const reminders = section(text, ["알림", "Reminders"]);
  if (!/\b20\d{2}-\d{2}-\d{2}\b/.test(reminders) || !/(알림|등록|수신|remind|calendar|notify)/i.test(reminders)) {
    addFailure("reminder-date", file, "Reminders need a concrete date and delivery or registration status.");
  }

  const annual = section(text, ["연간 체크리스트", "Annual Checklist"]);
  if (!/[-*]\s+\[[ xX]\]/.test(annual)) addFailure("annual-checklist", file, "Annual checklist needs checkable items.");

  const privacy = section(text, ["개인정보와 가림", "Privacy and Redaction"]);
  if (!/(가림|마스킹|제외|최소화|redact|mask|omit|minimi[sz]e)/i.test(privacy) || !/(주소|주거|여행|사람|역할|address|home|travel|person|role)/i.test(privacy)) {
    addFailure("privacy-redaction", file, "Privacy section needs concrete redaction and personal/home/travel minimization evidence.");
  }

  const preciseHome = /(?:집 주소|자택 주소|home address|residential address)\s*[:=]\s*(?!\[?(?:가림|redacted|omitted|미저장)\]?)[^\r\n]{6,}/i;
  const preciseTravel = /(?:항공편|flight(?: number)?|숙소|hotel|여행 일정|travel itinerary)\s*[:=]\s*(?!\[?(?:가림|redacted|omitted|미저장)\]?)[^\r\n]{5,}/i;
  if (preciseHome.test(text) || preciseTravel.test(text)) {
    addFailure("sensitive-personal-detail", file, "Remove exact home address, flight, lodging, or detailed future itinerary data.");
  }
}

function validateRun(run) {
  validateCommonText(run.text, run.relative);
  if (!run.status) addFailure("run-status", run.relative, "Status is required.");
  const language = topLevelText(run.text).match(/^Language\s*:\s*([^\r\n]+)$/im)?.[1]?.trim().toLowerCase() ?? "";
  if (!/^(?:ko|en)$/.test(language)) addFailure("invalid-language", run.relative, "Language must be ko or en.");
  validateSingletonSections(run.text, run.relative);
  validateSections(run.text, run.relative, [["대상 파일", "Target Files"], ...domainSections, ["검증", "Validation"]], "run");
  validateLifeAdmin(run.text, run.relative);

  const targetPaths = extractTargets(run.text);
  if (targetPaths.length === 0) addFailure("target-list-empty", run.relative, "Target Files must list at least one life-admin/ Markdown file.");
  if (targetPaths.length > config.maxTargets) addFailure("target-list-size", run.relative, `Target Files exceeds ${config.maxTargets} entries.`);
  const targets = readTargets(run, targetPaths.slice(0, config.maxTargets));
  for (const target of targets) {
    validateCommonText(target.text, target.relative);
    validateSections(target.text, target.relative, domainSections, "output");
    validateLifeAdmin(target.text, target.relative);
  }
  return targets.length;
}

function printFailures(activeRun, targetCount) {
  console.error(`OpenDock harness: ${config.title}`);
  console.error("Status: failed");
  console.error(`Run: ${activeRun ?? "none"}`);
  console.error(`Targets scanned: ${targetCount}`);
  for (const failure of failures) {
    console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
  }
}

function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1) addFailure("arguments", "<command-line>", "Accepts at most one explicit run manifest path.");
  const explicit = arguments_.length === 1;
  const runs = explicit ? [explicitRun(arguments_[0])].filter(Boolean) : discoverActiveRuns();

  if (!explicit && runs.length > 1) addFailure("multiple-active-runs", runRootRel, `Expected zero or one active run, found ${runs.length}.`);
  if (failures.length > 0 && (runs.length !== 1 || (!explicit && runs.length > 1))) {
    printFailures(runs[0]?.relative ?? null, 0);
    process.exitCode = 1;
    return;
  }
  if (runs.length === 0) {
    if (failures.length > 0) {
      printFailures(null, 0);
      process.exitCode = 1;
      return;
    }
    console.log(`OpenDock harness: ${config.title}`);
    console.log("Status: ready");
    console.log("Active run: none");
    console.log("Targets scanned: 0");
    console.log("Ready: no active life-admin run found.");
    return;
  }
  if (!explicit && runs.length > 1) {
    printFailures(runs[0].relative, 0);
    process.exitCode = 1;
    return;
  }

  const targetCount = validateRun(runs[0]);
  if (failures.length > 0) {
    printFailures(runs[0].relative, targetCount);
    process.exitCode = 1;
    return;
  }
  console.log(`OpenDock harness: ${config.title}`);
  console.log("Status: passed");
  console.log(`Run: ${runs[0].relative}`);
  console.log(`Targets scanned: ${targetCount}`);
  console.log("Life admin quality gate passed.");
}

main();
