#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const maxTextFileBytes = 1024 * 1024;
const readFailures = [];
const mode = "design";
const title = mode === "figma" ? "Figma Ultrawork" : "Design Ultrawork";
const focus =
  mode === "figma"
    ? "Figma canvas quality, DESIGN.md contract alignment, and handoff readiness"
    : "design implementation quality, DESIGN.md contract alignment, and UI handoff readiness";

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
  ".turbo",
  ".gradle",
  "target",
  ".venv",
  "venv",
]);
const ignoredRootFiles = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md", "HARNESS.md", "README.md", "DESIGN.md"]);
const textExtensions = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".html",
  ".sh",
  ".ps1",
  ".xml",
  ".svg",
  "",
]);

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

function normalizePath(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function readText(file) {
  const ext = path.extname(file);
  const base = path.basename(file);
  if (!textExtensions.has(ext) && !["Dockerfile", "Makefile"].includes(base)) return null;
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
  } catch {
    return null;
  }
}

function normalizeHex(hex) {
  let value = hex.toLowerCase();
  if (value.length === 4) value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  if (value.length === 5) {
    value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
  }
  return value;
}

function compactLength(value) {
  return String(value).toLowerCase().replace(/\s+/g, "");
}

function readDesignContract() {
  const file = path.join(root, "DESIGN.md");
  if (!fs.existsSync(file)) {
    return {
      exists: false,
      file: "DESIGN.md",
      text: "",
      lower: "",
      colors: new Set(),
      accentColors: new Set(),
      lengths: new Set(),
      allowsNegativeLetterSpacing: false,
      maxFontWeight: null,
      forbidPureWhiteBackground: false,
      forbidPillCtas: false,
      requirePillButtons: false,
      forbidAccentButtons: false,
      forbidDropShadows: false,
    };
  }

  if (fs.statSync(file).size > maxTextFileBytes) {
    return {
      exists: true,
      file: "DESIGN.md",
      text: "",
      lower: "",
      colors: new Set(),
      accentColors: new Set(),
      lengths: new Set(),
      allowsNegativeLetterSpacing: false,
      maxFontWeight: null,
      forbidPureWhiteBackground: false,
      forbidPillCtas: false,
      requirePillButtons: false,
      forbidAccentButtons: false,
      forbidDropShadows: false,
      tooLarge: true,
    };
  }

  const text = fs.readFileSync(file, "utf8");
  const lower = text.toLowerCase();
  const colors = new Set();
  const accentColors = new Set();
  for (const match of text.matchAll(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g)) {
    colors.add(normalizeHex(match[0]));
  }
  for (const line of text.split(/\r?\n/)) {
    for (const match of line.matchAll(/\{colors\.accent[^}]*\}[^#]*(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b)/g)) {
      accentColors.add(normalizeHex(match[1]));
    }
    if (!/^\s*-\s*\*\*Accent\b|^\s*-\s*Accent\b/.test(line)) continue;
    for (const match of line.matchAll(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g)) {
      accentColors.add(normalizeHex(match[0]));
    }
  }

  const lengths = new Set();
  for (const match of text.matchAll(/-?\d+(?:\.\d+)?\s*(?:px|rem|em|%)/gi)) {
    lengths.add(compactLength(match[0]));
  }

  let maxFontWeight = null;
  if (
    /weight ceiling (?:is |at )?600/.test(lower) ||
    /600 (?:is|as) the maximum weight/.test(lower) ||
    /maximum weight (?:is |at )?600/.test(lower) ||
    /maximum weight in the system/.test(lower) ||
    /don't use weight 700/.test(lower) ||
    /never uses? 700/.test(lower) ||
    /never uses? 700\+/.test(lower)
  ) {
    maxFontWeight = 600;
  }

  return {
    exists: true,
    file: "DESIGN.md",
    text,
    lower,
    colors,
    accentColors,
    lengths,
    allowsNegativeLetterSpacing: /negative (?:letter-spacing|tracking)|letter-spacing[^.\n]*-\d|tracking[^.\n]*-\d/.test(lower),
    maxFontWeight,
    forbidPureWhiteBackground: /don't use pure white|do not use pure white|not pure white/.test(lower),
    forbidPillCtas: /don't render ctas as pills|do not render ctas as pills|never uses? pill ctas|brand never uses pill ctas/.test(
      lower,
    ),
    requirePillButtons: /all buttons are pill|every cta is a pill|all buttons are pill-shaped|compose every cta as a pill/.test(
      lower,
    ),
    forbidAccentButtons: /accent colors?.*(?:never|not).*button|chromatic accents?.*never.*button|not as button backgrounds|not as button colours|not as button colors/.test(
      lower,
    ),
    forbidDropShadows: /no drop shadows|don't add drop shadows|do not add drop shadows/.test(lower) && !/layered drop/.test(lower),
  };
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

function push(failures, rule, file, detail) {
  failures.push({ rule, file, detail });
}

function lengthAllowed(contract, raw) {
  if (!contract.exists) return false;
  return contract.lengths.has(compactLength(raw));
}

function checkCommonTextRules(files, failures) {
  for (const file of files) {
    if (/[ \t]+$/m.test(file.text)) push(failures, "trailing-whitespace", file.rel, "Remove trailing whitespace.");
    if (/\t+/m.test(file.text) && /\.(md|ts|tsx|js|jsx|css|scss|yml|yaml|json)$/.test(file.rel)) {
      push(failures, "tab-indentation", file.rel, "Use spaces for indentation unless the project explicitly requires tabs.");
    }
    if (/font-size\s*[:=][^;\n]*(vw|vh|vmin|vmax)/i.test(file.text)) {
      push(failures, "viewport-font-size", file.rel, "Viewport-based font-size is not allowed.");
    }
    if (/!important/.test(file.text)) push(failures, "important-style", file.rel, "Avoid !important.");
    if (/z-index\s*[:=]\s*["']?(9{3,}|\d{4,})/i.test(file.text)) {
      push(failures, "large-z-index", file.rel, "Large arbitrary z-index values need review.");
    }
    if (file.rel.endsWith(".md") && hasOpeningCodeFenceWithoutLanguage(file.text)) {
      push(failures, "missing-code-fence-language", file.rel, "Markdown code fences should declare a language.");
    }
  }
}

function checkLengthsAgainstContract(files, contract, failures) {
  const propertyGroups = [
    { rule: "font-size-contract", property: "font-size", message: "Font-size must be declared in DESIGN.md." },
    { rule: "line-height-contract", property: "line-height", message: "Line-height must be declared in DESIGN.md when fractional." },
    { rule: "radius-contract", property: "border-radius", message: "Border radius must be declared in DESIGN.md." },
    { rule: "spacing-contract", property: "(?:margin|padding|gap|top|right|bottom|left)", message: "Spacing values must be declared in DESIGN.md when fractional." },
  ];

  for (const file of files) {
    if (!/\.(css|scss|tsx|jsx|html|svg)$/.test(file.rel)) continue;
    for (const group of propertyGroups) {
      const re = new RegExp(`${group.property}\\s*[:=]\\s*["']?(-?\\d+(?:\\.\\d+)?)(px|rem|em|%)`, "gi");
      for (const match of file.text.matchAll(re)) {
        const raw = `${match[1]}${match[2]}`;
        const isFractional = match[1].includes(".");
        if (isFractional && !lengthAllowed(contract, raw)) {
          push(failures, group.rule, file.rel, `${group.message} Found ${raw}.`);
        }
      }
    }

    for (const match of file.text.matchAll(/letter-spacing\s*[:=]\s*["']?(-?\d+(?:\.\d+)?)(px|rem|em|%)?/gi)) {
      const raw = `${match[1]}${match[2] || "px"}`;
      if (Number(match[1]) < 0) {
        if (!contract.allowsNegativeLetterSpacing) {
          push(failures, "letter-spacing-contract", file.rel, "Negative letter-spacing is not allowed by DESIGN.md.");
        } else if (!lengthAllowed(contract, raw)) {
          push(failures, "letter-spacing-contract", file.rel, `Negative letter-spacing ${raw} is not declared in DESIGN.md.`);
        }
      }
    }
  }
}

function checkColorsAgainstContract(files, contract, failures) {
  if (!contract.exists || contract.colors.size < 2) return;
  for (const file of files) {
    if (!/\.(css|scss|tsx|jsx|html|svg)$/.test(file.rel)) continue;
    for (const match of file.text.matchAll(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g)) {
      const color = normalizeHex(match[0]);
      if (!contract.colors.has(color)) {
        push(failures, "color-contract", file.rel, `${color} is not declared in DESIGN.md.`);
      }
    }
  }
}

function checkBrandSpecificRules(files, contract, failures) {
  if (!contract.exists) return;

  for (const file of files) {
    if (!/\.(css|scss|tsx|jsx|html|svg)$/.test(file.rel)) continue;
    const text = file.text;

    if (contract.forbidPureWhiteBackground && /background(?:-color)?\s*[:=]\s*["']?#(?:fff|ffffff)\b/i.test(text)) {
      push(failures, "pure-white-background", file.rel, "DESIGN.md forbids pure white as a page background.");
    }

    if (contract.maxFontWeight !== null) {
      for (const match of text.matchAll(/font-weight\s*[:=]\s*["']?(\d{3,4})/gi)) {
        const weight = Number(match[1]);
        if (weight > contract.maxFontWeight) {
          push(failures, "font-weight-contract", file.rel, `Font weight ${weight} exceeds DESIGN.md ceiling ${contract.maxFontWeight}.`);
        }
      }
    }

    if (contract.forbidPillCtas && /(button|cta)[^{\n]*(?:\{|\n)[^}]*border-radius\s*:\s*(9999px|50px|999em|999rem)/i.test(text)) {
      push(failures, "pill-cta-contract", file.rel, "DESIGN.md says CTAs must not be pill-shaped.");
    }

    if (contract.requirePillButtons && /(button|cta)[^{\n]*(?:\{|\n)[^}]*border-radius\s*:\s*(0|2px|4px|6px|8px|12px)\b/i.test(text)) {
      push(failures, "button-radius-contract", file.rel, "DESIGN.md says buttons/CTAs should be pill-shaped.");
    }

    if (contract.forbidAccentButtons && contract.accentColors.size > 0) {
      for (const color of contract.accentColors) {
        const escaped = color.replace("#", "#?");
        const re = new RegExp(`(button|cta)[^{\\n]*(?:\\{|\\n)[^}]*background(?:-color)?\\s*:\\s*${escaped}\\b`, "i");
        if (re.test(text)) {
          push(failures, "accent-button-contract", file.rel, `DESIGN.md says accent color ${color} must not be used as a button background.`);
        }
      }
    }

    if (contract.forbidDropShadows && /box-shadow\s*:\s*(?!none\b)[^;\n]+/i.test(text)) {
      push(failures, "shadow-contract", file.rel, "DESIGN.md forbids drop shadows for this design system.");
    }
  }
}

function runDesignChecks() {
  const contract = readDesignContract();
  const files = walk(root)
    .map((full) => ({ full, rel: normalizePath(full), text: readText(full) }))
    .filter((item) => item.text !== null);
  const failures = [];
  failures.push(...readFailures);

  if (contract.tooLarge) {
    push(failures, "file-too-large", "DESIGN.md", `DESIGN.md exceeds ${maxTextFileBytes} bytes and was not scanned.`);
  }

  if (!contract.exists) {
    push(failures, "missing-design-contract", contract.file, "DESIGN.md is required before design output can be validated.");
  }

  checkCommonTextRules(files, failures);
  checkLengthsAgainstContract(files, contract, failures);
  checkColorsAgainstContract(files, contract, failures);
  checkBrandSpecificRules(files, contract, failures);

  return { filesScanned: files.length, failures, contract };
}

function printResult(result) {
  if (result.failures.length > 0) {
    console.error(`OpenDock harness: ${title}`);
    console.error(`Focus: ${focus}`);
    console.error(`DESIGN.md: ${result.contract.exists ? "loaded" : "missing"}`);
    console.error(`Files scanned: ${result.filesScanned}`);
    console.error(`Failures: ${result.failures.length}`);
    for (const failure of result.failures.slice(0, 160)) {
      console.error(`- [${failure.rule}] ${failure.file}: ${failure.detail}`);
    }
    if (result.failures.length > 160) console.error(`... ${result.failures.length - 160} more failures omitted`);
    process.exit(1);
  }
  console.log(`OpenDock harness: ${title}`);
  console.log(`Focus: ${focus}`);
  console.log(`DESIGN.md: ${result.contract.exists ? "loaded" : "missing"}`);
  console.log(`Files scanned: ${result.filesScanned}`);
  console.log("Ultrawork passed.");
}

printResult(runDesignChecks());
