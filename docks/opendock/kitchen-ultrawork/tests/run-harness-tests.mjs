#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  assertFailed,
  assertPassed,
  cleanup,
  installRun,
  makeProject,
  manifest,
  officialSources,
  recipe,
  runHarness,
  write,
} from "./test-support.mjs";

const projects = [];
const project = (label) => {
  const root = makeProject(label);
  projects.push(root);
  return root;
};

try {
  const empty = project("empty");
  const emptyResult = runHarness(empty);
  assertPassed(emptyResult);
  assert.match(emptyResult.stdout, /Ready/);

  const valid = project("valid");
  installRun(valid, {
    runId: "tofu-bowl",
    ingredient: "tofu 300 g",
    safety: "Cook the tofu for 15 minutes and avoid cross-contamination.",
    sources: "No external numeric claims were used; actual product labels and storage conditions take priority.",
  });
  assertPassed(runHarness(valid));

  const koreanSuffix = project("korean-suffix");
  installRun(koreanSuffix, {
    runId: "korean-suffix",
    ingredient: "tofu 300 g",
    safety: "재료를 고르게 섞고 충분하게 익힌 뒤 교차오염을 피한다.",
    sources: "No external numeric claims were used; actual product labels and storage conditions take priority.",
  });
  assertPassed(runHarness(koreanSuffix));

  const invalid = project("invalid");
  write(invalid, "kitchen/recipes/chicken-cure.md", `# Chicken Recipe

Servings: 2
Prep time: 5 minutes
Cook time: 10 minutes

## Ingredients
- raw chicken 2 cups

## Steps
1. Cook briefly.

This food prevents disease and is allergen-free for everyone.
Any ingredient can be used as a substitute.
`);
  write(invalid, ".opendock/runs/kitchen/invalid/manifest.md", `# Kitchen Run

Status: review
Mode: recipe

## Request
위험한 예제를 검사한다.

## Household Constraints
제약을 충분히 검토하지 않은 잘못된 예제다.

## Available Ingredients
raw chicken two cups만 기록했다.

## Target Files
- \`kitchen/recipes/chicken-cure.md\`

## Allergen Review
확인이 필요한 부분을 적습니다.

## Food Safety
적용되는 항목과 근거를 적습니다.

## Sources And Uncertainty
pending

## Validation
pending
`);
  const invalidResult = runHarness(invalid);
  for (const rule of [
    "recipe-core",
    "medical-claim",
    "allergen-guarantee",
    "raw-protein-temperature",
  ]) {
    assertFailed(invalidResult, rule);
  }

  const boundaryCases = [
    ["poultry-c", "raw chicken thigh 300 g", "Cook raw chicken to an internal temperature of 74C."],
    ["ground-f", "ground beef 300 g", "Cook ground beef to an internal temperature of 160°F."],
    ["whole-cut-c", "pork chop 300 g", "Cook the pork chop to an internal temperature of 63 °C, then rest for 3 minutes."],
    ["egg-dish-f", "egg frittata mixture 300 g", "Cook the egg dish to an internal temperature of 160 F."],
    ["fish-c", "salmon fillet 300 g", "Cook the salmon to an internal temperature of 63C."],
    ["flower-crab-c", "꽃게 300 g", "꽃게의 내부 온도를 63C까지 올린다."],
    ["snow-crab-c", "대게 300 g", "대게의 내부 온도를 63C까지 올린다."],
    ["red-crab-c", "홍게 300 g", "홍게의 내부 온도를 63C까지 올린다."],
    ["king-crab-c", "킹크랩 300 g", "킹크랩의 내부 온도를 63C까지 올린다."],
    ["crab-meat-c", "게살 300 g", "게살의 내부 온도를 63C까지 올린다."],
  ];
  for (const [runId, ingredient, safety] of boundaryCases) {
    const root = project(`boundary-${runId}`);
    installRun(root, { runId, ingredient, safety });
    assertPassed(runHarness(root));
  }

  const unsafeCases = [
    ["poultry-10c", "raw chicken breast 300 g", "Cook raw chicken to an internal temperature of 10C."],
    ["ground-low", "ground pork 300 g", "Cook ground pork to an internal temperature of 70C."],
    ["whole-cut-low", "lamb chop 300 g", "Cook the lamb chop to an internal temperature of 62C, then rest for 3 minutes."],
    ["egg-dish-low", "egg casserole 300 g", "Cook the egg dish to an internal temperature of 70C."],
    ["seafood-low", "shrimp 300 g", "Cook the shrimp to an internal temperature of 144F."],
    ["flower-crab-low", "꽃게 300 g", "꽃게의 내부 온도를 62C까지만 올린다."],
    ["snow-crab-low", "대게 300 g", "대게의 내부 온도를 62C까지만 올린다."],
    ["red-crab-low", "홍게 300 g", "홍게의 내부 온도를 62C까지만 올린다."],
    ["king-crab-low", "킹크랩 300 g", "킹크랩의 내부 온도를 62C까지만 올린다."],
    ["crab-meat-low", "게살 300 g", "게살의 내부 온도를 62C까지만 올린다."],
  ];
  for (const [runId, ingredient, safety] of unsafeCases) {
    const root = project(`unsafe-${runId}`);
    installRun(root, { runId, ingredient, safety });
    assertFailed(runHarness(root), "raw-protein-temperature");
  }

  const missingRest = project("whole-cut-rest");
  installRun(missingRest, {
    runId: "whole-cut-rest",
    ingredient: "beef steak 300 g",
    safety: "Cook the beef steak to an internal temperature of 63C and serve immediately.",
  });
  assertFailed(runHarness(missingRest), "whole-cut-rest");

  const sourceCases = [
    ["missing-url", "Accessed: 2026-07-13. Scope: U.S. general guidance; product labels take priority."],
    ["insecure-url", "http://www.fsis.usda.gov/safe-temperature, accessed 2026-07-13. Scope: U.S. general guidance."],
    ["missing-date", "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation. Scope: U.S. general guidance."],
  ];
  for (const [runId, sources] of sourceCases) {
    const root = project(`source-${runId}`);
    installRun(root, {
      runId,
      ingredient: "raw turkey breast 300 g",
      safety: "Cook raw turkey to an internal temperature of 74C.",
      sources,
    });
    assertFailed(runHarness(root), "food-safety-source");
  }

  const missingScope = project("source-scope");
  installRun(missingScope, {
    runId: "source-scope",
    ingredient: "raw chicken 300 g",
    safety: "Cook raw chicken to an internal temperature of 74C.",
    sources: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation, accessed 2026-07-13.",
  });
  assertFailed(runHarness(missingScope), "food-safety-source-scope");

  for (const segment of [".opendock", "runs", "kitchen"]) {
    const root = project(`symlink-${segment.replace(".", "dot-")}`);
    const outside = project(`outside-${segment.replace(".", "dot-")}`);
    const outsideRunRoot = path.join(outside, ".opendock", "runs", "kitchen");
    fs.mkdirSync(outsideRunRoot, { recursive: true });

    installRun(outside, {
      runId: "linked",
      ingredient: "tofu 300 g",
      safety: "Cook the tofu for 15 minutes and avoid cross-contamination.",
      sources: "No external numeric claims were used; actual product labels and storage conditions take priority.",
    });
    write(root, "kitchen/recipes/linked.md", recipe({
      ingredient: "tofu 300 g",
      safety: "Cook the tofu for 15 minutes and avoid cross-contamination.",
    }));

    if (segment === ".opendock") {
      fs.symlinkSync(path.join(outside, ".opendock"), path.join(root, ".opendock"), "dir");
    } else if (segment === "runs") {
      fs.mkdirSync(path.join(root, ".opendock"));
      fs.symlinkSync(path.join(outside, ".opendock", "runs"), path.join(root, ".opendock", "runs"), "dir");
    } else {
      fs.mkdirSync(path.join(root, ".opendock", "runs"), { recursive: true });
      fs.symlinkSync(outsideRunRoot, path.join(root, ".opendock", "runs", "kitchen"), "dir");
    }
    assertFailed(runHarness(root), "run-root-symlink");
  }

  for (const statuses of [["active", "draft"], ["draft", "draft"]]) {
    const root = project(`multiple-${statuses.join("-")}`);
    const target = "kitchen/recipes/shared.md";
    write(root, target, recipe({
      ingredient: "tofu 300 g",
      safety: "Cook the tofu for 15 minutes and avoid cross-contamination.",
    }));
    statuses.forEach((status, index) => {
      const runId = `run-${index + 1}`;
      write(
        root,
        `.opendock/runs/kitchen/${runId}/manifest.md`,
        manifest({ runId, target, status, sources: officialSources }),
      );
    });
    assertFailed(runHarness(root), "multiple-active-runs");
  }

  const oneActive = project("one-active");
  const target = "kitchen/recipes/one-active.md";
  write(oneActive, target, recipe({
    ingredient: "tofu 300 g",
    safety: "Cook the tofu for 15 minutes and avoid cross-contamination.",
  }));
  write(oneActive, ".opendock/runs/kitchen/done/manifest.md", manifest({
    runId: "done",
    target,
    status: "completed",
  }));
  write(oneActive, ".opendock/runs/kitchen/current/manifest.md", manifest({
    runId: "current",
    target,
    status: "active",
  }));
  assertPassed(runHarness(oneActive));

  console.log("Kitchen harness fixture tests passed.");
} finally {
  cleanup(projects);
}
