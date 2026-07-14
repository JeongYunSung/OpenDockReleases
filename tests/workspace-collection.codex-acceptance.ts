import {
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DockInstaller } from "../../opendock/packages/cli/src/core/app/dock-installer.ts";
import {
	type DockManifest,
	DockRef,
	manifestForRef,
	parseManifestFile,
} from "../../opendock/packages/cli/src/core/domain/manifest.ts";
import { OpenDockStateStore } from "../../opendock/packages/cli/src/core/domain/state-store.ts";
import type { ResolvedDock } from "../../opendock/packages/cli/src/resolver.ts";
import {
	parseAcceptanceConcurrency,
	sanitizedChildEnvironment,
	selectAcceptanceCases,
} from "./workspace-collection.acceptance-config.ts";

type AcceptanceCase = {
	name: string;
	scenario: string;
	target: string;
};

type AcceptanceProgress = {
	project?: string;
	guidanceVerified: boolean;
	targetVerified: boolean;
	lockVerified: boolean;
	uninstallVerified: boolean;
};

type AcceptanceResult = AcceptanceProgress & {
	name: string;
	status: "passed" | "failed";
	durationMs: number;
	reason?: string;
};

const today = "2026-07-13";
const cases: AcceptanceCase[] = [
	{
		name: "ux-audit",
		target: "audits/ux/acceptance.md",
		scenario: `모바일 결제 화면을 감사한다. 관찰 근거: 390px 화면에서 주문 합계가 결제 버튼 아래로 밀리고, 쿠폰 오류는 색상만으로 표시되며, 로딩 중 버튼 label이 사라진다. 키보드 focus가 보이지 않고 결제 실패 후 재시도 경로가 없다. WCAG 참고 URL: https://www.w3.org/WAI/WCAG22/quickref/ (접근일 ${today}). 문제, 근거, 심각도, 개선 우선순위를 작성한다.`,
	},
	{
		name: "website-genome",
		target: "analysis/website-genome/acceptance.md",
		scenario: `가상 SaaS Atlas의 캡처 관찰을 구조화한다. 관찰일 ${today}, URL https://example.com/atlas. 1440px에서 12열 grid, Inter 계열, 8px spacing base, #176B5B accent, 6px radius, 180ms ease-out motion이다. 390px에서는 1열로 전환되고 CTA가 하단 고정된다. 추정과 직접 관찰을 분리하고 디자인 토큰, 컴포넌트, 반응형, 접근성, 기술 추정에 confidence를 붙인다.`,
	},
	{
		name: "design-system",
		target: "design-system/acceptance.md",
		scenario: `B2B 운영 도구 Atlas Console의 초기 디자인 시스템을 정의한다. 사용자 역할은 상담원과 관리자다. 밀도는 compact, primary #176B5B, surface #FFFFFF, canvas #F5F7F6, text #17201D, danger #B42318이다. 4px spacing base, radius 6px 하나, shadow language 하나를 사용한다. semantic token, typography, spacing, component states, WCAG AA 접근성, adoption/decision 항목을 작성한다.`,
	},
	{
		name: "portfolio-case-study",
		target: "portfolio/acceptance.md",
		scenario: `모바일 가입 흐름 개선 사례를 작성한다. 기존 7단계, 완료율 42%, 중도 이탈 38%였다. 12명 인터뷰에서 본인인증 목적 불명확과 오류 복구 부재가 반복됐다. 4단계 progressive disclosure와 복구 CTA를 적용한 2주 제한 실험에서 완료율 57%, 이탈 24%였다. 표본과 기간 한계를 명시하고 문제, 조사, 판단, 해결, 결과, 회고를 연결한다.`,
	},
	{
		name: "product-roast",
		target: "reviews/product-roast/acceptance.md",
		scenario: `Atlas Invoice 랜딩을 direct 모드로 리뷰한다. 첫 화면 headline은 '업무를 혁신하세요', CTA는 '시작', 가격은 세 번째 화면에만 있다. 5명 관찰 중 4명이 제품 대상을 설명하지 못했고 3명이 가격을 찾지 못했다. 모바일 CTA는 viewport 아래다. 모욕 없이 첫인상, 가치 제안, CTA, 신뢰, 가격, 온보딩, 모바일, 유지/변경을 근거와 심각도로 정리한다.`,
	},
	{
		name: "pm-workspace",
		target: "product/acceptance.md",
		scenario: `구독 결제 실패 복구 기능 PRD를 만든다. 월 1,200건 실패 중 46%가 7일 안에 자발 복구되고 나머지는 CS 문의로 이어진다. 목표는 복구율 60%, 관련 문의 20% 감소다. 비목표는 결제대행사 교체다. 사용자 story, acceptance criteria, edge case, metric, rollout, risk, decision log를 포함한다.`,
	},
	{
		name: "startup-validator",
		target: "validation/acceptance.md",
		scenario: `프리랜서 영수증 자동정리 아이디어를 검증한다. 8명 인터뷰 중 6명이 월말 분류에 2시간 이상 쓰고, 3명만 월 1만원 지불 의향을 보였다. 경쟁 대안은 스프레드시트와 세무 앱이다. 근거 수집일 ${today}; 참고 https://www.nts.go.kr/ (접근일 ${today}). 가장 위험한 가정, 임계값, 인터뷰 다음 단계, MVP 범위, 가격 가설, go/pivot/stop 기준을 작성한다.`,
	},
	{
		name: "error-investigator",
		target: "debug/acceptance.md",
		scenario: `로그인 요청이 간헐적으로 30초 timeout 되는 문제를 조사한다. 재현: 만료된 refresh token과 동시 요청 3개일 때 10회 중 8회. 합성 로그에서 refresh mutex 대기 후 재진입이 보인다. 실제 credential과 PII는 제공하지 않는다. 증상, 재현, 환경, 가설, 검증, root cause, 최소 수정, 회귀, rollback, privacy를 작성한다.`,
	},
	{
		name: "readme-doctor",
		target: "docs/readme-doctor/acceptance.md",
		scenario: `가상 CLI quickclip의 README를 진단한다. 현재 내용은 '# quickclip\nFast clipboard CLI.\nRun npm install.'뿐이다. 실제 명령은 'quickclip copy <file>'과 'quickclip paste', 요구 Node >=22, license MIT다. 설치, 5분 quick start, 명령 예시, troubleshooting, security, contribution, license 누락을 근거로 진단하고 개선안을 작성한다. 원본 README 자체는 수정하지 않는다.`,
	},
	{
		name: "ai-project-starter",
		target: ".ai/PROJECT.md",
		scenario: `내부 주문 조회 API의 AI 프로젝트 계약을 만든다. TypeScript, Node 22, PostgreSQL을 사용하며 범위는 read-only 주문 조회와 감사 로그다. 비범위는 결제와 고객정보 수정이다. 테스트는 unit, contract, auth smoke이며 secret/PII는 출력하지 않는다. 역할, context, 규칙, tool policy, workflow, decision, quality gate를 구성한다.`,
	},
	{
		name: "trip-planner",
		target: "trips/acceptance.md",
		scenario: `성인 2명의 교토 4박 여행을 계획한다. 총예산 160만원, 숙소는 교토역, 하루 걷기 12,000보 이하, 카페와 정원 중심이다. 09:30 시작, 구간 이동시간과 JPY/KRW 예산을 넣고 비 오는 날 대안을 둔다. 출처 https://www.japan.travel/en/ 및 https://www.westjr.co.jp/global/en/ (접근일 ${today}); 가격과 운영시간은 변동 가능하므로 재확인 안내를 둔다.`,
	},
	{
		name: "travel-research",
		target: "travel-research/acceptance.md",
		scenario: `리스본 6박 체류 지역을 Baixa, Alfama, Saldanha로 비교한다. 원격근무 2일, 야간 귀가, 언덕 회피가 조건이다. 사실/가정/추천을 분리하고 교통, 비용, 안전, 동네 trade-off를 작성한다. 출처 https://www.visitlisboa.com/ 및 https://www.metrolisboa.pt/en/ (접근일 ${today}); 현재 가격은 재확인 대상으로 표시한다.`,
	},
	{
		name: "group-trip",
		target: "group-trip/acceptance.md",
		scenario: `3명의 오사카 3박 여행을 조율한다. A는 카페와 숙소 품질, B는 저예산과 역사 명소, C는 채식 식사와 하루 8,000보 제한을 중시한다. 1인 예산 70만원이다. 공통 선호, 충돌, 양보 조건, veto, 공정한 일정, 비용 분담, 비상 계획을 작성한다. 당사자가 제공한 선호라는 근거를 명시한다.`,
	},
	{
		name: "packing-assistant",
		target: "packing/acceptance.md",
		scenario: `삿포로 겨울 5박, 스키 1일과 온천 1회를 위한 준비물이다. 영하권과 강설 가능성, 수하물 20kg 제한, 렌탈 가능한 스키 장비를 반영한다. 필수/선택/현지구매/렌탈을 나누고 수량과 출발 직전 checklist를 둔다. 출처 https://www.jma.go.jp/jma/indexe.html 및 https://www.visit-hokkaido.jp/en/ (접근일 ${today}); 출발 전 예보 재확인을 명시한다.`,
	},
	{
		name: "travel-journal",
		target: "travel-journal/acceptance.md",
		scenario: `교토 여행 기록을 만든다. ${today} 08:40 철학의 길 산책 사진(photo-001, 본인 촬영), 11:20 찻집 메모(note-001, 작성자 소유), 17:10 비 내린 기온 거리 사진(photo-002, 동행자 공유 허락 확인)이 있다. 관찰 사실과 감상을 분리하고 timeline, 장소, 사람, highlight, caption, final story, rights inventory를 작성한다. 없는 대화나 감정은 창작하지 않는다.`,
	},
	{
		name: "moving",
		target: "moving/acceptance.md",
		scenario: `서울 내 1인 이사를 ${today} 기준으로 30일 뒤 진행한다. 원룸에서 10평 오피스텔로 이동하며 엘리베이터 예약, 인터넷 이전, 주소 변경, 냉장고 정리, 귀중품 별도 운반이 필요하다. 업체 A 45만원, B 52만원 견적은 제공된 비교 근거이며 확정 전 재확인한다. D-30부터 D+3까지 일정, 예산, 책임자, 위험, 당일 checklist를 작성한다.`,
	},
	{
		name: "home-setup",
		target: "home-setup/acceptance.md",
		scenario: `10평 원룸을 재택근무 중심으로 세팅한다. 총예산 200만원, 책상 벽면 180cm, 침대 구역 220x240cm, 콘센트는 책상 쪽 2구다. 기존 보유는 27인치 모니터와 의자다. 방별 우선순위, 치수, 보유/필요 inventory, 전원·네트워크·안전, 구매 순서, 예산, 검증 checklist를 작성한다.`,
	},
	{
		name: "purchase-decision",
		target: "purchases/acceptance.md",
		scenario: `재택용 27인치 모니터를 비교한다. 필수: 4K, USB-C 65W 이상, 높이조절, 80만원 이하. 선호: KVM. 탈락: PWM flicker 확인 제품. 후보 A 69만원/90W/KVM, B 58만원/65W/KVM 없음, C 84만원이다. 가격 확인일 ${today}, 제조사 URL https://example.com/monitor-a 및 https://example.com/monitor-b. 요구, 후보, 총소유비용, deal breaker, 점수, 민감도, 결론과 재확인 항목을 작성한다.`,
	},
	{
		name: "life-admin",
		target: "life-admin/acceptance.md",
		scenario: `개인 행정 일정을 정리한다. 여권은 2027-02-10 만료, 보험 갱신은 2026-09-01, 노트북 보증은 2026-12-15, 월 구독은 12,900원과 5,500원 두 건이다. 실제 문서번호·계좌·연락처는 저장하지 않는다. 만료/갱신 timeline, 알림 시점, 책임자, 필요한 문서의 종류, 개인정보 최소화, 연간 checklist를 작성한다.`,
	},
	{
		name: "finance-review",
		target: "finance/acceptance.md",
		scenario: `2026년 6월 개인 지출을 검토한다. 수입 4,000,000원, 주거 1,200,000원, 식비 620,000원, 교통 180,000원, 구독 84,000원, 여가 430,000원, 저축 900,000원이다. 거래 원문이나 계좌번호는 포함하지 않는다. 계산 근거, 예산 대비, 반복 지출, 이상치, 다음 달 조정안, 불확실성, 검증식을 작성하며 투자 조언은 하지 않는다.`,
	},
	{
		name: "memory-book",
		target: "memories/acceptance.md",
		scenario: `가족 여름 기록을 정리한다. ${today} 오전 공원 피크닉 사진 family-001(가족 공유 허락), 오후 아이가 그린 그림 scan-001(보호자 보관 허락), 저녁 메모 note-001 '바람이 시원했다'(작성자 원문)가 있다. 사실, 직접 인용, 해석을 구분하고 timeline, people, places, highlights, captions, year-review 초안, rights note를 작성한다. 없는 기억은 만들지 않는다.`,
	},
];

if (process.env.RUN_CODEX_ACCEPTANCE !== "1") {
	throw new Error(
		"RUN_CODEX_ACCEPTANCE=1 is required. This acceptance gate never skips successfully.",
	);
}

const testDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(testDir, "..");
const docksRoot = join(repositoryRoot, "docks", "opendock");
const codexBin = process.env.CODEX_BIN ?? "codex";
const codexModel = process.env.CODEX_ACCEPTANCE_MODEL ?? "gpt-5.4";
const codexEffort = process.env.CODEX_ACCEPTANCE_EFFORT ?? "medium";
const concurrency = parseAcceptanceConcurrency(process.env.CODEX_ACCEPTANCE_CONCURRENCY);
const keepProjects = process.env.KEEP_CODEX_ACCEPTANCE === "1";
const selectedCases = selectAcceptanceCases(cases, process.env.CODEX_ACCEPTANCE_DOCKS);
const childEnvironment = sanitizedChildEnvironment(process.env);
const reportInput =
	process.env.CODEX_ACCEPTANCE_REPORT ??
	".opendock/reports/workspace-collection-codex-acceptance.json";
const reportPath = isAbsolute(reportInput)
	? reportInput
	: resolve(repositoryRoot, reportInput);
const startedAt = new Date();
const failures: string[] = [];
const projects: string[] = [];
const results: AcceptanceResult[] = [];
let cursor = 0;
let completed = 0;

await Promise.all(
	Array.from({ length: Math.min(concurrency, selectedCases.length) }, async () => {
		while (true) {
			const index = cursor++;
			if (index >= selectedCases.length) return;
			const acceptance = selectedCases[index];
			const started = Date.now();
			const progress: AcceptanceProgress = {
				guidanceVerified: false,
				targetVerified: false,
				lockVerified: false,
				uninstallVerified: false,
			};
			try {
				await runAcceptance(acceptance, progress);
				results.push({
					...progress,
					name: acceptance.name,
					status: "passed",
					durationMs: Date.now() - started,
				});
				console.log(`PASS ${acceptance.name}`);
			} catch (error) {
				const detail = error instanceof Error ? error.message : String(error);
				failures.push(`${acceptance.name}: ${detail}`);
				results.push({
					...progress,
					name: acceptance.name,
					status: "failed",
					durationMs: Date.now() - started,
					reason: reportReason(detail, progress.project),
				});
				console.error(`FAIL ${acceptance.name}: ${detail}`);
			} finally {
				completed++;
			}
		}
	}),
);

if (completed !== selectedCases.length) {
	failures.push(
		`Codex acceptance did not execute every selected case (${completed}/${selectedCases.length}).`,
	);
}

const order = new Map(selectedCases.map(({ name }, index) => [name, index]));
results.sort((left, right) => (order.get(left.name) ?? 0) - (order.get(right.name) ?? 0));
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(
	reportPath,
	`${JSON.stringify(
		{
			schema: "opendock/codex-acceptance/v1",
			startedAt: startedAt.toISOString(),
			finishedAt: new Date().toISOString(),
			platform: "macos",
			model: codexModel,
			effort: codexEffort,
			cliGit: gitState(join(repositoryRoot, "..", "opendock")),
			dockRepositoryGit: gitState(repositoryRoot),
			collectionSha256: collectionDigest(),
			selected: selectedCases.map(({ name }) => name),
			passed: results.filter(({ status }) => status === "passed").length,
			failed: results.filter(({ status }) => status === "failed").length,
			results: results.map(({ project: _project, ...result }) => result),
		},
		null,
		2,
	)}\n`,
);

if (failures.length === 0 && !keepProjects) {
	for (const project of projects) rmSync(project, { recursive: true, force: true });
} else if (failures.length > 0) {
	console.error(`Acceptance 실패 증적을 보존했습니다:\n${projects.join("\n")}`);
}

if (failures.length > 0) {
	throw new Error(
		`Codex acceptance failed (${failures.length}/${selectedCases.length}); report=${reportPath}\n${failures.join("\n")}`,
	);
}

console.log(
	`Codex acceptance passed: ${selectedCases.length}/${selectedCases.length}; report=${reportPath}`,
);

async function runAcceptance(
	acceptance: AcceptanceCase,
	progress: AcceptanceProgress,
): Promise<void> {
	const project = mkdtempSync(join(tmpdir(), `opendock-codex-${acceptance.name}-`));
	projects.push(project);
	progress.project = project;
	const root = join(docksRoot, acceptance.name);
	const dockRef = DockRef.parse(`opendock/${acceptance.name}@1.0.0`);
	const manifest = manifestForRef(
		parseManifestFile(join(root, "dock.macos.yml")),
		dockRef,
	);
	const release: ResolvedDock = {
		checksum: `codex-acceptance-${acceptance.name}`,
		manifest,
		platform: "macos",
		root,
		signature: "codex-acceptance-signature",
		version: "1.0.0",
	};

	await new DockInstaller().install({
		dockRef,
		phase: "install",
		platform: "macos",
		projectDir: project,
		resolve: () => release,
		runTasks: false,
	});
	const scenarioContent = `# Acceptance Scenario\n\n${acceptance.scenario}\n`;
	writeFileSync(join(project, "SCENARIO.md"), scenarioContent);

	const prompt = [
		`$opendock-${acceptance.name} 스킬을 사용해 SCENARIO.md의 요청을 실제로 수행하세요.`,
		`설치된 AGENTS.md, .agents/skills/opendock-${acceptance.name}/SKILL.md와 .opendock/docks/${acceptance.name}/ 아래 안내를 먼저 읽으세요.`,
		`주요 산출물 경로는 ${acceptance.target}입니다. 별도 run manifest나 검사 script를 만들거나 실행하지 마세요.`,
		"SCENARIO.md에 없는 현재 사실은 단정하지 말고 사실, 제공 근거, 가정, 추천을 구분하세요. TODO/TBD/placeholder, credential, PII 값은 남기지 마세요.",
		"외부 웹 검색, 브라우저, 앱, MCP는 사용하지 마세요. 이 acceptance에서는 SCENARIO.md와 설치된 Dock 파일만 사실 근거로 사용하고, 현재 확인이 필요한 정보는 재확인 항목으로 표시하세요.",
		"완료 전에 현재 산출물만 도메인 가이드와 비교해 누락과 근거 없는 단정을 자체 검토하세요.",
		"OpenDock이 설치한 managed 문서와 skill 자체는 수정하지 마세요.",
	].join("\n");

	const codex = Bun.spawn(
		[
			codexBin,
			"exec",
			"--ignore-user-config",
			"--ephemeral",
			"--disable",
			"apps",
			"--disable",
			"browser_use",
			"--disable",
			"browser_use_external",
			"--disable",
			"computer_use",
			"--disable",
			"in_app_browser",
			"--disable",
			"standalone_web_search",
			"--skip-git-repo-check",
			"--color",
			"never",
			"-m",
			codexModel,
			"-c",
			`model_reasoning_effort=\"${codexEffort}\"`,
			"-s",
			"workspace-write",
			"-C",
			project,
			prompt,
		],
		{ cwd: project, env: childEnvironment, stdout: "pipe", stderr: "pipe" },
	);
	let timedOut = false;
	let forceKillTimer: ReturnType<typeof setTimeout> | undefined;
	const timer = setTimeout(() => {
		timedOut = true;
		codex.kill();
		forceKillTimer = setTimeout(() => {
			try {
				codex.kill(9);
			} catch {
				// The process can exit between the graceful and forced termination attempts.
			}
		}, 5_000);
	}, 10 * 60 * 1000);
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(codex.stdout).text(),
		new Response(codex.stderr).text(),
		codex.exited,
	]);
	clearTimeout(timer);
	if (forceKillTimer) clearTimeout(forceKillTimer);
	writeFileSync(join(project, "codex-acceptance.log"), `${stdout}\n${stderr}`);
	if (timedOut) {
		throw new Error(`codex timed out after 10 minutes; project=${project}\n${tail(stderr || stdout)}`);
	}
	if (exitCode !== 0) throw new Error(`codex exit ${exitCode}; project=${project}\n${tail(stderr || stdout)}`);

	assertRegularFile(project, "AGENTS.md", "installed AGENTS guidance");
	assertRegularFile(project, `.agents/skills/opendock-${acceptance.name}/SKILL.md`, "installed skill");
	assertRegularFile(project, `.opendock/docks/${acceptance.name}/README.md`, "installed domain guide");
	progress.guidanceVerified = true;

	assertRegularFile(project, acceptance.target, "expected target");
	const output = readFileSync(join(project, acceptance.target), "utf8");
	if (output.trim().length < 100) {
		throw new Error(`expected target is too small to prove the scenario was completed; project=${project}`);
	}
	if (/\b(?:TODO|TBD|PLACEHOLDER)\b/i.test(output)) {
		throw new Error(`expected target still contains a placeholder; project=${project}`);
	}
	progress.targetVerified = true;
	if (!new OpenDockStateStore(project).findDock(`opendock/${acceptance.name}`)) {
		throw new Error(`installed lock record missing; project=${project}`);
	}
	progress.lockVerified = true;

	new DockInstaller().uninstall({ dockId: `opendock/${acceptance.name}`, projectDir: project });
	if (new OpenDockStateStore(project).findDock(`opendock/${acceptance.name}`)) {
		throw new Error(`uninstall lock record remained; project=${project}`);
	}
	for (const mapping of manifest.files) {
		if (existsSync(join(project, mapping.to))) {
			throw new Error(`managed file remained after uninstall: ${mapping.to}; project=${project}`);
		}
	}
	if (!existsSync(join(project, acceptance.target))) {
		throw new Error(`user output was removed by uninstall: ${acceptance.target}; project=${project}`);
	}
	if (readFileSync(join(project, "SCENARIO.md"), "utf8") !== scenarioContent) {
		throw new Error(`scenario file was unexpectedly modified; project=${project}`);
	}
	progress.uninstallVerified = true;
}

function assertRegularFile(project: string, relativePath: string, label: string): void {
	const full = join(project, relativePath);
	if (!existsSync(full)) {
		throw new Error(`${label} missing: ${relativePath}; project=${project}`);
	}
	const stat = lstatSync(full);
	if (stat.isSymbolicLink() || !stat.isFile()) {
		throw new Error(`${label} must be a regular non-symlink file: ${relativePath}; project=${project}`);
	}
}

function gitState(repository: string): {
	commit: string;
	dirty: boolean;
	statusSha256: string;
} {
	const revision = Bun.spawnSync(["git", "rev-parse", "HEAD"], {
		cwd: repository,
		env: childEnvironment,
		stdout: "pipe",
		stderr: "ignore",
	});
	const status = Bun.spawnSync(
		["git", "status", "--short", "--untracked-files=all"],
		{
			cwd: repository,
			env: childEnvironment,
			stdout: "pipe",
			stderr: "ignore",
		},
	);
	const statusText = status.exitCode === 0 ? status.stdout.toString() : "unavailable";
	return {
		commit: revision.exitCode === 0 ? revision.stdout.toString().trim() : "unknown",
		dirty: statusText.trim().length > 0,
		statusSha256: createHash("sha256").update(statusText).digest("hex"),
	};
}

function collectionDigest(): string {
	const hash = createHash("sha256");
	for (const { name } of cases) {
		hashDirectory(join(docksRoot, name), name, hash);
	}
	return hash.digest("hex");
}

function hashDirectory(
	directory: string,
	relativeDirectory: string,
	hash: ReturnType<typeof createHash>,
): void {
	for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
		left.name.localeCompare(right.name),
	)) {
		const full = join(directory, entry.name);
		const relative = `${relativeDirectory}/${entry.name}`;
		const stat = lstatSync(full);
		if (stat.isSymbolicLink()) {
			throw new Error(`collection digest refused symlink: ${relative}`);
		}
		if (stat.isDirectory()) {
			hashDirectory(full, relative, hash);
			continue;
		}
		if (!stat.isFile()) continue;
		hash.update(relative).update("\0").update(readFileSync(full)).update("\0");
	}
}

function reportReason(value: string, project: string | undefined): string {
	let firstLine = value.split(/\r?\n/, 1)[0].slice(0, 500);
	if (project) firstLine = firstLine.replaceAll(project, "<acceptance-project>");
	return firstLine;
}

function tail(value: string, lines = 40): string {
	return value.split(/\r?\n/).slice(-lines).join("\n");
}
