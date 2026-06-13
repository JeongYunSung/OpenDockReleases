#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = {
  "title": "QA Ultrawork",
  "focus": "QA, test, security, and release quality gates",
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
      "id": "test-only-skip",
      "globs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "**/*.kt",
        "**/*.java",
        "**/*.py"
      ],
      "pattern": "\\.(only|skip)\\(|@Disabled|@Ignore",
      "message": "Focused, skipped, or disabled tests must not remain."
    },
    {
      "id": "missing-test-evidence",
      "globs": [
        "**/*.md"
      ],
      "pattern": "(?i)(done|ready|complete)(?![\\s\\S]{0,500}(tested|verified|regression|smoke|coverage))",
      "message": "Completion notes should include verification evidence."
    },
    {
      "id": "bug-report-incomplete",
      "globs": [
        "**/BUG*.md",
        "**/*bug*.md"
      ],
      "pattern": "(?i)(bug|defect)(?![\\s\\S]{0,700}(steps|expected|actual|environment))",
      "message": "Bug reports need steps, expected, actual, and environment."
    },
    {
      "id": "security-change-without-review",
      "globs": [
        "**/*.md",
        "**/*.ts",
        "**/*.js",
        "**/*.kt",
        "**/*.java",
        "**/*.yml",
        "**/*.yaml"
      ],
      "pattern": "(?i)(auth|permission|token|secret|credential|admin)(?![\\s\\S]{0,600}(security review|scan|threat|risk|test))",
      "message": "Security-sensitive changes need review or scan evidence."
    },
    {
      "id": "release-without-rollback",
      "globs": [
        "**/*.md"
      ],
      "pattern": "(?i)(release|deploy|ship)(?![\\s\\S]{0,500}(rollback|monitor|owner|risk))",
      "message": "Release handoff needs rollback, monitoring, owner, and risk notes."
    }
  ]
};
const ignoredSegments = new Set([".git", "node_modules", ".opendock", ".agents", ".claude", ".codex", ".cursor", "dist", "build", "coverage", ".next", ".turbo", ".gradle", "target", ".venv", "venv"]);
const ignoredRootFiles = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md", "HARNESS.md", "README.md"]);
const textExtensions = new Set([".md", ".mdx", ".txt", ".json", ".yml", ".yaml", ".toml", ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".html", ".kt", ".kts", ".java", ".sql", ".sh", ".ps1", ".plist", ".xml", ".tf", ".tfvars", ".dart", ".properties", ".py", ".dbt", ""]);

function walk(dir) {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) entries.push(...walk(full));
    else if (entry.isFile() && !(dir === root && ignoredRootFiles.has(entry.name))) entries.push(full);
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

function run() {
  const files = walk(root).map((full) => ({ full, rel: normalize(full), text: readText(full) })).filter((item) => item.text !== null);
  const failures = [];

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
    for (const failure of failures.slice(0, 120)) console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
    if (failures.length > 120) console.error(`... ${failures.length - 120} more failures omitted`);
    process.exit(1);
  }
  console.log(`OpenDock harness: ${config.title}`);
  console.log(`Focus: ${config.focus}`);
  console.log(`Files scanned: ${files.length}`);
  console.log("Ultrawork passed.");
}

run();
