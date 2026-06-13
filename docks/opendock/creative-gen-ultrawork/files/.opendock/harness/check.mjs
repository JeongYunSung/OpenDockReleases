#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Creative Generation Ultrawork";

const ignoredSegments = new Set([
  ".git",
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage"
]);

const activeStatuses = new Set(["active", "review", "ready", "ready-for-review", "handoff"]);
const inactiveStatuses = new Set(["draft", "none", "paused", "backlog"]);
const supportedModes = new Set(["image", "logo", "favicon", "video", "audio", "asset-analysis"]);

const sizeLimits = {
  image: 10 * 1024 * 1024,
  logo: 5 * 1024 * 1024,
  favicon: 2 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  audio: 80 * 1024 * 1024
};

const modeSpecs = {
  image: {
    dirs: ["assets/generated/images"],
    exts: [".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"]
  },
  logo: {
    dirs: ["assets/generated/logos"],
    exts: [".svg", ".png"]
  },
  favicon: {
    dirs: ["assets/generated/favicons", "public"],
    exts: [".ico", ".png", ".svg", ".webmanifest", ".json"]
  },
  video: {
    dirs: ["assets/generated/videos"],
    exts: [".mp4", ".mov", ".webm"]
  },
  audio: {
    dirs: ["assets/generated/audio"],
    exts: [".mp3", ".wav", ".m4a", ".ogg", ".flac"]
  }
};

const requiredDocs = ["GENERATION_BRIEF.md", "OUTPUT_MANIFEST.md", "HARNESS.md"];
const manifestSections = [
  "Generated Outputs",
  "Prompt",
  "Tool",
  "Model",
  "Date",
  "Rights",
  "Review",
  "Revision History"
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function normalize(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function listFiles(dirs, exts) {
  const files = [];
  for (const dir of dirs) {
    const full = path.join(root, dir);
    for (const file of walk(full)) {
      const ext = path.extname(file).toLowerCase();
      if (exts.includes(ext)) files.push({ full: file, rel: normalize(file), ext });
    }
  }
  return files;
}

function parseField(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}\\s*:\\s*(.+)$`, "im");
  const match = text.match(re);
  return match ? match[1].trim() : "";
}

function parseModes(briefText, manifestText, outputFiles) {
  const modeLine = parseField(briefText, "Mode").toLowerCase();
  const explicit = new Set();
  for (const mode of supportedModes) {
    const escaped = mode.replace("-", "[- ]");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(modeLine)) explicit.add(mode);
  }

  for (const file of outputFiles) {
    if (file.rel.includes("/images/")) explicit.add("image");
    if (file.rel.includes("/logos/")) explicit.add("logo");
    if (file.rel.includes("/favicons/") || file.rel.endsWith("favicon.ico") || file.rel.endsWith("manifest.webmanifest")) explicit.add("favicon");
    if (file.rel.includes("/videos/")) explicit.add("video");
    if (file.rel.includes("/audio/")) explicit.add("audio");
  }

  if (exists("ASSET_INVENTORY.md") || exists("ASSET_REPORT.md")) {
    explicit.add("asset-analysis");
  }

  return [...explicit].filter((mode) => supportedModes.has(mode));
}

function hasHeading(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^#{1,6}\\s+${escaped}\\s*$`, "im").test(text);
}

function hasSafeName(rel) {
  return rel.split("/").every((segment) => /^[a-z0-9._@+-]+$/.test(segment));
}

function hasTemporaryName(rel) {
  return /(^|\/)(\.ds_store|thumbs\.db)$/i.test(rel) || /\.(tmp|temp|bak|backup|part|download)$/i.test(rel);
}

function fileSize(file) {
  try {
    return fs.statSync(file.full).size;
  } catch {
    return 0;
  }
}

function includesAny(text, words) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function validateSvg(file, failures) {
  if (file.ext !== ".svg") return;
  const text = fs.readFileSync(file.full, "utf8");
  if (!/<svg\b/i.test(text)) failures.push({ rule: "invalid-svg", file: file.rel, detail: "SVG output must contain an <svg> root." });
  if (!/\bviewBox=/i.test(text)) failures.push({ rule: "missing-viewbox", file: file.rel, detail: "Logo and vector SVG output needs a viewBox." });
  if (/<script\b|<foreignObject\b|javascript:/i.test(text)) failures.push({ rule: "unsafe-svg", file: file.rel, detail: "SVG must not contain script, foreignObject, or javascript URLs." });
}

function validateManifestJson(failures) {
  const candidates = ["public/manifest.webmanifest", "assets/generated/favicons/manifest.webmanifest"];
  const found = candidates.find(exists);
  if (!found) return false;
  try {
    const parsed = JSON.parse(readText(found));
    if (!Array.isArray(parsed.icons) || parsed.icons.length === 0) {
      failures.push({ rule: "manifest-icons", file: found, detail: "Web manifest needs a non-empty icons array." });
    }
  } catch {
    failures.push({ rule: "manifest-json", file: found, detail: "Web manifest must be valid JSON." });
  }
  return true;
}

function failIfMissingOutput(mode, files, failures) {
  if (files.length === 0) {
    failures.push({ rule: "missing-output", file: "OUTPUT_MANIFEST.md", detail: `${mode} mode needs at least one generated output file.` });
  }
}

function validateMode(mode, manifestText, failures) {
  if (mode === "asset-analysis") {
    if (!exists("ASSET_INVENTORY.md")) failures.push({ rule: "missing-asset-inventory", file: "ASSET_INVENTORY.md", detail: "Asset analysis needs an inventory file." });
    if (!exists("ASSET_REPORT.md")) failures.push({ rule: "missing-asset-report", file: "ASSET_REPORT.md", detail: "Asset analysis needs a report file." });
    const inventory = readText("ASSET_INVENTORY.md");
    for (const word of ["license", "owner", "usage", "risk"]) {
      if (!includesAny(inventory, [word])) failures.push({ rule: "asset-inventory-field", file: "ASSET_INVENTORY.md", detail: `Inventory should include ${word}.` });
    }
    return [];
  }

  const spec = modeSpecs[mode];
  const files = listFiles(spec.dirs, spec.exts);
  failIfMissingOutput(mode, files, failures);

  for (const file of files) {
    const bytes = fileSize(file);
    if (!hasSafeName(file.rel)) failures.push({ rule: "unsafe-file-name", file: file.rel, detail: "Use lowercase safe file names with no spaces." });
    if (hasTemporaryName(file.rel)) failures.push({ rule: "temporary-file", file: file.rel, detail: "Temporary files must not be in generated output." });
    if (bytes > sizeLimits[mode]) failures.push({ rule: "file-size", file: file.rel, detail: `${mode} output exceeds the size budget.` });
    if (!manifestText.includes(file.rel)) failures.push({ rule: "manifest-path", file: file.rel, detail: "Every generated output path must be listed in OUTPUT_MANIFEST.md." });
  }

  if (mode === "image") {
    if (!exists("ALT_TEXT.md") && !includesAny(manifestText, ["alt text", "alternative text"])) {
      failures.push({ rule: "missing-alt-text", file: "OUTPUT_MANIFEST.md", detail: "Image output needs alt text in ALT_TEXT.md or the manifest." });
    }
    if (!includesAny(manifestText, ["dimension", "aspect ratio", "width", "height"])) {
      failures.push({ rule: "missing-image-spec", file: "OUTPUT_MANIFEST.md", detail: "Image output needs dimensions or aspect ratio." });
    }
  }

  if (mode === "logo") {
    for (const file of files) validateSvg(file, failures);
    if (!includesAny(manifestText, ["clearspace", "clear space", "minimum size", "usage"])) {
      failures.push({ rule: "missing-logo-usage", file: "OUTPUT_MANIFEST.md", detail: "Logo output needs usage, clearspace, or minimum size notes." });
    }
  }

  if (mode === "favicon") {
    const hasFavicon = exists("public/favicon.ico") || exists("assets/generated/favicons/favicon.ico");
    if (!hasFavicon) failures.push({ rule: "missing-favicon", file: "public/favicon.ico", detail: "Favicon mode needs favicon.ico." });
    const hasManifest = validateManifestJson(failures);
    const hasAppIcons = files.some((file) => /(^|\/)(icon-192|icon-512|apple-touch-icon)\.png$/i.test(file.rel));
    if (!hasManifest && !hasAppIcons) {
      failures.push({ rule: "missing-install-icons", file: "assets/generated/favicons", detail: "Favicon mode needs app icon PNGs or a valid web manifest." });
    }
  }

  if (mode === "video") {
    if (!exists("VIDEO_SCRIPT.md") && !exists("STORYBOARD.md") && !includesAny(manifestText, ["script", "storyboard"])) {
      failures.push({ rule: "missing-video-script", file: "VIDEO_SCRIPT.md", detail: "Video output needs a script or storyboard." });
    }
    const hasCaptionFile = listFiles(["assets/generated/videos"], [".vtt", ".srt"]).length > 0;
    if (!hasCaptionFile && !includesAny(manifestText, ["caption", "subtitle", "captions not required"])) {
      failures.push({ rule: "missing-captions", file: "OUTPUT_MANIFEST.md", detail: "Video output needs captions or a documented exception." });
    }
  }

  if (mode === "audio") {
    if (!exists("TRANSCRIPT.md") && !includesAny(manifestText, ["transcript"])) {
      failures.push({ rule: "missing-transcript", file: "TRANSCRIPT.md", detail: "Audio output needs a transcript." });
    }
    if (!includesAny(manifestText, ["voice", "source", "consent", "license"])) {
      failures.push({ rule: "missing-audio-rights", file: "OUTPUT_MANIFEST.md", detail: "Audio output needs voice/source rights notes." });
    }
  }

  return files;
}

function run() {
  const failures = [];
  for (const doc of requiredDocs) {
    if (!exists(doc)) failures.push({ rule: "missing-doc", file: doc, detail: `${doc} is required.` });
  }

  const briefText = readText("GENERATION_BRIEF.md");
  const manifestText = readText("OUTPUT_MANIFEST.md");
  const allOutputFiles = [
    ...listFiles(modeSpecs.image.dirs, modeSpecs.image.exts),
    ...listFiles(modeSpecs.logo.dirs, modeSpecs.logo.exts),
    ...listFiles(modeSpecs.favicon.dirs, modeSpecs.favicon.exts),
    ...listFiles(modeSpecs.video.dirs, [...modeSpecs.video.exts, ".vtt", ".srt"]),
    ...listFiles(modeSpecs.audio.dirs, modeSpecs.audio.exts)
  ];

  const status = parseField(briefText, "Status").toLowerCase();
  const hasGeneratedOutput = allOutputFiles.length > 0 || exists("ASSET_INVENTORY.md") || exists("ASSET_REPORT.md");
  const isActive = activeStatuses.has(status) || (!inactiveStatuses.has(status) && hasGeneratedOutput);
  const modes = parseModes(briefText, manifestText, allOutputFiles);

  for (const section of ["Purpose", "Audience", "Output Requirements", "Constraints", "Review Criteria"]) {
    if (!hasHeading(briefText, section)) failures.push({ rule: "brief-section", file: "GENERATION_BRIEF.md", detail: `Missing brief section: ${section}` });
  }

  for (const section of manifestSections) {
    if (!hasHeading(manifestText, section)) failures.push({ rule: "manifest-section", file: "OUTPUT_MANIFEST.md", detail: `Missing manifest section: ${section}` });
  }

  if (!isActive && !hasGeneratedOutput) {
    if (failures.length === 0) {
      console.log(`OpenDock harness: ${title}`);
      console.log("Status: draft");
      console.log("No active generation output detected.");
      console.log("Ultrawork passed.");
      return;
    }
  }

  if (isActive && modes.length === 0) {
    failures.push({ rule: "missing-mode", file: "GENERATION_BRIEF.md", detail: "Active generation work must set Mode to a supported value." });
  }

  if (isActive || hasGeneratedOutput) {
    for (const field of ["prompt", "tool", "model", "date", "rights", "review"]) {
      if (!includesAny(manifestText, [field])) failures.push({ rule: "manifest-field", file: "OUTPUT_MANIFEST.md", detail: `Manifest must mention ${field}.` });
    }
    for (const mode of modes) validateMode(mode, manifestText, failures);
  }

  if (failures.length > 0) {
    console.error(`OpenDock harness: ${title}`);
    console.error(`Modes: ${modes.length ? modes.join(", ") : "none"}`);
    console.error(`Generated files scanned: ${allOutputFiles.length}`);
    console.error(`Failures: ${failures.length}`);
    for (const failure of failures.slice(0, 120)) {
      console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
    }
    if (failures.length > 120) console.error(`... ${failures.length - 120} more failures omitted`);
    process.exit(1);
  }

  console.log(`OpenDock harness: ${title}`);
  console.log(`Modes: ${modes.length ? modes.join(", ") : "none"}`);
  console.log(`Generated files scanned: ${allOutputFiles.length}`);
  console.log("Ultrawork passed.");
}

run();
