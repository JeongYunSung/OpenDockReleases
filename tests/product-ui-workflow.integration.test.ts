import { afterEach, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DockInstaller } from "../../opendock/packages/cli/src/core/app/dock-installer.ts";
import {
	DockRef,
	manifestForRef,
	parseManifestFile,
} from "../../opendock/packages/cli/src/core/domain/manifest.ts";
import { OpenDockStateStore } from "../../opendock/packages/cli/src/core/domain/state-store.ts";
import { validateManifestTaskCommands } from "../../opendock/packages/cli/src/core/runtime/task-command-validation.ts";
import { TaskRunner } from "../../opendock/packages/cli/src/core/runtime/task-runner.ts";
import {
	createDeployArchive,
	readDeployLogo,
	readDeployReadme,
} from "../../opendock/packages/cli/src/deploy-package.ts";

const root = resolve(import.meta.dir, "../docks/opendock/product-ui-workflow");
const ref = DockRef.parse("opendock/product-ui-workflow@1.0.0");
const skillPath = ".agents/skills/opendock-product-ui-workflow/SKILL.md";
const claudeSkillPath = ".claude/skills/opendock-product-ui-workflow/SKILL.md";
const guideRoot = ".opendock/docks/product-ui-workflow";
const temporaryProjects: string[] = [];
type Platform = "macos" | "windows";

afterEach(() => {
	for (const project of temporaryProjects.splice(0)) {
		rmSync(project, { recursive: true, force: true });
	}
});

function project(): string {
	const directory = mkdtempSync(join(tmpdir(), "product-ui-workflow-"));
	temporaryProjects.push(directory);
	return directory;
}

function manifest(platform: Platform) {
	return manifestForRef(
		parseManifestFile(join(root, `dock.${platform}.yml`)),
		ref,
	);
}

async function install(
	directory: string,
	platform: Platform,
	phase: "install" | "update" = "install",
) {
	return new DockInstaller().install({
		dockRef: ref,
		projectDir: directory,
		platform,
		phase,
		live: false,
		// Tool installation and native PowerShell execution are covered separately.
		runTasks: false,
		resolve: () => ({
			root,
			platform,
			manifest: manifest(platform),
			version: ref.requested(),
			checksum: `product-ui-workflow-${platform}`,
			signature: "local-test",
		}),
	});
}

for (const platform of ["macos", "windows"] as const) {
	test(`${platform}: manifest parity and deployment archive`, async () => {
		const value = manifest(platform);
		validateManifestTaskCommands(value, platform);
		expect(value.tools?.["oh-my-design"]?.version).toBe("2.0.0");
		expect(value.tools?.["oh-my-design"]?.commands).toEqual([
			"oh-my-design",
			"omd",
		]);
		expect(readDeployReadme(root, value)).toContain(
			"$opendock-product-ui-workflow",
		);
		expect(readDeployReadme(root, value)).toContain(
			"/opendock-product-ui-workflow",
		);
		expect(readDeployLogo(root, value)?.content_type).toBe("image/png");
		const archive = await createDeployArchive(
			root,
			value,
			ref.requested(),
			platform,
			readFileSync(join(root, `dock.${platform}.yml`), "utf8"),
			`dock.${platform}.yml`,
		);
		expect(archive.checksum).toMatch(/^[a-f0-9]{64}$/);
		expect(Buffer.from(archive.data_base64, "base64").length).toBeGreaterThan(
			5_000,
		);
	});

	test(`${platform}: fresh install resolves both skills and every guide`, async () => {
		const directory = project();
		await install(directory, platform);
		expect(new OpenDockStateStore(directory).readLock().docks.map((dock) => dock.id)).toEqual([
			ref.id(),
		]);
		for (const mapping of manifest(platform).files) {
			expect(existsSync(join(directory, mapping.to))).toBe(true);
		}

		const sourceSkill = readFileSync(join(root, "files/skill/SKILL.md"), "utf8");
		for (const runtimePath of [skillPath, claudeSkillPath]) {
			const skill = readFileSync(join(directory, runtimePath), "utf8");
			expect(skill).toBe(sourceSkill);
			const frontmatter = Bun.YAML.parse(
				skill.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "",
			) as { name: string };
			expect(frontmatter.name).toBe("opendock-product-ui-workflow");
			for (const match of skill.matchAll(/`(\.\.\/\.\.\/\.\.\/\.opendock\/docks\/product-ui-workflow\/[A-Z_]+\.md)`/g)) {
				expect(
					existsSync(resolve(directory, dirname(runtimePath), match[1])),
				).toBe(true);
			}
		}
	});

	test(`${platform}: update and uninstall preserve unrelated user files`, async () => {
		const directory = project();
		writeFileSync(join(directory, "AGENTS.md"), "# User rules\nKeep me.\n");
		writeFileSync(join(directory, "CLAUDE.md"), "User Claude rules.\n");
		mkdirSync(join(directory, ".claude/skills/user-skill"), { recursive: true });
		writeFileSync(
			join(directory, ".claude/skills/user-skill/SKILL.md"),
			"User skill.\n",
		);
		await install(directory, platform);
		const update = await install(directory, platform, "update");
		expect(update.filesCreated).toBe(0);
		expect(update.filesDeleted).toBe(0);
		new DockInstaller().uninstall({ dockId: ref.id(), projectDir: directory });
		expect(readFileSync(join(directory, "AGENTS.md"), "utf8")).toContain("Keep me.");
		expect(readFileSync(join(directory, "CLAUDE.md"), "utf8")).toBe(
			"User Claude rules.\n",
		);
		expect(
			readFileSync(join(directory, ".claude/skills/user-skill/SKILL.md"), "utf8"),
		).toBe("User skill.\n");
		for (const mapping of manifest(platform).files.filter(
			(mapping) => mapping.to !== "AGENTS.md",
		)) {
			expect(existsSync(join(directory, mapping.to))).toBe(false);
		}
	});

	test(`${platform}: user-modified managed guide blocks destructive update`, async () => {
		const directory = project();
		await install(directory, platform);
		const target = join(directory, guideRoot, "WORKFLOW.md");
		const modified = readFileSync(target, "utf8").replace(
			"<!-- OPENDOCK:END",
			"User edit.\n<!-- OPENDOCK:END",
		);
		writeFileSync(target, modified);
		await expect(install(directory, platform, "update")).rejects.toThrow();
		expect(readFileSync(target, "utf8")).toBe(modified);
	});
}

test("macos: doctor detects missing workflow and Claude skill", async () => {
	const directory = project();
	await install(directory, "macos");
	const run = () =>
		new TaskRunner().run(manifest("macos"), {
			dockId: ref.id(),
			phase: "doctor",
			platform: "macos",
			projectDir: directory,
			live: false,
		});
	// The CLI doctor fails here because tool tasks were intentionally skipped.
	expect(
		run().reports.filter((report) => report.status === "Failed").map((report) => report.id),
	).toEqual([
		"require-runtime-node",
		"require-tool-oh-my-design",
		"product-ui-workflow-cli",
	]);
	rmSync(join(directory, guideRoot, "WORKFLOW.md"));
	rmSync(join(directory, claudeSkillPath));
	expect(run().reports.filter((report) => report.status === "Failed").map((report) => report.id)).toEqual([
		"require-runtime-node",
		"require-tool-oh-my-design",
		"product-ui-workflow-cli",
		"product-ui-workflow-claude-skill",
		"product-ui-workflow-guide",
	]);
});

test("content contract excludes third-party user-story material and bounds loops", () => {
	const files = [
		"files/skill/SKILL.md",
		"files/docs/WORKFLOW.md",
		"files/docs/SCENARIOS.md",
		"files/docs/VISUAL_VERIFICATION.md",
	].map((path) => readFileSync(join(root, path), "utf8"));
	const content = files.join("\n");
	expect(content).toContain("at most three questions per round and three rounds");
	expect(content).toContain("no more than three focused repair rounds");
	expect(content).toContain("Do not copy or fetch external user-story templates");
	expect(content).not.toContain("slgoodrich");
});
