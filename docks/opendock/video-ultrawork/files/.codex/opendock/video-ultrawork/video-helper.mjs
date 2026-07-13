#!/usr/bin/env node
import {
  inspectVideo,
  subtitleVideo,
  thumbnailVideo,
  transcodeVideo,
  trimVideo,
  upscaleVideo
} from "./lib/media.mjs";

const usage = `Usage:
  video-helper.mjs inspect --input <video> --report <json> [--overwrite]
  video-helper.mjs trim --input <video> --output <mp4> --report <json> --start <seconds> --duration <seconds> [--overwrite]
  video-helper.mjs transcode --input <video> --output <mp4|webm> --report <json> [--audio preserve|drop] [--overwrite]
  video-helper.mjs subtitle --input <video> --subtitle <srt|vtt> --output <mp4> --report <json> [--overwrite]
  video-helper.mjs thumbnail --input <video> --output <png|jpg> --report <json> [--time <seconds>] [--overwrite]
  video-helper.mjs upscale --input <video> --output <mp4> --report <json> --scale <2|4> [--preset none|denoise|sharpen|balanced] [--overwrite]`;

function parseOptions(tokens, valueNames, flagNames = new Set(["overwrite"])) {
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--") || token.length <= 2 || token.includes("=")) {
      throw new Error(`invalid option: ${token}`);
    }
    const name = token.slice(2);
    if (Object.hasOwn(options, name)) {
      throw new Error(`duplicate option: --${name}`);
    }
    if (flagNames.has(name)) {
      options[name] = true;
      continue;
    }
    if (!valueNames.has(name)) {
      throw new Error(`unknown option: --${name}`);
    }
    const value = tokens[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`missing value for --${name}`);
    }
    options[name] = value;
    index += 1;
  }
  return options;
}

function required(options, name) {
  const value = options[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`missing required option --${name}`);
  }
  return value;
}

function numberOption(options, name, fallback) {
  if (options[name] === undefined) return fallback;
  const value = Number(options[name]);
  if (!Number.isFinite(value)) {
    throw new Error(`--${name} must be a finite number`);
  }
  return value;
}

function common(options) {
  return {
    input: required(options, "input"),
    report: required(options, "report"),
    overwrite: options.overwrite === true
  };
}

async function run(command, tokens) {
  if (command === "inspect") {
    const options = parseOptions(tokens, new Set(["input", "report"]));
    return await inspectVideo(common(options));
  }
  if (command === "trim") {
    const options = parseOptions(tokens, new Set(["input", "output", "report", "start", "duration"]));
    return await trimVideo({
      ...common(options),
      output: required(options, "output"),
      start: numberOption(options, "start", 0),
      duration: numberOption(options, "duration")
    });
  }
  if (command === "transcode") {
    const options = parseOptions(tokens, new Set(["input", "output", "report", "audio"]));
    return await transcodeVideo({
      ...common(options),
      output: required(options, "output"),
      audio: options.audio ?? "preserve"
    });
  }
  if (command === "subtitle") {
    const options = parseOptions(tokens, new Set(["input", "subtitle", "output", "report"]));
    return await subtitleVideo({
      ...common(options),
      subtitle: required(options, "subtitle"),
      output: required(options, "output")
    });
  }
  if (command === "thumbnail") {
    const options = parseOptions(tokens, new Set(["input", "output", "report", "time"]));
    return await thumbnailVideo({
      ...common(options),
      output: required(options, "output"),
      time: numberOption(options, "time", 0)
    });
  }
  if (command === "upscale") {
    const options = parseOptions(tokens, new Set(["input", "output", "report", "scale", "preset"]));
    return await upscaleVideo({
      ...common(options),
      output: required(options, "output"),
      scale: numberOption(options, "scale"),
      preset: options.preset ?? "none"
    });
  }
  throw new Error(`unknown command: ${command ?? ""}`);
}

try {
  const [command, ...tokens] = process.argv.slice(2);
  if (command === "--help" || command === "-h") {
    console.log(usage);
    process.exit(0);
  }
  const result = await run(command, tokens);
  console.log(JSON.stringify({ status: "passed", command, ...result }));
} catch (error) {
  console.error(`[video-helper] ${error instanceof Error ? error.message : String(error)}`);
  console.error(usage);
  process.exit(1);
}
