import fs from "node:fs";
import path from "node:path";

export function isPathInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

export function normalizePath(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

export function lstatIfPresent(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function resolvedInsideProject(root, file, addFailure, rule, label) {
  let resolved;
  try {
    resolved = fs.realpathSync(file);
  } catch (error) {
    addFailure(rule, normalizePath(root, file), `${label} could not be resolved: ${error.code ?? "unknown error"}.`);
    return null;
  }
  if (!isPathInside(root, resolved)) {
    addFailure(rule, normalizePath(root, file), `${label} resolves outside the project root.`);
    return null;
  }
  return resolved;
}

export function validateRunRoot(root, addFailure) {
  let current = root;
  for (const segment of [".opendock", "runs", "kitchen"]) {
    current = path.join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) return null;
    const relative = normalizePath(root, current);
    if (stat.isSymbolicLink()) {
      addFailure("run-root-symlink", relative, "Kitchen run-root ancestry must not contain symlinks.");
      return null;
    }
    if (!stat.isDirectory()) {
      addFailure("run-root-type", relative, "Kitchen run-root ancestry must contain only real directories.");
      return null;
    }
    if (!resolvedInsideProject(root, current, addFailure, "run-root-containment", "Run-root directory")) {
      return null;
    }
  }
  return current;
}

export function hasSymlinkSegment(root, relative) {
  let current = root;
  for (const segment of relative.replace(/\\/g, "/").split("/").filter(Boolean)) {
    current = path.join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) return false;
    if (stat.isSymbolicLink()) return true;
  }
  return false;
}
