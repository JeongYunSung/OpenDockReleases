import { afterEach, describe, expect, test } from "bun:test";
import {
	chmodSync,
	cpSync,
	existsSync,
	lstatSync,
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
	type DockManifest,
	DockRef,
	manifestForRef,
	parseManifestFile,
} from "../../opendock/packages/cli/src/core/domain/manifest.ts";
import { OpenDockStateStore } from "../../opendock/packages/cli/src/core/domain/state-store.ts";
import { CommandRunner } from "../../opendock/packages/cli/src/core/runtime/command-runner.ts";
import { validateManifestTaskCommands } from "../../opendock/packages/cli/src/core/runtime/task-command-validation.ts";
import { TaskRunner } from "../../opendock/packages/cli/src/core/runtime/task-runner.ts";
import { selectTaskSteps } from "../../opendock/packages/cli/src/core/runtime/task-selection.ts";
import type { OpenDockPlatform } from "../../opendock/packages/cli/src/platform.ts";
import type { ResolvedDock } from "../../opendock/packages/cli/src/resolver.ts";

const collection = [
	"ux-audit",
	"website-genome",
	"design-system",
	"portfolio-case-study",
	"product-roast",
	"pm-workspace",
	"startup-validator",
	"error-investigator",
	"readme-doctor",
	"ai-project-starter",
	"trip-planner",
	"travel-research",
	"group-trip",
	"packing-assistant",
	"travel-journal",
	"moving",
	"home-setup",
	"purchase-decision",
	"life-admin",
	"finance-review",
	"memory-book",
] as const;

const platforms = ["macos", "windows"] as const;
const testVersion = "1.0.0";
const testDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(testDir, "..");
const docksRoot = join(repositoryRoot, "docks", "opendock");
const tempRoots: string[] = [];

afterEach(() => {
	for (const root of tempRoots.splice(0)) {
		rmSync(root, { recursive: true, force: true });
	}
});

describe("OpenDock workspace collection", () => {
	test("21개 작업공간 Dock은 전용 하네스 없이 가이드와 스킬만 제공한다", () => {
		for (const name of collection) {
			for (const platform of platforms) {
				const manifest = boundManifest(name, platform, testVersion);
				const destinations = manifest.files.map(({ to }) => to);
				expect(destinations.some((to) => to.startsWith(".opendock/harness/"))).toBe(false);
				expect(destinations.some((to) => to.endsWith("/HARNESS.md"))).toBe(false);
				expect(destinations.some((to) => /quality-gate/i.test(to))).toBe(false);
				expect(destinations).toContain(`.agents/skills/opendock-${name}/SKILL.md`);
			}
			expect(existsSync(join(dockRoot(name), "tests", "run-harness-tests.mjs"))).toBe(false);
		}
	});

	test("42개 manifest가 최신 schema와 command policy를 통과한다", () => {
		const isolatedDestinations = new Map<string, string>();
		const logoPayloads = new Set<string>();
		const sharedManagedFiles = new Set(["AGENTS.md"]);

		for (const name of collection) {
			const root = dockRoot(name);
			for (const document of [
				"DOCK.md",
				`files/.opendock/docks/${name}/README.md`,
				"files/AGENTS.md",
			]) {
				const content = readFileSync(join(root, document), "utf8");
				expect(content, `${name}: ${document} needs Korean guidance`).toMatch(
					/[가-힣]/,
				);
			}
			const logo = readFileSync(join(root, "logo.png"));
			const logoPayload = logo.toString("base64");
			expect(logoPayloads.has(logoPayload), `${name}: duplicate logo`).toBe(false);
			logoPayloads.add(logoPayload);
			expect(logo.subarray(0, 8)).toEqual(
				Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			);
			expect(logo.readUInt32BE(16)).toBe(256);
			expect(logo.readUInt32BE(20)).toBe(256);

			for (const platform of platforms) {
				const manifest = boundManifest(name, platform, testVersion);
				const destinations = new Set(manifest.files.map(({ to }) => to));
				validateManifestTaskCommands(manifest, platform);
				expect(manifest.id).toBe(`opendock/${name}`);
				expect(manifest.readme).toBe("DOCK.md");
				expect(manifest.logo).toBe("logo.png");
				expect(manifest.tags.length).toBeGreaterThan(0);
				expect(Object.keys(manifest.tools ?? {})).toEqual([]);
				expect(Object.keys(manifest.dependencies ?? {})).toEqual([]);
				expect(manifest.tasks.install).toEqual([]);
				expect(manifest.tasks.update).toEqual([]);
				expect(destinations.has(`.agents/skills/opendock-${name}/SKILL.md`)).toBe(true);
				expect([...destinations].some((destination) => destination.startsWith(".opendock/harness/"))).toBe(false);
				expect([...destinations].some((destination) => destination.endsWith("/HARNESS.md"))).toBe(false);
				expect([...destinations].some((destination) => /quality-gate/i.test(destination))).toBe(false);

				for (const mapping of manifest.files) {
					const source = join(root, mapping.from);
					expect(
						existsSync(source),
						`${name}/${platform}: ${mapping.from}`,
					).toBe(true);
					expect(
						lstatSync(source).isSymbolicLink(),
						`${name}/${platform}: ${mapping.from}`,
					).toBe(false);
					if (lstatSync(source).isFile() && /\.(?:md|mdc)$/i.test(source)) {
						const content = readFileSync(source, "utf8");
						expect(
							content,
							`${name}/${platform}: source contains managed markers`,
						).not.toContain("<!-- OPENDOCK:START");
						expect(
							content,
							`${name}/${platform}: source contains managed markers`,
						).not.toContain("<!-- OPENDOCK:END");
					}
					if (platform === "macos" && !sharedManagedFiles.has(mapping.to)) {
						const prior = isolatedDestinations.get(mapping.to);
						expect(
							prior,
							`${mapping.to} collides between ${prior} and ${name}`,
						).toBeUndefined();
						isolatedDestinations.set(mapping.to, name);
					}
				}
			}
		}
		expect(logoPayloads.size).toBe(collection.length);
	});

	test("모든 Dock을 빈 프로젝트와 기존 프로젝트에 설치하고 제거한다", async () => {
		for (const name of collection) {
			for (const platform of platforms) {
				const project = tempDir(`${name}-${platform}-`);
				write(project, "KEEP.md", "사용자 파일\n");
				const manifest = boundManifest(name, platform, testVersion);

				await install(name, platform, project, testVersion);

				const lock = new OpenDockStateStore(project).readLock();
				expect(lock.docks.map((dock) => dock.id)).toEqual([`opendock/${name}`]);
				for (const mapping of manifest.files) {
					expect(
						existsSync(join(project, mapping.to)),
						`${name}/${platform}: ${mapping.to}`,
					).toBe(true);
				}

				uninstall(name, project);
				for (const mapping of manifest.files) {
					expect(
						existsSync(join(project, mapping.to)),
						`${name}/${platform}: uninstall left ${mapping.to}`,
					).toBe(false);
				}
				expect(readFileSync(join(project, "KEEP.md"), "utf8")).toBe(
					"사용자 파일\n",
				);
				expect(new OpenDockStateStore(project).readLock().docks).toEqual([]);
			}
		}
	});

	test("21개 복합 설치, 중간 제거, 사용자 파일 보존, 전체 제거가 동작한다", async () => {
		const project = tempDir("collection-mixed-");
		write(project, "KEEP.md", "root user file\n");

		for (const name of collection) {
			await install(name, "macos", project, testVersion);
		}

		const store = new OpenDockStateStore(project);
		expect(store.readLock().docks).toHaveLength(collection.length);
		for (const rootDocument of ["AGENTS.md"]) {
			const content = readFileSync(join(project, rootDocument), "utf8");
			expect((content.match(/<!-- OPENDOCK:START/g) ?? []).length).toBe(
				collection.length,
			);
			expect((content.match(/<!-- OPENDOCK:END/g) ?? []).length).toBe(
				collection.length,
			);
			for (const name of collection) {
				expect(content).toContain(`dock=opendock/${name}`);
			}
		}

		uninstall("product-roast", project);
		expect(store.readLock().docks).toHaveLength(collection.length - 1);
		expect(
			existsSync(
				join(project, ".agents/skills/opendock-product-roast/SKILL.md"),
			),
		).toBe(false);
		expect(
			existsSync(
				join(project, ".agents/skills/opendock-pm-workspace/SKILL.md"),
			),
		).toBe(true);
		for (const rootDocument of ["AGENTS.md"]) {
			const content = readFileSync(join(project, rootDocument), "utf8");
			expect((content.match(/<!-- OPENDOCK:START/g) ?? []).length).toBe(
				collection.length - 1,
			);
			expect((content.match(/<!-- OPENDOCK:END/g) ?? []).length).toBe(
				collection.length - 1,
			);
			expect(content).not.toContain("dock=opendock/product-roast");
		}

		write(project, ".agents/skills/user-owned/KEEP.md", "사용자 소유\n");
		for (const name of collection.toReversed()) {
			if (name !== "product-roast") uninstall(name, project);
		}

		expect(store.readLock().docks).toEqual([]);
		expect(readFileSync(join(project, "KEEP.md"), "utf8")).toBe(
			"root user file\n",
		);
		expect(
			readFileSync(join(project, ".agents/skills/user-owned/KEEP.md"), "utf8"),
		).toBe("사용자 소유\n");
		for (const rootDocument of ["AGENTS.md"]) {
			expect(existsSync(join(project, rootDocument))).toBe(false);
		}
		expect(existsSync(join(project, "README.md"))).toBe(false);
		expect(existsSync(join(project, "HARNESS.md"))).toBe(false);
	});

	test("기존 사용자 파일 충돌은 어떤 Dock 파일도 쓰기 전에 중단한다", async () => {
		const project = tempDir("collection-conflict-");
		write(
			project,
			".agents/skills/opendock-ux-audit/SKILL.md",
			"사용자 소유 skill\n",
		);
		write(project, "KEEP.md", "보존\n");

		await expect(
			install("ux-audit", "macos", project, testVersion),
		).rejects.toThrow("target already exists and is not OpenDock-owned");

		expect(
			readFileSync(
				join(project, ".agents/skills/opendock-ux-audit/SKILL.md"),
				"utf8",
			),
		).toBe("사용자 소유 skill\n");
		expect(readFileSync(join(project, "KEEP.md"), "utf8")).toBe("보존\n");
		expect(existsSync(join(project, "AGENTS.md"))).toBe(false);
		expect(new OpenDockStateStore(project).readLock().docks).toEqual([]);
	});

	test("모든 Dock은 동일 payload의 버전 업데이트와 후속 제거를 처리한다", async () => {
		for (const name of collection) {
			for (const platform of platforms) {
				const project = tempDir(`${name}-${platform}-same-payload-update-`);
				await install(name, platform, project, "1.0.0");
				await install(name, platform, project, "1.0.1", { phase: "update" });

				const store = new OpenDockStateStore(project);
				expect(store.findDock(`opendock/${name}`)?.version).toBe("1.0.1");
				for (const mapping of boundManifest(name, platform, "1.0.1").files) {
					expect(existsSync(join(project, mapping.to))).toBe(true);
				}

				uninstall(name, project);
				expect(store.readLock().docks).toEqual([]);
			}
		}
	}, 30_000);

	test("합성 버전 업데이트가 파일 추가, 변경, 삭제와 사용자 수정 충돌을 처리한다", async () => {
		const v1Root = tempDir("ux-v1-");
		const v2Root = tempDir("ux-v2-");
		cpSync(dockRoot("ux-audit"), v1Root, { recursive: true });
		cpSync(dockRoot("ux-audit"), v2Root, { recursive: true });

		const playbookPath = join(
			v2Root,
			"files",
			".opendock",
			"docks",
			"ux-audit",
			"UX_AUDIT_PLAYBOOK.md",
		);
		writeFileSync(
			playbookPath,
			`${readFileSync(playbookPath, "utf8")}\n## Synthetic 0.1.1\n업데이트 검증 표식입니다.\n`,
		);
		writeFileSync(
			join(v2Root, "files", "UX_AUDIT_RELEASE_NOTE.md"),
			"# 0.1.1 변경 기록\n",
		);
		writeFileSync(join(v1Root, "files", "UX_AUDIT_LEGACY.md"), "# 제거될 파일\n");

		const v1Ref = DockRef.parse("opendock/ux-audit@0.1.0");
		const v2Ref = DockRef.parse("opendock/ux-audit@0.1.1");
		const v1Base = manifestForRef(
			parseManifestFile(join(v1Root, "dock.macos.yml")),
			v1Ref,
		);
		const v1Manifest: DockManifest = {
			...v1Base,
			files: [
				...v1Base.files,
				{
					from: "files/UX_AUDIT_LEGACY.md",
					to: ".opendock/docks/ux-audit/UX_AUDIT_LEGACY.md",
				},
			],
		};
		const v2Base = manifestForRef(
			parseManifestFile(join(v2Root, "dock.macos.yml")),
			v2Ref,
		);
		const v2Manifest: DockManifest = {
			...v2Base,
			files: [
				...v2Base.files,
				{
					from: "files/UX_AUDIT_RELEASE_NOTE.md",
					to: ".opendock/docks/ux-audit/UX_AUDIT_RELEASE_NOTE.md",
				},
			],
		};

		const cleanProject = tempDir("ux-update-clean-");
		await installResolved(
			v1Ref,
			"macos",
			cleanProject,
			resolved(v1Ref, "macos", v1Root, v1Manifest),
		);
		const report = await installResolved(
			v2Ref,
			"macos",
			cleanProject,
			resolved(v2Ref, "macos", v2Root, v2Manifest),
			{ phase: "update" },
		);

		expect(
			readFileSync(
				join(cleanProject, ".opendock/docks/ux-audit/UX_AUDIT_PLAYBOOK.md"),
				"utf8",
			),
		).toContain("Synthetic 0.1.1");
		expect(
			existsSync(
				join(cleanProject, ".opendock/docks/ux-audit/UX_AUDIT_RELEASE_NOTE.md"),
			),
		).toBe(true);
		expect(
			existsSync(join(cleanProject, ".opendock/docks/ux-audit/UX_AUDIT_LEGACY.md")),
		).toBe(false);
		expect(report.filesUpdated).toBeGreaterThan(0);
		expect(report.filesCreated).toBeGreaterThan(0);
		expect(report.filesDeleted).toBeGreaterThan(0);

		const conflictProject = tempDir("ux-update-conflict-");
		await installResolved(
			v1Ref,
			"macos",
			conflictProject,
			resolved(v1Ref, "macos", v1Root, v1Manifest),
		);
		const installedPlaybook = join(
			conflictProject,
			".opendock/docks/ux-audit/UX_AUDIT_PLAYBOOK.md",
		);
		writeFileSync(
			installedPlaybook,
			readFileSync(installedPlaybook, "utf8").replace(
				"<!-- OPENDOCK:END",
				"사용자가 관리 블록 안을 직접 수정했습니다.\n<!-- OPENDOCK:END",
			),
		);

		await expect(
			installResolved(
				v2Ref,
				"macos",
				conflictProject,
				resolved(v2Ref, "macos", v2Root, v2Manifest),
				{ phase: "update" },
			),
		).rejects.toThrow();

		await installResolved(
			v2Ref,
			"macos",
			conflictProject,
			resolved(v2Ref, "macos", v2Root, v2Manifest),
			{ force: true, phase: "update" },
		);
		expect(readFileSync(installedPlaybook, "utf8")).toContain(
			"Synthetic 0.1.1",
		);
	});

	test("macOS doctor와 제한된 Windows PowerShell doctor가 설치 결과를 확인한다", async () => {
		for (const platform of platforms) {
			const project = tempDir(`collection-doctor-${platform}-`);
			for (const name of collection) {
				await install(name, platform, project, testVersion, {
					runTasks: platform === "macos",
				});
			}

			if (platform === "windows") {
				const bin = tempDir("fake-powershell-");
				const fakePowershell = join(bin, "powershell");
				writeFileSync(
					fakePowershell,
					'#!/bin/sh\nargs="$*"\ncase "$args" in\n  *"Test-Path -LiteralPath "*)\n    target=${args#*Test-Path -LiteralPath }\n    target=${target%%)*}\n    test -f "$target"\n    ;;\n  *) exit 9 ;;\nesac\n',
				);
				chmodSync(fakePowershell, 0o755);
				for (const name of collection) {
					const manifest = boundManifest(name, platform, testVersion);
					for (const step of selectTaskSteps(manifest.tasks.doctor, platform)) {
						expect(step.check, `${name}/${platform}/${step.id}`).toBeDefined();
						const result = new CommandRunner().run(step.check ?? "", {
							cwd: project,
							live: false,
							missingAsFailure: true,
							pathEntries: [bin],
							permissionPrograms: ["powershell"],
							platform,
						});
						expect(
							result.success,
							`${name}/${platform}/${step.id}: ${result.stderr}`,
						).toBe(true);
					}
				}

				rmSync(join(project, ".opendock/docks/ux-audit/UX_AUDIT_PLAYBOOK.md"));
				const missingStep = selectTaskSteps(
					boundManifest("ux-audit", platform, testVersion).tasks.doctor,
					platform,
				).find((step) => step.id === "ux-audit-playbook");
				expect(missingStep?.check).toBeDefined();
				const missingResult = new CommandRunner().run(missingStep?.check ?? "", {
					cwd: project,
					live: false,
					missingAsFailure: true,
					pathEntries: [bin],
					permissionPrograms: ["powershell"],
					platform,
				});
				expect(missingResult.success).toBe(false);
				continue;
			}

			for (const name of collection) {
				const result = new TaskRunner().run(
					boundManifest(name, platform, testVersion),
					{
						dockId: `opendock/${name}`,
						live: false,
						phase: "doctor",
						platform,
						projectDir: project,
					},
				);
				expect(
					result.reports.filter((report) => report.status === "Failed"),
					`${name}/${platform}`,
				).toEqual([]);
			}
		}
	}, 30_000);
});

function dockRoot(name: (typeof collection)[number]): string {
	return join(docksRoot, name);
}

function manifestPath(
	name: (typeof collection)[number],
	platform: OpenDockPlatform,
): string {
	return join(dockRoot(name), `dock.${platform}.yml`);
}

function boundManifest(
	name: (typeof collection)[number],
	platform: OpenDockPlatform,
	version: string,
): DockManifest {
	return manifestForRef(
		parseManifestFile(manifestPath(name, platform)),
		DockRef.parse(`opendock/${name}@${version}`),
	);
}

function resolved(
	dockRef: DockRef,
	platform: OpenDockPlatform,
	root: string,
	manifest: DockManifest,
): ResolvedDock {
	return {
		checksum: `${dockRef.id()}-${platform}-${dockRef.requested()}-checksum`,
		manifest,
		platform,
		root,
		signature: "workspace-collection-test-signature",
		version: dockRef.requested(),
	};
}

async function install(
	name: (typeof collection)[number],
	platform: OpenDockPlatform,
	projectDir: string,
	version: string,
	options: {
		force?: boolean;
		phase?: "install" | "update";
		runTasks?: boolean;
	} = {},
): Promise<Awaited<ReturnType<DockInstaller["install"]>>> {
	const dockRef = DockRef.parse(`opendock/${name}@${version}`);
	return installResolved(
		dockRef,
		platform,
		projectDir,
		resolved(
			dockRef,
			platform,
			dockRoot(name),
			boundManifest(name, platform, version),
		),
		{
			force: options.force,
			phase: options.phase,
			runTasks: options.runTasks,
		},
	);
}

async function installResolved(
	dockRef: DockRef,
	platform: OpenDockPlatform,
	projectDir: string,
	release: ResolvedDock,
	options: {
		force?: boolean;
		phase?: "install" | "update";
		runTasks?: boolean;
	} = {},
): Promise<Awaited<ReturnType<DockInstaller["install"]>>> {
	return new DockInstaller().install({
		dockRef,
		force: options.force,
		phase: options.phase ?? "install",
		platform,
		projectDir,
		resolve: () => release,
		runTasks: options.runTasks ?? false,
	});
}

function uninstall(
	name: (typeof collection)[number],
	projectDir: string,
): void {
	new DockInstaller().uninstall({ dockId: `opendock/${name}`, projectDir });
}

function tempDir(prefix: string): string {
	const root = mkdtempSync(join(tmpdir(), `opendock-${prefix}`));
	tempRoots.push(root);
	return root;
}

function write(root: string, relativePath: string, content: string): void {
	const file = join(root, relativePath);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, content);
}
