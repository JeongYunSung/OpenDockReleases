#!/usr/bin/env node
import { appendFileSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assert,
  assertFailed,
  assertPassed,
  cleanupProject,
  createSyntheticVideo,
  readJson,
  run,
  runHelper,
  setupProject
} from "./test-support.mjs";

const project = setupProject();

try {
  const versions = await createSyntheticVideo(project);
  const runId = ".opendock/runs/video/helper";
  const cases = [
    {
      command: "inspect",
      args: ["inspect", "--input", "media/source.mp4", "--report", `${runId}/inspect.json`],
      report: `${runId}/inspect.json`
    },
    {
      command: "trim",
      args: [
        "trim",
        "--input",
        "media/source.mp4",
        "--output",
        "outputs/trim.mp4",
        "--report",
        `${runId}/trim.json`,
        "--start",
        "0.25",
        "--duration",
        "1"
      ],
      report: `${runId}/trim.json`
    },
    {
      command: "transcode",
      args: [
        "transcode",
        "--input",
        "media/source.mp4",
        "--output",
        "outputs/transcoded.webm",
        "--report",
        `${runId}/transcode.json`,
        "--audio",
        "preserve"
      ],
      report: `${runId}/transcode.json`
    },
    {
      command: "subtitle",
      args: [
        "subtitle",
        "--input",
        "media/source.mp4",
        "--subtitle",
        "captions/sample.srt",
        "--output",
        "outputs/subtitled.mp4",
        "--report",
        `${runId}/subtitle.json`
      ],
      report: `${runId}/subtitle.json`
    },
    {
      command: "thumbnail",
      args: [
        "thumbnail",
        "--input",
        "media/source.mp4",
        "--output",
        "outputs/thumbnail.png",
        "--report",
        `${runId}/thumbnail.json`,
        "--time",
        "0.5"
      ],
      report: `${runId}/thumbnail.json`
    },
    {
      command: "upscale",
      args: [
        "upscale",
        "--input",
        "media/source.mp4",
        "--output",
        "outputs/upscaled.mp4",
        "--report",
        `${runId}/upscale.json`,
        "--scale",
        "4",
        "--preset",
        "balanced"
      ],
      report: `${runId}/upscale.json`
    }
  ];

  for (const testCase of cases) {
    const result = runHelper(project, testCase.args);
    assertPassed(result, testCase.command);
    const report = readJson(project.projectRoot, testCase.report);
    assert(report.command === testCase.command, `${testCase.command} report command mismatch`);
    assert(report.verification?.status === "passed", `${testCase.command} report did not pass verification`);
    assert(report.verification.checks.includes("video-stream"), `${testCase.command} did not verify video stream`);
  }

  const upscale = readJson(project.projectRoot, `${runId}/upscale.json`);
  assert(upscale.outputProbe.video.width === 640, "4x upscale width must be 640");
  assert(upscale.outputProbe.video.height === 480, "4x upscale height must be 480");
  assert(upscale.options.scale === 4, "4x upscale report must record scale 4");
  assert(upscale.outputProbe.audio.present, "upscale must preserve audio presence");

  const subtitle = readJson(project.projectRoot, `${runId}/subtitle.json`);
  assert(subtitle.outputProbe.subtitle.present, "subtitle command must create a subtitle stream");
  assert(subtitle.outputProbe.subtitle.codec === "mov_text", "subtitle codec must be mov_text");

  assertFailed(
    runHelper(project, ["inspect", "--input", "/tmp/source.mp4", "--report", `${runId}/absolute.json`]),
    "absolute input path"
  );
  assertFailed(
    runHelper(project, ["inspect", "--input", "https://example.com/video.mp4", "--report", `${runId}/url.json`]),
    "URL input"
  );
  assertFailed(
    runHelper(project, ["inspect", "--input", "../source.mp4", "--report", `${runId}/traversal.json`]),
    "traversal input"
  );
  assertFailed(runHelper(project, cases[0].args), "implicit report overwrite");
  assertFailed(
    runHelper(project, [
      "upscale",
      "--input",
      "media/source.mp4",
      "--output",
      "outputs/invalid-scale.mp4",
      "--report",
      `${runId}/invalid-scale.json`,
      "--scale",
      "3"
    ]),
    "invalid upscale factor"
  );

  symlinkSync("source.mp4", join(project.projectRoot, "media", "source-link.mp4"));
  assertFailed(
    runHelper(project, ["inspect", "--input", "media/source-link.mp4", "--report", `${runId}/symlink-input.json`]),
    "symlink input"
  );
  symlinkSync("../media/source.mp4", join(project.projectRoot, "outputs", "symlink-output.mp4"));
  assertFailed(
    runHelper(project, [
      "trim",
      "--input",
      "media/source.mp4",
      "--output",
      "outputs/symlink-output.mp4",
      "--report",
      `${runId}/symlink-output.json`,
      "--duration",
      "1"
    ]),
    "symlink output"
  );

  writeFileSync(
    join(project.projectRoot, "media", "playlist.mp4"),
    "#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:2.0,\nsource.mp4\n#EXT-X-ENDLIST\n",
    "utf8"
  );
  const playlist = runHelper(project, [
    "inspect",
    "--input",
    "media/playlist.mp4",
    "--report",
    `${runId}/playlist.json`
  ]);
  assertFailed(playlist, "HLS playlist with external file reference");
  assert(playlist.stderr.includes("container does not match"), "playlist rejection must come from parsed container allowlist");

  const processModule = await import(pathToFileURL(join(project.helperRoot, "lib", "process.mjs")).href);
  const expectedPolicies = {
    "darwin-arm64": "21e892603ea18c7607a34ce0b96c5f0b7299f8703ccb7b7a84baf38542ad78b2",
    "darwin-x64": "81fde53658014fef0a9676edce18d9da4846182a34b81119b551d51d77d53f0d",
    "win32-x64": "d06c45704cd247744f83fc1ed8e005ce1d1b8f84b0c4acd8e17a7c1b8a202b0a",
    "win32-arm64": "c485e0283b46f5b3a5b79120daa7583217e00db2534ecb3a4be048e902e75399"
  };
  for (const [key, digest] of Object.entries(expectedPolicies)) {
    const [platform, arch] = key.split("-");
    assert(processModule.binaryPolicyFor(platform, arch).sha256 === digest, `${key} digest policy mismatch`);
  }
  let rejectedVersion = false;
  try {
    processModule.assertFfmpegVersionOutput("ffmpeg version 8.0", processModule.binaryPolicyFor());
  } catch {
    rejectedVersion = true;
  }
  assert(rejectedVersion, "FFmpeg version check must fail closed");

  const helperSource = `${readFileSync(join(project.helperRoot, "video-helper.mjs"), "utf8")}\n${readFileSync(
    join(project.helperRoot, "lib", "media.mjs"),
    "utf8"
  )}`;
  assert(!/\beval\s*\(/.test(helperSource), "helper must not use eval");
  assert(!/\bexec(?:Sync|File)?\s*\(/.test(helperSource), "helper must not use exec APIs");
  assert(!/shell\s*:\s*true/.test(helperSource), "helper must not enable a shell");

  appendFileSync(versions.ffmpegPath, "tamper", "utf8");
  const tampered = runHelper(project, [
    "trim",
    "--input",
    "media/source.mp4",
    "--output",
    "outputs/tampered.mp4",
    "--report",
    `${runId}/tampered.json`,
    "--start",
    "0",
    "--duration",
    "1"
  ]);
  assertFailed(tampered, "tampered FFmpeg binary");
  assert(tampered.stderr.includes("SHA-256 mismatch"), "tampered binary must fail at the digest check");
  const tamperedPostinstall = run(process.execPath, ["verify-install.mjs"], { cwd: project.helperRoot });
  assertFailed(tamperedPostinstall, "tampered FFmpeg postinstall verification");
  assert(
    tamperedPostinstall.stderr.includes("SHA-256 mismatch"),
    "postinstall verifier must reject a tampered FFmpeg binary"
  );

  console.log(
    JSON.stringify(
      {
        status: "passed",
        platform: `${process.platform}-${process.arch}`,
        importShape: versions.importShape,
        installedBytes: versions.installedBytes,
        ffmpeg: versions.ffmpegVersion,
        ffmpegSha256: versions.ffmpegSha256,
        operations: cases.map((testCase) => testCase.command),
        negativeCases: [
          "absolute",
          "url",
          "traversal",
          "overwrite",
          "scale",
          "symlink-input",
          "symlink-output",
          "playlist-external-reference",
          "binary-version",
          "binary-digest"
        ]
      },
      null,
      2
    )
  );
} finally {
  cleanupProject(project.tempRoot);
}
