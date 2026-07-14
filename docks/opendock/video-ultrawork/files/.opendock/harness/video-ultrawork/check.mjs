#!/usr/bin/env node
import { lstatSync, readFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import {
  REPORT_SCHEMA,
  assertProjectInput,
  normalizeProjectPath,
  probeProjectMedia,
  verifyProbe
} from "../../../.codex/opendock/video-ultrawork/lib/media.mjs";

const projectRoot = process.cwd();
const manifestSchema = "opendock.video-run/v1";
const maxJsonBytes = 1024 * 1024;
const operations = new Set(["inspect", "trim", "transcode", "subtitle", "thumbnail", "upscale"]);
const failures = [];

function fail(rule, target, detail) {
  failures.push({ rule, target, detail });
}

function safeText(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, "?");
}

function parseArguments(tokens) {
  if (tokens.length !== 2 || tokens[0] !== "--manifest" || tokens[1].startsWith("--")) {
    throw new Error("usage: check.mjs --manifest .opendock/runs/video/<run-id>/manifest.json");
  }
  const rel = normalizeProjectPath(tokens[1], "manifest path");
  if (!/^\.opendock\/runs\/video\/[A-Za-z0-9._-]+\/manifest\.json$/.test(rel)) {
    throw new Error("manifest must match .opendock/runs/video/<run-id>/manifest.json");
  }
  return rel;
}

function readJson(rel, label) {
  const file = assertProjectInput(projectRoot, rel, label);
  const stat = lstatSync(file.full);
  if (stat.size > maxJsonBytes) {
    throw new Error(`${label} exceeds ${maxJsonBytes} bytes: ${rel}`);
  }
  try {
    return JSON.parse(readFileSync(file.full, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${rel}: ${error.message}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function positiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function positiveNumber(value, name, maximum = Number.POSITIVE_INFINITY) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} must be a positive number not greater than ${maximum}`);
  }
  return value;
}

function validateExpected(value, operation) {
  if (!isObject(value)) throw new Error("expected must be an object");
  const container = value.container;
  const videoCodec = value.videoCodec;
  if (!["mp4", "webm", "png", "jpeg"].includes(container)) {
    throw new Error("expected.container must be mp4, webm, png, or jpeg");
  }
  if (typeof videoCodec !== "string" || !/^[A-Za-z0-9._-]+$/.test(videoCodec)) {
    throw new Error("expected.videoCodec must be an ffprobe codec name");
  }
  const expected = {
    container,
    videoCodec,
    width: positiveInteger(value.width, "expected.width"),
    height: positiveInteger(value.height, "expected.height"),
    audio: value.audio,
    subtitle: value.subtitle
  };
  if (!["present", "absent"].includes(expected.audio)) {
    throw new Error("expected.audio must be present or absent");
  }
  if (!["present", "absent"].includes(expected.subtitle)) {
    throw new Error("expected.subtitle must be present or absent");
  }
  if (operation !== "thumbnail") {
    expected.durationSeconds = positiveNumber(value.durationSeconds, "expected.durationSeconds");
    expected.durationToleranceSeconds = positiveNumber(
      value.durationToleranceSeconds,
      "expected.durationToleranceSeconds",
      5
    );
  }
  return expected;
}

function validateOperationContract(operation, rel, expected) {
  const extension = extname(rel).toLowerCase();
  if (operation === "inspect" && extension !== ".json") {
    throw new Error("inspect path must be a JSON report");
  }
  if (["trim", "subtitle", "upscale"].includes(operation) && extension !== ".mp4") {
    throw new Error(`${operation} output must be .mp4`);
  }
  if (operation === "transcode" && ![".mp4", ".webm"].includes(extension)) {
    throw new Error("transcode output must be .mp4 or .webm");
  }
  if (operation === "thumbnail" && ![".png", ".jpg", ".jpeg"].includes(extension)) {
    throw new Error("thumbnail output must be PNG or JPEG");
  }
  const fixed = {
    trim: ["mp4", "h264"],
    subtitle: ["mp4", "h264"],
    upscale: ["mp4", "h264"],
    thumbnail: [extension === ".png" ? "png" : "jpeg", extension === ".png" ? "png" : "mjpeg"]
  }[operation];
  if (fixed && (expected.container !== fixed[0] || expected.videoCodec !== fixed[1])) {
    throw new Error(`${operation} expected codec/container must be ${fixed[1]}/${fixed[0]}`);
  }
  if (operation === "transcode") {
    const transcodeFixed = extension === ".webm" ? ["webm", "vp9"] : ["mp4", "h264"];
    if (expected.container !== transcodeFixed[0] || expected.videoCodec !== transcodeFixed[1]) {
      throw new Error(`transcode expected codec/container must be ${transcodeFixed[1]}/${transcodeFixed[0]}`);
    }
  }
  if (operation === "subtitle" && expected.subtitle !== "present") {
    throw new Error("subtitle output must expect a subtitle stream");
  }
  if (operation === "thumbnail" && (expected.audio !== "absent" || expected.subtitle !== "absent")) {
    throw new Error("thumbnail output must expect no audio or subtitle stream");
  }
  if (operation === "upscale" && (expected.width % 2 !== 0 || expected.height % 2 !== 0)) {
    throw new Error("upscale dimensions must be even");
  }
}

function assertReport(report, operation, path, reportPath, expected) {
  if (!isObject(report) || report.schema !== REPORT_SCHEMA) {
    throw new Error("helper report schema is invalid");
  }
  if (report.command !== operation) {
    throw new Error(`helper report command ${report.command} does not match ${operation}`);
  }
  if (!isObject(report.verification) || report.verification.status !== "passed") {
    throw new Error("helper report verification did not pass");
  }
  if (!Array.isArray(report.verification.checks) || !report.verification.checks.includes("video-stream")) {
    throw new Error("helper report is missing video-stream verification evidence");
  }
  if (operation === "inspect") {
    if (path !== reportPath || report.output !== null || !isObject(report.sourceProbe)) {
      throw new Error("inspect entry must point to its helper report with a sourceProbe");
    }
  } else {
    if (report.output !== path || !isObject(report.outputProbe)) {
      throw new Error("helper report output does not match the manifest output");
    }
  }
  if (typeof report.input !== "string") {
    throw new Error("helper report input path is missing");
  }
  normalizeProjectPath(report.input, "helper report input");
  if (operation === "upscale") {
    const scale = report.options?.scale;
    const sourceWidth = report.sourceProbe?.video?.width;
    const sourceHeight = report.sourceProbe?.video?.height;
    if (![2, 4].includes(scale)) {
      throw new Error("upscale helper report scale must be 2 or 4");
    }
    if (!Number.isInteger(sourceWidth) || sourceWidth <= 0 || !Number.isInteger(sourceHeight) || sourceHeight <= 0) {
      throw new Error("upscale helper report must include valid source dimensions");
    }
    if (expected.width !== sourceWidth * scale || expected.height !== sourceHeight * scale) {
      throw new Error("upscale expected dimensions must equal source dimensions multiplied by scale");
    }
  }
}

function compareCurrentWithReport(current, recorded, tolerance) {
  if (
    current.video?.width !== recorded.video?.width ||
    current.video?.height !== recorded.video?.height ||
    current.video?.codec !== recorded.video?.codec ||
    current.audio?.present !== recorded.audio?.present ||
    current.audio?.codec !== recorded.audio?.codec ||
    current.subtitle?.present !== recorded.subtitle?.present ||
    current.subtitle?.codec !== recorded.subtitle?.codec ||
    current.formatName !== recorded.formatName
  ) {
    throw new Error("current output stream signature differs from the helper report");
  }
  if (
    typeof current.durationSeconds === "number" &&
    typeof recorded.durationSeconds === "number" &&
    Math.abs(current.durationSeconds - recorded.durationSeconds) > tolerance
  ) {
    throw new Error("current output duration differs from the helper report");
  }
}

async function validateEntry(entry, index, runDirectory) {
  if (!isObject(entry)) throw new Error("output entry must be an object");
  const operation = entry.operation;
  if (!operations.has(operation)) throw new Error(`unsupported operation: ${operation}`);
  const path = normalizeProjectPath(entry.path, `outputs[${index}].path`);
  const expected = validateExpected(entry.expected, operation);
  validateOperationContract(operation, path, expected);

  const reportPath = normalizeProjectPath(
    operation === "inspect" ? path : entry.report,
    `outputs[${index}].report`
  );
  if (dirname(reportPath).replaceAll("\\", "/") !== runDirectory) {
    throw new Error("helper report must be in the same run directory as manifest.json");
  }
  const report = readJson(reportPath, "helper report");
  assertReport(report, operation, path, reportPath, expected);

  if (operation === "inspect") {
    verifyProbe(report.sourceProbe, expected);
    return;
  }

  assertProjectInput(projectRoot, path, "manifest output");
  const currentProbe = await probeProjectMedia(projectRoot, path);
  verifyProbe(currentProbe, expected);
  verifyProbe(report.outputProbe, expected);
  compareCurrentWithReport(currentProbe, report.outputProbe, expected.durationToleranceSeconds ?? 0.5);
}

async function validateManifest(manifest, manifestPath) {
  if (!isObject(manifest)) throw new Error("run manifest must be a JSON object");
  if (manifest.schema !== manifestSchema) throw new Error(`schema must be ${manifestSchema}`);
  if (manifest.status !== "ready") throw new Error("status must be ready before handoff");
  if (typeof manifest.rights !== "string" || manifest.rights.trim().length < 8) {
    throw new Error("rights must document source/output usage");
  }
  if (typeof manifest.review !== "string" || manifest.review.trim().length < 8) {
    throw new Error("review must document output verification");
  }
  if (!Array.isArray(manifest.outputs) || manifest.outputs.length === 0 || manifest.outputs.length > 16) {
    throw new Error("outputs must contain between 1 and 16 entries");
  }
  const runDirectory = dirname(manifestPath).replaceAll("\\", "/");
  for (const [index, entry] of manifest.outputs.entries()) {
    try {
      await validateEntry(entry, index, runDirectory);
    } catch (error) {
      fail("output-contract", `outputs[${index}]`, error.message);
    }
  }
}

try {
  const manifestPath = parseArguments(process.argv.slice(2));
  const manifest = readJson(manifestPath, "run manifest");
  await validateManifest(manifest, manifestPath);
} catch (error) {
  fail("manifest", "--manifest", error.message);
}

if (failures.length > 0) {
  console.error(`Video Ultrawork harness failed (${failures.length})`);
  for (const failure of failures) {
    console.error(`- [${safeText(failure.rule)}] ${safeText(failure.target)}: ${safeText(failure.detail)}`);
  }
  process.exit(1);
}

console.log("Video Ultrawork harness passed");
