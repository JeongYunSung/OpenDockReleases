import { describe, expect, test } from "bun:test";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DockInstaller } from "../../opendock/packages/cli/src/core/app/dock-installer.ts";
import {
  DockRef,
  manifestForRef,
  parseManifestFile,
} from "../../opendock/packages/cli/src/core/domain/manifest.ts";
import type { ResolvedDock } from "../../opendock/packages/cli/src/resolver.ts";
import {
  assertAcceptanceFinalWorkspaceInventory,
  captureAcceptanceTarget,
  runAcceptanceChild,
} from "./workspace-collection.codex-acceptance.ts";

const darwinTest = process.platform === "darwin" ? test : test.skip;
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const acceptanceRunMarkerKey = "OPENDOCK_CODEX_ACCEPTANCE_RUN_MARKER";

function fixture(): string {
  return mkdtempSync(join(tmpdir(), "opendock-acceptance-process-group-"));
}

function delayedWriteCommand(exitCode: number): string[] {
  return [
    "sh",
    "-c",
    `(sleep 0.25; printf 'late\\n' > "$LATE_WRITE_PATH") & printf 'leader\\n'; exit ${exitCode}`,
  ];
}

function escapedBunCommand(
  childSource: string,
  stdout: "ignore" | "inherit",
): string[] {
  const leaderSource = `
    const child = Bun.spawn(
      [process.execPath, "-e", ${JSON.stringify(childSource)}],
      {
        detached: true,
        env: process.env,
        stdin: "ignore",
        stdout: ${JSON.stringify(stdout)},
        stderr: "ignore",
      },
    );
    child.unref();
    if (process.env.ESCAPED_PID_PATH) {
      await Bun.write(process.env.ESCAPED_PID_PATH, String(child.pid));
    }
    const readyPath = process.env.ESCAPED_READY_PATH;
    const deadline = Date.now() + 1000;
    while (!(await Bun.file(readyPath).exists())) {
      if (Date.now() >= deadline) process.exit(9);
      await Bun.sleep(5);
    }
  `;
  return [process.execPath, "-e", leaderSource];
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
    throw error;
  }
}

function readFixturePid(pidPath: string): number | undefined {
  if (!existsSync(pidPath)) return undefined;
  const pid = Number(readFileSync(pidPath, "utf8"));
  return Number.isSafeInteger(pid) && pid > 1 && pid !== process.pid
    ? pid
    : undefined;
}

async function terminateFixtureProcess(pidPath: string): Promise<void> {
  const pid = readFixturePid(pidPath);
  if (!pid || !processExists(pid)) return;
  try {
    process.kill(-pid, "SIGKILL");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ESRCH") throw error;
    try {
      process.kill(pid, "SIGKILL");
    } catch (fallbackError) {
      if ((fallbackError as NodeJS.ErrnoException).code !== "ESRCH") {
        throw fallbackError;
      }
    }
  }
  const deadline = Date.now() + 1_000;
  while (processExists(pid) && Date.now() < deadline) await Bun.sleep(10);
  if (processExists(pid)) {
    throw new Error(`fixture process ${pid} survived cleanup`);
  }
}

describe("Codex acceptance process-group confinement", () => {
  darwinTest("drains a successful leader's delayed descendant", async () => {
    const root = fixture();
    const project = join(root, "project");
    const evidencePath = join(root, "project.codex-acceptance.log");
    mkdirSync(project);
    try {
      const result = await runAcceptanceChild(delayedWriteCommand(0), {
        cwd: project,
        env: { ...process.env, LATE_WRITE_PATH: evidencePath },
        timeoutMs: 2_000,
        terminationGraceMs: 250,
        drainTimeoutMs: 500,
      });
      expect(result).toMatchObject({ exitCode: 0, timedOut: false });
      expect(result.stdout).toContain("leader");

      writeFileSync(evidencePath, "trusted evidence\n", {
        flag: "wx",
        mode: 0o600,
      });
      await Bun.sleep(350);
      expect(readFileSync(evidencePath, "utf8")).toBe("trusted evidence\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest("drains a nonzero leader's delayed descendant", async () => {
    const root = fixture();
    const delayedPath = join(root, "late.txt");
    try {
      const result = await runAcceptanceChild(delayedWriteCommand(7), {
        cwd: root,
        env: { ...process.env, LATE_WRITE_PATH: delayedPath },
        timeoutMs: 2_000,
        terminationGraceMs: 250,
        drainTimeoutMs: 500,
      });
      expect(result).toMatchObject({ exitCode: 7, timedOut: false });
      await Bun.sleep(350);
      expect(existsSync(delayedPath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest(
    "terminates the full group on timeout before validation",
    async () => {
      const root = fixture();
      const delayedPath = join(root, "late.txt");
      try {
        const result = await runAcceptanceChild(
          [
            "sh",
            "-c",
            `(sleep 0.25; printf 'late\\n' > "$LATE_WRITE_PATH") & sleep 5`,
          ],
          {
            cwd: root,
            env: { ...process.env, LATE_WRITE_PATH: delayedPath },
            timeoutMs: 50,
            terminationGraceMs: 250,
            drainTimeoutMs: 500,
          },
        );
        expect(result.timedOut).toBe(true);
        await Bun.sleep(350);
        expect(existsSync(delayedPath)).toBe(false);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest("escalates a TERM-ignoring descendant to KILL", async () => {
    const root = fixture();
    const readyPath = join(root, "ready.txt");
    const pidPath = join(root, "term-ignoring-pid.txt");
    try {
      const started = Date.now();
      const result = await runAcceptanceChild(
        [
          "sh",
          "-c",
          `sh -c 'trap "" TERM; : > "$READY_PATH"; while :; do :; done' & printf '%s' "$!" > "$ESCAPED_PID_PATH"; while [ ! -f "$READY_PATH" ]; do sleep 0.01; done; exit 0`,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            ESCAPED_PID_PATH: pidPath,
            READY_PATH: readyPath,
          },
          timeoutMs: 2_000,
          terminationGraceMs: 50,
          drainTimeoutMs: 500,
        },
      );
      expect(result).toMatchObject({ exitCode: 0, timedOut: false });
      expect(Date.now() - started).toBeGreaterThanOrEqual(45);
      expect(existsSync(readyPath)).toBe(true);
    } finally {
      await terminateFixtureProcess(pidPath);
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest(
    "terminates a detached Bun descendant before its delayed write",
    async () => {
      const root = fixture();
      const readyPath = join(root, "escaped-ready.txt");
      const pidPath = join(root, "escaped-pid.txt");
      const delayedPath = join(root, "escaped-late.txt");
      const childSource = `
        await Bun.write(process.env.ESCAPED_READY_PATH, "ready\\n");
        await Bun.sleep(250);
        await Bun.write(process.env.LATE_WRITE_PATH, "late\\n");
      `;
      try {
        const result = await runAcceptanceChild(
          escapedBunCommand(childSource, "ignore"),
          {
            cwd: root,
            env: {
              ...process.env,
              ESCAPED_PID_PATH: pidPath,
              ESCAPED_READY_PATH: readyPath,
              LATE_WRITE_PATH: delayedPath,
            },
            timeoutMs: 2_000,
            terminationGraceMs: 100,
            drainTimeoutMs: 250,
          },
        );
        expect(result).toMatchObject({ exitCode: 0, timedOut: false });
        expect(existsSync(readyPath)).toBe(true);
        await Bun.sleep(350);
        expect(existsSync(delayedPath)).toBe(false);
      } finally {
        await terminateFixtureProcess(pidPath);
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest(
    "returns within the bound when a detached descendant inherits stdout",
    async () => {
      const root = fixture();
      const readyPath = join(root, "pipe-ready.txt");
      const pidPath = join(root, "pipe-pid.txt");
      const childSource = `
        await Bun.write(process.env.ESCAPED_READY_PATH, "ready\\n");
        process.stdout.write("escaped pipe holder\\n");
        setInterval(() => {}, 1000);
      `;
      try {
        const started = Date.now();
        const result = await runAcceptanceChild(
          escapedBunCommand(childSource, "inherit"),
          {
            cwd: root,
            env: {
              ...process.env,
              ESCAPED_PID_PATH: pidPath,
              ESCAPED_READY_PATH: readyPath,
            },
            timeoutMs: 2_000,
            terminationGraceMs: 100,
            drainTimeoutMs: 100,
          },
        );
        expect(result).toMatchObject({ exitCode: 0, timedOut: false });
        expect(result.stdout).toContain("escaped pipe holder");
        expect(Date.now() - started).toBeLessThan(2_000);
      } finally {
        await terminateFixtureProcess(pidPath);
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest(
    "cancels a bounded pipe drain when an escaped child scrubs the marker",
    async () => {
      const root = fixture();
      const readyPath = join(root, "scrubbed-ready.txt");
      const pidPath = join(root, "scrubbed-pid.txt");
      const childSource = `
        await Bun.write(process.env.ESCAPED_PID_PATH, String(process.pid));
        await Bun.write(process.env.ESCAPED_READY_PATH, "ready\\n");
        process.stdout.write("scrubbed pipe holder\\n");
        setInterval(() => {}, 1000);
      `;
      const leaderSource = `
        const child = Bun.spawn(
          [
            "/usr/bin/env",
            "-u",
            ${JSON.stringify(acceptanceRunMarkerKey)},
            process.execPath,
            "-e",
            ${JSON.stringify(childSource)},
          ],
          {
            detached: true,
            env: process.env,
            stdin: "ignore",
            stdout: "inherit",
            stderr: "ignore",
          },
        );
        child.unref();
        const deadline = Date.now() + 1000;
        while (!(await Bun.file(process.env.ESCAPED_READY_PATH).exists())) {
          if (Date.now() >= deadline) process.exit(9);
          await Bun.sleep(5);
        }
      `;
      try {
        const started = Date.now();
        await expect(
          runAcceptanceChild([process.execPath, "-e", leaderSource], {
            cwd: root,
            env: {
              ...process.env,
              ESCAPED_PID_PATH: pidPath,
              ESCAPED_READY_PATH: readyPath,
            },
            timeoutMs: 2_000,
            terminationGraceMs: 100,
            drainTimeoutMs: 100,
          }),
        ).rejects.toThrow(/stdio remained open/);
        expect(Date.now() - started).toBeLessThan(2_000);
        const escapedPid = readFixturePid(pidPath);
        expect(Number.isSafeInteger(escapedPid) && escapedPid > 1).toBe(true);
        expect(processExists(escapedPid!)).toBe(true);
      } finally {
        await terminateFixtureProcess(pidPath);
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest(
    "records marker-scrubbed stdio-detached children as outside the cooperative boundary",
    async () => {
      const root = fixture();
      const readyPath = join(root, "residual-ready.txt");
      const pidPath = join(root, "residual-pid.txt");
      const delayedPath = join(root, "residual-late.txt");
      const childSource = `
        await Bun.write(process.env.ESCAPED_PID_PATH, String(process.pid));
        await Bun.write(process.env.ESCAPED_READY_PATH, "ready\\n");
        await Bun.sleep(200);
        await Bun.write(process.env.LATE_WRITE_PATH, "late\\n");
        setInterval(() => {}, 1000);
      `;
      const leaderSource = `
        const child = Bun.spawn(
          [
            "/usr/bin/env",
            "-u",
            ${JSON.stringify(acceptanceRunMarkerKey)},
            process.execPath,
            "-e",
            ${JSON.stringify(childSource)},
          ],
          {
            detached: true,
            env: process.env,
            stdin: "ignore",
            stdout: "ignore",
            stderr: "ignore",
          },
        );
        child.unref();
        const deadline = Date.now() + 1000;
        while (!(await Bun.file(process.env.ESCAPED_READY_PATH).exists())) {
          if (Date.now() >= deadline) process.exit(9);
          await Bun.sleep(5);
        }
      `;
      try {
        const result = await runAcceptanceChild(
          [process.execPath, "-e", leaderSource],
          {
            cwd: root,
            env: {
              ...process.env,
              ESCAPED_PID_PATH: pidPath,
              ESCAPED_READY_PATH: readyPath,
              LATE_WRITE_PATH: delayedPath,
            },
            timeoutMs: 2_000,
            terminationGraceMs: 100,
            drainTimeoutMs: 100,
          },
        );
        expect(result).toMatchObject({ exitCode: 0, timedOut: false });
        await Bun.sleep(300);
        // This proves the documented residual rather than claiming sandboxing.
        expect(readFileSync(delayedPath, "utf8")).toBe("late\n");
      } finally {
        await terminateFixtureProcess(pidPath);
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest("does not signal an unrelated unmarked process", async () => {
    const root = fixture();
    const unrelated = Bun.spawn(
      [process.execPath, "-e", "setInterval(() => {}, 1000)"],
      {
        cwd: root,
        detached: true,
        env: { ...process.env },
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
      },
    );
    try {
      expect(Number.isSafeInteger(unrelated.pid) && unrelated.pid > 1).toBe(
        true,
      );
      const result = await runAcceptanceChild(["sh", "-c", "exit 0"], {
        cwd: root,
        env: { ...process.env },
        timeoutMs: 2_000,
        terminationGraceMs: 100,
        drainTimeoutMs: 250,
      });
      expect(result).toMatchObject({ exitCode: 0, timedOut: false });
      expect(processExists(unrelated.pid)).toBe(true);
    } finally {
      try {
        process.kill(-unrelated.pid, "SIGKILL");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
      }
      await unrelated.exited;
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest(
    "redacts the private marker from captured child output",
    async () => {
      const root = fixture();
      try {
        const result = await runAcceptanceChild(
          [
            "sh",
            "-c",
            `printf '%s' "$${acceptanceRunMarkerKey}"; printf '%s' "$${acceptanceRunMarkerKey}" >&2`,
          ],
          {
            cwd: root,
            env: { ...process.env },
            timeoutMs: 2_000,
            terminationGraceMs: 100,
            drainTimeoutMs: 250,
          },
        );
        expect(result.stdout).toBe("<redacted-acceptance-run-marker>");
        expect(result.stderr).toBe("<redacted-acceptance-run-marker>");
        expect(`${result.stdout}${result.stderr}`).not.toMatch(/[a-f0-9]{64}/);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest("fails closed after bounded stdout capture", async () => {
    const root = fixture();
    try {
      await expect(
        runAcceptanceChild(["sh", "-c", "yes x | head -c 4096"], {
          cwd: root,
          env: { ...process.env },
          timeoutMs: 2_000,
          terminationGraceMs: 100,
          drainTimeoutMs: 250,
          maxOutputBytes: 128,
        }),
      ).rejects.toThrow(/output exceeded the 128-byte per-stream limit/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest("fails closed after a bounded process scan", async () => {
    const root = fixture();
    try {
      await expect(
        runAcceptanceChild(["sh", "-c", "exit 0"], {
          cwd: root,
          env: { ...process.env },
          timeoutMs: 2_000,
          terminationGraceMs: 100,
          drainTimeoutMs: 250,
          processScanMaxBytes: 64,
        }),
      ).rejects.toThrow(/process scan exceeded the 64-byte output limit/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest("bounds the overall descendant cleanup budget", async () => {
    const root = fixture();
    const pidPath = join(root, "cleanup-timeout-pid.txt");
    try {
      const started = Date.now();
      await expect(
        runAcceptanceChild(
          [
            "sh",
            "-c",
            `printf '%s' "$$" > "$ESCAPED_PID_PATH"; trap '' TERM; while :; do sleep 1; done`,
          ],
          {
            cwd: root,
            env: { ...process.env, ESCAPED_PID_PATH: pidPath },
            timeoutMs: 25,
            terminationGraceMs: 1_000,
            cleanupTimeoutMs: 75,
            drainTimeoutMs: 100,
          },
        ),
      ).rejects.toThrow(/cleanup/);
      expect(Date.now() - started).toBeLessThan(1_000);
    } finally {
      await terminateFixtureProcess(pidPath);
      rmSync(root, { recursive: true, force: true });
    }
  });

  darwinTest(
    "initializes every validator before main-module orchestration",
    async () => {
      const root = fixture();
      const fakeCodex = join(root, "fake-codex.sh");
      const reportPath = join(root, "report.json");
      const runnerPath = join(
        repositoryRoot,
        "tests/workspace-collection.codex-acceptance.ts",
      );
      writeFileSync(
        fakeCodex,
        `#!/bin/sh
mkdir -p .opendock/runs/product-designer/acceptance
printf '# Invalid smoke SESSION\\n%s\\n' '${"x".repeat(150)}' > .opendock/runs/product-designer/acceptance/SESSION.md
`,
      );
      chmodSync(fakeCodex, 0o700);
      let combined = "";
      try {
        const smoke = Bun.spawn([process.execPath, runnerPath], {
          cwd: repositoryRoot,
          env: {
            ...process.env,
            RUN_CODEX_ACCEPTANCE: "1",
            CODEX_ACCEPTANCE_DOCKS: "product-designer",
            CODEX_ACCEPTANCE_CONCURRENCY: "1",
            CODEX_ACCEPTANCE_REPORT: reportPath,
            CODEX_BIN: fakeCodex,
            KEEP_CODEX_ACCEPTANCE: "1",
          },
          stdin: "ignore",
          stdout: "pipe",
          stderr: "pipe",
        });
        const [exitCode, stdout, stderr] = await Promise.all([
          smoke.exited,
          new Response(smoke.stdout).text(),
          new Response(smoke.stderr).text(),
        ]);
        combined = `${stdout}\n${stderr}`;
        expect(exitCode).not.toBe(0);
        expect(combined).not.toMatch(
          /Cannot access 'productDesignerStages' before initialization|ReferenceError/,
        );
        expect(combined).toMatch(
          /product-designer SESSION lacks YAML front matter/,
        );
        const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
          failed: number;
          results: Array<{ reason?: string }>;
        };
        expect(report.failed).toBe(1);
        expect(report.results[0]?.reason).toMatch(
          /SESSION lacks YAML front matter/,
        );
      } finally {
        const projectPaths = new Set(
          [
            ...combined.matchAll(
              /\/[^\s;]+\/opendock-codex-product-designer-[A-Za-z0-9]+/g,
            ),
          ].map((match) => match[0]),
        );
        for (const project of projectPaths) {
          if (project.startsWith(tmpdir())) {
            rmSync(project, { recursive: true, force: true });
            rmSync(`${project}.codex-acceptance.log`, { force: true });
          }
        }
        for (const match of combined.matchAll(
          /\/[^\s]+\/workspace-collection-codex-acceptance-evidence\/[A-Za-z0-9-]+\.json/g,
        )) {
          rmSync(match[0], { force: true });
        }
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  darwinTest(
    "rejects invalid duration and empty command contracts",
    async () => {
      const root = fixture();
      try {
        await expect(
          runAcceptanceChild([], { cwd: root, timeoutMs: 50 }),
        ).rejects.toThrow(/non-empty tokens/);
        await expect(
          runAcceptanceChild(["sh", "-c", "exit 0"], {
            cwd: root,
            timeoutMs: 0,
          }),
        ).rejects.toThrow(/positive integer/);
        await expect(
          runAcceptanceChild(["sh", "-c", "exit 0"], {
            cwd: root,
            env: {
              ...process.env,
              [acceptanceRunMarkerKey]: "caller-controlled",
            },
            timeoutMs: 50,
          }),
        ).rejects.toThrow(/reserved key/);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  test("requires an exact post-uninstall workspace inventory", () => {
    const root = fixture();
    const target = ".opendock/runs/product-designer/acceptance/SESSION.md";
    try {
      writeFileSync(join(root, "SCENARIO.md"), "scenario\n");
      mkdirSync(dirname(join(root, target)), { recursive: true });
      writeFileSync(join(root, target), "session\n");
      writeFileSync(join(root, ".opendock/project.yml"), "docks: []\n");
      writeFileSync(join(root, ".opendock/dock.lock.yml"), "docks: []\n");
      const targetSnapshot = captureAcceptanceTarget(root, target);
      const scenarioSnapshot = captureAcceptanceTarget(root, "SCENARIO.md");

      expect(() =>
        assertAcceptanceFinalWorkspaceInventory(
          root,
          target,
          targetSnapshot,
          scenarioSnapshot,
        ),
      ).not.toThrow();

      writeFileSync(join(root, "managed-remnant.md"), "remnant\n");
      expect(() =>
        assertAcceptanceFinalWorkspaceInventory(
          root,
          target,
          targetSnapshot,
          scenarioSnapshot,
        ),
      ).toThrow(/unexpected post-uninstall workspace entry/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("matches the real product-designer uninstall inventory", async () => {
    const project = fixture();
    const target = ".opendock/runs/product-designer/acceptance/SESSION.md";
    const root = join(repositoryRoot, "docks/opendock/product-designer");
    const dockRef = DockRef.parse("opendock/product-designer@1.0.0");
    const manifest = manifestForRef(
      parseManifestFile(join(root, "dock.macos.yml")),
      dockRef,
    );
    const release: ResolvedDock = {
      checksum: "process-group-inventory-test",
      manifest,
      platform: "macos",
      root,
      signature: "process-group-inventory-test-signature",
      version: "1.0.0",
    };
    try {
      await new DockInstaller().install({
        dockRef,
        phase: "install",
        platform: "macos",
        projectDir: project,
        resolve: () => release,
        runTasks: false,
      });
      writeFileSync(join(project, "SCENARIO.md"), "scenario\n");
      mkdirSync(dirname(join(project, target)), { recursive: true });
      writeFileSync(join(project, target), "session\n");
      const targetSnapshot = captureAcceptanceTarget(project, target);
      const scenarioSnapshot = captureAcceptanceTarget(project, "SCENARIO.md");

      new DockInstaller().uninstall({
        dockId: "opendock/product-designer",
        projectDir: project,
      });
      expect(() =>
        assertAcceptanceFinalWorkspaceInventory(
          project,
          target,
          targetSnapshot,
          scenarioSnapshot,
        ),
      ).not.toThrow();
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });
});
