#!/usr/bin/env node
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  assert,
  assertFailed,
  assertPassed,
  cleanupProject,
  createSyntheticVideo,
  readJson,
  run,
  runHelper,
  setupProject,
  writeJson
} from "./test-support.mjs";

const project = setupProject({ harness: true });

try {
  await createSyntheticVideo(project);
  const validRun = ".opendock/runs/video/valid";
  const trim = runHelper(project, [
    "trim",
    "--input",
    "media/source.mp4",
    "--output",
    "outputs/harness-trim.mp4",
    "--report",
    `${validRun}/trim.json`,
    "--start",
    "0.2",
    "--duration",
    "1"
  ]);
  assertPassed(trim, "harness fixture trim");
  const report = readJson(project.projectRoot, `${validRun}/trim.json`);
  const probe = report.outputProbe;
  const validManifest = {
    schema: "opendock.video-run/v1",
    status: "ready",
    rights: "user-owned synthetic test fixture",
    review: "helper report and current single-file MediaInfo output checked",
    outputs: [
      {
        operation: "trim",
        path: "outputs/harness-trim.mp4",
        report: `${validRun}/trim.json`,
        expected: {
          container: "mp4",
          videoCodec: "h264",
          width: probe.video.width,
          height: probe.video.height,
          durationSeconds: probe.durationSeconds,
          durationToleranceSeconds: 0.5,
          audio: "present",
          subtitle: "absent"
        }
      }
    ]
  };
  writeJson(project.projectRoot, `${validRun}/manifest.json`, validManifest);

  const unrelated = join(project.projectRoot, ".opendock", "runs", "video", "unrelated");
  mkdirSync(unrelated, { recursive: true });
  writeFileSync(join(unrelated, "manifest.json"), "{ invalid unrelated data", "utf8");
  writeFileSync(join(project.projectRoot, "outputs", "unrelated.tmp"), "invalid unrelated output", "utf8");

  const valid = run(process.execPath, [project.harness, "--manifest", `${validRun}/manifest.json`], {
    cwd: project.projectRoot,
    timeout: 120_000
  });
  assertPassed(valid, "valid harness case");
  assert(valid.stdout.includes("harness passed"), "valid harness did not print pass status");

  const invalidRun = ".opendock/runs/video/invalid";
  const invalidManifest = structuredClone(validManifest);
  mkdirSync(join(project.projectRoot, ...invalidRun.split("/")), { recursive: true });
  copyFileSync(
    join(project.projectRoot, ...`${validRun}/trim.json`.split("/")),
    join(project.projectRoot, ...`${invalidRun}/trim.json`.split("/"))
  );
  invalidManifest.outputs[0].report = `${invalidRun}/trim.json`;
  invalidManifest.outputs[0].expected.width += 2;
  writeJson(project.projectRoot, `${invalidRun}/manifest.json`, invalidManifest);
  const invalid = run(process.execPath, [project.harness, "--manifest", `${invalidRun}/manifest.json`], {
    cwd: project.projectRoot,
    timeout: 120_000
  });
  assertFailed(invalid, "invalid harness case");
  assert(invalid.stderr.includes("output-contract"), "invalid harness did not report output-contract");

  const forgedRun = ".opendock/runs/video/forged-upscale";
  mkdirSync(join(project.projectRoot, ...forgedRun.split("/")), { recursive: true });
  copyFileSync(
    join(project.projectRoot, "media", "source.mp4"),
    join(project.projectRoot, "outputs", "forged-upscale.mp4")
  );
  const forgedReport = {
    ...structuredClone(report),
    command: "upscale",
    output: "outputs/forged-upscale.mp4",
    options: { scale: 1, preset: "none", filter: "lanczos" },
    outputProbe: report.sourceProbe
  };
  writeJson(project.projectRoot, `${forgedRun}/upscale.json`, forgedReport);
  writeJson(project.projectRoot, `${forgedRun}/manifest.json`, {
    ...structuredClone(validManifest),
    outputs: [
      {
        operation: "upscale",
        path: "outputs/forged-upscale.mp4",
        report: `${forgedRun}/upscale.json`,
        expected: {
          container: "mp4",
          videoCodec: "h264",
          width: report.sourceProbe.video.width,
          height: report.sourceProbe.video.height,
          durationSeconds: report.sourceProbe.durationSeconds,
          durationToleranceSeconds: 0.5,
          audio: "present",
          subtitle: "absent"
        }
      }
    ]
  });
  const forged = run(process.execPath, [project.harness, "--manifest", `${forgedRun}/manifest.json`], {
    cwd: project.projectRoot,
    timeout: 120_000
  });
  assertFailed(forged, "forged 1x upscale report");
  assert(forged.stderr.includes("scale must be 2 or 4"), "forged upscale did not fail the scale contract");

  const traversal = run(process.execPath, [project.harness, "--manifest", "../manifest.json"], {
    cwd: project.projectRoot,
    timeout: 120_000
  });
  assertFailed(traversal, "harness traversal path");

  const missingArgument = run(process.execPath, [project.harness], {
    cwd: project.projectRoot,
    timeout: 120_000
  });
  assertFailed(missingArgument, "harness missing manifest argument");

  console.log(
    JSON.stringify(
      {
        status: "passed",
        valid: true,
        invalid: true,
        rejectedForgedOneXUpscale: true,
        ignoredUnrelatedRun: true,
        rejectedTraversal: true,
        requiredManifestArgument: true
      },
      null,
      2
    )
  );
} finally {
  cleanupProject(project.tempRoot);
}
