#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { validateFoodSafety } from "./food-safety.mjs";
import {
  hasSymlinkSegment,
  isPathInside,
  lstatIfPresent,
  normalizePath,
  resolvedInsideProject,
  validateRunRoot,
} from "./path-safety.mjs";

const title = "Kitchen Ultrawork";
const root = fs.realpathSync(process.cwd());
const activeStatuses = new Set(["draft", "active", "in-progress", "in_progress", "review", "ready"]);
const maxManifestBytes = 256 * 1024;
const maxTargetBytes = 1024 * 1024;
const maxTargets = 24;
const allowedExtensions = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".csv"]);
const blockedSegments = new Set([".git", ".opendock", ".agents", ".codex", ".claude", ".ssh", "node_modules"]);
const failures = [];

function normalize(file) {
  return normalizePath(root, file);
}

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(2, "0");
    return `\\x${code}`;
  });
}

function addFailure(rule, file, detail) {
  if (failures.some((item) => item.rule === rule && item.file === file && item.detail === detail)) return;
  failures.push({ rule, file, detail });
}

function parseField(text, name) {
  const match = text.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function section(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^##\\s+${escaped}\\s*$`, "im").exec(text);
  if (!match || match.index === undefined) return "";
  const tail = text.slice(match.index + match[0].length);
  const nextHeading = tail.search(/^##\s+/m);
  return (nextHeading === -1 ? tail : tail.slice(0, nextHeading)).trim();
}

function readRunManifests() {
  const runRoot = validateRunRoot(root, addFailure);
  if (!runRoot) return [];
  const result = [];
  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true })) {
    const runDirectory = path.join(runRoot, entry.name);
    if (entry.isSymbolicLink()) {
      addFailure("run-directory-type", normalize(runDirectory), "Run directories must not be symlinks.");
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (!resolvedInsideProject(root, runDirectory, addFailure, "run-path", "Run directory")) continue;
    const file = path.join(runDirectory, "manifest.md");
    const stat = lstatIfPresent(file);
    if (!stat) continue;
    if (!stat.isFile() || stat.isSymbolicLink()) {
      addFailure("run-manifest-type", normalize(file), "Run manifest must be a regular file, not a symlink.");
      continue;
    }
    if (!resolvedInsideProject(root, file, addFailure, "run-path", "Run manifest")) continue;
    if (stat.size > maxManifestBytes) {
      addFailure("run-manifest-size", normalize(file), `Run manifest exceeds ${maxManifestBytes} bytes.`);
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const status = parseField(text, "Status").toLowerCase();
    if (activeStatuses.has(status)) result.push({ file, text, status });
  }
  return result.sort((a, b) => a.file.localeCompare(b.file));
}

function extractTargets(text) {
  const body = section(text, "Target Files");
  const targets = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*[-*]\s+`?([^`]+?)`?\s*$/);
    if (match) targets.push(match[1].trim());
  }
  return [...new Set(targets)];
}

function safeTarget(relative) {
  if (!relative || path.isAbsolute(relative) || relative.includes("\0")) return false;
  const normalized = relative.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] !== "kitchen" || segments.some((part) => part === ".." || part === "." || blockedSegments.has(part))) return false;
  if (!allowedExtensions.has(path.extname(normalized).toLowerCase())) return false;
  const resolved = path.resolve(root, normalized);
  return isPathInside(root, resolved) && resolved !== root;
}

function readTargets(manifestFile, targetPaths) {
  const targets = [];
  for (const relative of targetPaths) {
    if (!safeTarget(relative)) {
      addFailure("target-path", normalize(manifestFile), `Unsafe or out-of-scope target path: ${relative}`);
      continue;
    }
    if (hasSymlinkSegment(root, relative)) {
      addFailure("target-symlink", relative, "Target path must not contain symlinks.");
      continue;
    }
    const file = path.resolve(root, relative);
    const fileStat = lstatIfPresent(file);
    if (!fileStat || !fileStat.isFile()) {
      addFailure("target-missing", relative, "Target file does not exist.");
      continue;
    }
    if (!resolvedInsideProject(root, file, addFailure, "target-path", "Target file")) continue;
    const stat = fs.statSync(file);
    if (stat.size > maxTargetBytes) {
      addFailure("target-size", relative, `Target exceeds ${maxTargetBytes} bytes.`);
      continue;
    }
    targets.push({ relative, text: fs.readFileSync(file, "utf8") });
  }
  return targets;
}

function validateRecipe(target) {
  const text = target.text;
  const required = [
    [/(servings|인분)/i, "servings"],
    [/(ingredients|재료)/i, "ingredients"],
    [/(steps|instructions|만드는 법|조리 순서|조리법)/i, "steps"],
    [/(prep time|cook time|준비 시간|조리 시간)/i, "time"],
    [/(allergen|알레르기)/i, "allergen notes"],
    [/(storage|reheating|보관|재가열)/i, "storage and reheating"],
  ];
  const missing = required.filter(([pattern]) => !pattern.test(text)).map(([, label]) => label);
  if (missing.length) addFailure("recipe-core", target.relative, `Recipe is missing: ${missing.join(", ")}.`);
}

function validateContent(target, sourceEvidence) {
  const text = target.text;
  const looksLikeRecipe = /(^|\/)recipes?\//i.test(target.relative) || /^#\s+.*recipe|^#\s+레시피/im.test(text);
  if (looksLikeRecipe) validateRecipe(target);

  if (/(치료한다|완치|질병을?\s*예방|의학적으로 보장|detox(?:es)?|cures?|prevents? disease)/i.test(text)) {
    addFailure("medical-claim", target.relative, "Do not present recipes or foods as medical treatment, cure, or guaranteed prevention.");
  }

  if (/(알레르기\s*(?:없음|안전)|allergen[- ]free|safe for (?:all|everyone))/i.test(text) && !/(교차오염|표시 확인|제품 라벨|cross[- ]contamination|check the label)/i.test(text)) {
    addFailure("allergen-guarantee", target.relative, "Allergen safety claims need label and cross-contamination caveats.");
  }

  validateFoodSafety({ text, sourceEvidence, file: target.relative, addFailure });

}

function validateRun(run) {
  const manifestRel = normalize(run.file);
  if (!parseField(run.text, "Mode")) addFailure("run-mode", manifestRel, "Mode is required.");

  const targetPaths = extractTargets(run.text);
  if (targetPaths.length === 0) addFailure("target-list-empty", manifestRel, "Target Files must list at least one kitchen/ file.");
  if (targetPaths.length > maxTargets) addFailure("target-list-size", manifestRel, `Target Files exceeds ${maxTargets} entries.`);
  const targets = readTargets(run.file, targetPaths.slice(0, maxTargets));
  const sourceEvidence = section(run.text, "Sources And Uncertainty");
  for (const target of targets) validateContent(target, sourceEvidence);
}

function main() {
  const runs = readRunManifests();
  console.log(`OpenDock harness: ${title}`);
  if (runs.length > 1) {
    addFailure("multiple-active-runs", normalize(path.join(root, ".opendock", "runs", "kitchen")), "Exactly one draft or active kitchen run may exist at a time.");
  }
  console.log(`Active runs: ${runs.length}`);
  for (const run of runs) validateRun(run);
  if (failures.length > 0) {
    console.error(`Kitchen Ultrawork failed with ${failures.length} issue(s):`);
    for (const failure of failures) {
      console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
    }
    process.exitCode = 1;
    return;
  }
  if (runs.length === 0) console.log("No active kitchen run found. Ready.");
  else console.log("Kitchen Ultrawork passed.");
}

main();
