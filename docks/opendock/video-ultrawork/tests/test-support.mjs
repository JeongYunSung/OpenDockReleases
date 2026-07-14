import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

export const dockRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function run(program, args, options = {}) {
  return spawnSync(program, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env ?? process.env,
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
    timeout: options.timeout ?? 600_000,
    windowsHide: true
  });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function assertPassed(result, label) {
  if (result.error || result.status !== 0) {
    throw new Error(
      `${label} failed (${result.status}): ${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`
    );
  }
}

export function assertFailed(result, label) {
  if (!result.error && result.status === 0) {
    throw new Error(`${label} unexpectedly passed: ${result.stdout}`);
  }
}

function directorySize(root) {
  let total = 0;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    total += entry.isDirectory() ? directorySize(full) : statSync(full).size;
  }
  return total;
}

export function setupProject({ harness = false } = {}) {
  const tempRoot = mkdtempSync(join(tmpdir(), "opendock-video-tests-"));
  const projectRoot = join(tempRoot, "project");
  const testHome = join(tempRoot, "home");
  const helperRoot = join(projectRoot, ".codex", "opendock", "video-ultrawork");
  mkdirSync(projectRoot);
  mkdirSync(testHome);
  cpSync(join(dockRoot, "files", ".codex", "opendock", "video-ultrawork"), helperRoot, {
    recursive: true
  });
  if (harness) {
    cpSync(
      join(dockRoot, "files", ".opendock", "harness", "video-ultrawork"),
      join(projectRoot, ".opendock", "harness", "video-ultrawork"),
      { recursive: true }
    );
  }
  const install = run("npm", ["ci", "--no-audit", "--no-fund"], {
    cwd: helperRoot,
    env: {
      ...process.env,
      HOME: testHome,
      XDG_CACHE_HOME: join(testHome, ".cache")
    },
    timeout: 600_000
  });
  assertPassed(install, "locked dependency install");
  const ffmpegName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const nodeAvBinaryRoot = join(helperRoot, "node_modules", "node-av", "binary");
  assert(existsSync(join(nodeAvBinaryRoot, ffmpegName)), "postinstall must leave a verified FFmpeg executable");
  assert(
    existsSync(join(nodeAvBinaryRoot, ".opendock-verified.json")),
    "postinstall must leave the FFmpeg integrity marker"
  );
  return {
    tempRoot,
    projectRoot,
    helperRoot,
    helper: join(helperRoot, "video-helper.mjs"),
    harness: join(projectRoot, ".opendock", "harness", "video-ultrawork", "check.mjs")
  };
}

export function cleanupProject(tempRoot) {
  if (process.env.KEEP_VIDEO_TEST_PROJECT === "1") {
    console.log(`kept test project: ${tempRoot}`);
    return;
  }
  rmSync(tempRoot, { recursive: true, force: true });
}

export async function createSyntheticVideo(project) {
  mkdirSync(join(project.projectRoot, "media"), { recursive: true });
  mkdirSync(join(project.projectRoot, "captions"), { recursive: true });
  mkdirSync(join(project.projectRoot, "outputs"), { recursive: true });
  mkdirSync(join(project.projectRoot, ".opendock", "runs", "video"), { recursive: true });
  const processModule = await import(pathToFileURL(join(project.helperRoot, "lib", "process.mjs")).href);
  const ffmpegPath = await processModule.verifiedFfmpegPath();
  const policy = processModule.binaryPolicyFor();
  const ffmpegVersion = run(ffmpegPath, ["-version"], { cwd: project.projectRoot, timeout: 30_000 });
  assertPassed(ffmpegVersion, "ffmpeg -version");

  const fixture = run(
    ffmpegPath,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-nostdin",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=160x120:rate=15",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1000:sample_rate=44100",
      "-t",
      "2",
      "-shortest",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "media/source.mp4"
    ],
    { cwd: project.projectRoot, timeout: 120_000 }
  );
  assertPassed(fixture, "synthetic A/V fixture");
  writeFileSync(
    join(project.projectRoot, "captions", "sample.srt"),
    "1\n00:00:00,100 --> 00:00:01,500\nOpenDock subtitle test\n",
    "utf8"
  );
  return {
    ffmpegPath,
    ffmpegSha256: policy.sha256,
    ffmpegVersion: ffmpegVersion.stdout.split(/\r?\n/)[0],
    importShape: ["ffmpegPath", "ffmpegVersion", "isFfmpegAvailable"],
    installedBytes: directorySize(join(project.helperRoot, "node_modules"))
  };
}

export function runHelper(project, args) {
  return run(process.execPath, [project.helper, ...args], {
    cwd: project.projectRoot,
    timeout: 300_000
  });
}

export function readJson(projectRoot, rel) {
  return JSON.parse(readFileSync(join(projectRoot, ...rel.split("/")), "utf8"));
}

export function writeJson(projectRoot, rel, value) {
  const full = join(projectRoot, ...rel.split("/"));
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
