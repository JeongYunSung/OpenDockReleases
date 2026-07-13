import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const dockRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceHarness = path.join(
  dockRoot,
  "files",
  ".opendock",
  "harness",
  "opendock__kitchen-ultrawork",
  "check.mjs",
);

export const officialSources = `- USDA FSIS safe-temperature guidance: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart
- Accessed: 2026-07-13
- Scope and limitations: U.S. general consumer guidance; actual product labels and applicable local public-health guidance take priority.`;

export function makeProject(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `kitchen-ultrawork-${label}-`));
}

export function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

export function runHarness(root) {
  return spawnSync(process.execPath, [sourceHarness], { cwd: root, encoding: "utf8" });
}

export function recipe({ ingredient, safety, title = "Safety Recipe", extra = "" }) {
  return `# ${title} Recipe

Servings: 2
Prep time: 10 minutes
Cook time: 20 minutes

## Ingredients
- ${ingredient}

## Allergen Notes
Check every product label and prevent cross-contamination with shared tools.

## Steps
1. Prepare the ingredients with clean, separate tools.
2. ${safety}

## Food Safety
${safety}

## Storage And Reheating
Refrigerate leftovers promptly in a sealed container and reheat thoroughly.

${extra}
`;
}

export function manifest({
  runId,
  target,
  sources = officialSources,
  status = "review",
}) {
  return `# Kitchen Run

Status: ${status}
Mode: recipe
Run ID: ${runId}

## Request
Create and validate a two-serving safety-focused recipe for this fixture.

## Household Constraints
Two servings, no confirmed allergies, shared tools cleaned, and a food thermometer available.

## Available Ingredients
The listed ingredient and quantity were confirmed from the pantry record and package.

## Target Files
- \`${target}\`

## Allergen Review
Product labels and possible cross-contamination from shared tools were reviewed.

## Food Safety
Separation, internal temperature, prompt refrigeration, storage, and reheating were reviewed.

## Sources And Uncertainty
${sources}

## Validation
Harness fixtures, ingredient quantities, household constraints, and safety guidance were reviewed.
`;
}

export function installRun(root, {
  ingredient,
  runId,
  safety,
  sources,
  status,
  target = `kitchen/recipes/${runId}.md`,
  extra,
}) {
  write(root, target, recipe({ ingredient, safety, extra }));
  write(
    root,
    `.opendock/runs/kitchen/${runId}/manifest.md`,
    manifest({ runId, target, sources, status }),
  );
  return target;
}

export function assertFailed(result, rule) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0) throw new Error(`expected harness failure for ${rule}:\n${output}`);
  if (!new RegExp(`\\[${rule}\\]`).test(result.stderr)) {
    throw new Error(`missing ${rule}:\n${output}`);
  }
}

export function assertPassed(result) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0) throw new Error(`expected harness success:\n${output}`);
  if (!/passed|Ready/.test(result.stdout)) throw new Error(`missing success output:\n${output}`);
}

export function cleanup(...roots) {
  for (const root of roots.flat()) fs.rmSync(root, { recursive: true, force: true });
}
