#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const config = {
  title: "Purchase Decision",
  runSlug: "purchase-decision",
  outputRoot: "purchases",
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
  ["범위와 사용 사례", "Scope and Use Cases"],
  ["의사결정 기준", "Decision Criteria"],
  ["후보", "Candidates"],
  ["근거와 출처", "Evidence and Sources"],
  ["사실과 가정", "Facts and Assumptions"],
  ["가중 비교", "Weighted Comparison"],
  ["탈락 조건", "Dealbreakers"],
  ["총소유비용", "Total Cost of Ownership"],
  ["위험과 불확실성", "Risks and Uncertainty"],
  ["추천과 이유", "Recommendation and Why"],
  ["다음 검증 단계", "Next Verification Step"],
  ["이해상충과 제휴", "Conflicts and Affiliate Disclosure"],
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
  const pattern = /^\.opendock\/runs\/purchase-decision\/([A-Za-z0-9._-]+)\/manifest\.md$/;
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
    /(?:account(?:\s+(?:number|no\.?))?|routing(?:\s+number)?|card\s+number|계좌번호|카드번호|주민등록번호|주민번호|여권번호)\s*[:=]\s*(?!\[?(?:redacted|masked|none|없음|미저장|가림|omitted|not stored)\]?)[A-Z0-9][A-Z0-9 -]{5,}/i,
  ];
  if (secretPatterns.some((pattern) => pattern.test(text))) {
    addFailure("secret-value", file, "Remove credential, account, or full personal identifier values.");
  }

  const actionable = actionableText(text);
  const destructive = /\brm[ \t]+(?:-[A-Za-z]*[rR][A-Za-z]*f[A-Za-z]*|-[A-Za-z]*f[A-Za-z]*[rR][A-Za-z]*|(?:-[rR]|--recursive)[ \t]+(?:-f|--force)|(?:-f|--force)[ \t]+(?:-[rR]|--recursive))(?=[ \t\r\n]|$)|\bgit\s+reset\s+--hard\b|\bdel\s+\/s\s+\/q\b|\bformat\s+[A-Za-z]:|\bRemove-Item\b[^\n]*-Recurse[^\n]*-Force/i;
  const injection = /(?:ignore|disregard).{0,40}(?:previous|prior|higher[- ]priority|system|developer).{0,40}(?:instruction|message)|(?:reveal|expose).{0,30}(?:secret|credential|system prompt)|(?:bypass|skip).{0,30}(?:approval|permission)|(?:이전|상위|시스템|개발자).{0,30}지시.{0,20}무시|(?:비밀|자격 증명|시스템 프롬프트).{0,20}(?:공개|출력)|승인.{0,20}우회/is;
  if (destructive.test(actionable)) addFailure("unsafe-instruction", file, "Active imperative destructive command detected.");
  if (injection.test(actionable)) addFailure("prompt-injection", file, "Active instruction-hierarchy bypass or secret disclosure request detected.");

  const guarantee = /(?:무조건|100%)\s*(?:최저가|최고|완벽)|(?:최저가|최고의 제품|구매 성공)\s*(?:보장|확정)|guaranteed\s+(?:lowest price|best|perfect purchase)/i;
  if (guarantee.test(actionable)) addFailure("unsupported-guarantee", file, "Do not guarantee best product, lowest price, or purchase outcome.");
}

function countStructuredItems(body) {
  const bullets = body.split(/\r?\n/).filter((line) => /^\s*[-*]\s+\S/.test(line)).length;
  const tableRows = body.split(/\r?\n/).filter((line) => /^\s*\|/.test(line) && !/^\s*\|?\s*:?-+/.test(line)).length;
  return Math.max(bullets, Math.max(0, tableRows - 1));
}

function validateSourcesAndDistinctions(text, file) {
  const sources = section(text, ["근거와 출처", "Evidence and Sources"]);
  if (!/https:\/\/[^\s)\]>]+/i.test(sources) || !/(조회일|확인일|accessed|access date)/i.test(sources) || !/\b20\d{2}-\d{2}-\d{2}\b/.test(sources)) {
    addFailure("source-url-date", file, "Evidence needs an HTTPS source URL and explicit YYYY-MM-DD access date.");
  }
  const distinctions = section(text, ["사실과 가정", "Facts and Assumptions"]);
  if (!/(?:^|\n)\s*[-*]?\s*(?:사실|Fact)s?\s*:/im.test(distinctions) || !/(?:^|\n)\s*[-*]?\s*(?:가정|Assumption)s?\s*:/im.test(distinctions)) {
    addFailure("facts-assumptions", file, "Facts and assumptions must be explicitly labeled and separated.");
  }
}

function validatePurchase(text, file) {
  validateSourcesAndDistinctions(text, file);

  const criteria = section(text, ["의사결정 기준", "Decision Criteria"]);
  const missingCriteria = ["Must", "Should", "Won't"].filter((label) => !new RegExp(`(?:^|\\n)\\s*[-*]?\\s*${label.replace("'", "['’]")}\\s*:`, "i").test(criteria));
  if (missingCriteria.length) addFailure("decision-criteria", file, `Missing criteria labels: ${missingCriteria.join(", ")}.`);

  const candidates = section(text, ["후보", "Candidates"]);
  if (countStructuredItems(candidates) < 2) addFailure("candidate-count", file, "List at least two concrete candidates.");

  const comparison = section(text, ["가중 비교", "Weighted Comparison"]);
  const weights = [...comparison.matchAll(/(?:^|[^\d])(\d{1,3})\s*%/g)].map((match) => Number(match[1]));
  const tableLines = comparison.split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
  if (weights.length < 2 || weights.reduce((sum, value) => sum + value, 0) !== 100 || tableLines.length < 4 || !/\|\s*[0-5](?:\.\d+)?\s*\|/.test(comparison)) {
    addFailure("weighted-comparison", file, "Use a comparison table with numeric scores and criterion weights totaling 100%.");
  }

  const ownership = section(text, ["총소유비용", "Total Cost of Ownership"]);
  if (!/(KRW|USD|EUR|JPY|원|달러|유로|엔|[$€¥])/i.test(ownership) || !/(\d+\s*(?:개월|년|months?|years?)|기간)/i.test(ownership)) {
    addFailure("total-cost", file, "Total cost needs an explicit currency and ownership period.");
  }

  const recommendation = section(text, ["추천과 이유", "Recommendation and Why"]);
  if (!/(이유|때문|근거|because|reason)/i.test(recommendation)) addFailure("recommendation-why", file, "Recommendation must explain why it fits the use case.");

  const nextStep = section(text, ["다음 검증 단계", "Next Verification Step"]);
  if (!/\b20\d{2}-\d{2}-\d{2}\b/.test(nextStep) || !/(확인|검증|문의|측정|check|verify|contact|test)/i.test(nextStep)) {
    addFailure("next-verification", file, "Next verification step needs a concrete action and date.");
  }

  const conflict = section(text, ["이해상충과 제휴", "Conflicts and Affiliate Disclosure"]);
  if (!/(제휴|협찬|수익|이해상충|affiliate|sponsor|conflict)/i.test(conflict) || !/(없음|없다|none|disclos|공개)/i.test(conflict)) {
    addFailure("affiliate-disclosure", file, "Disclose affiliate, sponsorship, and conflict status, including none.");
  }
}

function validateRun(run) {
  validateCommonText(run.text, run.relative);
  if (!run.status) addFailure("run-status", run.relative, "Status is required.");
  const language = topLevelText(run.text).match(/^Language\s*:\s*([^\r\n]+)$/im)?.[1]?.trim().toLowerCase() ?? "";
  if (!/^(?:ko|en)$/.test(language)) addFailure("invalid-language", run.relative, "Language must be ko or en.");
  validateSingletonSections(run.text, run.relative);
  validateSections(run.text, run.relative, [["대상 파일", "Target Files"], ...domainSections, ["검증", "Validation"]], "run");
  validatePurchase(run.text, run.relative);

  const targetPaths = extractTargets(run.text);
  if (targetPaths.length === 0) addFailure("target-list-empty", run.relative, "Target Files must list at least one purchases/ Markdown file.");
  if (targetPaths.length > config.maxTargets) addFailure("target-list-size", run.relative, `Target Files exceeds ${config.maxTargets} entries.`);
  const targets = readTargets(run, targetPaths.slice(0, config.maxTargets));
  for (const target of targets) {
    validateCommonText(target.text, target.relative);
    validateSections(target.text, target.relative, domainSections, "output");
    validatePurchase(target.text, target.relative);
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

  if (!explicit && runs.length > 1) {
    addFailure("multiple-active-runs", runRootRel, `Expected zero or one active run, found ${runs.length}.`);
  }

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
    console.log("Ready: no active purchase-decision run found.");
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
  console.log("Purchase decision quality gate passed.");
}

main();
