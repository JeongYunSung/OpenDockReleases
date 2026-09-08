import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DockInstaller } from "../../opendock/packages/cli/src/core/app/dock-installer.ts";
import { DockRef, manifestForRef, parseManifestFile } from "../../opendock/packages/cli/src/core/domain/manifest.ts";
import { OpenDockStateStore } from "../../opendock/packages/cli/src/core/domain/state-store.ts";
import { validateManifestTaskCommands } from "../../opendock/packages/cli/src/core/runtime/task-command-validation.ts";
import { TaskRunner } from "../../opendock/packages/cli/src/core/runtime/task-runner.ts";
import { createDeployArchive, readDeployLogo, readDeployReadme } from "../../opendock/packages/cli/src/deploy-package.ts";

const root = resolve(import.meta.dir, "../docks/opendock/ux-review-lab");
const ref = DockRef.parse("opendock/ux-review-lab@1.0.1");
const skillPath = ".agents/skills/opendock-ux-review-lab/SKILL.md";
const claudeSkillPath = ".claude/skills/opendock-ux-review-lab/SKILL.md";
const temporaryProjects: string[] = [];
type Platform = "macos" | "windows";

afterEach(() => {
  for (const project of temporaryProjects.splice(0)) rmSync(project, { recursive: true, force: true });
});

function project() {
  const directory = mkdtempSync(join(tmpdir(), "ux-review-lab-"));
  temporaryProjects.push(directory);
  return directory;
}

function manifest(platform: Platform) {
  return manifestForRef(parseManifestFile(join(root, `dock.${platform}.yml`)), ref);
}

async function install(directory: string, platform: Platform, phase: "install" | "update" = "install") {
  return new DockInstaller().install({
    dockRef: ref,
    projectDir: directory,
    platform,
    phase,
    live: false,
    // Windows file installation is exercised on macOS; PowerShell execution is not simulated.
    runTasks: platform === "macos",
    resolve: () => ({ root, platform, manifest: manifest(platform), version: ref.requested(), checksum: "local-test", signature: "local-test" }),
  });
}

for (const platform of ["macos", "windows"] as const) {
  test(`${platform}: manifest policy and actual deployment archive`, async () => {
    const value = manifest(platform);
    validateManifestTaskCommands(value, platform);
    expect(readDeployReadme(root, value)).toContain("$opendock-ux-review-lab");
    expect(readDeployLogo(root, value)?.content_type).toBe("image/png");
    const archive = await createDeployArchive(root, value, ref.requested(), platform, readFileSync(join(root, `dock.${platform}.yml`), "utf8"), `dock.${platform}.yml`);
    expect(archive.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(Buffer.from(archive.data_base64, "base64").length).toBeGreaterThan(0);
  });

  test(`${platform}: fresh install, discoverable skill and resolved guides`, async () => {
    const directory = project();
    await install(directory, platform);
    const lock = new OpenDockStateStore(directory).readLock();
    expect(lock.docks.map(dock => dock.id)).toEqual([ref.id()]);
    for (const mapping of manifest(platform).files) expect(existsSync(join(directory, mapping.to))).toBe(true);
    for (const runtimePath of [skillPath, claudeSkillPath]) {
      const skill = readFileSync(join(directory, runtimePath), "utf8");
      expect(skill).toBe(readFileSync(join(root, "files/skill/SKILL.md"), "utf8"));
      expect(skill.startsWith("---\n")).toBe(true);
      const frontmatter = Bun.YAML.parse(skill.match(/^---\n([\s\S]*?)\n---/)![1]) as { name: string };
      expect(frontmatter.name).toBe("opendock-ux-review-lab");
      const guides = [...skill.matchAll(/`(\.\.\/[^`]+\.md)`/g)];
      expect(guides).toHaveLength(3);
      for (const guide of guides) expect(existsSync(resolve(directory, dirname(runtimePath), guide[1]))).toBe(true);
    }
  });

  test(`${platform}: no-change update and uninstall preserve user files`, async () => {
    const directory = project();
    writeFileSync(join(directory, "AGENTS.md"), "# User instructions\nKeep this section.\n");
    writeFileSync(join(directory, "KEEP.md"), "user document\n");
    writeFileSync(join(directory, "CLAUDE.md"), "user Claude instructions\n");
    mkdirSync(join(directory, ".claude/skills/user-skill"), { recursive: true });
    writeFileSync(join(directory, ".claude/skills/user-skill/SKILL.md"), "user Claude skill\n");
    mkdirSync(join(directory, ".agents/skills/user-skill"), { recursive: true });
    writeFileSync(join(directory, ".agents/skills/user-skill/SKILL.md"), "user skill\n");
    await install(directory, platform);
    const before = manifest(platform).files.map(mapping => readFileSync(join(directory, mapping.to), "utf8"));
    const update = await install(directory, platform, "update");
    expect(update.filesCreated).toBe(0);
    expect(update.filesDeleted).toBe(0);
    expect(manifest(platform).files.map(mapping => readFileSync(join(directory, mapping.to), "utf8"))).toEqual(before);
    new DockInstaller().uninstall({ dockId: ref.id(), projectDir: directory });
    expect(new OpenDockStateStore(directory).readLock().docks).toHaveLength(0);
    expect(readFileSync(join(directory, "AGENTS.md"), "utf8")).toContain("Keep this section.");
    expect(readFileSync(join(directory, "KEEP.md"), "utf8")).toBe("user document\n");
    expect(readFileSync(join(directory, "CLAUDE.md"), "utf8")).toBe("user Claude instructions\n");
    expect(readFileSync(join(directory, ".claude/skills/user-skill/SKILL.md"), "utf8")).toBe("user Claude skill\n");
    expect(readFileSync(join(directory, ".agents/skills/user-skill/SKILL.md"), "utf8")).toBe("user skill\n");
    for (const mapping of manifest(platform).files.filter(mapping => mapping.to !== "AGENTS.md")) expect(existsSync(join(directory, mapping.to))).toBe(false);
  });

  test(`${platform}: modified managed content is not overwritten by update`, async () => {
    const directory = project();
    await install(directory, platform);
    const guidePath = join(directory, ".opendock/docks/ux-review-lab/QUICK_REVIEW.md");
    const modified = readFileSync(guidePath, "utf8").replace("<!-- OPENDOCK:END", "User edit inside managed section.\n<!-- OPENDOCK:END");
    writeFileSync(guidePath, modified);
    await expect(install(directory, platform, "update")).rejects.toThrow();
    expect(readFileSync(guidePath, "utf8")).toBe(modified);
  });

  test(`${platform}: update adds the missing Claude skill to the 1.0.0 file contract`, async () => {
    const directory = project();
    const oldRef = DockRef.parse("opendock/ux-review-lab@1.0.0");
    const oldManifest = manifestForRef(parseManifestFile(join(root, `dock.${platform}.yml`)), oldRef);
    oldManifest.files = oldManifest.files.filter(mapping => mapping.to !== claudeSkillPath);
    oldManifest.tasks.doctor = oldManifest.tasks.doctor.filter(step => step.id !== "ux-review-lab-claude-skill");
    await new DockInstaller().install({
      dockRef: oldRef, projectDir: directory, platform, live: false, runTasks: platform === "macos",
      resolve: () => ({ root, platform, manifest: oldManifest, version: oldRef.requested(), checksum: "old-local-test", signature: "local-test" }),
    });
    expect(existsSync(join(directory, claudeSkillPath))).toBe(false);
    await install(directory, platform, "update");
    expect(readFileSync(join(directory, claudeSkillPath), "utf8")).toBe(readFileSync(join(directory, skillPath), "utf8"));
  });

  test(`${platform}: modified Claude skill blocks update and uninstall without data loss`, async () => {
    const directory = project();
    await install(directory, platform);
    const target = join(directory, claudeSkillPath);
    const modified = `${readFileSync(target, "utf8")}\nUser customization.\n`;
    writeFileSync(target, modified);
    await expect(install(directory, platform, "update")).rejects.toThrow();
    expect(() => new DockInstaller().uninstall({ dockId: ref.id(), projectDir: directory })).toThrow();
    expect(readFileSync(target, "utf8")).toBe(modified);
  });
}

test("macOS: doctor succeeds and detects a missing guide", async () => {
  const directory = project();
  await install(directory, "macos");
  const run = () => new TaskRunner().run(manifest("macos"), { dockId: ref.id(), phase: "doctor", platform: "macos", projectDir: directory, live: false });
  expect(run().reports.filter(report => report.status === "Failed")).toHaveLength(0);
  rmSync(join(directory, ".opendock/docks/ux-review-lab/QUICK_REVIEW.md"));
  expect(run().reports.filter(report => report.status === "Failed")).toHaveLength(1);
});

test("macOS: doctor detects a missing Claude skill", async () => {
  const directory = project();
  await install(directory, "macos");
  rmSync(join(directory, claudeSkillPath));
  const result = new TaskRunner().run(manifest("macos"), { dockId: ref.id(), phase: "doctor", platform: "macos", projectDir: directory, live: false });
  expect(result.reports.filter(report => report.status === "Failed").map(report => report.id)).toEqual(["ux-review-lab-claude-skill"]);
});
