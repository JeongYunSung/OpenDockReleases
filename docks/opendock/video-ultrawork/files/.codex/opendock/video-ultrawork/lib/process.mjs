import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { ffmpegPath as nodeAvFfmpegPath, ffmpegVersion } from "node-av/ffmpeg";
import { projectRootReal } from "./paths.mjs";

const maxProcessOutputBytes = 16 * 1024 * 1024;
const expectedNodeAvVersion = "6.1.1";
const expectedFfmpegVersion = "8.1";
const require = createRequire(import.meta.url);
const nodeAvEntry = require.resolve("node-av");
const nodeAvRoot = resolve(dirname(nodeAvEntry), "..");
const nodeAvPackage = JSON.parse(readFileSync(join(nodeAvRoot, "package.json"), "utf8"));
export const ffmpegVerificationMarker = join(nodeAvRoot, "binary", ".opendock-verified.json");

const binaryPolicies = Object.freeze({
  "darwin-arm64": Object.freeze({
    fileName: "ffmpeg",
    sha256: "21e892603ea18c7607a34ce0b96c5f0b7299f8703ccb7b7a84baf38542ad78b2",
    versionPrefix: "ffmpeg version 8.1-Jellyfin"
  }),
  "darwin-x64": Object.freeze({
    fileName: "ffmpeg",
    sha256: "81fde53658014fef0a9676edce18d9da4846182a34b81119b551d51d77d53f0d",
    versionPrefix: "ffmpeg version 8.1-Jellyfin"
  }),
  "win32-x64": Object.freeze({
    fileName: "ffmpeg.exe",
    sha256: "d06c45704cd247744f83fc1ed8e005ce1d1b8f84b0c4acd8e17a7c1b8a202b0a",
    versionPrefix: "ffmpeg version 8.1"
  }),
  "win32-arm64": Object.freeze({
    fileName: "ffmpeg.exe",
    sha256: "c485e0283b46f5b3a5b79120daa7583217e00db2534ecb3a4be048e902e75399",
    versionPrefix: "ffmpeg version 8.1"
  })
});

export function binaryPolicyFor(platform = process.platform, arch = process.arch) {
  const key = `${platform}-${arch}`;
  const policy = binaryPolicies[key];
  if (!policy) {
    throw new Error(`unsupported FFmpeg platform: ${key}`);
  }
  return policy;
}

function assertDependencyBinary(value, policy) {
  if (typeof value !== "string" || value.length === 0 || !isAbsolute(value)) {
    throw new Error("node-av did not expose an absolute FFmpeg binary path");
  }
  if (!existsSync(value)) {
    throw new Error("node-av FFmpeg binary is missing");
  }
  const stat = lstatSync(value);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("node-av FFmpeg binary must be a regular file, not a symlink");
  }
  const root = realpathSync(nodeAvRoot);
  const full = resolve(value);
  const back = relative(root, full);
  if (back === "" || back === ".." || back.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(back)) {
    throw new Error("node-av FFmpeg binary escaped its package directory");
  }
  let current = root;
  for (const segment of back.split(/[\\/]/)) {
    current = join(current, segment);
    const currentStat = lstatSync(current);
    if (currentStat.isSymbolicLink()) {
      throw new Error("node-av FFmpeg binary path must not contain symlinks");
    }
  }
  if (basename(full).toLowerCase() !== policy.fileName.toLowerCase()) {
    throw new Error(`node-av FFmpeg binary must be named ${policy.fileName}`);
  }
  return full;
}

function sha256File(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("error", reject)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolveHash(hash.digest("hex")));
  });
}

export function assertFfmpegVersionOutput(stdout, policy) {
  const firstLine = String(stdout).split(/\r?\n/, 1)[0];
  if (!firstLine.startsWith(policy.versionPrefix)) {
    throw new Error(`unexpected FFmpeg version: ${firstLine || "empty output"}`);
  }
}

let verifiedPathPromise;

export function verifiedFfmpegPath() {
  verifiedPathPromise ??= verifyDownloadedFfmpeg();
  return verifiedPathPromise;
}

async function verifyDownloadedFfmpeg() {
  const policy = binaryPolicyFor();
  if (nodeAvPackage.version !== expectedNodeAvVersion) {
    throw new Error(`node-av version must be ${expectedNodeAvVersion}, got ${nodeAvPackage.version ?? "unknown"}`);
  }
  if (ffmpegVersion() !== expectedFfmpegVersion) {
    throw new Error(`node-av FFmpeg version must be ${expectedFfmpegVersion}, got ${ffmpegVersion()}`);
  }
  const path = assertDependencyBinary(nodeAvFfmpegPath(), policy);
  const digest = await sha256File(path);
  if (digest !== policy.sha256) {
    throw new Error(`node-av FFmpeg SHA-256 mismatch: expected ${policy.sha256}, got ${digest}`);
  }
  const stdout = runBinary(path, ["-version"], process.cwd(), "ffmpeg version", 30_000);
  assertFfmpegVersionOutput(stdout, policy);
  writeFileSync(
    ffmpegVerificationMarker,
    `${JSON.stringify({ nodeAv: expectedNodeAvVersion, ffmpeg: expectedFfmpegVersion, sha256: digest })}\n`,
    { encoding: "utf8", flag: "w", mode: 0o600 }
  );
  return path;
}

export function runBinary(program, args, projectRoot, label, timeout = 300_000) {
  const result = spawnSync(program, args, {
    cwd: projectRootReal(projectRoot),
    encoding: "utf8",
    maxBuffer: maxProcessOutputBytes,
    shell: false,
    timeout,
    windowsHide: true
  });
  if (result.error) {
    throw new Error(`${label} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = `${result.stderr ?? ""}\n${result.stdout ?? ""}`
      .trim()
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "?")
      .slice(-4000);
    throw new Error(`${label} exited with status ${result.status}${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout;
}

export async function runFfmpeg(args, projectRoot, label = "ffmpeg", timeout = 300_000) {
  return runBinary(await verifiedFfmpegPath(), args, projectRoot, label, timeout);
}

export function ffmpegPrefix(overwrite) {
  return ["-hide_banner", "-loglevel", "error", "-nostdin", overwrite ? "-y" : "-n"];
}
