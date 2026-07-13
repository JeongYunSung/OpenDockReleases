import { MAX_OUTPUT_PIXELS } from "./constants.mjs";
import {
  assertDistinctPaths,
  assertProjectInput,
  prepareProjectOutput,
  requireExtension
} from "./paths.mjs";
import {
  audioExpectation,
  durationTolerance,
  ffmpegSubtitleInputArgs,
  ffmpegVideoInputArgs,
  probeProjectVideoInput
} from "./probe.mjs";
import { executeMediaOperation, operationReport, writeReport } from "./operation.mjs";

export async function inspectVideo({ input, report, overwrite = false }, projectRoot = process.cwd()) {
  const source = await probeProjectVideoInput(projectRoot, input);
  requireExtension(report, [".json"], "report");
  const reportTarget = prepareProjectOutput(projectRoot, report, overwrite, "report");
  assertDistinctPaths([
    { ...source, label: "input" },
    { ...reportTarget, label: "report" }
  ]);
  const sourceProbe = source.probe;
  const checks = ["video-stream", "positive-duration", "allowed-container"];
  const result = operationReport(
    "inspect",
    source.rel,
    null,
    {},
    sourceProbe,
    null,
    checks,
    { audio: "observe", subtitle: "observe" }
  );
  writeReport(reportTarget, result, overwrite);
  return { output: reportTarget.rel, report: reportTarget.rel, verification: result.verification };
}

export async function trimVideo(
  { input, output, report, start, duration, overwrite = false },
  projectRoot = process.cwd()
) {
  const source = await probeProjectVideoInput(projectRoot, input);
  requireExtension(output, [".mp4"], "trim output");
  const sourceProbe = source.probe;
  if (!Number.isFinite(start) || start < 0 || start >= sourceProbe.durationSeconds) {
    throw new Error("--start must be within the input duration");
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("--duration must be a positive number");
  }
  const expectedDuration = Math.min(duration, sourceProbe.durationSeconds - start);
  return executeMediaOperation({
    command: "trim",
    projectRoot,
    input: source,
    output,
    report,
    overwrite,
    args: [
      ...ffmpegVideoInputArgs(source, start),
      "-t",
      String(duration),
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart"
    ],
    options: { startSeconds: start, durationSeconds: duration },
    sourceProbe,
    expected: {
      container: "mp4",
      videoCodec: "h264",
      width: sourceProbe.video.width,
      height: sourceProbe.video.height,
      durationSeconds: expectedDuration,
      durationToleranceSeconds: durationTolerance(sourceProbe),
      audio: audioExpectation(sourceProbe, "preserve"),
      audioCodec: sourceProbe.audio.present ? "aac" : undefined,
      subtitle: "absent"
    },
    intent: { audio: "preserve", subtitle: "drop" }
  });
}

export async function transcodeVideo(
  { input, output, report, audio = "preserve", overwrite = false },
  projectRoot = process.cwd()
) {
  const source = await probeProjectVideoInput(projectRoot, input);
  const extension = requireExtension(output, [".mp4", ".webm"], "transcode output");
  if (!["preserve", "drop"].includes(audio)) {
    throw new Error("--audio must be preserve or drop");
  }
  const sourceProbe = source.probe;
  const isWebm = extension === ".webm";
  const args = [...ffmpegVideoInputArgs(source), "-map", "0:v:0"];
  if (audio === "preserve") args.push("-map", "0:a?");
  args.push(
    "-c:v",
    isWebm ? "libvpx-vp9" : "libx264",
    "-crf",
    isWebm ? "32" : "20",
    ...(isWebm ? ["-b:v", "0", "-row-mt", "1"] : ["-preset", "medium", "-pix_fmt", "yuv420p"])
  );
  if (audio === "drop") {
    args.push("-an");
  } else {
    args.push("-c:a", isWebm ? "libopus" : "aac", "-b:a", "160k");
  }
  if (!isWebm) args.push("-movflags", "+faststart");
  return executeMediaOperation({
    command: "transcode",
    projectRoot,
    input: source,
    output,
    report,
    overwrite,
    args,
    options: { audio },
    sourceProbe,
    expected: {
      container: isWebm ? "webm" : "mp4",
      videoCodec: isWebm ? "vp9" : "h264",
      width: sourceProbe.video.width,
      height: sourceProbe.video.height,
      durationSeconds: sourceProbe.durationSeconds,
      durationToleranceSeconds: durationTolerance(sourceProbe),
      audio: audioExpectation(sourceProbe, audio),
      audioCodec: audio === "preserve" && sourceProbe.audio.present ? (isWebm ? "opus" : "aac") : undefined,
      subtitle: "absent"
    },
    intent: { audio, subtitle: "drop" }
  });
}

export async function subtitleVideo(
  { input, subtitle, output, report, overwrite = false },
  projectRoot = process.cwd()
) {
  const source = await probeProjectVideoInput(projectRoot, input);
  const subtitleInput = assertProjectInput(projectRoot, subtitle, "subtitle input");
  requireExtension(subtitleInput.rel, [".srt", ".vtt"], "subtitle input");
  requireExtension(output, [".mp4"], "subtitle output");
  const sourceProbe = source.probe;
  return executeMediaOperation({
    command: "subtitle",
    projectRoot,
    input: source,
    output,
    report,
    overwrite,
    extraInputs: [{ ...subtitleInput, label: "subtitle input" }],
    args: [
      ...ffmpegVideoInputArgs(source),
      ...ffmpegSubtitleInputArgs(subtitleInput),
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-map",
      "1:0",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-c:s",
      "mov_text",
      "-metadata:s:s:0",
      "language=und",
      "-movflags",
      "+faststart"
    ],
    options: { subtitle: subtitleInput.rel, mode: "soft" },
    sourceProbe,
    expected: {
      container: "mp4",
      videoCodec: "h264",
      width: sourceProbe.video.width,
      height: sourceProbe.video.height,
      durationSeconds: sourceProbe.durationSeconds,
      durationToleranceSeconds: durationTolerance(sourceProbe),
      audio: audioExpectation(sourceProbe, "preserve"),
      audioCodec: sourceProbe.audio.present ? "aac" : undefined,
      subtitle: "present",
      subtitleCodec: "mov_text"
    },
    intent: { audio: "preserve", subtitle: "soft-track" }
  });
}

export async function thumbnailVideo(
  { input, output, report, time = 0, overwrite = false },
  projectRoot = process.cwd()
) {
  const source = await probeProjectVideoInput(projectRoot, input);
  const extension = requireExtension(output, [".png", ".jpg", ".jpeg"], "thumbnail output");
  const sourceProbe = source.probe;
  if (!Number.isFinite(time) || time < 0 || time >= sourceProbe.durationSeconds) {
    throw new Error("--time must be within the input duration");
  }
  const isPng = extension === ".png";
  return executeMediaOperation({
    command: "thumbnail",
    projectRoot,
    input: source,
    output,
    report,
    overwrite,
    args: [
      ...ffmpegVideoInputArgs(source, time),
      "-map",
      "0:v:0",
      "-frames:v",
      "1",
      "-an",
      "-c:v",
      isPng ? "png" : "mjpeg",
      ...(isPng ? [] : ["-q:v", "2"]),
      "-f",
      "image2"
    ],
    options: { timeSeconds: time },
    sourceProbe,
    expected: {
      container: isPng ? "png" : "jpeg",
      videoCodec: isPng ? "png" : "mjpeg",
      width: sourceProbe.video.width,
      height: sourceProbe.video.height,
      audio: "absent",
      subtitle: "absent"
    },
    intent: { audio: "drop", subtitle: "drop" }
  });
}

function upscaleFilter(scale, preset) {
  const scaleFilter = `scale=iw*${scale}:ih*${scale}:flags=lanczos`;
  if (preset === "none") return scaleFilter;
  if (preset === "denoise") return `hqdn3d=1.2:1.0:2.4:2.0,${scaleFilter}`;
  if (preset === "sharpen") return `${scaleFilter},unsharp=5:5:0.35:3:3:0.0`;
  if (preset === "balanced") return `hqdn3d=1.0:0.8:2.0:1.6,${scaleFilter},unsharp=5:5:0.25:3:3:0.0`;
  throw new Error("--preset must be none, denoise, sharpen, or balanced");
}

export async function upscaleVideo(
  { input, output, report, scale, preset = "none", overwrite = false },
  projectRoot = process.cwd()
) {
  const source = await probeProjectVideoInput(projectRoot, input);
  requireExtension(output, [".mp4"], "upscale output");
  if (![2, 4].includes(scale)) {
    throw new Error("--scale must be 2 or 4");
  }
  const sourceProbe = source.probe;
  const width = sourceProbe.video.width * scale;
  const height = sourceProbe.video.height * scale;
  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels > MAX_OUTPUT_PIXELS) {
    throw new Error(`upscale output exceeds the ${MAX_OUTPUT_PIXELS} pixel budget`);
  }
  if (width % 2 !== 0 || height % 2 !== 0) {
    throw new Error("upscale output dimensions must be even");
  }
  const filter = upscaleFilter(scale, preset);
  return executeMediaOperation({
    command: "upscale",
    projectRoot,
    input: source,
    output,
    report,
    overwrite,
    args: [
      ...ffmpegVideoInputArgs(source),
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      filter,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart"
    ],
    options: {
      scale,
      preset,
      filter: "lanczos",
      maxOutputPixels: MAX_OUTPUT_PIXELS
    },
    sourceProbe,
    expected: {
      container: "mp4",
      videoCodec: "h264",
      width,
      height,
      durationSeconds: sourceProbe.durationSeconds,
      durationToleranceSeconds: durationTolerance(sourceProbe),
      audio: audioExpectation(sourceProbe, "preserve"),
      audioCodec: sourceProbe.audio.present ? "aac" : undefined,
      subtitle: "absent"
    },
    intent: { audio: "preserve", subtitle: "drop", detail: "resample-only" }
  });
}
