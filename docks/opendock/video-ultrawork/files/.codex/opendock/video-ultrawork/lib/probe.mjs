import { open } from "node:fs/promises";
import { extname } from "node:path";
import mediaInfoFactory from "mediainfo.js";
import { assertProjectInput, requireExtension } from "./paths.mjs";

const sourceSpecs = Object.freeze({
  ".mp4": Object.freeze({ container: "mp4", demuxer: "mov", formats: ["MPEG-4"] }),
  ".mov": Object.freeze({ container: "mov", demuxer: "mov", formats: ["MPEG-4", "QuickTime"] }),
  ".webm": Object.freeze({ container: "webm", demuxer: "matroska", formats: ["WebM"] }),
  ".mkv": Object.freeze({ container: "matroska", demuxer: "matroska", formats: ["Matroska"] })
});

const probeSpecs = Object.freeze({
  ...sourceSpecs,
  ".png": Object.freeze({ container: "png", formats: ["PNG"] }),
  ".jpg": Object.freeze({ container: "jpeg", formats: ["JPEG"] }),
  ".jpeg": Object.freeze({ container: "jpeg", formats: ["JPEG"] })
});

function finiteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function codecName(track) {
  const format = String(track?.Format ?? "").toUpperCase();
  const codecId = String(track?.CodecID ?? "").toLowerCase();
  if (format === "AVC") return "h264";
  if (format === "VP9") return "vp9";
  if (format === "PNG") return "png";
  if (format === "JPEG") return "mjpeg";
  if (format === "AAC") return "aac";
  if (format === "OPUS") return "opus";
  if (format === "TIMED TEXT" || codecId.includes("tx3g")) return "mov_text";
  return String(track?.Format ?? "").toLowerCase().replaceAll(/[^a-z0-9._-]+/g, "_");
}

function canonicalFormat(spec) {
  if (spec.container === "mp4" || spec.container === "mov") return "mov,mp4";
  if (spec.container === "webm") return "matroska,webm";
  if (spec.container === "matroska") return "matroska";
  if (spec.container === "png") return "png_pipe";
  if (spec.container === "jpeg") return "jpeg_pipe";
  return spec.container;
}

function simplifyProbe(raw, spec) {
  const tracks = Array.isArray(raw.media?.track) ? raw.media.track : [];
  const general = tracks.find((track) => track["@type"] === "General");
  const video = tracks.find((track) => track["@type"] === "Video" || track["@type"] === "Image");
  const audio = tracks.find((track) => track["@type"] === "Audio");
  const subtitle = tracks.find((track) => track["@type"] === "Text");
  const formatDuration = finiteNumber(general?.Duration);
  const videoDuration = finiteNumber(video?.Duration);
  return {
    formatName: canonicalFormat(spec),
    containerFormat: String(general?.Format ?? ""),
    durationSeconds: formatDuration ?? videoDuration,
    video: video
      ? {
          codec: codecName(video),
          width: Number(video.Width) || 0,
          height: Number(video.Height) || 0,
          frameRate: finiteNumber(video.FrameRate)
        }
      : null,
    audio: audio
      ? {
          present: true,
          codec: codecName(audio),
          channels: Number(audio.Channels) || null
        }
      : { present: false, codec: null, channels: null },
    subtitle: subtitle
      ? {
          present: true,
          codec: codecName(subtitle)
        }
      : { present: false, codec: null },
    streamCount: tracks.filter((track) => track["@type"] !== "General").length
  };
}

async function analyzeSingleFile(path) {
  const mediaInfo = await mediaInfoFactory({ coverData: false, format: "object", full: false });
  let handle;
  try {
    handle = await open(path, "r");
    const stat = await handle.stat();
    return await mediaInfo.analyzeData(stat.size, async (size, offset) => {
      const buffer = new Uint8Array(size);
      const { bytesRead } = await handle.read(buffer, 0, size, offset);
      return bytesRead === size ? buffer : buffer.subarray(0, bytesRead);
    });
  } finally {
    await handle?.close();
    mediaInfo.close();
  }
}

async function analyzeProjectMedia(projectRoot, value, specs, label) {
  const input = assertProjectInput(projectRoot, value, "probe input");
  const extension = requireExtension(input.rel, Object.keys(specs), label);
  const spec = specs[extension];
  const raw = await analyzeSingleFile(input.full);
  const tracks = Array.isArray(raw.media?.track) ? raw.media.track : [];
  const general = tracks.find((track) => track["@type"] === "General");
  const format = String(general?.Format ?? "");
  if (!spec.formats.includes(format)) {
    throw new Error(`${label} container does not match ${extension}: ${format || "unknown"}`);
  }
  return { input, probe: simplifyProbe(raw, spec), spec };
}

export async function probeProjectMedia(projectRoot, value) {
  return (await analyzeProjectMedia(projectRoot, value, probeSpecs, "media")).probe;
}

export async function probeProjectVideoInput(projectRoot, value) {
  const result = await analyzeProjectMedia(projectRoot, value, sourceSpecs, "input video");
  requireVideoSource(result.probe);
  return { ...result.input, probe: result.probe, demuxer: result.spec.demuxer };
}

export function ffmpegVideoInputArgs(source, seek) {
  const args = [];
  if (seek !== undefined) args.push("-ss", String(seek));
  args.push("-protocol_whitelist", "file", "-f", source.demuxer);
  if (source.demuxer === "mov") {
    args.push("-enable_drefs", "0", "-use_absolute_path", "0");
  }
  args.push("-i", source.rel);
  return args;
}

export function ffmpegSubtitleInputArgs(subtitle) {
  const extension = extname(subtitle.rel).toLowerCase();
  const demuxer = extension === ".srt" ? "srt" : "webvtt";
  return ["-protocol_whitelist", "file", "-f", demuxer, "-i", subtitle.rel];
}

function hasContainer(probe, expected) {
  const names = probe.formatName.split(",");
  if (expected === "mp4") return names.includes("mp4") || names.includes("mov");
  if (expected === "webm") return names.includes("webm") || names.includes("matroska");
  if (expected === "png") return names.includes("png_pipe") || probe.video?.codec === "png";
  if (expected === "jpeg") return names.includes("jpeg_pipe") || probe.video?.codec === "mjpeg";
  return names.includes(expected);
}

export function verifyProbe(probe, expected) {
  const checks = [];
  if (!probe.video || probe.video.width <= 0 || probe.video.height <= 0) {
    throw new Error("verification failed: output has no valid video stream");
  }
  checks.push("video-stream");

  if (expected.width !== undefined || expected.height !== undefined) {
    if (probe.video.width !== expected.width || probe.video.height !== expected.height) {
      throw new Error(
        `verification failed: expected ${expected.width}x${expected.height}, got ${probe.video.width}x${probe.video.height}`
      );
    }
    checks.push("dimensions");
  }

  if (expected.videoCodec !== undefined) {
    if (probe.video.codec !== expected.videoCodec) {
      throw new Error(`verification failed: expected video codec ${expected.videoCodec}, got ${probe.video.codec}`);
    }
    checks.push("video-codec");
  }

  if (expected.container !== undefined) {
    if (!hasContainer(probe, expected.container)) {
      throw new Error(`verification failed: expected container ${expected.container}, got ${probe.formatName}`);
    }
    checks.push("container");
  }

  if (expected.durationSeconds !== undefined) {
    const actual = probe.durationSeconds;
    const tolerance = expected.durationToleranceSeconds ?? 0.5;
    if (actual === null || Math.abs(actual - expected.durationSeconds) > tolerance) {
      throw new Error(
        `verification failed: expected duration ${expected.durationSeconds}s +/- ${tolerance}s, got ${actual}`
      );
    }
    checks.push("duration");
  }

  if (expected.audio === "present" && !probe.audio.present) {
    throw new Error("verification failed: expected an audio stream");
  }
  if (expected.audio === "absent" && probe.audio.present) {
    throw new Error("verification failed: audio stream must be absent");
  }
  if (expected.audio !== undefined) checks.push("audio-intent");

  if (expected.audioCodec !== undefined && probe.audio.codec !== expected.audioCodec) {
    throw new Error(`verification failed: expected audio codec ${expected.audioCodec}, got ${probe.audio.codec}`);
  }
  if (expected.audioCodec !== undefined) checks.push("audio-codec");

  if (expected.subtitle === "present" && !probe.subtitle.present) {
    throw new Error("verification failed: expected a subtitle stream");
  }
  if (expected.subtitle === "absent" && probe.subtitle.present) {
    throw new Error("verification failed: subtitle stream must be absent");
  }
  if (expected.subtitle !== undefined) checks.push("subtitle-intent");

  if (expected.subtitleCodec !== undefined && probe.subtitle.codec !== expected.subtitleCodec) {
    throw new Error(
      `verification failed: expected subtitle codec ${expected.subtitleCodec}, got ${probe.subtitle.codec}`
    );
  }
  if (expected.subtitleCodec !== undefined) checks.push("subtitle-codec");
  return checks;
}

export function requireVideoSource(probe) {
  const checks = verifyProbe(probe, {});
  if (probe.durationSeconds === null || probe.durationSeconds <= 0) {
    throw new Error("input must have a positive video duration");
  }
  checks.push("positive-duration");
  return checks;
}

export function durationTolerance(probe) {
  const frameAllowance = probe.video?.frameRate ? 2 / probe.video.frameRate : 0;
  return Math.max(0.5, frameAllowance);
}

export function audioExpectation(sourceProbe, intent) {
  if (intent === "drop") return "absent";
  return sourceProbe.audio.present ? "present" : "absent";
}
