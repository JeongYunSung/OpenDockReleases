import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

const maxPathLength = 240;
const safeSegmentPattern = /^[A-Za-z0-9._-]+$/;

export function normalizeProjectPath(value, label = "path") {
  if (typeof value !== "string" || value.length === 0 || value.length > maxPathLength) {
    throw new Error(`${label} must be a non-empty project-relative path under ${maxPathLength + 1} characters`);
  }
  if (value.includes("\0") || value !== value.trim()) {
    throw new Error(`${label} contains unsafe characters`);
  }
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) || value.startsWith("~") || isAbsolute(value)) {
    throw new Error(`${label} must not be an absolute path or URL`);
  }
  const normalized = value.replaceAll("\\", "/").replaceAll(/\/+/g, "/");
  const segments = normalized.split("/");
  if (
    segments.length === 0 ||
    segments.some((segment) => segment === "" || segment === "." || segment === ".." || !safeSegmentPattern.test(segment))
  ) {
    throw new Error(`${label} must contain safe project-relative path segments only`);
  }
  return segments.join("/");
}

export function projectRootReal(projectRoot) {
  const root = realpathSync(projectRoot);
  const stat = lstatSync(root);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error("project root must be a real directory");
  }
  return root;
}

function resolvedInsideProject(projectRoot, rel, label) {
  const root = projectRootReal(projectRoot);
  const full = resolve(root, ...rel.split("/"));
  const back = relative(root, full);
  if (back === "" || back === ".." || back.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(back)) {
    throw new Error(`${label} must stay inside the project`);
  }
  return { root, full };
}

function ensureParentDirectories(projectRoot, rel, label) {
  const { root } = resolvedInsideProject(projectRoot, rel, label);
  const parts = dirname(rel).replaceAll("\\", "/").split("/").filter((part) => part !== ".");
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    if (!existsSync(current)) {
      mkdirSync(current);
    }
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`${label} parent must be a real directory: ${rel}`);
    }
  }
}

export function assertProjectInput(projectRoot, value, label = "input") {
  const rel = normalizeProjectPath(value, label);
  const { root, full } = resolvedInsideProject(projectRoot, rel, label);
  let current = root;
  for (const part of rel.split("/")) {
    current = join(current, part);
    if (!existsSync(current)) {
      throw new Error(`${label} does not exist: ${rel}`);
    }
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`${label} must not use a symlink: ${rel}`);
    }
  }
  const stat = lstatSync(full);
  if (!stat.isFile()) {
    throw new Error(`${label} must be a regular file: ${rel}`);
  }
  return { rel, full };
}

export function prepareProjectOutput(projectRoot, value, overwrite, label) {
  const rel = normalizeProjectPath(value, label);
  ensureParentDirectories(projectRoot, rel, label);
  const { full } = resolvedInsideProject(projectRoot, rel, label);
  const existed = existsSync(full);
  if (existed) {
    const stat = lstatSync(full);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(`${label} must not be a symlink or non-regular file: ${rel}`);
    }
    if (!overwrite) {
      throw new Error(`${label} already exists; pass --overwrite to replace it: ${rel}`);
    }
  }
  return { rel, full, existed };
}

export function assertDistinctPaths(entries) {
  const seen = new Map();
  for (const entry of entries) {
    const existing = seen.get(entry.full);
    if (existing) {
      throw new Error(`${entry.label} must differ from ${existing}`);
    }
    seen.set(entry.full, entry.label);
  }
}

export function requireExtension(rel, allowed, label) {
  const extension = extname(rel).toLowerCase();
  if (!allowed.includes(extension)) {
    throw new Error(`${label} extension must be one of: ${allowed.join(", ")}`);
  }
  return extension;
}
