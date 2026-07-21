import { lstat, mkdir, realpath, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const runtimeRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(runtimeRoot, "../../..");
const supportedExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const maxInputBytes = 50 * 1024 * 1024;
const maxInputPixels = 40_000_000;

function fail(message) {
  throw new Error(message);
}

function resolveProjectPath(value, label) {
  if (!value || isAbsolute(value) || value.includes("\0")) {
    fail(`${label} must be a project-relative path`);
  }
  const target = resolve(projectRoot, value);
  const rel = relative(projectRoot, target);
  if (rel === "" || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) {
    fail(`${label} must stay inside the project`);
  }
  return target;
}

async function rejectSymlinkPath(target, label, allowMissingLeaf = false) {
  const rel = relative(projectRoot, target);
  const parts = rel.split(/[\\/]/u).filter(Boolean);
  let current = projectRoot;
  for (const [index, part] of parts.entries()) {
    current = resolve(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) {
        fail(`${label} cannot contain a symlink`);
      }
    } catch (error) {
      if (allowMissingLeaf && error && error.code === "ENOENT" && index === parts.length - 1) {
        return;
      }
      if (error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }
}

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  fail("usage: normalize-image.mjs <input-relative-path> <output-relative-path.png>");
}

const input = resolveProjectPath(inputArg, "input");
const output = resolveProjectPath(outputArg, "output");
if (!supportedExtensions.has(extname(input).toLowerCase())) {
  fail("input must be PNG, JPEG, or WebP");
}
if (extname(output).toLowerCase() !== ".png") {
  fail("output must use the .png extension");
}
if (input === output) {
  fail("input and output paths must differ");
}

await rejectSymlinkPath(input, "input");
await rejectSymlinkPath(output, "output", true);
const inputReal = await realpath(input);
const inputRelative = relative(projectRoot, inputReal);
if (
  inputRelative === "" ||
  inputRelative === ".." ||
  inputRelative.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
  isAbsolute(inputRelative)
) {
  fail("input must resolve inside the project");
}

const inputStat = await stat(inputReal);
if (!inputStat.isFile()) {
  fail("input must be a regular file");
}
if (inputStat.size > maxInputBytes) {
  fail("input exceeds the 50 MB limit");
}

await mkdir(dirname(output), { recursive: true });
const image = sharp(inputReal, { failOn: "error", limitInputPixels: maxInputPixels }).rotate();
const metadata = await image.metadata();
if (!metadata.width || !metadata.height) {
  fail("input image dimensions could not be read");
}
await image.png({ compressionLevel: 9 }).toFile(output);

process.stdout.write(
  `${JSON.stringify({ format: metadata.format, height: metadata.height, output: outputArg, width: metadata.width })}\n`,
);
