#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const harness = path.resolve(
  testDir,
  "../files/.opendock/harness/opendock__interactive-ui-ultrawork/check.mjs",
);

function write(root, rel, contents) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function execute(root) {
  return spawnSync(process.execPath, [harness], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

function output(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function assert(condition, message, result) {
  if (condition) return;
  const detail = result ? `\n--- harness output ---\n${output(result)}` : "";
  throw new Error(`${message}${detail}`);
}

function runManifest(targets) {
  return `# Interaction Run Manifest

Status: active
Interaction Type: expandable settings disclosure with persistent state feedback
Framework: React existing application
Implementation Tier: CSS
Library Decision: none - native button semantics and CSS cover the required behavior
Library Installation: none - no dependency changes or automatic installs were needed
Primary Trigger: a semantic button activated by keyboard, pointer, or touch
Primary Feedback: aria-expanded and panel visibility change immediately after activation
Primary Completion: aria-expanded matches the final panel visibility after each completed activation
Recovery Path: activating the same button again returns the disclosure to its stable closed state
Focus Contract: focus stays on the disclosure button before, during, and after each state change
Motion Complexity Evidence: not applicable - one transform transition is sufficient for this disclosure
Special Choice Evidence: not applicable - no timeline or SVG choreography is required

## Target Files

${targets.map((target) => `- \`${target}\``).join("\n")}

## Interaction State Matrix

| State | Behavior and evidence |
| --- | --- |
| idle | button and disclosure content remain stable before user input |
| hover | pointer hover uses the same transform cue as visible keyboard focus |
| focus | focus-visible outline remains visible around the semantic button |
| pressed/active | button activation updates aria-expanded and the disclosure content |
| loading | not applicable - this local disclosure performs no asynchronous operation |
| error | not applicable - this local state transition has no external failure path |
| disabled | not applicable - the disclosure action is always available in this fixture |
| reduced motion | media query removes transition duration while preserving the final state |

## Input Parity Evidence

Keyboard Evidence: Tab reaches the button and Enter or Space toggles the disclosure state
Touch Evidence: native button click behavior was exercised through the pointer-compatible activation path
Focus Evidence: focus-visible outline remains present before and after disclosure activation

## Motion Evidence

Reduced Motion Evidence: prefers-reduced-motion sets transition duration to zero and preserves state feedback

## Async State Evidence

Loading Evidence: not applicable - no request, promise, or deferred operation exists in this interaction
Error Evidence: not applicable - the local boolean transition cannot produce a recoverable request error
Disabled Evidence: not applicable - no duplicate submission or unavailable action exists in this interaction

## Cleanup Evidence

Cleanup Evidence: no timer, animation frame, listener, observer, subscription, or imperative animation is created

## Responsive And Overflow Evidence

Horizontal Overflow Evidence: inspected at 320px width with long button text and observed no horizontal scrolling

## Validation Evidence

Validation Commands: node harness fixture plus keyboard, reduced-motion, and 320px viewport observations
Validation Result: passed - target files satisfied input parity, motion, state, cleanup, and overflow checks

## Exceptions

None. No human-approved exception is required for this fixture.
`;
}

const validComponent = `import { useState } from "react";

export function Disclosure() {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        className="disclosureButton"
        aria-expanded={open}
        aria-controls="details"
        onClick={() => setOpen((value) => !value)}
      >
        Account details
      </button>
      <div id="details" hidden={!open}>Saved account preferences</div>
    </section>
  );
}
`;

const validStyles = `.disclosureButton {
  transition: transform 160ms ease;
}

.disclosureButton:hover,
.disclosureButton:focus-visible {
  transform: translateY(-1px);
}

.disclosureButton:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .disclosureButton {
    transition-duration: 0ms;
  }
}
`;

const invalidComponent = `async function activate() {
  await fetch("/api/activate");
}

export function BadInteraction() {
  setInterval(() => {}, 1000);
  window.addEventListener("resize", () => {});
  return <div onClick={activate} onMouseDown={() => {}}>Activate</div>;
}
`;

const invalidStyles = `.badInteraction {
  width: 100vw;
  transition: all 200ms ease;
  animation: pulse 1s infinite;
}

.badInteraction:hover {
  transform: scale(1.04);
}

@keyframes pulse {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
`;

const leakyTarget = `function handleResize() {}

export function startLeakyInteraction() {
  setInterval(() => {}, 1000);
  window.addEventListener("resize", handleResize);
}
`;

const unrelatedCleanupTarget = `export function cleanupUnrelatedResources(intervalId, handler) {
  clearInterval(intervalId);
  window.removeEventListener("scroll", handler);
}
`;

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opendock-interactive-ui-"));

try {
  const noRunRoot = path.join(temporaryRoot, "no-run");
  fs.mkdirSync(noRunRoot, { recursive: true });
  const noRun = execute(noRunRoot);
  assert(noRun.status === 0, "No-active-run fixture must pass as ready.", noRun);
  assert(output(noRun).includes("Status: ready"), "No-active-run fixture must report ready status.", noRun);

  const validRoot = path.join(temporaryRoot, "valid");
  write(validRoot, ".opendock/runs/interactive-ui/valid/manifest.md", runManifest(["src/Disclosure.tsx", "src/disclosure.css"]));
  write(validRoot, "src/Disclosure.tsx", validComponent);
  write(validRoot, "src/disclosure.css", validStyles);
  write(validRoot, "src/unrelated.css", ".legacy { width: 100vw; transition: all 1s; }");
  const valid = execute(validRoot);
  assert(valid.status === 0, "Valid fixture must pass.", valid);
  assert(output(valid).includes("Status: passed"), "Valid fixture must report passed status.", valid);
  assert(output(valid).includes("Targets scanned: 2"), "Harness must scan only manifest targets.", valid);

  const misplacedContractRoot = path.join(temporaryRoot, "misplaced-contract");
  const misplacedContractManifest = runManifest(["src/Disclosure.tsx", "src/disclosure.css"])
    .replace(/^Primary Completion:.*\n/m, "")
    .replace(/^Recovery Path:.*\n/m, "")
    .replace(/^Focus Contract:.*\n/m, "")
    .replace(
      "## Target Files",
      `## Target Files

Primary Completion: the panel visibility confirms completion after activation
Recovery Path: a second activation returns the disclosure to its closed state
Focus Contract: focus remains on the disclosure button throughout the state change`,
    );
  write(misplacedContractRoot, ".opendock/runs/interactive-ui/misplaced/manifest.md", misplacedContractManifest);
  write(misplacedContractRoot, "src/Disclosure.tsx", validComponent);
  write(misplacedContractRoot, "src/disclosure.css", validStyles);
  const misplacedContract = execute(misplacedContractRoot);
  const misplacedContractOutput = output(misplacedContract);
  assert(misplacedContract.status !== 0, "Contract fields below a section must fail.", misplacedContract);
  for (const field of ["Primary Completion", "Recovery Path", "Focus Contract"]) {
    assert(misplacedContractOutput.includes(field), `${field} must be enforced as a top-level field.`, misplacedContract);
  }

  const splitCleanupRoot = path.join(temporaryRoot, "split-cleanup");
  write(
    splitCleanupRoot,
    ".opendock/runs/interactive-ui/split-cleanup/manifest.md",
    runManifest(["src/LeakyInteraction.ts", "src/UnrelatedCleanup.ts"]),
  );
  write(splitCleanupRoot, "src/LeakyInteraction.ts", leakyTarget);
  write(splitCleanupRoot, "src/UnrelatedCleanup.ts", unrelatedCleanupTarget);
  const splitCleanup = execute(splitCleanupRoot);
  const splitCleanupOutput = output(splitCleanup);
  assert(splitCleanup.status !== 0, "Cleanup in another target file must not conceal missing cleanup.", splitCleanup);
  for (const rule of ["timer-cleanup", "listener-cleanup"]) {
    assert(splitCleanupOutput.includes(`[${rule}] src/LeakyInteraction.ts:`), `${rule} must identify the leaky target.`, splitCleanup);
  }

  const invalidRoot = path.join(temporaryRoot, "invalid");
  write(invalidRoot, ".opendock/runs/interactive-ui/invalid/manifest.md", runManifest(["src/BadInteraction.tsx", "src/bad.css"]));
  write(invalidRoot, "src/BadInteraction.tsx", invalidComponent);
  write(invalidRoot, "src/bad.css", invalidStyles);
  const invalid = execute(invalidRoot);
  assert(invalid.status !== 0, "Invalid fixture must exit non-zero.", invalid);

  const invalidOutput = output(invalid);
  const expectedRules = [
    "transition-all",
    "nonsemantic-click-target",
    "mouse-only-behavior",
    "hover-only-behavior",
    "reduced-motion-missing",
    "loading-state-missing",
    "error-state-missing",
    "disabled-state-missing",
    "timer-cleanup",
    "listener-cleanup",
    "horizontal-overflow-risk",
  ];
  for (const rule of expectedRules) {
    assert(invalidOutput.includes(`[${rule}]`), `Invalid fixture must report ${rule}.`, invalid);
  }

  console.log("Harness fixture tests passed.");
  console.log("- no active run: ready (exit 0)");
  console.log("- valid target-scoped fixture: passed (exit 0)");
  console.log("- misplaced top-level contract fields: rejected (non-zero)");
  console.log("- cleanup split across target files: rejected (non-zero)");
  console.log("- invalid fixture: rejected (non-zero) with expected rule ids");
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
