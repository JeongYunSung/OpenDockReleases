import { describe, expect, test } from "bun:test";
import {
  chmodSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  acceptancePathExistsByLstat,
  assertAcceptanceTargetAvailable,
  assertAcceptanceTargetPreserved,
  assertAcceptanceWorkspaceConfinement,
  captureAcceptanceTarget,
  captureAcceptanceWorkspace,
} from "./workspace-collection.codex-acceptance.ts";

function fixture(): { project: string; target: string } {
  const project = mkdtempSync(
    join(tmpdir(), "opendock-acceptance-confinement-"),
  );
  writeFileSync(join(project, "SCENARIO.md"), "approved input\n");
  return {
    project,
    target: ".opendock/runs/product-designer/acceptance/SESSION.md",
  };
}

function writeApprovedOutputs(project: string, target: string): void {
  mkdirSync(dirname(join(project, target)), { recursive: true });
  writeFileSync(join(project, target), "approved session\n");
}

describe("Codex acceptance workspace confinement", () => {
  test("allows only the expected target and its missing parent directories", () => {
    const { project, target } = fixture();
    try {
      const before = captureAcceptanceWorkspace(project);
      writeApprovedOutputs(project, target);
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target),
      ).not.toThrow();
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });

  test("rejects extra files and directories", () => {
    const { project, target } = fixture();
    try {
      const before = captureAcceptanceWorkspace(project);
      writeApprovedOutputs(project, target);
      mkdirSync(join(project, "unapproved"));
      writeFileSync(join(project, "unapproved/data.txt"), "data\n");
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target),
      ).toThrow(/unapproved workspace entry/);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });

  test("rejects edits or deletion of baseline files", () => {
    const changed = fixture();
    try {
      const before = captureAcceptanceWorkspace(changed.project);
      writeApprovedOutputs(changed.project, changed.target);
      writeFileSync(join(changed.project, "SCENARIO.md"), "changed\n");
      expect(() =>
        assertAcceptanceWorkspaceConfinement(
          changed.project,
          before,
          changed.target,
        ),
      ).toThrow(/changed a file/);
    } finally {
      rmSync(changed.project, { recursive: true, force: true });
    }

    const removed = fixture();
    try {
      const before = captureAcceptanceWorkspace(removed.project);
      writeApprovedOutputs(removed.project, removed.target);
      rmSync(join(removed.project, "SCENARIO.md"));
      expect(() =>
        assertAcceptanceWorkspaceConfinement(
          removed.project,
          before,
          removed.target,
        ),
      ).toThrow(/removed a file or directory/);
    } finally {
      rmSync(removed.project, { recursive: true, force: true });
    }
  });

  test("rejects chmod and same-byte replacement of baseline entries", () => {
    const changedMode = fixture();
    try {
      const baselineFile = join(changedMode.project, "SCENARIO.md");
      const before = captureAcceptanceWorkspace(changedMode.project);
      writeApprovedOutputs(changedMode.project, changedMode.target);
      chmodSync(baselineFile, 0o400);
      expect(() =>
        assertAcceptanceWorkspaceConfinement(
          changedMode.project,
          before,
          changedMode.target,
        ),
      ).toThrow(/changed a file/);
    } finally {
      rmSync(changedMode.project, { recursive: true, force: true });
    }

    const changedDirectoryMode = fixture();
    try {
      const baselineDirectory = join(changedDirectoryMode.project, "managed");
      mkdirSync(baselineDirectory);
      const before = captureAcceptanceWorkspace(changedDirectoryMode.project);
      writeApprovedOutputs(
        changedDirectoryMode.project,
        changedDirectoryMode.target,
      );
      chmodSync(baselineDirectory, 0o700);
      expect(() =>
        assertAcceptanceWorkspaceConfinement(
          changedDirectoryMode.project,
          before,
          changedDirectoryMode.target,
        ),
      ).toThrow(/changed a file/);
    } finally {
      rmSync(changedDirectoryMode.project, {
        recursive: true,
        force: true,
      });
    }

    const replaced = fixture();
    try {
      const baselineFile = join(replaced.project, "SCENARIO.md");
      const replacement = join(replaced.project, "replacement.tmp");
      const before = captureAcceptanceWorkspace(replaced.project);
      writeApprovedOutputs(replaced.project, replaced.target);
      writeFileSync(replacement, "approved input\n");
      renameSync(replacement, baselineFile);
      expect(() =>
        assertAcceptanceWorkspaceConfinement(
          replaced.project,
          before,
          replaced.target,
        ),
      ).toThrow(/changed a file/);
    } finally {
      rmSync(replaced.project, { recursive: true, force: true });
    }
  });

  test("supports confinement after a failed run without requiring a target", () => {
    const { project, target } = fixture();
    try {
      const before = captureAcceptanceWorkspace(project);
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target, {
          requireTarget: false,
        }),
      ).not.toThrow();

      mkdirSync(dirname(join(project, target)), { recursive: true });
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target, {
          requireTarget: false,
        }),
      ).not.toThrow();

      writeFileSync(join(project, "unexpected.txt"), "escaped\n");
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target, {
          requireTarget: false,
        }),
      ).toThrow(/unapproved workspace entry/);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });

  test("rejects a project log symlink without modifying its outside target", () => {
    const { project, target } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "opendock-acceptance-outside-"));
    const outsideLog = join(outside, "evidence.log");
    try {
      writeFileSync(outsideLog, "outside sentinel\n");
      const before = captureAcceptanceWorkspace(project);
      writeApprovedOutputs(project, target);
      symlinkSync(outsideLog, join(project, "codex-acceptance.log"));
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target),
      ).toThrow(/symlink/);
      expect(readFileSync(outsideLog, "utf8")).toBe("outside sentinel\n");
    } finally {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("rejects symlinked target parents", () => {
    const { project, target } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "opendock-acceptance-outside-"));
    try {
      const before = captureAcceptanceWorkspace(project);
      mkdirSync(join(project, ".opendock/runs/product-designer"), {
        recursive: true,
      });
      symlinkSync(
        outside,
        join(project, ".opendock/runs/product-designer/acceptance"),
      );
      writeFileSync(join(outside, "SESSION.md"), "escaped\n");
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target),
      ).toThrow(/symlink/);
    } finally {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("rejects a hard-linked target", () => {
    const { project, target } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "opendock-acceptance-outside-"));
    try {
      const source = join(outside, "SESSION.md");
      writeFileSync(source, "linked\n");
      const before = captureAcceptanceWorkspace(project);
      mkdirSync(dirname(join(project, target)), { recursive: true });
      linkSync(source, join(project, target));
      expect(() =>
        assertAcceptanceWorkspaceConfinement(project, before, target),
      ).toThrow(/linked file/);
    } finally {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("preserves target bytes and file identity across uninstall", () => {
    const preserved = fixture();
    try {
      writeApprovedOutputs(preserved.project, preserved.target);
      const before = captureAcceptanceTarget(
        preserved.project,
        preserved.target,
      );
      expect(() =>
        assertAcceptanceTargetPreserved(
          preserved.project,
          preserved.target,
          before,
        ),
      ).not.toThrow();
      writeFileSync(join(preserved.project, preserved.target), "modified\n");
      expect(() =>
        assertAcceptanceTargetPreserved(
          preserved.project,
          preserved.target,
          before,
        ),
      ).toThrow(/changed during uninstall/);
    } finally {
      rmSync(preserved.project, { recursive: true, force: true });
    }
  });

  test("detects dangling managed remnants with lstat", () => {
    const { project } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "opendock-acceptance-outside-"));
    try {
      const danglingTarget = join(outside, "missing.md");
      symlinkSync(danglingTarget, join(project, "managed.md"));
      expect(acceptancePathExistsByLstat(project, "managed.md")).toBe(true);
      expect(acceptancePathExistsByLstat(project, "absent.md")).toBe(false);
    } finally {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("rejects target collisions, reserved evidence names and unsafe paths", () => {
    const { project, target } = fixture();
    try {
      writeApprovedOutputs(project, target);
      const withTarget = captureAcceptanceWorkspace(project);
      expect(() =>
        assertAcceptanceTargetAvailable(project, withTarget, target),
      ).toThrow(/already exists/);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }

    const parentCollision = fixture();
    try {
      const before = captureAcceptanceWorkspace(parentCollision.project);
      expect(() =>
        assertAcceptanceTargetAvailable(
          parentCollision.project,
          before,
          "SCENARIO.md/output.md",
        ),
      ).toThrow(/parent collides/);
      for (const unsafe of [
        "/absolute.md",
        "../escape.md",
        "nested//output.md",
        "nested\\output.md",
        "codex-acceptance.log",
        "codex-acceptance.log/output.md",
      ]) {
        expect(() =>
          assertAcceptanceTargetAvailable(
            parentCollision.project,
            before,
            unsafe,
          ),
        ).toThrow(/safe relative path|reserved evidence name/);
      }
    } finally {
      rmSync(parentCollision.project, { recursive: true, force: true });
    }
  });
});
