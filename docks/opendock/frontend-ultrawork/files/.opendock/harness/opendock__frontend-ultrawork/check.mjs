#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const maxTextFileBytes = 1024 * 1024;
const readFailures = [];
const traversalFailures = [];
const maxWalkEntries = 20000;
const maxWalkDepth = 32;
const config = {
  "title": "Frontend Ultrawork",
  "focus": "frontend implementation quality gates",
  "patterns": [
    {
      "id": "trailing-whitespace",
      "globs": [
        "**/*"
      ],
      "pattern": "[ \\t]+$",
      "message": "Remove trailing whitespace."
    },
    {
      "id": "tab-indentation",
      "globs": [
        "**/*.md",
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "**/*.css",
        "**/*.scss",
        "**/*.kt",
        "**/*.java",
        "**/*.yml",
        "**/*.yaml",
        "**/*.sql",
        "**/*.tf"
      ],
      "pattern": "^\\t+",
      "message": "Use spaces for indentation unless the project explicitly requires tabs."
    },
    {
      "id": "console-log",
      "globs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx"
      ],
      "pattern": "console\\.log\\(",
      "message": "console.log must not remain."
    },
    {
      "id": "debugger",
      "globs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx"
      ],
      "pattern": "\\bdebugger\\b",
      "message": "debugger statement must not remain."
    },
    {
      "id": "explicit-any",
      "globs": [
        "**/*.ts",
        "**/*.tsx"
      ],
      "pattern": "\\bany\\b",
      "message": "any usage needs review or replacement."
    },
    {
      "id": "href-hash",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "href=[\"\\']#[\"\\']",
      "message": "Avoid href=\"#\" placeholders."
    },
    {
      "id": "img-without-alt",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "<img(?![^>]*\\balt=)",
      "message": "Images need alt text."
    },
    {
      "id": "button-without-type",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "<button(?![^>]*\\btype=)",
      "message": "Buttons should declare type."
    },
    {
      "id": "nested-interactive-control",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "(<button\\b[\\s\\S]{0,500}<a\\b|<a\\b[\\s\\S]{0,500}<button\\b)",
      "message": "Do not nest links and buttons inside each other."
    },
    {
      "id": "icon-button-without-name",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "<button\\b(?![^>]*(aria-label|aria-labelledby|title=))[^>]*>\\s*(<svg\\b|<img\\b|<Icon\\b)",
      "message": "Icon-only buttons need an accessible name."
    },
    {
      "id": "input-without-label",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "<input(?![^>]*(aria-label|aria-labelledby|id=))",
      "message": "Inputs need labels or accessible names."
    },
    {
      "id": "select-textarea-without-label",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "<(select|textarea)\\b(?![^>]*(aria-label|aria-labelledby|id=))",
      "message": "Select and textarea controls need labels or accessible names."
    },
    {
      "id": "nonsemantic-click-target",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "<(div|span)\\b(?=[^>]*\\bonClick=)(?![^>]*(role=|tabIndex=|tabindex=|onKeyDown=|onKeyUp=|onKeyPress=))",
      "message": "Clickable div/span needs semantic element or keyboard and role support."
    },
    {
      "id": "positive-tabindex",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "\\b(tabIndex=\\{?[1-9]\\d*\\}?|tabindex=[\"']?[1-9]\\d*)",
      "message": "Positive tab index creates unpredictable keyboard order."
    },
    {
      "id": "aria-hidden-focusable",
      "globs": [
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "aria-hidden=[\"']true[\"'][^>]*(href=|onClick=|tabIndex=|tabindex=)",
      "message": "aria-hidden elements must not be focusable or interactive."
    },
    {
      "id": "missing-loading-state",
      "globs": [
        "**/*.tsx",
        "**/*.jsx"
      ],
      "pattern": "(?i)(fetch\\(|axios\\.)(?![\\s\\S]{0,500}(loading|isLoading|pending|error|catch))",
      "message": "API calls should expose loading and error states."
    },
    {
      "id": "test-only-skip",
      "globs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx"
      ],
      "pattern": "\\.(only|skip)\\(",
      "message": "Focused or skipped tests must not remain."
    }
  ],
  "packageScripts": [
    "format",
    "lint",
    "typecheck",
    "test",
    "build"
  ]
};
const ignoredSegments = new Set([".git", "node_modules", ".opendock", ".agents", ".claude", ".codex", ".cursor", "dist", "build", "coverage", ".next", ".turbo", ".gradle", "target", ".venv", "venv"]);
const ignoredRootFiles = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md", "HARNESS.md", "README.md"]);
const textExtensions = new Set([".md", ".mdx", ".txt", ".json", ".yml", ".yaml", ".toml", ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".html", ".kt", ".kts", ".java", ".sql", ".sh", ".ps1", ".plist", ".xml", ".tf", ".tfvars", ".dart", ".properties", ".py", ".dbt", ""]);

function recordTraversalFailure(rule, file, detail) {
  if (traversalFailures.some((failure) => failure.rule === rule && failure.file === file)) return;
  traversalFailures.push({ rule, file, detail });
}

function walk(dir, depth = 0, state = { entries: 0, stopped: false }) {
  const entries = [];
  if (state.stopped || !fs.existsSync(dir)) return entries;
  if (depth > maxWalkDepth) {
    recordTraversalFailure("walk-depth-budget", normalize(dir), `Directory traversal exceeded ${maxWalkDepth} levels.`);
    state.stopped = true;
    return entries;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    state.entries += 1;
    if (state.entries > maxWalkEntries) {
      recordTraversalFailure("walk-entry-budget", normalize(full), `Directory traversal exceeded ${maxWalkEntries} entries.`);
      state.stopped = true;
      return entries;
    }
    if (entry.isDirectory()) entries.push(...walk(full, depth + 1, state));
    else if (entry.isFile() && !(dir === root && ignoredRootFiles.has(entry.name))) entries.push(full);
    if (state.stopped) break;
  }
  return entries;
}

function normalize(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function globToRegExp(glob) {
  let out = "^";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    const next = glob[i + 1];
    if (ch === "*" && next === "*") { out += ".*"; i += 1; }
    else if (ch === "*") out += "[^/]*";
    else if (ch === ".") out += "\\.";
    else if ("+?^${}()|[]\\".includes(ch)) out += `\\${ch}`;
    else out += ch;
  }
  return new RegExp(`${out}$`);
}

function matchesAny(file, globs) {
  return globs.some((glob) => {
    if (glob === "**/*") return true;
    if (glob.startsWith("**/")) {
      const tail = glob.slice(3);
      if (!tail.includes("*")) return file === tail || file.endsWith(`/${tail}`);
      return globToRegExp(glob).test(file) || globToRegExp(tail).test(file);
    }
    if (glob.startsWith("**/*.")) return file.endsWith(glob.slice(4));
    if (!glob.includes("*")) return file === glob || file.endsWith(`/${glob}`);
    return globToRegExp(glob).test(file);
  });
}

function readText(file) {
  const ext = path.extname(file);
  const base = path.basename(file);
  if (!textExtensions.has(ext) && !["Dockerfile", "Makefile", "AndroidManifest.xml", "gradlew"].includes(base)) return null;
  try {
    const stats = fs.statSync(file);
    if (stats.size > maxTextFileBytes) {
      readFailures.push({
        rule: "file-too-large",
        file: path.relative(root, file).split(path.sep).join("/"),
        detail: `File exceeds ${maxTextFileBytes} bytes and was not scanned.`
      });
      return null;
    }

    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) return null;
    return buffer.toString("utf8");
  } catch { return null; }
}

function compilePattern(pattern) {
  let source = pattern;
  let flags = "m";
  while (source.startsWith("(?i)") || source.startsWith("(?s)")) {
    if (source.startsWith("(?i)")) { flags += "i"; source = source.slice(4); }
    if (source.startsWith("(?s)")) { flags += "s"; source = source.slice(4); }
  }
  return new RegExp(source, flags);
}

function readPackageJson() {
  const file = path.join(root, "package.json");
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return { scripts: {} }; }
}

function hasGradleProject(files) {
  return fs.existsSync(path.join(root, "build.gradle")) || fs.existsSync(path.join(root, "build.gradle.kts")) || files.some((file) => file.rel.endsWith("/build.gradle") || file.rel.endsWith("/build.gradle.kts"));
}

function hasOpeningCodeFenceWithoutLanguage(text) {
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("```")) continue;
    const marker = line.trim();
    if (!inFence) {
      if (marker === "```") return true;
      inFence = true;
    } else if (marker === "```") {
      inFence = false;
    }
  }
  return false;
}

function escapeTerminal(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(2, "0");
    return `\\x${code}`;
  });
}

function run() {
  const files = walk(root).map((full) => ({ full, rel: normalize(full), text: readText(full) })).filter((item) => item.text !== null);
  const failures = [];
  failures.push(...readFailures, ...traversalFailures);

  for (const rule of config.patterns) {
    if (rule.id === "missing-code-fence-language") {
      for (const file of files) {
        if (!matchesAny(file.rel, rule.globs)) continue;
        if (hasOpeningCodeFenceWithoutLanguage(file.text)) failures.push({ rule: rule.id, file: file.rel, detail: rule.message });
      }
      continue;
    }
    const re = compilePattern(rule.pattern);
    for (const file of files) {
      if (!matchesAny(file.rel, rule.globs)) continue;
      if (re.test(file.text)) failures.push({ rule: rule.id, file: file.rel, detail: rule.message });
    }
  }

  const pkg = readPackageJson();
  if (pkg && config.packageScripts?.length) {
    const scripts = pkg.scripts || {};
    for (const script of config.packageScripts) {
      if (!scripts[script]) failures.push({ rule: "missing-package-script", file: "package.json", detail: `Missing package script: ${script}` });
    }
  }

  if (hasGradleProject(files)) {
    for (const required of config.gradleRequired || []) {
      if (!fs.existsSync(path.join(root, required))) failures.push({ rule: "missing-gradle-file", file: required, detail: `Gradle project should include ${required}` });
    }
    const gradleText = files.filter((file) => file.rel.endsWith("build.gradle") || file.rel.endsWith("build.gradle.kts")).map((file) => file.text).join("\n");
    for (const task of config.gradleTasks || []) {
      if (!gradleText.includes(task)) failures.push({ rule: "missing-gradle-task", file: "build.gradle(.kts)", detail: `Expected Gradle task or plugin reference: ${task}` });
    }
  }

  if (failures.length > 0) {
    console.error(`OpenDock harness: ${config.title}`);
    console.error(`Focus: ${config.focus}`);
    console.error(`Files scanned: ${files.length}`);
    console.error(`Failures: ${failures.length}`);
    for (const failure of failures.slice(0, 120)) console.error(`- [${escapeTerminal(failure.rule)}] ${escapeTerminal(failure.file)}: ${escapeTerminal(failure.detail)}`);
    if (failures.length > 120) console.error(`... ${failures.length - 120} more failures omitted`);
    process.exit(1);
  }
  console.log(`OpenDock harness: ${config.title}`);
  console.log(`Focus: ${config.focus}`);
  console.log(`Files scanned: ${files.length}`);
  console.log("Ultrawork passed.");
}

run();
