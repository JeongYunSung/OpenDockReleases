#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const config = {
  "title": "Ultrawork",
  "focus": "end-to-end work completion quality",
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
        "**/*.sql"
      ],
      "pattern": "^\\t+",
      "message": "Use spaces for indentation unless the project explicitly requires tabs."
    },
    {
      "id": "decimal-font-size",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "font-size\\s*[:=]\\s*[\"\\']?\\d+\\.\\d+(px|rem|em)",
      "message": "Decimal font-size is not allowed."
    },
    {
      "id": "decimal-line-height",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx"
      ],
      "pattern": "line-height\\s*[:=]\\s*[\"\\']?\\d+\\.\\d+(px|rem|em)",
      "message": "Decimal line-height is not allowed."
    },
    {
      "id": "decimal-radius",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx"
      ],
      "pattern": "border-radius\\s*[:=]\\s*[\"\\']?\\d+\\.\\d+px",
      "message": "Decimal border-radius is not allowed."
    },
    {
      "id": "viewport-font-size",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "font-size\\s*[:=][^;\\n]*(vw|vh|vmin|vmax)",
      "message": "Viewport-based font-size is not allowed."
    },
    {
      "id": "negative-letter-spacing",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "letter-spacing\\s*[:=]\\s*[\"\\']?-",
      "message": "Negative letter-spacing is not allowed."
    },
    {
      "id": "important-style",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx",
        "**/*.html"
      ],
      "pattern": "!important",
      "message": "Avoid !important."
    },
    {
      "id": "large-z-index",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx"
      ],
      "pattern": "z-index\\s*[:=]\\s*[\"\\']?(9{3,}|\\d{4,})",
      "message": "Large arbitrary z-index values need review."
    },
    {
      "id": "large-radius",
      "globs": [
        "**/*.css",
        "**/*.scss",
        "**/*.tsx",
        "**/*.jsx"
      ],
      "pattern": "border-radius\\s*[:=][^;\\n]*(2[5-9]|[3-9]\\d|\\d{3,})px",
      "message": "Large radius values should be intentional."
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
      "id": "hardcoded-secret",
      "globs": [
        "**/*.ts",
        "**/*.js",
        "**/*.kt",
        "**/*.java",
        "**/*.yml",
        "**/*.yaml",
        "**/*.properties"
      ],
      "pattern": "(?i)(password|secret|token|api[_-]?key)\\s*[:=]\\s*[\"\\']?[^\"\\'\\n]{8,}",
      "message": "Hardcoded secret-like value."
    },
    {
      "id": "log-sensitive-data",
      "globs": [
        "**/*.ts",
        "**/*.js",
        "**/*.kt",
        "**/*.java"
      ],
      "pattern": "(?i)(console\\.log|logger\\.|log\\.)[^\\n]*(password|secret|token|ssn|email)",
      "message": "Logs should not include sensitive data."
    },
    {
      "id": "sql-concat",
      "globs": [
        "**/*.ts",
        "**/*.js",
        "**/*.kt",
        "**/*.java"
      ],
      "pattern": "(?i)(select|insert|update|delete)[^\\n]+\\+[^\\n]+",
      "message": "SQL string concatenation needs injection review."
    },
    {
      "id": "dangerous-shell",
      "globs": [
        "**/*.sh",
        "**/*.md",
        "**/*.yml",
        "**/*.yaml"
      ],
      "pattern": "(?i)(rm\\s+-rf\\s+/|chmod\\s+777|curl\\s+[^|]+\\|\\s*(sh|bash|zsh))",
      "message": "Dangerous shell command needs review."
    },
    {
      "id": "application-secret",
      "globs": [
        "**/application*.yml",
        "**/application*.yaml",
        "**/application*.properties"
      ],
      "pattern": "(?i)(password|secret|token|api-key|apikey)\\s*[:=]\\s*[^$\\n][^\\n]+",
      "message": "Application config appears to contain a literal secret."
    },
    {
      "id": "blocking-in-coroutine",
      "globs": [
        "**/*.kt",
        "**/*.kts"
      ],
      "pattern": "runBlocking\\s*\\(",
      "message": "runBlocking requires review in production paths."
    },
    {
      "id": "missing-validation-import",
      "globs": [
        "**/*Controller.kt"
      ],
      "pattern": "@RequestBody(?![\\s\\S]{0,180}@Valid)",
      "message": "Controller request bodies should use validation where appropriate."
    },
    {
      "id": "select-star",
      "globs": [
        "**/*.sql",
        "**/*.md"
      ],
      "pattern": "(?i)select\\s+\\*",
      "message": "Avoid SELECT * without justification."
    },
    {
      "id": "destructive-sql",
      "globs": [
        "**/*.sql",
        "**/*.md"
      ],
      "pattern": "(?i)\\b(drop|truncate|delete\\s+from)\\b",
      "message": "Destructive SQL requires review."
    },
    {
      "id": "pii-column",
      "globs": [
        "**/*.sql",
        "**/*.md",
        "**/*.yml",
        "**/*.yaml"
      ],
      "pattern": "(?i)\\b(email|phone|address|ssn|birthdate|full_name)\\b",
      "message": "PII fields require masking/access review."
    },
    {
      "id": "latest-image-tag",
      "globs": [
        "**/*.yml",
        "**/*.yaml",
        "**/*.tf",
        "Dockerfile",
        "**/Dockerfile"
      ],
      "pattern": ":latest\\b",
      "message": "Avoid latest image tags in deployable infrastructure."
    },
    {
      "id": "public-cidr",
      "globs": [
        "**/*.tf",
        "**/*.yml",
        "**/*.yaml"
      ],
      "pattern": "0\\.0\\.0\\.0/0",
      "message": "Public network exposure requires review."
    },
    {
      "id": "privileged-container",
      "globs": [
        "**/*.yml",
        "**/*.yaml"
      ],
      "pattern": "privileged:\\s*true",
      "message": "Privileged containers require review."
    },
    {
      "id": "missing-k8s-resource-limits",
      "globs": [
        "**/*.yml",
        "**/*.yaml"
      ],
      "pattern": "(?s)kind:\\s*Deployment(?!.*resources:)",
      "message": "Kubernetes deployments should define resource requests/limits."
    },
    {
      "id": "empty-code-fence-language",
      "globs": [
        "**/*.md"
      ],
      "pattern": "^```[ \\t]*$",
      "message": "Code fences should declare a language when practical."
    },
    {
      "id": "stale-registry-url",
      "globs": [
        "**/*.md"
      ],
      "pattern": "hub\\.opendock\\.app/v1|opendock\\.app/api",
      "message": "Use registry.opendock.app for API/registry references."
    },
    {
      "id": "versionless-install",
      "globs": [
        "**/*.md"
      ],
      "pattern": "opendock\\s+install\\s+[\\w-]+/[\\w-]+(?=\\s|$)",
      "message": "Install examples should include @version."
    },
    {
      "id": "unsupported-superlative",
      "globs": [
        "**/*.md"
      ],
      "pattern": "(?i)best-in-class|revolutionary|game[- ]changing|world[- ]class",
      "message": "Strong claims need proof."
    },
    {
      "id": "missing-cta-copy",
      "globs": [
        "**/*.md"
      ],
      "pattern": "(?i)campaign|landing page|ad copy",
      "message": "Conversion copy should include a CTA."
    },
    {
      "id": "permission-without-rationale",
      "globs": [
        "**/*.plist",
        "AndroidManifest.xml",
        "**/*.md"
      ],
      "pattern": "(?i)(camera|location|microphone|contacts)",
      "message": "Permission usage needs user-facing rationale."
    },
    {
      "id": "flutter-print",
      "globs": [
        "**/*.dart"
      ],
      "pattern": "\\bprint\\(",
      "message": "print() should not remain in production Dart code."
    },
    {
      "id": "test-only-or-skip",
      "globs": [
        "**/*.test.*",
        "**/*.spec.*"
      ],
      "pattern": "\\.(only|skip)\\(",
      "message": "Committed tests must not use .only or .skip."
    }
  ],
  "packageScripts": [
    "format",
    "lint",
    "typecheck",
    "test",
    "build"
  ],
  "gradleTasks": [
    "ktlintCheck",
    "detekt",
    "test",
    "build",
    "bootJar"
  ],
  "requiredIfGradle": [
    "gradlew"
  ]
};
const root = process.cwd();
const ignoredSegments = new Set([".git", "node_modules", ".opendock", ".agents", ".claude", ".codex", ".cursor", "dist", "build", "coverage", ".next", ".turbo", ".gradle", "target", ".idea"]);
const ignoredRootFiles = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md", "HARNESS.md", "README.md"]);
const textExtensions = new Set([".md", ".mdx", ".txt", ".json", ".yml", ".yaml", ".toml", ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".html", ".kt", ".kts", ".java", ".sql", ".sh", ".ps1", ".plist", ".xml", ".tf", ".tfvars", ".dart", ".properties", ""]);

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
    if (rule.id === "empty-code-fence-language") {
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
    for (const required of config.requiredIfGradle || []) {
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
