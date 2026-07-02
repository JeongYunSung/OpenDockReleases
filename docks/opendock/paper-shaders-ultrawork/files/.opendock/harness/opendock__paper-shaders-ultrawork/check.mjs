#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const title = "Paper Shaders Ultrawork";
const maxTextBytes = 1024 * 1024;
const maxWalkEntries = 20000;

const required = [
  "PAPER_SHADERS.md",
  "HARNESS.md",
  ".opendock/data/paper-shaders/catalog.json",
  ".opendock/harness/opendock__paper-shaders-ultrawork/check.mjs",
  ".agents/skills/opendock-paper-shaders-ultrawork/SKILL.md",
  ".agents/workflows/opendock-paper-shaders-ultrawork/quality-gate.md"
];

const ignoredSegments = new Set([
  ".git",
  "node_modules",
  ".opendock",
  ".agents",
  ".claude",
  ".codex",
  ".cursor",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo"
]);

const sourceExtensions = new Set([".tsx", ".jsx", ".ts", ".js", ".html"]);
const safeReactProps = new Set([
  "key",
  "ref",
  "id",
  "className",
  "style",
  "children",
  "title",
  "role",
  "tabIndex",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "data-testid",
  "suppressHydrationWarning"
]);

const failures = [];
let walked = 0;

function normalize(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolve(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(resolve(rel));
}

function read(rel) {
  const full = resolve(rel);
  const stat = fs.statSync(full);
  if (stat.size > maxTextBytes) return "";
  return fs.readFileSync(full, "utf8");
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir) || walked > maxWalkEntries) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredSegments.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    walked += 1;
    if (walked > maxWalkEntries) {
      failures.push({ rule: "walk-budget", file: normalize(full), detail: "Too many files scanned." });
      return out;
    }

    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      out.push(full);
    }
  }

  return out;
}

function parseRange(values) {
  if (!values || values === "—") return null;
  const match = values.match(/(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function allowedPropsFor(item) {
  const map = new Map();
  for (const prop of [...item.shaderProps, ...item.commonProps]) map.set(prop.name, prop);
  for (const prop of ["width", "height", "className", "style", "children"]) {
    if (!map.has(prop)) map.set(prop, { name: prop, values: "—" });
  }
  return map;
}

function extractNamedImports(text) {
  const imports = [];
  for (const match of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@paper-design\/shaders-react["']/g)) {
    for (const raw of match[1].split(",")) {
      const parts = raw.trim().split(/\s+as\s+/i);
      const imported = parts[0]?.trim();
      const local = (parts[1] || parts[0])?.trim();
      if (imported && local) imports.push({ imported, local });
    }
  }
  return imports;
}

function extractNamespaceImports(text) {
  const aliases = [];
  for (const match of text.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s*["']@paper-design\/shaders-react["']/g)) {
    aliases.push(match[1]);
  }
  return aliases;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractJsxProps(attrText) {
  const props = [];
  for (const match of attrText.matchAll(/\b([A-Za-z_$][\w$:-]*)\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g)) {
    props.push({ name: match[1], raw: match[2] });
  }
  return props;
}

function literalNumber(raw) {
  const match = raw.match(/^\{\s*(-?\d+(?:\.\d+)?)\s*\}$/);
  return match ? Number(match[1]) : null;
}

function countLiteralArray(raw) {
  if (!/^\{\s*\[/.test(raw)) return null;
  return [...raw.matchAll(/["'][^"']+["']/g)].length;
}

function isSafeProp(name) {
  return safeReactProps.has(name) || name.startsWith("aria-") || name.startsWith("data-") || /^on[A-Z]/.test(name);
}

function validateCatalog(catalog) {
  if (catalog.count !== 29 || !Array.isArray(catalog.items) || catalog.items.length !== 29) {
    failures.push({
      rule: "catalog-count",
      file: ".opendock/data/paper-shaders/catalog.json",
      detail: "Catalog must contain the 29 official shader pages."
    });
  }

  for (const item of catalog.items || []) {
    const location = `.opendock/data/paper-shaders/catalog.json#${item.slug || item.component || "unknown"}`;
    for (const field of ["slug", "label", "category", "url", "component", "description", "code"]) {
      if (!item[field]) failures.push({ rule: "catalog-field", file: location, detail: `Missing ${field}.` });
    }
    if (!Array.isArray(item.shaderProps) || item.shaderProps.length === 0) {
      failures.push({ rule: "catalog-props", file: location, detail: "Missing shader-specific props." });
    }
    if (!Array.isArray(item.commonProps) || item.commonProps.length === 0) {
      failures.push({ rule: "catalog-props", file: location, detail: "Missing common props." });
    }
    if (!Array.isArray(item.controls) || item.controls.length === 0) {
      failures.push({ rule: "catalog-controls", file: location, detail: "Missing sidebar-style controls." });
    } else {
      for (const control of item.controls) {
        if (!control.name || !control.prop || !control.type || control.type === "unknown") {
          failures.push({
            rule: "catalog-control-field",
            file: location,
            detail: `Invalid control metadata for ${control.name || "unnamed control"}.`
          });
        }
      }
    }
  }
}

function validateUsage({ file, text, component, localName, item, attrText }) {
  const allowed = allowedPropsFor(item);
  const props = extractJsxProps(attrText);
  const names = new Set(props.map((prop) => prop.name));

  if (!names.has("width") && !names.has("height") && !names.has("className") && !names.has("style")) {
    failures.push({
      rule: "missing-size",
      file,
      detail: `${localName} (${component}) should declare width/height or provide className/style sizing.`
    });
  }

  for (const prop of props) {
    if (!allowed.has(prop.name) && !isSafeProp(prop.name)) {
      failures.push({
        rule: "unknown-prop",
        file,
        detail: `${localName}.${prop.name} is not documented in PAPER_SHADERS.md for ${component}.`
      });
      continue;
    }

    if (prop.name === "colors") {
      const count = countLiteralArray(prop.raw);
      if (count !== null && count > 10) {
        failures.push({
          rule: "too-many-colors",
          file,
          detail: `${localName}.colors has ${count} literal colors; Paper documents up to 10.`
        });
      }
    }

    const meta = allowed.get(prop.name);
    const range = parseRange(meta?.values || "");
    const num = literalNumber(prop.raw);
    if (range && num !== null && (num < range.min || num > range.max)) {
      failures.push({
        rule: "range",
        file,
        detail: `${localName}.${prop.name}=${num} is outside ${range.min} to ${range.max}.`
      });
    }
  }
}

function scanNamedUsage(file, text, byComponent) {
  for (const { imported, local } of extractNamedImports(text)) {
    const item = byComponent.get(imported);
    if (!item) {
      failures.push({ rule: "unknown-component", file, detail: `${imported} is not in the Paper Shaders catalog.` });
      continue;
    }

    const jsxRe = new RegExp(`<${escapeRegExp(local)}\\b([\\s\\S]*?)(?:\\/>|>)`, "g");
    for (const jsx of text.matchAll(jsxRe)) {
      validateUsage({ file, text, component: imported, localName: local, item, attrText: jsx[1] });
    }
  }
}

function scanNamespaceUsage(file, text, byComponent) {
  for (const alias of extractNamespaceImports(text)) {
    const jsxRe = new RegExp(`<${escapeRegExp(alias)}\\.([A-Z][A-Za-z0-9_]*)\\b([\\s\\S]*?)(?:\\/>|>)`, "g");
    for (const jsx of text.matchAll(jsxRe)) {
      const component = jsx[1];
      const item = byComponent.get(component);
      if (!item) {
        failures.push({ rule: "unknown-component", file, detail: `${alias}.${component} is not in the Paper Shaders catalog.` });
        continue;
      }
      validateUsage({ file, text, component, localName: `${alias}.${component}`, item, attrText: jsx[2] });
    }
  }
}

for (const file of required) {
  if (!exists(file)) failures.push({ rule: "missing-file", file, detail: `${file} is required.` });
}

let catalog;
try {
  catalog = JSON.parse(read(".opendock/data/paper-shaders/catalog.json"));
} catch {
  failures.push({
    rule: "catalog-json",
    file: ".opendock/data/paper-shaders/catalog.json",
    detail: "Catalog JSON must parse."
  });
}

if (catalog) {
  validateCatalog(catalog);
  const byComponent = new Map(catalog.items.map((item) => [item.component, item]));

  for (const file of walk(root).map(normalize)) {
    const text = read(file);
    if (!text.includes("@paper-design/shaders-react")) continue;
    scanNamedUsage(file, text, byComponent);
    scanNamespaceUsage(file, text, byComponent);
  }
}

if (failures.length > 0) {
  console.error(`OpenDock harness: ${title}`);
  console.error(`Failures: ${failures.length}`);
  for (const failure of failures.slice(0, 120)) {
    console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
  }
  if (failures.length > 120) console.error(`... ${failures.length - 120} more failures omitted`);
  process.exit(1);
}

console.log(`OpenDock harness: ${title}`);
console.log("Status: ready");
console.log(`Catalog entries: ${catalog?.items?.length ?? 0}`);
console.log("Ultrawork passed.");
