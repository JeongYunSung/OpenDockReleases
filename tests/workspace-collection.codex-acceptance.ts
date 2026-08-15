import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
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
  evidenceSha256?: string;
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

export type AcceptanceChildOptions = {
  cwd: string;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
  terminationGraceMs?: number;
  drainTimeoutMs?: number;
  cleanupTimeoutMs?: number;
  maxOutputBytes?: number;
  processScanTimeoutMs?: number;
  processScanMaxBytes?: number;
};

export type AcceptanceChildResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
};

type CodexJsonlItem = {
  id?: unknown;
  type?: unknown;
  text?: unknown;
  command?: unknown;
  changes?: unknown;
  status?: unknown;
  exit_code?: unknown;
  aggregated_output?: unknown;
};

type CodexJsonlEvent = {
  type?: unknown;
  item?: unknown;
};

export type ProductDesignerExpectedAcceptanceContext = {
  scenarioSha256: string;
  sessionId: string;
  sessionPath: string;
  accessAndData: string;
  humanApprover: string;
  requireStateChangingAction?: boolean;
  requireUnprovenOutcomeAcceptance?: boolean;
  unprovenOutcomeTokens?: string[];
  unprovenOutcomeMetric?: {
    value: number;
    unit: "percent" | "count" | "seconds" | "minutes";
    direction: "increase" | "decrease";
    subjectTokens: string[];
  };
  requireConfirmedTerminalSuccess?: boolean;
  requirePermissionRouteAssumption?: boolean;
  requireAccessibilityContract?: boolean;
  workflowSha256?: string;
  protocolSha256?: string;
  skillSha256?: string;
  validationNow?: string;
};

const productDesignerAcceptanceAccessAndData =
  "create/write; SCENARIO.md non-sensitive product-design metadata and text prototype";

const acceptanceRunMarkerKey = "OPENDOCK_CODEX_ACCEPTANCE_RUN_MARKER";
const acceptanceProcessScanIntervalMs = 25;
const defaultAcceptanceOutputLimitBytes = 8 * 1024 * 1024;
const defaultAcceptanceProcessScanLimitBytes = 8 * 1024 * 1024;
const defaultAcceptanceProcessScanTimeoutMs = 2_000;

const productDesignerFirstMessagePattern =
  /^작업 깊이: (Quick|Guided|Deep) \| 이유: (\S(?:.*\S)?) \| 예상 설계 결정 왕복: (\d+)회$/;
const productDesignerWriteReadinessMessage =
  "저장 준비: 초안 구성 및 자체 검토 완료 | 승인: AP-ACCEPT-001 | 다음 변경: 승인 경로 1회 생성";

const isMainModule = import.meta.main;
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
    name: "product-designer",
    target: ".opendock/runs/product-designer/acceptance/SESSION.md",
    scenario: `B2B 정산 운영자의 실패 거래 재처리 화면을 설계한다. primary user는 매일 실패 거래를 확인하고 재처리하는 운영자다. 목표는 건당 처리시간 30% 감소, 범위는 목록·상세·재시도, 비범위는 결제수단 변경이다. 데이터 상태는 pending/failed/retrying/succeeded, 재시도 권한은 supervisor만 갖는다. 390px과 1440px을 지원하고 WCAG AA를 따른다. 기존 기준은 spacing 4px, radius 6px 하나, primary #176B5B다. 방향은 상태 중심 inbox와 거래 중심 table을 의미 있게 비교하고 상태 중심 inbox를 선택한 것으로 진행한다. 외부 도구, 설치와 server 없이 specification, text prototype, validation과 중립 handoff를 작성하고 Product Designer 재검증 전 status는 complete로 표시하지 않는다.`,
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

if (isMainModule && process.env.RUN_CODEX_ACCEPTANCE !== "1") {
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
const concurrency = parseAcceptanceConcurrency(
  process.env.CODEX_ACCEPTANCE_CONCURRENCY,
);
const keepProjects = process.env.KEEP_CODEX_ACCEPTANCE === "1";
const selectedCases = selectAcceptanceCases(
  cases,
  process.env.CODEX_ACCEPTANCE_DOCKS,
);
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
const evidenceFiles = new Map<string, string>();
const evidenceDigests = new Map<string, string>();
const results: AcceptanceResult[] = [];
let cursor = 0;
let completed = 0;

export async function runAcceptanceChild(
  command: string[],
  options: AcceptanceChildOptions,
): Promise<AcceptanceChildResult> {
  if (process.platform !== "darwin") {
    throw new Error(
      "Codex acceptance process-tree confinement is implemented for Darwin only",
    );
  }
  if (command.length === 0 || command.some((token) => token.length === 0)) {
    throw new Error("Codex acceptance command must contain non-empty tokens");
  }
  const timeoutMs = positiveDuration(options.timeoutMs ?? 10 * 60 * 1000);
  const terminationGraceMs = positiveDuration(
    options.terminationGraceMs ?? 5_000,
  );
  const drainTimeoutMs = positiveDuration(options.drainTimeoutMs ?? 5_000);
  const cleanupTimeoutMs = positiveDuration(
    options.cleanupTimeoutMs ?? Math.max(5_000, terminationGraceMs * 4),
  );
  const maxOutputBytes = positiveDuration(
    options.maxOutputBytes ?? defaultAcceptanceOutputLimitBytes,
  );
  const processScanTimeoutMs = positiveDuration(
    options.processScanTimeoutMs ?? defaultAcceptanceProcessScanTimeoutMs,
  );
  const processScanMaxBytes = positiveDuration(
    options.processScanMaxBytes ?? defaultAcceptanceProcessScanLimitBytes,
  );
  const sourceEnvironment = options.env ?? process.env;
  if (
    Object.prototype.hasOwnProperty.call(
      sourceEnvironment,
      acceptanceRunMarkerKey,
    )
  ) {
    throw new Error(
      `Codex acceptance environment must not define reserved key ${acceptanceRunMarkerKey}`,
    );
  }
  // This marker closes cooperative Darwin detached-descendant leaks. It is
  // defense in depth, not a malicious-code sandbox: a child can deliberately
  // scrub the marker and detach stdio. Strong isolation belongs in an OS
  // sandbox/VM rather than this acceptance helper.
  const runMarker = randomBytes(32).toString("hex");
  const child = Bun.spawn(command, {
    cwd: options.cwd,
    env: { ...sourceEnvironment, [acceptanceRunMarkerKey]: runMarker },
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    detached: true,
  });
  if (
    !Number.isSafeInteger(child.pid) ||
    child.pid <= 1 ||
    child.pid === process.pid
  ) {
    try {
      child.kill("SIGKILL");
    } catch {
      // Invalid process identity is already fatal; termination is best effort.
    }
    throw new Error(
      `Codex acceptance received an unsafe process-group ID: ${child.pid}`,
    );
  }
  const stdoutCapture = captureAcceptanceStream(child.stdout, maxOutputBytes);
  const stderrCapture = captureAcceptanceStream(child.stderr, maxOutputBytes);
  const exitPromise = child.exited;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const outcome = await Promise.race([
    exitPromise.then((exitCode) => ({ kind: "exit" as const, exitCode })),
    new Promise<{ kind: "timeout" }>((resolveTimeout) => {
      timeoutHandle = setTimeout(
        () => resolveTimeout({ kind: "timeout" }),
        timeoutMs,
      );
    }),
  ]);
  if (timeoutHandle) clearTimeout(timeoutHandle);

  // The leader can exit while descendants retain stdout, workspace handles, or
  // delayed writes. Quiesce both its detached group and cooperative descendants
  // that created another session before inspecting files or settling stdio.
  const shutdownErrors: unknown[] = [];
  const cleanupDeadline = Date.now() + cleanupTimeoutMs;
  try {
    await terminatePosixProcessGroup(
      child.pid,
      terminationGraceMs,
      cleanupDeadline,
    );
  } catch (error) {
    shutdownErrors.push(error);
  }
  try {
    await terminateMarkedAcceptanceProcesses(
      runMarker,
      terminationGraceMs,
      cleanupDeadline,
      processScanTimeoutMs,
      processScanMaxBytes,
    );
  } catch (error) {
    shutdownErrors.push(error);
  }

  let exitCode: number | undefined;
  try {
    exitCode = await settleWithin(
      exitPromise,
      remainingCleanupTime(cleanupDeadline),
      "Codex acceptance leader did not exit after its descendants stopped",
    );
  } catch (error) {
    shutdownErrors.push(error);
  }

  let stdout = "";
  let stderr = "";
  try {
    const captures = await settleWithin(
      Promise.all([stdoutCapture.promise, stderrCapture.promise]),
      boundedCleanupPhase(drainTimeoutMs, cleanupDeadline),
      "Codex acceptance stdio remained open after its descendants stopped",
    );
    stdout = captures[0].output;
    stderr = captures[1].output;
    if (captures[0].exceeded || captures[1].exceeded) {
      shutdownErrors.push(
        new Error(
          `Codex acceptance output exceeded the ${maxOutputBytes}-byte per-stream limit`,
        ),
      );
    }
  } catch (error) {
    shutdownErrors.push(error);
    await Promise.race([
      Promise.allSettled([stdoutCapture.cancel(), stderrCapture.cancel()]),
      Bun.sleep(Math.min(100, drainTimeoutMs)),
    ]);
  }

  if (shutdownErrors.length === 1) throw shutdownErrors[0];
  if (shutdownErrors.length > 1) {
    throw new AggregateError(
      shutdownErrors,
      "Codex acceptance child cleanup failed",
    );
  }
  if (exitCode === undefined) {
    throw new Error("Codex acceptance child cleanup lost the leader exit code");
  }
  return {
    stdout: stdout.replaceAll(runMarker, "<redacted-acceptance-run-marker>"),
    stderr: stderr.replaceAll(runMarker, "<redacted-acceptance-run-marker>"),
    exitCode: outcome.kind === "exit" ? outcome.exitCode : exitCode,
    timedOut: outcome.kind === "timeout",
  };
}

type AcceptanceStreamCapture = {
  promise: Promise<{ output: string; exceeded: boolean }>;
  cancel: () => Promise<void>;
};

function captureAcceptanceStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): AcceptanceStreamCapture {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let settled = false;
  const promise = (async () => {
    let output = "";
    let capturedBytes = 0;
    let exceeded = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!exceeded && capturedBytes + value.byteLength <= maxBytes) {
          capturedBytes += value.byteLength;
          output += decoder.decode(value, { stream: true });
        } else {
          exceeded = true;
        }
      }
      if (!exceeded) output += decoder.decode();
      return { output, exceeded };
    } finally {
      settled = true;
      reader.releaseLock();
    }
  })();
  return {
    promise,
    cancel: async () => {
      if (settled) return;
      try {
        await reader.cancel(
          "Codex acceptance stopped draining an escaped descendant",
        );
      } catch {
        // A concurrently closed stream is already quiescent.
      }
    },
  };
}

function positiveDuration(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(
      `Codex acceptance duration must be a positive integer: ${value}`,
    );
  }
  return value;
}

function remainingCleanupTime(deadline: number): number {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new Error("Codex acceptance cleanup exceeded its overall time limit");
  }
  return remaining;
}

function boundedCleanupPhase(requestedMs: number, deadline: number): number {
  return Math.min(requestedMs, remainingCleanupTime(deadline));
}

async function terminatePosixProcessGroup(
  processGroupId: number,
  graceMs: number,
  cleanupDeadline: number,
): Promise<void> {
  signalPosixProcessGroup(processGroupId, "SIGTERM");
  const termBudget = Math.min(
    graceMs,
    Math.max(1, Math.floor(remainingCleanupTime(cleanupDeadline) / 2)),
  );
  if (await waitForPosixProcessGroupExit(processGroupId, termBudget)) {
    return;
  }
  signalPosixProcessGroup(processGroupId, "SIGKILL");
  if (
    !(await waitForPosixProcessGroupExit(
      processGroupId,
      boundedCleanupPhase(Math.max(graceMs, 1_000), cleanupDeadline),
    ))
  ) {
    throw new Error(
      `Codex acceptance process group ${processGroupId} survived SIGKILL`,
    );
  }
}

async function terminateMarkedAcceptanceProcesses(
  marker: string,
  graceMs: number,
  cleanupDeadline: number,
  scanTimeoutMs: number,
  scanMaxBytes: number,
): Promise<void> {
  const termBudget = Math.min(
    graceMs,
    Math.max(1, Math.floor(remainingCleanupTime(cleanupDeadline) / 2)),
  );
  if (
    await drainMarkedAcceptanceProcesses(
      marker,
      "SIGTERM",
      termBudget,
      cleanupDeadline,
      scanTimeoutMs,
      scanMaxBytes,
    )
  ) {
    return;
  }
  if (
    await drainMarkedAcceptanceProcesses(
      marker,
      "SIGKILL",
      boundedCleanupPhase(Math.max(graceMs, 1_000), cleanupDeadline),
      cleanupDeadline,
      scanTimeoutMs,
      scanMaxBytes,
    )
  ) {
    return;
  }
  throw new Error(
    "Codex acceptance marked descendants survived SIGKILL or could not be verified",
  );
}

async function drainMarkedAcceptanceProcesses(
  marker: string,
  signal: NodeJS.Signals,
  timeoutMs: number,
  cleanupDeadline: number,
  scanTimeoutMs: number,
  scanMaxBytes: number,
): Promise<boolean> {
  const deadline = Math.min(Date.now() + timeoutMs, cleanupDeadline);
  let stableEmptyScans = 0;
  while (true) {
    const markedPids = await scanMarkedAcceptanceProcesses(
      marker,
      Math.min(scanTimeoutMs, remainingCleanupTime(cleanupDeadline)),
      scanMaxBytes,
    );
    if (markedPids.length === 0) {
      stableEmptyScans++;
      if (stableEmptyScans === 2) return true;
    } else {
      stableEmptyScans = 0;
      for (const pid of markedPids) {
        // Re-scan immediately before signaling to reduce the PID-reuse window.
        // Darwin does not provide pidfd; OS isolation owns the stronger bound.
        if (
          !(
            await scanMarkedAcceptanceProcesses(
              marker,
              Math.min(scanTimeoutMs, remainingCleanupTime(cleanupDeadline)),
              scanMaxBytes,
            )
          ).includes(pid)
        ) {
          continue;
        }
        try {
          process.kill(pid, signal);
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== "ESRCH") throw error;
        }
      }
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) return false;
    await Bun.sleep(Math.min(acceptanceProcessScanIntervalMs, remaining));
  }
}

async function scanMarkedAcceptanceProcesses(
  marker: string,
  timeoutMs: number,
  maxBytes: number,
): Promise<number[]> {
  const currentUid = process.geteuid?.();
  if (!Number.isSafeInteger(currentUid) || currentUid === undefined) {
    throw new Error(
      "Codex acceptance could not establish its effective user ID",
    );
  }
  const scan = Bun.spawn(["/bin/ps", "eww", "-axo", "pid=,uid=,command="], {
    cwd: "/",
    env: { LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin" },
    stdin: "ignore",
    stdout: "pipe",
    stderr: "ignore",
  });
  const capture = captureAcceptanceStream(scan.stdout, maxBytes);
  let scanResult: [number, { output: string; exceeded: boolean }];
  try {
    scanResult = await settleWithin(
      Promise.all([scan.exited, capture.promise]),
      timeoutMs,
      "Codex acceptance process scan exceeded its time limit",
    );
  } catch (error) {
    try {
      scan.kill("SIGKILL");
    } catch {
      // A scanner that already exited is already quiescent.
    }
    await Promise.race([
      Promise.allSettled([capture.cancel()]),
      Bun.sleep(Math.min(100, timeoutMs)),
    ]);
    throw error;
  }
  const [exitCode, captured] = scanResult;
  if (exitCode !== 0) {
    throw new Error(
      `Codex acceptance process scan failed with exit code ${exitCode}`,
    );
  }
  if (captured.exceeded) {
    throw new Error(
      `Codex acceptance process scan exceeded the ${maxBytes}-byte output limit`,
    );
  }

  const assignment = `${acceptanceRunMarkerKey}=${marker}`;
  const pids = new Set<number>();
  for (const line of captured.output.split(/\r?\n/)) {
    if (!containsExactProcessEnvironmentAssignment(line, assignment)) continue;
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+/);
    if (!match) {
      throw new Error(
        "Codex acceptance found a marked process with an unreadable identity",
      );
    }
    const pid = Number(match[1]);
    const uid = Number(match[2]);
    if (
      !Number.isSafeInteger(pid) ||
      pid <= 1 ||
      pid === process.pid ||
      !Number.isSafeInteger(uid) ||
      uid !== currentUid
    ) {
      throw new Error(
        "Codex acceptance found a marked process with an unsafe identity",
      );
    }
    pids.add(pid);
  }
  return [...pids].sort((left, right) => left - right);
}

function containsExactProcessEnvironmentAssignment(
  line: string,
  assignment: string,
): boolean {
  let offset = 0;
  while (true) {
    const index = line.indexOf(assignment, offset);
    if (index < 0) return false;
    const before = index === 0 ? " " : line[index - 1];
    const afterIndex = index + assignment.length;
    const after = afterIndex === line.length ? " " : line[afterIndex];
    if (/\s/.test(before) && /\s/.test(after)) return true;
    offset = index + 1;
  }
}

function signalPosixProcessGroup(
  processGroupId: number,
  signal: NodeJS.Signals,
): void {
  try {
    process.kill(-processGroupId, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}

async function waitForPosixProcessGroupExit(
  processGroupId: number,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (posixProcessGroupExists(processGroupId)) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return false;
    await Bun.sleep(Math.min(25, remaining));
  }
  return true;
}

function posixProcessGroupExists(processGroupId: number): boolean {
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ESRCH") return false;
    if (code === "EPERM") return true;
    throw error;
  }
}

async function settleWithin<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export function assertProductDesignerCodexExecutionContract(
  stdout: string,
  project: string,
  target: string,
  sessionOutput: string,
): void {
  const events = parseCodexJsonl(stdout, project);
  const normalizedTarget = safeRelativeSegments(
    target,
    "product-designer execution target",
    project,
  ).join("/");
  const absoluteTarget = resolve(project, ...normalizedTarget.split("/"));

  let firstAgentMessage:
    | { eventIndex: number; item: CodexJsonlItem; mode: string }
    | undefined;
  let firstFileChangeEventIndex: number | undefined;
  const writeReadinessEvents: number[] = [];
  const itemTypeById = new Map<string, string>();
  const uniqueCompletedItemIds = new Set<string>();
  const commands = new Map<
    string,
    { command: string; started: boolean; completed: number }
  >();
  const fileChanges = new Map<
    string,
    { signature: string; started: boolean; completed: number }
  >();
  const completedFileChangeOccurrences: Array<{
    eventIndex: number;
    itemId: string;
    signature: string;
  }> = [];
  let threadStartedEventIndex: number | undefined;
  let turnStartedEventIndex: number | undefined;
  let turnCompletedEventIndex: number | undefined;
  const completedAgentMessageIndexes: number[] = [];

  for (const [eventIndex, event] of events.entries()) {
    if (event.type === "thread.started") {
      assertCodexLifecycleEventShape(event, eventIndex, project);
      if (
        threadStartedEventIndex !== undefined ||
        turnStartedEventIndex !== undefined ||
        turnCompletedEventIndex !== undefined
      ) {
        throw new Error(
          `product-designer Codex JSONL has an invalid thread.started order; project=${project}`,
        );
      }
      const threadId = (event as { thread_id?: unknown }).thread_id;
      if (typeof threadId !== "string" || threadId.trim().length === 0) {
        throw new Error(
          `product-designer Codex thread.started lacks a thread id; project=${project}`,
        );
      }
      threadStartedEventIndex = eventIndex;
      continue;
    }
    if (event.type === "turn.started") {
      assertCodexLifecycleEventShape(event, eventIndex, project);
      if (
        threadStartedEventIndex === undefined ||
        turnStartedEventIndex !== undefined ||
        turnCompletedEventIndex !== undefined
      ) {
        throw new Error(
          `product-designer Codex JSONL has an invalid turn.started order; project=${project}`,
        );
      }
      turnStartedEventIndex = eventIndex;
      continue;
    }
    if (event.type === "turn.completed") {
      assertCodexLifecycleEventShape(event, eventIndex, project);
      if (turnCompletedEventIndex !== undefined) {
        throw new Error(
          `product-designer Codex JSONL contains duplicate turn.completed events; project=${project}`,
        );
      }
      if (turnStartedEventIndex === undefined) {
        throw new Error(
          `product-designer Codex JSONL completed a turn that never started; project=${project}`,
        );
      }
      turnCompletedEventIndex = eventIndex;
      continue;
    }
    if (event.type !== "item.started" && event.type !== "item.completed") {
      throw new Error(
        `product-designer Codex JSONL event ${eventIndex + 1} has an unknown event type; project=${project}`,
      );
    }
    if (turnCompletedEventIndex !== undefined) {
      throw new Error(
        `product-designer Codex JSONL contains an item after turn.completed; project=${project}`,
      );
    }
    if (turnStartedEventIndex === undefined) {
      throw new Error(
        `product-designer Codex JSONL item precedes thread/turn startup; project=${project}`,
      );
    }
    const item = codexJsonlItem(event, eventIndex, project);
    const itemType = String(item.type ?? "");
    if (
      itemType !== "agent_message" &&
      itemType !== "reasoning" &&
      itemType !== "command_execution" &&
      itemType !== "file_change"
    ) {
      throw new Error(
        `product-designer Codex JSONL event ${eventIndex + 1} has an unknown item type; project=${project}`,
      );
    }
    const itemId = codexJsonlItemId(item, eventIndex, project);
    const priorType = itemTypeById.get(itemId);
    if (priorType !== undefined && priorType !== itemType) {
      throw new Error(
        `product-designer Codex JSONL reuses item id ${itemId} across ${priorType} and ${itemType}; project=${project}`,
      );
    }
    itemTypeById.set(itemId, itemType);

    if (itemType === "agent_message" || itemType === "reasoning") {
      if (event.type !== "item.completed") {
        throw new Error(
          `product-designer Codex ${itemType} must be a completed item; project=${project}`,
        );
      }
      if (uniqueCompletedItemIds.has(itemId)) {
        throw new Error(
          `product-designer Codex JSONL duplicates ${itemType} item id ${itemId}; project=${project}`,
        );
      }
      uniqueCompletedItemIds.add(itemId);
      if (itemType === "agent_message") {
        if (typeof item.text !== "string" || item.text.trim().length === 0) {
          throw new Error(
            `product-designer Codex agent_message ${itemId} lacks nonempty text; project=${project}`,
          );
        }
        completedAgentMessageIndexes.push(eventIndex);
      }
    }
    if (
      event.type === "item.completed" &&
      itemType === "agent_message" &&
      !firstAgentMessage
    ) {
      const mode = assertProductDesignerFirstAgentMessage(item, project);
      firstAgentMessage = { eventIndex, item, mode };
    }
    if (
      event.type === "item.completed" &&
      itemType === "agent_message" &&
      typeof item.text === "string" &&
      item.text.trim() === productDesignerWriteReadinessMessage
    ) {
      writeReadinessEvents.push(eventIndex);
    }
    if (itemType === "agent_message" || itemType === "reasoning") {
      continue;
    }

    if (!firstAgentMessage) {
      throw new Error(
        `product-designer Codex used ${itemType} before declaring its mode; project=${project}`,
      );
    }

    if (itemType === "command_execution") {
      if (writeReadinessEvents.length > 0) {
        throw new Error(
          `product-designer Codex ran command_execution after write readiness; project=${project}`,
        );
      }
      const command = codexJsonlCommand(item, eventIndex, project);
      const previous = commands.get(itemId);
      if (previous !== undefined && previous.command !== command) {
        throw new Error(
          `product-designer Codex JSONL changed command_execution ${itemId} between events; project=${project}`,
        );
      }
      const lifecycle = previous ?? {
        command,
        started: false,
        completed: 0,
      };
      if (event.type === "item.started") {
        if (item.status !== "in_progress" || lifecycle.started) {
          throw new Error(
            `product-designer command_execution ${itemId} has an invalid started lifecycle; project=${project}`,
          );
        }
        lifecycle.started = true;
      } else {
        const expectedNoMatch = isExpectedRipgrepNoMatch(
          item,
          command,
          project,
        );
        if (
          (item.status !== "completed" && !expectedNoMatch) ||
          !lifecycle.started ||
          lifecycle.completed > 0 ||
          (item.exit_code !== 0 && !expectedNoMatch)
        ) {
          throw new Error(
            `product-designer command_execution ${itemId} has an invalid or unsuccessful completed lifecycle; project=${project}`,
          );
        }
        lifecycle.completed += 1;
      }
      commands.set(itemId, lifecycle);
      const readOnlyFailure = productDesignerReadOnlyCommandFailure(
        command,
        project,
      );
      if (readOnlyFailure) {
        throw new Error(
          `product-designer Codex used a command outside the cooperative read-only allowlist (${readOnlyFailure}); project=${project}`,
        );
      }
      continue;
    }

    firstFileChangeEventIndex ??= eventIndex;
    const signature = codexJsonlFileChangeSignature(
      item,
      eventIndex,
      project,
      absoluteTarget,
      normalizedTarget,
    );
    const previous = fileChanges.get(itemId);
    if (previous !== undefined && previous.signature !== signature) {
      throw new Error(
        `product-designer Codex JSONL changed file_change ${itemId} between events; project=${project}`,
      );
    }
    const lifecycle = previous ?? {
      signature,
      started: false,
      completed: 0,
    };
    if (event.type === "item.started") {
      if (item.status !== "in_progress" || lifecycle.started) {
        throw new Error(
          `product-designer file_change ${itemId} has an invalid started lifecycle; project=${project}`,
        );
      }
      lifecycle.started = true;
    } else {
      if (
        item.status !== "completed" ||
        !lifecycle.started ||
        lifecycle.completed > 0
      ) {
        throw new Error(
          `product-designer file_change ${itemId} has an invalid completed lifecycle; project=${project}`,
        );
      }
      lifecycle.completed += 1;
      completedFileChangeOccurrences.push({ eventIndex, itemId, signature });
    }
    fileChanges.set(itemId, lifecycle);
  }

  if (!firstAgentMessage) {
    throw new Error(
      `product-designer Codex JSONL lacks a completed first agent message; project=${project}`,
    );
  }
  if (
    threadStartedEventIndex === undefined ||
    turnStartedEventIndex === undefined ||
    turnCompletedEventIndex === undefined
  ) {
    throw new Error(
      `product-designer Codex JSONL must contain one ordered thread and turn lifecycle; project=${project}`,
    );
  }
  assertProductDesignerSessionMode(
    sessionOutput,
    firstAgentMessage.mode,
    project,
  );

  for (const [itemId, lifecycle] of commands) {
    if (!lifecycle.started || lifecycle.completed !== 1) {
      throw new Error(
        `product-designer command_execution ${itemId} must have exactly one started and one completed event; project=${project}`,
      );
    }
  }

  if (writeReadinessEvents.length !== 1) {
    throw new Error(
      `product-designer Codex must emit the exact write-readiness message once (observed=${writeReadinessEvents.length}); project=${project}`,
    );
  }
  const readinessEventIndex = writeReadinessEvents[0];
  if (
    readinessEventIndex <= firstAgentMessage.eventIndex ||
    firstFileChangeEventIndex === undefined ||
    readinessEventIndex >= firstFileChangeEventIndex
  ) {
    throw new Error(
      `product-designer write readiness must follow the mode declaration and precede every file_change; project=${project}`,
    );
  }
  const nextActionable = nextCodexActionableEvent(
    events,
    readinessEventIndex + 1,
    project,
  );
  if (
    !nextActionable ||
    nextActionable.item.type !== "file_change" ||
    nextActionable.eventIndex !== firstFileChangeEventIndex
  ) {
    throw new Error(
      `product-designer write readiness must be followed immediately by its sole file_change; project=${project}`,
    );
  }

  if (fileChanges.size !== 1) {
    throw new Error(
      `product-designer Codex must perform exactly one file_change (observed unique=${fileChanges.size}); project=${project}`,
    );
  }
  const completedEntry = fileChanges.entries().next().value;
  if (!completedEntry) {
    throw new Error(
      `product-designer Codex lacks a file_change lifecycle; project=${project}`,
    );
  }
  const [completedId, completedLifecycle] = completedEntry;
  if (!completedLifecycle.started || completedLifecycle.completed !== 1) {
    throw new Error(
      `product-designer file_change ${completedId} must have exactly one started and one completed event; project=${project}`,
    );
  }
  if (
    turnCompletedEventIndex !== undefined &&
    turnCompletedEventIndex <= completedFileChangeOccurrences[0].eventIndex
  ) {
    throw new Error(
      `product-designer turn.completed must follow the completed file_change; project=${project}`,
    );
  }
  if (
    !completedAgentMessageIndexes.some(
      (eventIndex) =>
        eventIndex > completedFileChangeOccurrences[0].eventIndex &&
        eventIndex < turnCompletedEventIndex,
    )
  ) {
    throw new Error(
      `product-designer Codex must report a final agent message after its file_change and before turn.completed; project=${project}`,
    );
  }
  assertProductDesignerAtomicWriteSequence(
    events,
    readinessEventIndex,
    completedFileChangeOccurrences,
    project,
  );
}

function assertCodexLifecycleEventShape(
  event: CodexJsonlEvent,
  eventIndex: number,
  project: string,
): void {
  if (event.item !== undefined) {
    throw new Error(
      `product-designer Codex lifecycle event ${eventIndex + 1} must not contain an item; project=${project}`,
    );
  }
}

function assertProductDesignerAtomicWriteSequence(
  events: readonly CodexJsonlEvent[],
  readinessEventIndex: number,
  completedOccurrences: readonly {
    eventIndex: number;
    itemId: string;
    signature: string;
  }[],
  project: string,
): void {
  const firstCompletion = completedOccurrences[0];
  if (!firstCompletion) {
    throw new Error(
      `product-designer Codex lacks a completed file_change; project=${project}`,
    );
  }
  for (
    let eventIndex = readinessEventIndex + 1;
    eventIndex < events.length;
    eventIndex++
  ) {
    const event = events[eventIndex];
    if (event.type !== "item.started" && event.type !== "item.completed") {
      continue;
    }
    const item = codexJsonlItem(event, eventIndex, project);
    if (eventIndex <= firstCompletion.eventIndex) {
      if (item.type !== "file_change" || item.id !== firstCompletion.itemId) {
        throw new Error(
          `product-designer write readiness must lead directly through one file_change to completion; project=${project}`,
        );
      }
      continue;
    }
    if (item.type === "agent_message") continue;
    if (
      event.type === "item.completed" &&
      item.type === "file_change" &&
      item.id === firstCompletion.itemId
    ) {
      const duplicate = completedOccurrences.find(
        (occurrence) => occurrence.eventIndex === eventIndex,
      );
      if (duplicate?.signature === firstCompletion.signature) continue;
    }
    if (item.type === "command_execution" || item.type === "file_change") {
      throw new Error(
        `product-designer Codex used a tool after its completed file_change; project=${project}`,
      );
    }
  }
}

function parseCodexJsonl(stdout: string, project: string): CodexJsonlEvent[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    throw new Error(
      `product-designer Codex JSONL output is empty; project=${project}`,
    );
  }
  return lines.map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(
        `product-designer Codex JSONL line ${index + 1} is not valid JSON; project=${project}`,
      );
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error(
        `product-designer Codex JSONL line ${index + 1} is not an event object; project=${project}`,
      );
    }
    const event = parsed as CodexJsonlEvent;
    if (typeof event.type !== "string" || event.type.trim().length === 0) {
      throw new Error(
        `product-designer Codex JSONL line ${index + 1} lacks an event type; project=${project}`,
      );
    }
    return event;
  });
}

function codexJsonlItem(
  event: CodexJsonlEvent,
  eventIndex: number,
  project: string,
): CodexJsonlItem {
  if (
    !event.item ||
    Array.isArray(event.item) ||
    typeof event.item !== "object"
  ) {
    throw new Error(
      `product-designer Codex JSONL event ${eventIndex + 1} lacks an item object; project=${project}`,
    );
  }
  return event.item as CodexJsonlItem;
}

function codexJsonlItemId(
  item: CodexJsonlItem,
  eventIndex: number,
  project: string,
): string {
  if (typeof item.id !== "string" || item.id.trim().length === 0) {
    throw new Error(
      `product-designer Codex JSONL actionable event ${eventIndex + 1} lacks an item id; project=${project}`,
    );
  }
  return item.id;
}

function codexJsonlCommand(
  item: CodexJsonlItem,
  eventIndex: number,
  project: string,
): string {
  const command = typeof item.command === "string" ? item.command : undefined;
  if (!command?.trim()) {
    throw new Error(
      `product-designer command_execution event ${eventIndex + 1} lacks a readable command; project=${project}`,
    );
  }
  return command.trim();
}

function codexJsonlFileChangeSignature(
  item: CodexJsonlItem,
  eventIndex: number,
  project: string,
  absoluteTarget: string,
  normalizedTarget: string,
): string {
  if (!Array.isArray(item.changes) || item.changes.length !== 1) {
    throw new Error(
      `product-designer file_change event ${eventIndex + 1} must contain exactly one change; project=${project}`,
    );
  }
  const normalizedChanges = item.changes.map((change, changeIndex) => {
    if (!change || Array.isArray(change) || typeof change !== "object") {
      throw new Error(
        `product-designer file_change event ${eventIndex + 1} has an invalid change ${changeIndex + 1}; project=${project}`,
      );
    }
    const changePath = (change as { path?: unknown }).path;
    const changeKind = (change as { kind?: unknown }).kind;
    if (typeof changePath !== "string" || changePath.trim().length === 0) {
      throw new Error(
        `product-designer file_change event ${eventIndex + 1} has a change without a path; project=${project}`,
      );
    }
    if (changeKind !== "add") {
      throw new Error(
        `product-designer file_change event ${eventIndex + 1} must add the new target; project=${project}`,
      );
    }
    const resolvedPath = isAbsolute(changePath)
      ? resolve(changePath)
      : resolve(project, changePath);
    if (resolvedPath !== absoluteTarget) {
      throw new Error(
        `product-designer file_change event ${eventIndex + 1} touched a path outside ${normalizedTarget}; project=${project}`,
      );
    }
    return { path: resolvedPath, kind: "add" };
  });
  return JSON.stringify(normalizedChanges);
}

function assertProductDesignerFirstAgentMessage(
  item: CodexJsonlItem,
  project: string,
): string {
  if (typeof item.text !== "string") {
    throw new Error(
      `product-designer first agent message lacks text; project=${project}`,
    );
  }
  const firstLine = item.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  const match = firstLine?.match(productDesignerFirstMessagePattern);
  if (!match) {
    throw new Error(
      `product-designer first agent message must use the exact mode/reason/expected-turns format; project=${project}`,
    );
  }
  const reason = match[2].trim();
  const expectedTurns = Number(match[3]);
  if (
    /^(?:\.\.\.|tbd|todo|placeholder)$/i.test(reason) ||
    !Number.isSafeInteger(expectedTurns) ||
    expectedTurns < 0
  ) {
    throw new Error(
      `product-designer first agent message has an invalid reason or expected-turn range; project=${project}`,
    );
  }
  const mode = match[1];
  const modeHasValidEstimate =
    (mode === "Quick" && expectedTurns >= 0 && expectedTurns <= 2) ||
    (mode === "Guided" && expectedTurns >= 3 && expectedTurns <= 7) ||
    (mode === "Deep" && expectedTurns >= 0);
  if (!modeHasValidEstimate) {
    throw new Error(
      `product-designer first agent message has expected turns outside the selected mode; project=${project}`,
    );
  }
  return mode.toLowerCase();
}

function assertProductDesignerSessionMode(
  sessionOutput: string,
  declaredMode: string,
  project: string,
): void {
  const frontMatter = markdownFrontMatter(sessionOutput, project);
  const finalMode = String(frontMatter.mode ?? "");
  const modeRank = new Map([
    ["quick", 0],
    ["guided", 1],
    ["deep", 2],
  ]);
  const declaredRank = modeRank.get(declaredMode);
  const finalRank = modeRank.get(finalMode);
  if (declaredRank === undefined || finalRank === undefined) {
    throw new Error(
      `product-designer declared or final SESSION mode is invalid; project=${project}`,
    );
  }
  if (finalMode !== declaredMode) {
    if (
      finalRank <= declaredRank ||
      !hasProductDesignerModeEscalationRecord(
        sessionOutput,
        declaredMode,
        finalMode,
      )
    ) {
      throw new Error(
        `product-designer declared mode does not match a documented upward SESSION mode transition; project=${project}`,
      );
    }
  }
  if (frontMatter.mode_decision_turn_count !== 0) {
    throw new Error(
      `product-designer one-turn acceptance must keep mode_decision_turn_count at 0; project=${project}`,
    );
  }
}

function hasProductDesignerModeEscalationRecord(
  sessionOutput: string,
  previousMode: string,
  nextMode: string,
): boolean {
  return tableRows(sessionOutput, "# Change Log").some((row) => {
    if (row.length < 7) return false;
    const change = row[4].toLowerCase();
    const reason = row[5].trim();
    const namesTransition = new RegExp(
      `(?:previous[_ ]?mode\\s*[:=]\\s*${previousMode}.*new[_ ]?mode\\s*[:=]\\s*${nextMode}|${previousMode}\\s*(?:->|→|to)\\s*${nextMode})`,
      "i",
    ).test(change);
    const recordsReset =
      /(?:mode_decision_turn_count|decision[_ ]?turn[_ ]?count|count)[^|]{0,40}(?:reset|=)[^|]{0,10}\b0\b/i.test(
        change,
      );
    return (
      namesTransition &&
      recordsReset &&
      reason.length >= 3 &&
      !/^(?:none|unknown|pending|tbd|todo|placeholder)$/i.test(reason)
    );
  });
}

function nextCodexActionableEvent(
  events: readonly CodexJsonlEvent[],
  startIndex: number,
  project: string,
): { eventIndex: number; item: CodexJsonlItem } | undefined {
  for (let eventIndex = startIndex; eventIndex < events.length; eventIndex++) {
    const event = events[eventIndex];
    if (event.type !== "item.started" && event.type !== "item.completed") {
      continue;
    }
    const item = codexJsonlItem(event, eventIndex, project);
    if (
      item.type === "agent_message" ||
      item.type === "command_execution" ||
      item.type === "file_change"
    ) {
      return { eventIndex, item };
    }
  }
  return undefined;
}

function productDesignerReadOnlyCommandFailure(
  command: string,
  project: string,
): string | undefined {
  // Cooperative quality gate: this grammar and workspace confinement catch
  // accidental writes; they are not an OS security boundary against a hostile process,
  // and a transient mutation reverted before the snapshot remains a threat-boundary residual.
  if (hasActiveShellExpansion(command)) return "shell expansion";
  let payload = command.trim();
  const wrapperTokens = shellWords(payload);
  if (!wrapperTokens) return "unparseable shell command";
  const wrapperToken = wrapperTokens[0] ?? "";
  const wrapper = trustedReadOnlyExecutable(wrapperToken);
  if (wrapper === "zsh" || wrapper === "sh" || wrapper === "bash") {
    if (wrapperTokens[1] !== "-lc" && wrapperTokens[1] !== "-c") {
      return "shell wrapper without -c/-lc";
    }
    if (wrapperTokens.length < 3) return "shell wrapper without payload";
    const wrappedPayload = extractReadOnlyShellWrapperPayload(command);
    if (!wrappedPayload) return "unparseable shell wrapper payload";
    payload = wrappedPayload;
  }
  payload = payload.replace(/(?:^|\s)2>\s*\/dev\/null(?=\s|$)/g, " ");
  const stages = splitReadOnlyShellStages(payload);
  if (!stages || stages.length === 0) return "shell control or redirection";
  for (const stage of stages) {
    const words = shellWords(stage);
    if (!words || words.length === 0) return "unparseable command stage";
    const executable = trustedReadOnlyExecutable(words[0]);
    if (!executable) return `untrusted executable ${words[0] || "<empty>"}`;
    const args = words.slice(1);
    if (!productDesignerReadOnlyProgram(executable, args, project)) {
      return `program ${executable || "<empty>"} is not read-only`;
    }
  }
  return undefined;
}

function isExpectedRipgrepNoMatch(
  item: CodexJsonlItem,
  command: string,
  project: string,
): boolean {
  if (
    item.status !== "failed" ||
    item.exit_code !== 1 ||
    typeof item.aggregated_output !== "string" ||
    item.aggregated_output.trim() !== "" ||
    productDesignerReadOnlyCommandFailure(command, project)
  ) {
    return false;
  }
  let payload = command.trim();
  const wrapperTokens = shellWords(payload);
  const wrapper = wrapperTokens?.[0]
    ? trustedReadOnlyExecutable(wrapperTokens[0])
    : undefined;
  if (wrapper === "zsh" || wrapper === "sh" || wrapper === "bash") {
    const wrappedPayload = extractReadOnlyShellWrapperPayload(command);
    if (!wrappedPayload) return false;
    payload = wrappedPayload;
  }
  payload = payload.replace(/(?:^|\s)2>\s*\/dev\/null(?=\s|$)/g, " ");
  const stages = splitReadOnlyShellStages(payload);
  if (!stages || stages.length !== 1) return false;
  const words = shellWords(stages[0]);
  return Boolean(words && trustedReadOnlyExecutable(words[0] ?? "") === "rg");
}

function extractReadOnlyShellWrapperPayload(
  command: string,
): string | undefined {
  const match =
    /^\s*(?:\/(?:bin|usr\/bin)\/)?(?:zsh|sh|bash)\s+(?:-lc|-c)\s+([\s\S]+?)\s*$/.exec(
      command,
    );
  if (!match) return undefined;
  let payload = match[1];
  const quote = payload[0];
  if ((quote === "'" || quote === '"') && payload.at(-1) === quote) {
    payload = payload.slice(1, -1);
  }
  return payload.trim() || undefined;
}

function trustedReadOnlyExecutable(value: string): string | undefined {
  const allowed = new Set([
    "bash",
    "cat",
    "date",
    "find",
    "grep",
    "head",
    "ls",
    "pwd",
    "rg",
    "sed",
    "sh",
    "shasum",
    "sort",
    "stat",
    "tail",
    "wc",
    "zsh",
  ]);
  if (allowed.has(value)) return value;
  const system = /^\/(?:bin|usr\/bin)\/([A-Za-z0-9_-]+)$/.exec(value);
  return system && allowed.has(system[1]) ? system[1] : undefined;
}

function hasActiveShellExpansion(command: string): boolean {
  let quote: "'" | '"' | undefined;
  let escaped = false;
  for (let index = 0; index < command.length; index++) {
    const character = command[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote === "'") {
      if (character === "'") quote = undefined;
      continue;
    }
    if (character === "'") {
      if (!quote) quote = "'";
      continue;
    }
    if (character === '"') {
      quote = quote === '"' ? undefined : '"';
      continue;
    }
    if (character === "`" || isShellExpansionStart(command, index)) return true;
  }
  return false;
}

function isShellExpansionStart(command: string, index: number): boolean {
  if (command[index] !== "$") return false;
  return /[({A-Za-z0-9_@*#?$!\-]/.test(command[index + 1] ?? "");
}

function splitReadOnlyShellStages(command: string): string[] | undefined {
  const stages: string[] = [];
  let start = 0;
  let quote: "'" | '"' | undefined;
  let escaped = false;
  for (let index = 0; index < command.length; index++) {
    const character = command[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (
        quote === '"' &&
        (character === "`" || isShellExpansionStart(command, index))
      ) {
        return undefined;
      }
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (
      character === "`" ||
      isShellExpansionStart(command, index) ||
      character === ";" ||
      character === "\n" ||
      character === "\r"
    ) {
      return undefined;
    }
    if (character === ">" || character === "<") return undefined;
    if (command.startsWith("||", index)) {
      return undefined;
    }
    const separatorLength = command.startsWith("&&", index)
      ? 2
      : character === "|"
        ? 1
        : 0;
    if (separatorLength === 0) {
      if (character === "&") return undefined;
      continue;
    }
    const stage = command.slice(start, index).trim();
    if (!stage) return undefined;
    stages.push(stage);
    index += separatorLength - 1;
    start = index + 1;
  }
  if (quote || escaped) return undefined;
  const finalStage = command.slice(start).trim();
  if (!finalStage) return undefined;
  stages.push(finalStage);
  return stages;
}

function shellWords(command: string): string[] | undefined {
  const words: string[] = [];
  let current = "";
  let quote: "'" | '"' | undefined;
  let escaped = false;
  let tokenStarted = false;
  for (const character of command) {
    if (escaped) {
      current += character;
      escaped = false;
      tokenStarted = true;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      tokenStarted = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = undefined;
      else current += character;
      tokenStarted = true;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      tokenStarted = true;
      continue;
    }
    if (/\s/.test(character)) {
      if (tokenStarted) {
        words.push(current);
        current = "";
        tokenStarted = false;
      }
      continue;
    }
    current += character;
    tokenStarted = true;
  }
  if (quote || escaped) return undefined;
  if (tokenStarted) words.push(current);
  return words;
}

function productDesignerReadOnlyProgram(
  executable: string,
  args: readonly string[],
  project: string,
): boolean {
  if (executable === "pwd") return args.length === 0;
  if (executable === "sort") return args.length === 0;
  if (
    new Set(["grep", "ls", "head", "tail", "wc", "stat", "shasum", "cat"]).has(
      executable,
    )
  ) {
    return args.every((arg) => safeReadOnlyArgument(arg, project));
  }
  if (executable === "date") {
    return args.every((arg) => arg === "-u" || arg.startsWith("+"));
  }
  if (executable === "rg") {
    return (
      !args.some((arg) => arg === "--pre" || arg.startsWith("--pre=")) &&
      args.every((arg) => safeReadOnlyArgument(arg, project))
    );
  }
  if (executable === "sed") {
    return (
      !args.some(
        (arg) =>
          arg === "-i" ||
          arg.startsWith("--in-place") ||
          /^-[A-Za-z]*i.*$/.test(arg),
      ) &&
      !args.some((arg) => /(?:^|[;}])\s*(?:w|e)\s+\S/i.test(arg)) &&
      args.every((arg) => safeReadOnlyArgument(arg, project))
    );
  }
  if (executable === "find") {
    const forbidden = new Set([
      "-delete",
      "-exec",
      "-execdir",
      "-ok",
      "-okdir",
      "-fprint",
      "-fprint0",
      "-fprintf",
    ]);
    const firstExpression = args.findIndex((arg) => arg.startsWith("-"));
    const roots = args.slice(
      0,
      firstExpression < 0 ? args.length : firstExpression,
    );
    return (
      roots.length > 0 &&
      roots.every((root) => safeProjectPathOperand(root, project)) &&
      !args.some((arg) => forbidden.has(arg)) &&
      args.every((arg) => safeReadOnlyArgument(arg, project))
    );
  }
  return false;
}

function safeReadOnlyArgument(value: string, project: string): boolean {
  if (value === "--") return true;
  if (/^(?:~|\.\.(?:\/|$))/.test(value) || /(?:^|\/)\.\.(?:\/|$)/.test(value)) {
    return false;
  }
  if (isAbsolute(value)) return safeProjectPathOperand(value, project);
  return true;
}

function safeProjectPathOperand(value: string, project: string): boolean {
  if (/^(?:~|\.\.(?:\/|$))/.test(value) || /(?:^|\/)\.\.(?:\/|$)/.test(value)) {
    return false;
  }
  const root = resolve(project);
  const candidate = resolve(project, value);
  return candidate === root || candidate.startsWith(`${root}/`);
}

async function runMainAcceptance(): Promise<void> {
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, selectedCases.length) },
      async () => {
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
            const detail =
              error instanceof Error ? error.message : String(error);
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
      },
    ),
  );

  if (completed !== selectedCases.length) {
    failures.push(
      `Codex acceptance did not execute every selected case (${completed}/${selectedCases.length}).`,
    );
  }

  const order = new Map(selectedCases.map(({ name }, index) => [name, index]));
  results.sort(
    (left, right) => (order.get(left.name) ?? 0) - (order.get(right.name) ?? 0),
  );
  for (const [project, evidencePath] of evidenceFiles) {
    let evidenceProblem: string | undefined;
    try {
      const expectedDigest = evidenceDigests.get(project);
      const current = readSingleLinkRegularFile(
        evidencePath,
        "Codex acceptance evidence",
      );
      const currentDigest = createHash("sha256").update(current).digest("hex");
      if (!expectedDigest || currentDigest !== expectedDigest) {
        evidenceProblem = `Codex acceptance evidence changed after preservation: ${evidencePath}`;
      }
    } catch (error) {
      evidenceProblem =
        error instanceof Error
          ? error.message
          : `Codex acceptance evidence could not be rechecked: ${evidencePath}`;
    }
    if (evidenceProblem) {
      failures.push(evidenceProblem);
      const result = results.find((candidate) => candidate.project === project);
      if (result) {
        result.status = "failed";
        result.reason = evidenceProblem;
      }
    }
  }
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
    for (const project of projects)
      rmSync(project, { recursive: true, force: true });
    for (const evidenceFile of evidenceFiles.values())
      rmSync(evidenceFile, { force: true });
  } else if (failures.length > 0) {
    console.error(
      `Acceptance 실패 증적을 보존했습니다:\n${projects
        .map(
          (project) =>
            `${project}\n${evidenceFiles.get(project) ?? "<evidence unavailable>"}`,
        )
        .join("\n")}`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Codex acceptance failed (${failures.length}/${selectedCases.length}); report=${reportPath}\n${failures.join("\n")}`,
    );
  }

  console.log(
    `Codex acceptance passed: ${selectedCases.length}/${selectedCases.length}; report=${reportPath}`,
  );
}

async function runAcceptance(
  acceptance: AcceptanceCase,
  progress: AcceptanceProgress,
): Promise<void> {
  const project = mkdtempSync(
    join(tmpdir(), `opendock-codex-${acceptance.name}-`),
  );
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
  const scenarioSha256 = createHash("sha256")
    .update(scenarioContent)
    .digest("hex");
  if (acceptance.name === "product-designer") {
    prepareAcceptanceTargetParent(project, acceptance.target);
  }

  const prompt = [
    `$opendock-${acceptance.name} 스킬을 사용해 SCENARIO.md의 요청을 실제로 수행하세요.`,
    `설치된 AGENTS.md, .agents/skills/opendock-${acceptance.name}/SKILL.md와 .opendock/docks/${acceptance.name}/ 아래 안내를 먼저 읽으세요.`,
    `주요 산출물 경로는 ${acceptance.target}입니다. 별도 run manifest나 검사 script를 만들거나 실행하지 마세요.`,
    "SCENARIO.md에 없는 현재 사실은 단정하지 말고 사실, 제공 근거, 가정, 추천을 구분하세요. TODO/TBD/placeholder, credential, PII 값은 남기지 마세요.",
    "외부 웹 검색, 브라우저, 앱, MCP는 사용하지 마세요. 이 acceptance에서는 SCENARIO.md와 설치된 Dock 파일만 사실 근거로 사용하고, 현재 확인이 필요한 정보는 재확인 항목으로 표시하세요.",
    "완료 전에 현재 산출물만 도메인 가이드와 비교해 누락과 근거 없는 단정을 자체 검토하세요.",
    "OpenDock이 설치한 managed 문서와 skill 자체는 수정하지 마세요.",
    ...(acceptance.name === "product-designer"
      ? [
          "첫 agent message의 첫 줄을 `작업 깊이: Quick | 이유: SCENARIO에 목표·범위·방향이 이미 정해져 있어 추가 design decision이 필요 없음 | 예상 설계 결정 왕복: 0회`로 정확히 작성하세요. 이 선언 전에는 command_execution이나 file_change를 포함한 어떤 도구도 사용하지 마세요. 이 acceptance는 추가 사용자 답변이 없는 한 turn이므로 최종 SESSION의 mode는 quick, mode_decision_turn_count는 0이어야 합니다.",
          "현재 workspace는 이 acceptance만을 위한 독립 sandbox입니다. 현재 사용자인 제가 capability approval AP-ACCEPT-001을 명시적으로 승인합니다.",
          `승인 action은 create_or_update_checkpoint, resource는 ${acceptance.target}, access와 data class는 정확히 "${productDesignerAcceptanceAccessAndData}", subject revision은 정확히 "SCENARIO.md SHA-256 ${scenarioSha256}", 범위는 정확히 single_use입니다. Approval Log에도 이 canonical value와 human approver "current user"를 그대로 기록하세요.`,
          "SCENARIO.md와 설치된 managed 문서를 확인하기 위한 로컬 read-only 접근은 이 요청에 포함됩니다. 탐색에는 pwd, rg, grep, ls, head, tail, wc, stat, shasum, cat, date -u, non-in-place sed, non-mutating find, pipeline 안의 인자 없는 sort와 이들의 read-only pipeline/&&만 사용하세요. 목적과 예상 결과는 provider-neutral SESSION checkpoint를 작성해 specification, prototype, validation과 handoff를 검증하는 것입니다. 승인 경로 밖의 파일 쓰기, mutation 명령, network 전송, 설치, server, commit, push와 deploy는 승인하지 않습니다.",
          "Content and Data Contract의 Source/interface, Freshness, Read actor와 Write actor 중 하나라도 SCENARIO.md 또는 Evidence Register의 verified fact가 직접 입증하지 않으면 fact와 가정을 한 행에 섞지 말고 그 행 전체 Status를 design_interface_assumption으로 기록하세요.",
          "이 text-prototype profile에서 SCENARIO.md의 `WCAG AA를 따른다`는 접근성 구조 요구를 뜻합니다. SCENARIO가 rendered conformance audit 자체를 이번 delivery로 명시하지 않았으므로 accessibility_structure Acceptance는 required/pass로 검증하고, formal wcag_conformance Acceptance는 optional/not_run으로 두어 G5를 막지 마세요.",
          "state_change에 acknowledgement 또는 terminal success가 있으면 Prototype 표의 claim 문장에만 넣지 말고 `## Prototype Detail`에 `acknowledgement_only_when=...`와 `terminal_success_when=...`를 각각 독립된 canonical 줄로 기록하세요.",
          "Flow cell의 canonical assignment는 `; `로 분리하세요. `feedback=..., and acknowledgement_only_when=...`처럼 다른 value 안에 key를 넣지 말고, Flow와 Prototype Detail의 acknowledgement_only_when 값은 글자 단위로 같게 쓰세요.",
          "최종 저장 preflight에서 (1) 각 state_change Action의 Flow Required Acceptance IDs, exact Action ID를 Claim 또는 Threshold에서 역참조하는 required Acceptance IDs, Prototype action acceptance_set이 exact same set인지, (2) transition의 start, processing, success, failure 네 token이 첫 세미콜론 전 하나의 value에 있고 terminal_success_when의 success token과 exact target/terminal binding도 첫 세미콜론 전 같은 value에 있으며 binding:<terminal field>=<value>의 value가 transition success branch exact token인지, (3) State Matrix permission 행 하나에 unauthorized actor 하나만 있는지, (4) flow-critical Safe visible fallback마다 explicit disabled, hidden, not_rendered 또는 read-only control state와 visible feedback 및 observable recovery trigger가 있는지, (5) optional을 포함한 Acceptance ID 집합과 current Validation head의 Acceptance ID 집합이 정확히 같고 각 Validation Required와 Method가 같은 Acceptance 행의 Required for delivery와 Method를 글자 단위로 그대로 복사했는지, (6) Ambiguity, Decision, Approval, Validation과 Change Log 전체에서 Event ID가 전역 유일한지, (7) front matter last_event_id가 Change Log의 마지막 Event ID와 정확히 같은지 확인하세요.",
          "접근성 Acceptance도 Action reverse-reference 집합에서 예외가 아닙니다. required accessibility Claim 또는 Threshold가 exact state_change Action ID를 포함하면 그 ACC ID를 해당 Flow Required Acceptance IDs와 같은 Action의 Prototype acceptance_set 양쪽에 반드시 포함하세요. artifact 수준 acceptance라며 한쪽 set에서 빼지 마세요.",
          "Acceptance Contract의 required와 optional 행은 모두 정확히 9개 cell을 가져야 합니다. 특히 optional WCAG 또는 outcome 행도 Minimum prototype level 다음에 Target participants, Owner, Privacy/consent/stop condition을 모두 기록하세요. 참여자가 적용되지 않으면 Target participants cell을 생략하지 말고 Owner 앞에 `not_applicable(reason=no participant study)`처럼 bounded N/A를 넣으세요.",
          "Goal User approval이 approved_in_request이면 그 evidence는 SCENARIO.md 또는 Goal, Frame, scope, direction, delivery boundary의 현재 요청을 verified fact로 설명하는 EVD여야 합니다. checkpoint write, single_use, create_or_update_checkpoint capability만 설명하는 EVD를 Goal 승인에 쓰지 마세요.",
          "모든 Event ID는 checkpoint_revision=1이면 `evt-00000001-0001`, `evt-00000001-0002`처럼 첫 8자리가 revision이고 마지막 4자리가 증가 ordinal입니다. 모든 Validation 뒤에 Change Log event를 마지막 ordinal로 발급하고 그 exact final Change Event ID를 front matter last_event_id에 복사하세요. 예: 마지막 Validation이 evt-00000001-0014이면 Change와 last_event_id는 evt-00000001-0015입니다.",
          "모든 Markdown table delimiter cell은 최소 `---` 세 hyphen을 사용하세요. `| -- |`처럼 두 hyphen인 cell은 table이 아니므로 저장하지 마세요.",
          `runner가 이미 현재 workspace에 .git이 없고, ${acceptance.target}이 없으며, 그 부모 디렉터리는 실제 directory로 존재함을 검증했습니다. 이 세 경로의 존재 여부를 ls, stat, find 또는 다른 command로 다시 확인하지 마세요. 존재하지 않아야 정상인 경로를 다른 존재 경로와 한 command에 묶어 nonzero exit를 만들지 마세요.`,
          `산출물의 부모 디렉터리는 이미 준비되어 있습니다. mkdir, redirection, writer script 같은 mutation command를 사용하지 마세요. ${acceptance.target} 전체 내용을 응답 메모리에서 먼저 완성하고 template/protocol과 대조하세요. 그 뒤 별도 agent message로 정확히 \`${productDesignerWriteReadinessMessage}\`라고 선언하고, 다른 command나 message 없이 바로 정확히 한 번의 atomic file_change로 새 파일을 만드세요. 저장 후에는 같은 파일을 다시 수정하지 마세요.`,
        ]
      : []),
  ].join("\n");
  const workspaceBeforeCodex = captureAcceptanceWorkspace(project);
  assertAcceptanceTargetAvailable(
    project,
    workspaceBeforeCodex,
    acceptance.target,
  );
  const evidenceRoot = ensureAcceptanceEvidenceRoot();
  const evidencePath = join(
    evidenceRoot,
    `${acceptance.name}-${randomBytes(16).toString("hex")}.json`,
  );
  evidenceFiles.set(project, evidencePath);

  const codex = await runAcceptanceChild(
    [
      codexBin,
      "exec",
      "--json",
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
    { cwd: project, env: childEnvironment, timeoutMs: 10 * 60 * 1000 },
  );
  const { stdout, stderr, exitCode, timedOut } = codex;

  let confinementFailure: unknown;
  try {
    assertAcceptanceWorkspaceConfinement(
      project,
      workspaceBeforeCodex,
      acceptance.target,
      { requireTarget: !timedOut && exitCode === 0 },
    );
  } catch (error) {
    confinementFailure = error;
  }

  let evidenceFailure: unknown;
  try {
    const evidence = `${JSON.stringify(
      {
        schema: "opendock/codex-acceptance-evidence/v1",
        project,
        stdout,
        stderr,
        stdoutSha256: createHash("sha256").update(stdout).digest("hex"),
        stderrSha256: createHash("sha256").update(stderr).digest("hex"),
      },
      null,
      2,
    )}\n`;
    writeFileSync(evidencePath, evidence, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    const persisted = readSingleLinkRegularFile(
      evidencePath,
      "Codex acceptance evidence",
    );
    const digest = createHash("sha256").update(persisted).digest("hex");
    evidenceDigests.set(project, digest);
    progress.evidenceSha256 = digest;
  } catch (error) {
    evidenceFailure = error;
  }

  if (confinementFailure) {
    const detail =
      confinementFailure instanceof Error
        ? confinementFailure.message
        : String(confinementFailure);
    throw new Error(`${detail}; evidence=${evidencePath}`);
  }
  if (evidenceFailure) {
    const detail =
      evidenceFailure instanceof Error
        ? evidenceFailure.message
        : String(evidenceFailure);
    throw new Error(
      `could not preserve Codex acceptance evidence: ${detail}; project=${project}`,
    );
  }
  if (timedOut) {
    throw new Error(
      `codex timed out after 10 minutes; project=${project}; evidence=${evidencePath}\n${tail(stderr || stdout)}`,
    );
  }
  if (exitCode !== 0)
    throw new Error(
      `codex exit ${exitCode}; project=${project}; evidence=${evidencePath}\n${tail(stderr || stdout)}`,
    );
  assertRegularFile(project, "AGENTS.md", "installed AGENTS guidance");
  assertRegularFile(
    project,
    `.agents/skills/opendock-${acceptance.name}/SKILL.md`,
    "installed skill",
  );
  assertRegularFile(
    project,
    `.opendock/docks/${acceptance.name}/README.md`,
    "installed domain guide",
  );
  progress.guidanceVerified = true;

  assertRegularFile(project, acceptance.target, "expected target");
  const output = readFileSync(join(project, acceptance.target), "utf8");
  if (output.trim().length < 100) {
    throw new Error(
      `expected target is too small to prove the scenario was completed; project=${project}`,
    );
  }
  if (
    /(?:^|\n)\s*(?:[-*]\s*)?(?:TODO|TBD)\s*[:：-]|\[(?:TODO|TBD|PLACEHOLDER)\]|<PLACEHOLDER>|\{\{[^}\n]+\}\}/i.test(
      output,
    )
  ) {
    throw new Error(
      `expected target still contains a placeholder; project=${project}`,
    );
  }
  if (acceptance.name === "product-designer") {
    const template = readFileSync(
      join(project, ".opendock/templates/product-designer/DESIGN_SESSION.md"),
      "utf8",
    );
    assertProductDesignerOutput(output, template, project, {
      scenarioSha256,
      sessionId: "acceptance",
      sessionPath: acceptance.target,
      accessAndData: productDesignerAcceptanceAccessAndData,
      humanApprover: "current user",
      requireStateChangingAction: true,
      requireUnprovenOutcomeAcceptance: true,
      unprovenOutcomeMetric: {
        value: 30,
        unit: "percent",
        direction: "decrease",
        subjectTokens: [
          "handling time",
          "processing time",
          "처리시간",
          "소요 시간",
        ],
      },
      requireConfirmedTerminalSuccess: true,
      requirePermissionRouteAssumption: true,
      requireAccessibilityContract: true,
      workflowSha256: createHash("sha256")
        .update(
          readFileSync(
            join(
              project,
              ".opendock/docks/product-designer/PRODUCT_DESIGN_WORKFLOW.md",
            ),
          ),
        )
        .digest("hex"),
      protocolSha256: createHash("sha256")
        .update(
          readFileSync(
            join(
              project,
              ".opendock/docks/product-designer/SESSION_PROTOCOL.md",
            ),
          ),
        )
        .digest("hex"),
      skillSha256: createHash("sha256")
        .update(
          readFileSync(
            join(project, ".agents/skills/opendock-product-designer/SKILL.md"),
          ),
        )
        .digest("hex"),
    });
    assertProductDesignerCodexExecutionContract(
      stdout,
      project,
      acceptance.target,
      output,
    );
    for (const required of [
      "# Shared Vocabulary and Relationships",
      "# Ambiguity Ledger",
      "# Decision Log",
      "# Approval Log",
      "# Specification",
      "## State Matrix",
      "# Acceptance Contract",
      "# Prototype",
      "# Validation Log",
      "# Handoff",
      "# Current Checkpoint",
    ]) {
      if (!output.includes(required)) {
        throw new Error(
          `product-designer output is missing ${required}; project=${project}`,
        );
      }
    }
    for (const field of [
      "session_path:",
      "checkpoint_revision:",
      "workflow_sha256:",
      "protocol_sha256:",
      "current_stage:",
      "current_gate:",
      "gate_state:",
      "completion_kind:",
      "skill_sha256:",
      "checkpoint_write_approval_id: AP-ACCEPT-001",
    ]) {
      if (!output.includes(field)) {
        throw new Error(
          `product-designer output is missing session field ${field}; project=${project}`,
        );
      }
    }
    if (/(?:replace-[a-z0-9-]+|capture-on-create)/i.test(output)) {
      throw new Error(
        `product-designer session retained a template value; project=${project}`,
      );
    }
    if (!output.includes(scenarioSha256)) {
      throw new Error(
        `product-designer session did not bind approvals to the scenario revision; project=${project}`,
      );
    }
    if (!/\|\s*Structure\s*\|/i.test(output)) {
      throw new Error(
        `product-designer output does not declare its prototype level; project=${project}`,
      );
    }
    if (!/\|\s*not_run\s*\||\|\s*needs_review\s*\|/i.test(output)) {
      throw new Error(
        `product-designer output does not preserve an unproven acceptance; project=${project}`,
      );
    }
    for (const state of [
      "default",
      "loading",
      "empty",
      "error",
      "permission",
      "disabled",
      "success",
      "recovery",
    ]) {
      if (!new RegExp(`\\b${state}\\b`, "i").test(output)) {
        throw new Error(
          `product-designer output is missing state ${state}; project=${project}`,
        );
      }
    }
    if (!/(not_run|pass|fail|needs_review|approved_exception)/.test(output)) {
      throw new Error(
        `product-designer output lacks honest validation status; project=${project}`,
      );
    }
    if (/^(?:status:\s*)?complete\s*$/im.test(output)) {
      throw new Error(
        `product-designer completed before designer revalidation; project=${project}`,
      );
    }
  }
  progress.targetVerified = true;
  if (
    !new OpenDockStateStore(project).findDock(`opendock/${acceptance.name}`)
  ) {
    throw new Error(`installed lock record missing; project=${project}`);
  }
  progress.lockVerified = true;

  // Recheck immediately before uninstall to catch delayed writes from the run.
  assertAcceptanceWorkspaceConfinement(
    project,
    workspaceBeforeCodex,
    acceptance.target,
  );
  const targetBeforeUninstall = captureAcceptanceTarget(
    project,
    acceptance.target,
  );
  const scenarioBeforeUninstall = captureAcceptanceTarget(
    project,
    "SCENARIO.md",
  );

  new DockInstaller().uninstall({
    dockId: `opendock/${acceptance.name}`,
    projectDir: project,
  });
  if (new OpenDockStateStore(project).findDock(`opendock/${acceptance.name}`)) {
    throw new Error(`uninstall lock record remained; project=${project}`);
  }
  for (const mapping of manifest.files) {
    if (acceptancePathExistsByLstat(project, mapping.to)) {
      throw new Error(
        `managed file remained after uninstall: ${mapping.to}; project=${project}`,
      );
    }
  }
  assertAcceptanceFinalWorkspaceInventory(
    project,
    acceptance.target,
    targetBeforeUninstall,
    scenarioBeforeUninstall,
  );
  progress.uninstallVerified = true;
}

export function assertProductDesignerOutput(
  output: string,
  template: string,
  project = "<fixture>",
  expected?: string | ProductDesignerExpectedAcceptanceContext,
): void {
  const scenarioSha256 =
    typeof expected === "string" ? expected : expected?.scenarioSha256;
  if (scenarioSha256 && !/^[a-f0-9]{64}$/.test(scenarioSha256)) {
    throw new Error(
      `product-designer has an invalid expected acceptance context digest; project=${project}`,
    );
  }
  if (typeof expected === "object") {
    assertProductDesignerResumeCompatibility(output, expected, project);
  }
  assertProductDesignerSessionCore(output, template, project);
  assertProductDesignerFinalAcceptanceStage(output, project);
  if (scenarioSha256 && !output.includes(scenarioSha256)) {
    throw new Error(
      `product-designer session did not bind approvals to the scenario revision; project=${project}`,
    );
  }
  assertProductDesignerTraceability(output, project, expected);
  assertProductDesignerSemanticCompletion(output, project, expected);
}

export function assertProductDesignerResumeCompatibility(
  output: string,
  expected: Pick<
    ProductDesignerExpectedAcceptanceContext,
    "workflowSha256" | "protocolSha256" | "skillSha256"
  >,
  project = "<fixture>",
): void {
  const expectedDigests = [
    ["workflow_sha256", expected.workflowSha256],
    ["protocol_sha256", expected.protocolSha256],
    ["skill_sha256", expected.skillSha256],
  ] as const;
  const configured = expectedDigests.filter(
    ([, digest]) => digest !== undefined,
  );
  if (configured.length === 0) return;
  if (
    configured.length !== expectedDigests.length ||
    configured.some(([, digest]) => !/^[a-f0-9]{64}$/.test(digest ?? ""))
  ) {
    throw new Error(
      `product-designer resume compatibility has an incomplete or invalid installed digest set; project=${project}`,
    );
  }
  const frontMatter = markdownFrontMatter(output, project);
  const mismatches = expectedDigests
    .filter(([field, digest]) => frontMatter[field] !== digest)
    .map(([field]) => field);
  if (mismatches.length > 0) {
    throw new Error(
      `product-designer migration_required; open the SESSION read_only until ${mismatches.join(", ")} is migrated to the installed dock revisions; project=${project}`,
    );
  }
}

export function assertProductDesignerSessionCore(
  output: string,
  template: string,
  project = "<fixture>",
): void {
  assertProductDesignerSessionStructure(output, template, project);
  const frontMatter = markdownFrontMatter(output, project);
  assertProductDesignerStageContract(frontMatter, output, project);
  assertCompletedProjection(output, frontMatter, project);
}

function markdownFrontMatter(
  markdown: string,
  project: string,
): Record<string, unknown> {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(
      `product-designer SESSION lacks YAML front matter; project=${project}`,
    );
  }
  const parsed = YAML.parse(match[1]);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(
      `product-designer SESSION front matter is not an object; project=${project}`,
    );
  }
  return parsed as Record<string, unknown>;
}

type MarkdownHeading = {
  index: number;
  level: number;
  text: string;
  normalized: string;
};

type MarkdownScan = {
  lines: string[];
  visible: boolean[];
  headings: MarkdownHeading[];
};

function scanMarkdown(markdown: string): MarkdownScan {
  const lines = markdown.split(/\r?\n/);
  const visible = Array.from({ length: lines.length }, () => false);
  const headings: MarkdownHeading[] = [];
  let fence: { marker: "`" | "~"; length: number } | undefined;
  let htmlComment = false;
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index];
    let rendered = "";
    let cursor = 0;
    while (cursor < line.length) {
      if (htmlComment) {
        const end = line.indexOf("-->", cursor);
        if (end < 0) {
          cursor = line.length;
          continue;
        }
        htmlComment = false;
        cursor = end + 3;
        continue;
      }
      const start = line.indexOf("<!--", cursor);
      if (start < 0) {
        rendered += line.slice(cursor);
        break;
      }
      rendered += line.slice(cursor, start);
      htmlComment = true;
      cursor = start + 4;
    }
    line = rendered;
    lines[index] = line;
    if (fence) {
      const closing = new RegExp(
        `^ {0,3}\\${fence.marker}{${fence.length},}\\s*$`,
      );
      if (closing.test(line)) fence = undefined;
      continue;
    }
    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (opening) {
      fence = {
        marker: opening[1][0] as "`" | "~",
        length: opening[1].length,
      };
      continue;
    }
    visible[index] = true;
    const heading = /^(#{1,6})[ \t]+(.+?)[ \t]*$/.exec(line);
    if (heading) {
      const text = heading[2].replace(/[ \t]+#+[ \t]*$/, "").trim();
      headings.push({
        index,
        level: heading[1].length,
        text,
        normalized: `${heading[1]} ${text}`,
      });
    }
  }
  if (htmlComment) {
    throw new Error("product-designer SESSION has an unclosed HTML comment");
  }
  return { lines, visible, headings };
}

function markdownSection(
  markdown: string,
  heading: string,
): { scan: MarkdownScan; start: number; end: number } | undefined {
  const scan = scanMarkdown(markdown);
  const target = scan.headings.find(
    (candidate) => candidate.normalized === heading,
  );
  if (!target) return undefined;
  const next = scan.headings.find(
    (candidate) =>
      candidate.index > target.index && candidate.level <= target.level,
  );
  return { scan, start: target.index, end: next?.index ?? scan.lines.length };
}

function visibleSectionLines(markdown: string, heading: string): string[] {
  const section = markdownSection(markdown, heading);
  if (!section) return [];
  const lines: string[] = [];
  for (let index = section.start; index < section.end; index++) {
    if (section.scan.visible[index]) lines.push(section.scan.lines[index]);
  }
  return lines;
}

function structuralHeadings(markdown: string): string[] {
  return scanMarkdown(markdown)
    .headings.filter(({ level }) => level <= 2)
    .map(({ normalized }) => normalized);
}

function managedTemplatePayload(markdown: string, project: string): string {
  const lines = markdown.split(/\r?\n/);
  const first = lines.findIndex((line) => line.trim().length > 0);
  let last = lines.length - 1;
  while (last >= 0 && lines[last].trim().length === 0) last--;
  if (first < 0 || last < first) {
    throw new Error(`product-designer template is empty; project=${project}`);
  }
  const hasStart = /^<!-- OPENDOCK:START\b.*-->$/.test(lines[first].trim());
  const hasEnd = /^<!-- OPENDOCK:END\b.*-->$/.test(lines[last].trim());
  if (hasStart !== hasEnd) {
    throw new Error(
      `product-designer template has an incomplete managed envelope; project=${project}`,
    );
  }
  return (
    hasStart ? lines.slice(first + 1, last) : lines.slice(first, last + 1)
  ).join("\n");
}

function tableHeaders(markdown: string): string[] {
  const scan = scanMarkdown(markdown);
  const headers: string[] = [];
  for (let index = 0; index < scan.lines.length - 1; index++) {
    if (!scan.visible[index] || !scan.visible[index + 1]) continue;
    const cells = parseMarkdownTableRow(scan.lines[index]);
    if (
      cells &&
      isMarkdownTableDelimiter(scan.lines[index + 1], cells.length)
    ) {
      const owner = scan.headings
        .filter((heading) => heading.index < index && heading.level <= 2)
        .at(-1)?.normalized;
      headers.push(JSON.stringify([owner ?? "<document>", cells]));
    }
  }
  return headers;
}

function parseMarkdownTableRow(line: string): string[] | undefined {
  if (!line.startsWith("|") || !line.endsWith("|")) return undefined;
  const cells: string[] = [];
  let cell = "";
  for (let index = 1; index < line.length - 1; index++) {
    const character = line[index];
    if (character !== "|") {
      cell += character;
      continue;
    }
    let backslashes = 0;
    for (
      let cursor = index - 1;
      cursor >= 0 && line[cursor] === "\\";
      cursor--
    ) {
      backslashes++;
    }
    if (backslashes % 2 === 1) {
      cell = `${cell.slice(0, -1)}|`;
      continue;
    }
    cells.push(cell.trim());
    cell = "";
  }
  cells.push(cell.trim());
  return cells;
}

function isMarkdownTableDelimiter(
  line: string,
  expectedCells?: number,
): boolean {
  const cells = parseMarkdownTableRow(line);
  return (
    cells !== undefined &&
    (expectedCells === undefined || cells.length === expectedCells) &&
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

function managedTableName(heading: string): string {
  return heading.replace(/^#{1,6}\s+/, "");
}

const productDesignerManagedTableArities = new Map<string, number>([
  ["# Design Contract Scope Map", 4],
  ["# Evidence Register", 7],
  ["# Shared Vocabulary and Relationships", 8],
  ["# Ambiguity Ledger", 13],
  ["# Decision Log", 11],
  ["# Approval Log", 13],
  ["## Flow", 10],
  ["## State Matrix", 4],
  ["## Content and Data Contract", 12],
  ["# Acceptance Contract", 9],
  ["# Prototype", 7],
  ["# Validation Log", 11],
  ["# Change Log", 7],
]);

function assertManagedTableArities(markdown: string, project: string): void {
  const scan = scanMarkdown(markdown);
  const found = new Set<string>();
  for (let index = 0; index < scan.lines.length - 1; index++) {
    if (!scan.visible[index] || !scan.visible[index + 1]) continue;
    const header = parseMarkdownTableRow(scan.lines[index]);
    if (
      !header ||
      !isMarkdownTableDelimiter(scan.lines[index + 1], header.length)
    ) {
      continue;
    }
    const heading = scan.headings
      .filter((candidate) => candidate.index < index && candidate.level <= 2)
      .at(-1)?.normalized;
    if (!heading || !productDesignerManagedTableArities.has(heading)) continue;
    found.add(heading);
    const expected = productDesignerManagedTableArities.get(heading)!;
    if (header.length !== expected) {
      throw new Error(
        `product-designer ${managedTableName(heading)} header must have exactly ${expected} cells; project=${project}`,
      );
    }
    for (let rowIndex = index + 2; rowIndex < scan.lines.length; rowIndex++) {
      if (!scan.visible[rowIndex]) continue;
      const row = parseMarkdownTableRow(scan.lines[rowIndex]);
      if (!row) break;
      if (row.length !== expected) {
        throw new Error(
          `product-designer ${managedTableName(heading)} row must have exactly ${expected} cells; project=${project}`,
        );
      }
    }
  }
  for (const heading of productDesignerManagedTableArities.keys()) {
    if (!found.has(heading)) {
      throw new Error(
        `product-designer ${managedTableName(heading)} table is missing; project=${project}`,
      );
    }
  }
}

const productDesignerStages = new Set([
  "INTAKE",
  "DISCOVER",
  "FRAME",
  "DIRECTIONS",
  "SPECIFY",
  "PROTOTYPE",
  "VALIDATE",
  "HANDOFF",
]);
const productDesignerGates = new Set([
  "G0",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
]);
const productDesignerGateStates = new Set([
  "open",
  "waiting_input",
  "waiting_approval",
  "waiting_external",
  "blocked_external",
  "passed",
  "reused",
  "not_applicable",
]);
const productDesignerCompletionKinds = new Set([
  "none",
  "design_delivery",
  "implemented_and_revalidated",
]);
const productDesignerDeliveryProfiles = new Set([
  "decision",
  "specification",
  "prototype",
  "implementation",
]);
const productDesignerStageGate = new Map([
  ["INTAKE", "G0"],
  ["DISCOVER", "G1"],
  ["FRAME", "G1"],
  ["DIRECTIONS", "G2"],
  ["SPECIFY", "G3"],
  ["PROTOTYPE", "G4"],
  ["VALIDATE", "G5"],
  ["HANDOFF", "G6"],
]);

function assertProductDesignerStageContract(
  frontMatter: Record<string, unknown>,
  output: string,
  project: string,
): void {
  const status = String(frontMatter.status ?? "");
  const stage = String(frontMatter.current_stage ?? "");
  const gate = String(frontMatter.current_gate ?? "");
  const gateState = String(frontMatter.gate_state ?? "");
  const lastPassed = String(frontMatter.last_passed_gate ?? "");
  const completion = String(frontMatter.completion_kind ?? "");
  const mode = String(frontMatter.mode ?? "");
  const modeReason = String(frontMatter.mode_reason ?? "");
  const deliveryProfile = String(frontMatter.delivery_profile ?? "");
  const modeDecisionTurnCount = frontMatter.mode_decision_turn_count;
  if (!new Set(["active", "paused", "complete"]).has(status)) {
    throw new Error(
      `product-designer SESSION has invalid status; project=${project}`,
    );
  }
  if (!productDesignerStages.has(stage)) {
    throw new Error(
      `product-designer SESSION has invalid current_stage; project=${project}`,
    );
  }
  if (!productDesignerGates.has(gate)) {
    throw new Error(
      `product-designer SESSION has invalid current_gate; project=${project}`,
    );
  }
  if (!productDesignerGateStates.has(gateState)) {
    throw new Error(
      `product-designer SESSION has invalid gate_state; project=${project}`,
    );
  }
  if (lastPassed !== "none" && !productDesignerGates.has(lastPassed)) {
    throw new Error(
      `product-designer SESSION has invalid last_passed_gate; project=${project}`,
    );
  }
  if (!productDesignerCompletionKinds.has(completion)) {
    throw new Error(
      `product-designer SESSION has invalid completion_kind; project=${project}`,
    );
  }
  if (!/^(?:quick|guided|deep)$/.test(mode)) {
    throw new Error(
      `product-designer SESSION has invalid mode; project=${project}`,
    );
  }
  if (
    !isConcreteProductContractValue(modeReason) ||
    templateSentinelValue(modeReason)
  ) {
    throw new Error(
      `product-designer SESSION has invalid mode_reason; project=${project}`,
    );
  }
  if (!productDesignerDeliveryProfiles.has(deliveryProfile)) {
    throw new Error(
      `product-designer SESSION has invalid delivery_profile; project=${project}`,
    );
  }
  if (
    typeof modeDecisionTurnCount !== "number" ||
    !Number.isSafeInteger(modeDecisionTurnCount) ||
    modeDecisionTurnCount < 0 ||
    (mode === "quick" && modeDecisionTurnCount > 2)
  ) {
    throw new Error(
      `product-designer SESSION has invalid mode_decision_turn_count; project=${project}`,
    );
  }
  if (productDesignerStageGate.get(stage) !== gate) {
    throw new Error(
      `product-designer SESSION has an invalid stage/gate tuple; project=${project}`,
    );
  }
  if (
    stage === "HANDOFF" &&
    status !== "complete" &&
    !/^(?:open|waiting_approval|waiting_external)$/.test(gateState)
  ) {
    throw new Error(
      `product-designer SESSION has an invalid nonterminal G6 gate_state; project=${project}`,
    );
  }
  const designDelivery =
    status === "complete" &&
    stage === "HANDOFF" &&
    gate === "G6" &&
    gateState === "not_applicable" &&
    lastPassed === "G5" &&
    completion === "design_delivery";
  const implementedAndRevalidated =
    status === "complete" &&
    stage === "HANDOFF" &&
    gate === "G6" &&
    gateState === "passed" &&
    lastPassed === "G6" &&
    completion === "implemented_and_revalidated";
  if (status === "complete") {
    if (!designDelivery && !implementedAndRevalidated) {
      throw new Error(
        `product-designer SESSION has a contradictory terminal tuple; project=${project}`,
      );
    }
  } else {
    if (completion !== "none") {
      throw new Error(
        `product-designer SESSION has a contradictory non-terminal completion_kind; project=${project}`,
      );
    }
    if (/^(?:passed|reused|not_applicable)$/.test(gateState)) {
      throw new Error(
        `product-designer SESSION persisted a completed gate without advancing its stage; project=${project}`,
      );
    }
    const gateNumber = Number(gate.slice(1));
    const expectedLastPassed = gateNumber === 0 ? "none" : `G${gateNumber - 1}`;
    if (lastPassed !== expectedLastPassed) {
      throw new Error(
        `product-designer SESSION has an invalid last_passed_gate for its current gate; project=${project}`,
      );
    }
  }
  if (designDelivery && deliveryProfile === "implementation") {
    throw new Error(
      `product-designer design-delivery terminal has an implementation delivery_profile; project=${project}`,
    );
  }
  if (implementedAndRevalidated && deliveryProfile !== "implementation") {
    throw new Error(
      `product-designer implemented terminal lacks the implementation delivery_profile; project=${project}`,
    );
  }

  if (implementedAndRevalidated) {
    const revalidation = bulletValue(
      output,
      "# Handoff",
      "Product Designer revalidation",
    );
    if (
      !revalidation ||
      /^(?:pending|not_run|needs_review)$/i.test(revalidation)
    ) {
      throw new Error(
        `product-designer implemented terminal tuple lacks completed revalidation; project=${project}`,
      );
    }
  }
  if (designDelivery) {
    const revalidation = bulletValue(
      output,
      "# Handoff",
      "Product Designer revalidation",
    );
    if (!revalidation || !/^not_applicable\(reason=.+\)$/i.test(revalidation)) {
      throw new Error(
        `product-designer design-delivery terminal tuple lacks a revalidation N/A reason; project=${project}`,
      );
    }
  }
}

function assertProductDesignerFinalAcceptanceStage(
  output: string,
  project: string,
): void {
  const frontMatter = markdownFrontMatter(output, project);
  const actual = [
    frontMatter.status,
    frontMatter.current_stage,
    frontMatter.current_gate,
    frontMatter.gate_state,
    frontMatter.last_passed_gate,
    frontMatter.completion_kind,
  ];
  const expected = [
    "paused",
    "HANDOFF",
    "G6",
    "waiting_approval",
    "G5",
    "none",
  ];
  if (actual.some((value, index) => value !== expected[index])) {
    throw new Error(
      `product-designer final acceptance did not stop at the approval-ready G6 checkpoint; project=${project}`,
    );
  }
}

function assertProductDesignerSessionStructure(
  output: string,
  template: string,
  project: string,
): void {
  if (/<!-- OPENDOCK:(?:START|END)\b/.test(output)) {
    throw new Error(
      `product-designer user SESSION copied OpenDock managed markers; project=${project}`,
    );
  }
  assertNoPersistentSensitiveData(output, project);
  const templatePayload = managedTemplatePayload(template, project);
  const outputFrontMatter = markdownFrontMatter(output, project);
  const templateFrontMatter = markdownFrontMatter(templatePayload, project);
  const outputKeys = Object.keys(outputFrontMatter).sort();
  const templateKeys = Object.keys(templateFrontMatter).sort();
  if (JSON.stringify(outputKeys) !== JSON.stringify(templateKeys)) {
    throw new Error(
      `product-designer SESSION front matter keys drifted from template; project=${project}`,
    );
  }
  for (const [key, value] of Object.entries(outputFrontMatter)) {
    if (value !== null && typeof value === "object") {
      throw new Error(
        `product-designer SESSION front matter field became nested: ${key}; project=${project}`,
      );
    }
  }
  if (outputFrontMatter.schema !== "opendock/product-designer-session/v1") {
    throw new Error(
      `product-designer SESSION schema id is invalid; project=${project}`,
    );
  }
  const exactMetadata = new Map<string, string>([
    ["workflow_revision", "opendock.product-designer-workflow@2"],
    ["protocol_revision", "opendock.product-designer-session-protocol@2"],
    ["persona", "opendock.product-designer@1"],
  ]);
  for (const [field, expected] of exactMetadata) {
    if (outputFrontMatter[field] !== expected) {
      throw new Error(
        `product-designer SESSION has invalid ${field}; project=${project}`,
      );
    }
  }
  if (
    !/^(?:greenfield|git|non_git|remote)$/.test(
      String(outputFrontMatter.project_mode ?? ""),
    ) ||
    !/^(?:none|git_ref|snapshot|scenario_document|remote_ref)$/.test(
      String(outputFrontMatter.baseline_kind ?? ""),
    ) ||
    !/^(?:read_only|snapshot|worktree|session_metadata_only|conversation_only|remote_copy)$/.test(
      String(outputFrontMatter.isolation_strategy ?? ""),
    ) ||
    typeof outputFrontMatter.isolation_approved !== "boolean"
  ) {
    throw new Error(
      `product-designer SESSION has invalid project or isolation metadata; project=${project}`,
    );
  }
  if (
    outputFrontMatter.baseline_kind === "none" &&
    outputFrontMatter.baseline_ref !== "none"
  ) {
    throw new Error(
      `product-designer SESSION has a contradictory baseline reference; project=${project}`,
    );
  }
  for (const digest of ["workflow_sha256", "protocol_sha256", "skill_sha256"]) {
    if (!/^[a-f0-9]{64}$/.test(String(outputFrontMatter[digest] ?? ""))) {
      throw new Error(
        `product-designer SESSION has invalid ${digest}; project=${project}`,
      );
    }
  }
  for (const timestamp of ["created_at", "updated_at"]) {
    const value = String(outputFrontMatter[timestamp] ?? "");
    if (!value.endsWith("Z") || !isRfc3339Instant(value)) {
      throw new Error(
        `product-designer SESSION has invalid ${timestamp}; project=${project}`,
      );
    }
  }
  if (
    !/^evt-\d{8}-\d{4}$/.test(String(outputFrontMatter.last_event_id ?? ""))
  ) {
    throw new Error(
      `product-designer SESSION has invalid last_event_id; project=${project}`,
    );
  }
  if (
    JSON.stringify(structuralHeadings(output)) !==
    JSON.stringify(structuralHeadings(templatePayload))
  ) {
    throw new Error(
      `product-designer SESSION H1/H2 structure drifted from template; project=${project}`,
    );
  }
  if (
    JSON.stringify(tableHeaders(output)) !==
    JSON.stringify(tableHeaders(templatePayload))
  ) {
    throw new Error(
      `product-designer SESSION table headers drifted from template; project=${project}`,
    );
  }
  assertManagedTableArities(output, project);
}

function assertNoPersistentSensitiveData(
  output: string,
  project: string,
): void {
  const sensitivePatterns = [
    /https?:\/\/[^\s/:@]+:[^\s/@]+@/i,
    /[?&](?:access_token|api[_-]?key|client_secret|password|secret|token)=[^\s&#]+/i,
    /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    /\b(?:sk|rk|pk)-(?:live|prod|test)?-?[A-Za-z0-9]{20,}\b/i,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b\d{6}-[1-4]\d{6}\b/,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  ];
  for (const line of output.split(/\r?\n/)) {
    if (/\bsynthetic:/i.test(line)) continue;
    if (sensitivePatterns.some((pattern) => pattern.test(line))) {
      throw new Error(
        `product-designer persistent SESSION contains unredacted sensitive data; project=${project}`,
      );
    }
  }
}

function tableRows(markdown: string, heading: string): string[][] {
  const lines = visibleSectionLines(markdown, heading);
  const header = lines.findIndex((line, index) => {
    const cells = parseMarkdownTableRow(line);
    return (
      cells !== undefined &&
      index + 1 < lines.length &&
      isMarkdownTableDelimiter(lines[index + 1], cells.length)
    );
  });
  if (header < 0) return [];
  const rows: string[][] = [];
  for (let index = header + 2; index < lines.length; index++) {
    const row = parseMarkdownTableRow(lines[index]);
    if (!row) break;
    rows.push(row);
  }
  return rows;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsCanonicalId(value: string | undefined, id: string): boolean {
  if (!value) return false;
  return new RegExp(
    `(?:^|[^A-Za-z0-9_-])${escapeRegExp(id)}(?=$|[^A-Za-z0-9_-])`,
  ).test(value);
}

function assertProductDesignerTraceability(
  output: string,
  project: string,
  expected?: string | ProductDesignerExpectedAcceptanceContext,
): void {
  const acceptanceRows = tableRows(output, "# Acceptance Contract");
  const prototypeRows = tableRows(output, "# Prototype");
  const validationRows = tableRows(output, "# Validation Log");
  if (acceptanceRows.length === 0 || prototypeRows.length === 0) {
    throw new Error(
      `product-designer SESSION lacks acceptance or prototype rows; project=${project}`,
    );
  }
  const acceptanceIds = acceptanceRows.map(([id]) => id);
  if (
    acceptanceIds.some((id) => !/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) ||
    new Set(acceptanceIds).size !== acceptanceIds.length
  ) {
    throw new Error(
      `product-designer acceptance IDs are combined, invalid, or duplicated; project=${project}`,
    );
  }
  const requiredIds = acceptanceRows
    .filter((row) => parseRequiredCell(row[2], row[0], project))
    .map(([id]) => id);
  for (const row of validationRows) {
    if (row.length !== 11) {
      throw new Error(
        `product-designer validation row does not match template columns; project=${project}`,
      );
    }
    const acceptanceId = row[3];
    if (!acceptanceIds.includes(acceptanceId)) {
      throw new Error(
        `product-designer validation references an unknown acceptance: ${acceptanceId}; project=${project}`,
      );
    }
    if (
      !row[5] ||
      !row[6] ||
      !/^(?:not_run|pass|fail|needs_review|approved_exception)$/.test(row[7])
    ) {
      throw new Error(
        `product-designer validation lacks subject revision, method, or valid status; project=${project}`,
      );
    }
    const acceptance = acceptanceRows.find(
      (candidate) => candidate[0] === acceptanceId,
    );
    const acceptanceRequired = acceptance
      ? parseRequiredCell(acceptance[2], acceptanceId, project)
      : undefined;
    const validationRequired = parseRequiredCell(row[4], acceptanceId, project);
    if (
      acceptanceRequired !== validationRequired ||
      (acceptance &&
        row[7] !== "approved_exception" &&
        !sameCanonicalProse(row[6], acceptance[3]))
    ) {
      throw new Error(
        `product-designer validation requiredness or method drifted from acceptance ${acceptanceId}; project=${project}`,
      );
    }
    if (
      /^(?:pass|approved_exception)$/.test(row[7]) &&
      (!isConcreteProductContractValue(row[8]) ||
        /^(?:invented|fabricated|banana|placeholder)(?:\s+evidence)?$/i.test(
          row[8],
        ))
    ) {
      throw new Error(
        `product-designer validation ${acceptanceId} lacks concrete evidence; project=${project}`,
      );
    }
  }
  const validationByAcceptance = foldSubjectRows(
    validationRows,
    { subject: 3, supersedes: 10 },
    "Validation Log",
    project,
  );
  for (const id of acceptanceIds) {
    if (!validationByAcceptance.has(id)) {
      throw new Error(
        `product-designer acceptance has no validation head: ${id}; project=${project}`,
      );
    }
  }
  for (const id of requiredIds) {
    const head = validationByAcceptance.get(id);
    if (!head) {
      throw new Error(
        `product-designer required acceptance has no validation event: ${id}; project=${project}`,
      );
    }
    if (!/^(?:pass|approved_exception)$/.test(head[7])) {
      throw new Error(
        `product-designer required acceptance is not delivery-ready: ${id}; project=${project}`,
      );
    }
  }
  if (
    typeof expected === "object" &&
    expected.requireUnprovenOutcomeAcceptance === true
  ) {
    const tokens = expected.unprovenOutcomeTokens ?? [];
    const metric = expected.unprovenOutcomeMetric;
    const optionalOutcome = acceptanceRows.find((row) => {
      if (parseRequiredCell(row[2], row[0], project)) return false;
      if (!/^Evidence-backed$/i.test(row[5] ?? "")) return false;
      const claim = `${row[1] ?? ""} ${row[4] ?? ""}`.toLowerCase();
      return metric
        ? [row[1] ?? "", row[4] ?? ""].some((value) =>
            matchesExpectedOutcomeMetric(value, metric),
          )
        : tokens.every((token) =>
            new RegExp(
              `(?:^|[^0-9A-Za-z])${escapeRegExp(token.toLowerCase())}(?=$|[^0-9A-Za-z])`,
            ).test(claim),
          );
    });
    const validation = optionalOutcome
      ? validationByAcceptance.get(optionalOutcome[0])
      : undefined;
    const handoff = sectionBody(output, "# Handoff");
    const handoffRecord = optionalOutcome
      ? canonicalOutcomeHandoff(handoff, optionalOutcome[0])
      : undefined;
    if (
      !optionalOutcome ||
      !validation ||
      !/^(?:not_run|needs_review)$/.test(validation[7] ?? "") ||
      !handoffRecord ||
      handoffRecord.status !== validation[7] ||
      !sameCanonicalProse(handoffRecord.owner, optionalOutcome[7]) ||
      !isCanonicalBoundedValidationPoint(
        `${handoffRecord.validationPoint}; expected_evidence=${handoffRecord.expectedEvidence}`,
        "design_interface_assumption",
      )
    ) {
      throw new Error(
        `product-designer did not preserve the unmeasured outcome as an optional Evidence-backed acceptance; project=${project}`,
      );
    }
    if (
      metric &&
      handoff
        .split(/\r?\n/)
        .some(
          (line) =>
            matchesExpectedOutcomeMagnitude(line, metric) &&
            /(?:\bproven\b|\bverified\b|\breleased\b|\bclosed\b|\bachieved\b|입증 완료|검증 완료|출시 완료|달성)/i.test(
              line,
            ) &&
            !/(?:proof=unproven|unproven|unverified|not (?:yet )?(?:validated|verified)|미입증|검증 전)/i.test(
              line,
            ),
        )
    ) {
      throw new Error(
        `product-designer handoff contradicts the unproven outcome metric; project=${project}`,
      );
    }
  }
  if (
    !requiredIds.some((id) =>
      prototypeRows.some((row) => containsCanonicalId(row[4], id)),
    )
  ) {
    throw new Error(
      `product-designer prototype does not link any required acceptance claim; project=${project}`,
    );
  }
  assertProductDesignerStructuredActionContract(
    output,
    acceptanceRows,
    prototypeRows,
    validationByAcceptance,
    typeof expected === "object" &&
      expected.requireStateChangingAction === true,
    typeof expected === "object" &&
      expected.requirePermissionRouteAssumption === true,
    typeof expected === "object" &&
      expected.requireConfirmedTerminalSuccess === true,
    project,
  );
  assertProductDesignerAccessibilityContract(
    output,
    acceptanceRows,
    prototypeRows,
    validationByAcceptance,
    typeof expected === "object" &&
      expected.requireAccessibilityContract === true,
    project,
  );
}

function matchesExpectedOutcomeMetric(
  claim: string,
  metric: NonNullable<
    ProductDesignerExpectedAcceptanceContext["unprovenOutcomeMetric"]
  >,
): boolean {
  const normalized = claim.normalize("NFKC").toLowerCase();
  const value = new RegExp(`(?:^|[^0-9])${metric.value}(?=$|[^0-9])`).test(
    normalized,
  );
  const unit =
    metric.unit === "percent"
      ? /(?:%|percent|percentage|퍼센트)/i.test(normalized)
      : new RegExp(`\\b${escapeRegExp(metric.unit)}?\\b`, "i").test(normalized);
  const direction =
    metric.direction === "decrease"
      ? /(?:decrease|reduc(?:e|es|ed|ing|tion)|lower|less|improve|improvement|감소|줄이|단축|개선)/i.test(
          normalized,
        )
      : /(?:increase|growth|raise|more|증가|늘리|향상)/i.test(normalized);
  const subject = metric.subjectTokens.some((token) =>
    normalized.includes(token.normalize("NFKC").toLowerCase()),
  );
  return value && unit && direction && subject;
}

function matchesExpectedOutcomeMagnitude(
  claim: string,
  metric: NonNullable<
    ProductDesignerExpectedAcceptanceContext["unprovenOutcomeMetric"]
  >,
): boolean {
  const normalized = claim.normalize("NFKC").toLowerCase();
  const value = new RegExp(`(?:^|[^0-9])${metric.value}(?=$|[^0-9])`).test(
    normalized,
  );
  const unit =
    metric.unit === "percent"
      ? /(?:%|percent|percentage|퍼센트)/i.test(normalized)
      : new RegExp(`\\b${escapeRegExp(metric.unit)}?\\b`, "i").test(normalized);
  const direction =
    metric.direction === "decrease"
      ? /(?:decrease|reduc(?:e|es|ed|ing|tion)|lower|less|improve|improvement|감소|줄이|단축|개선)/i.test(
          normalized,
        )
      : /(?:increase|growth|raise|more|증가|늘리|향상)/i.test(normalized);
  return value && unit && direction;
}

function sameCanonicalProse(
  left: string | undefined,
  right: string | undefined,
): boolean {
  const normalize = (value: string | undefined) =>
    (value ?? "")
      .normalize("NFKC")
      .replace(/[.!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  return normalize(left).length > 0 && normalize(left) === normalize(right);
}

function hasAffirmativeWcagConformanceClaim(value: string): boolean {
  const withoutNegatedClaims = value
    .replace(
      /\b(?:without|does not|do not|must not|cannot)\b[^\n]{0,80}\bWCAG[^\n]{0,60}(?:AA|conform\w*|complian\w*|준수|충족)?/gi,
      " ",
    )
    .replace(
      /\bWCAG[^\n]{0,60}(?:AA|conform\w*|complian\w*|준수|충족)[^\n]{0,80}\b(?:not\s+(?:claimed|proven|verified)|unproven|unverified|outside\b[^\n]{0,30}\bboundary)/gi,
      " ",
    )
    .replace(
      /\b(?:treat(?:s|ed|ing)?|frame(?:s|d|ing)?|use(?:s|d|ing)?)\s+WCAG[^\n]{0,40}\bas\s+(?:an?\s+)?(?:accessibility\s+)?structure\b/gi,
      " ",
    )
    .replace(/\bWCAG[^\n]{0,30}\b(?:design\s+)?target\b/gi, " ");
  return /(?:can be implemented to\s+WCAG|WCAG[^\n]{0,60}(?:AA|conform|compli|준수|충족)|(?:conform|compli|준수|충족)[^\n]{0,60}WCAG)/i.test(
    withoutNegatedClaims,
  );
}

function assertProductDesignerAccessibilityContract(
  output: string,
  acceptanceRows: string[][],
  prototypeRows: string[][],
  validationByAcceptance: Map<string, string[]>,
  requireAccessibilityContract: boolean,
  project: string,
): void {
  const flowRows = tableRows(output, "## Flow");
  const actionKinds = new Map(flowRows.map((row) => [row[0], row[1]]));
  const prototypeDetail = sectionBody(output, "## Prototype Detail");
  const handoff = sectionBody(output, "# Handoff");
  let qualifyingStructure = 0;
  let qualifyingConformance = 0;

  for (const acceptance of acceptanceRows) {
    const acceptanceId = acceptance[0];
    const required = parseRequiredCell(acceptance[2], acceptanceId, project);
    const validation = validationByAcceptance.get(acceptanceId);
    if (!validation) continue;
    const claimText = `${acceptance[1] ?? ""} ${acceptance[4] ?? ""}`;
    const claimKind = canonicalAssignmentValue(acceptance[3], "claim_kind");
    const checks = new Set(
      (canonicalAssignmentValue(acceptance[3], "checks") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    const promisesKeyboardPath =
      /(?:keyboard|\btab(?:bing)?\b|focus[-_ ]?order|키보드|탭\s*순서|초점\s*순서)/i.test(
        claimText,
      );
    const promisesFocusAfter =
      /(?:focus[^\n]{0,50}(?:after|return|restore|preserv)|(?:after|return|restore|preserv)[^\n]{0,50}focus|동작\s*후[^\n]{0,30}초점|초점[^\n]{0,30}(?:복귀|이동|보존))/i.test(
        claimText,
      );
    const directWcagClaim = hasAffirmativeWcagConformanceClaim(claimText);

    if (
      validation[7] === "pass" &&
      acceptance[5] === "Structure" &&
      (claimKind === "wcag_conformance" || directWcagClaim)
    ) {
      throw new Error(
        `product-designer Structure evidence cannot pass a WCAG conformance acceptance ${acceptanceId}; project=${project}`,
      );
    }
    if (
      validation[7] === "pass" &&
      (promisesKeyboardPath || promisesFocusAfter) &&
      (claimKind !== "accessibility_structure" ||
        (promisesKeyboardPath && !checks.has("keyboard_path")) ||
        (promisesFocusAfter && !checks.has("focus_after")))
    ) {
      throw new Error(
        `product-designer accessibility acceptance ${acceptanceId} makes an uncategorized keyboard or focus claim; project=${project}`,
      );
    }

    if (
      required &&
      validation[7] === "pass" &&
      claimKind === "accessibility_structure"
    ) {
      if (
        [...checks].some(
          (check) => !/^(?:keyboard_path|focus_after)$/.test(check),
        ) ||
        checks.size === 0
      ) {
        throw new Error(
          `product-designer accessibility acceptance ${acceptanceId} has invalid canonical checks; project=${project}`,
        );
      }
      assertAccessibilityPrototypeEvidence(
        acceptanceId,
        checks,
        prototypeRows,
        validation,
        prototypeDetail,
        actionKinds,
        project,
      );
      if (checks.has("keyboard_path") && checks.has("focus_after")) {
        qualifyingStructure++;
      }
    }

    if (claimKind === "wcag_conformance") {
      if (
        required ||
        !/^(?:not_run|needs_review)$/.test(validation[7]) ||
        !/^manual_and_automated_rendered$/.test(
          canonicalAssignmentValue(acceptance[3], "audit") ?? "",
        )
      ) {
        throw new Error(
          `product-designer WCAG conformance acceptance ${acceptanceId} must remain an optional rendered audit; project=${project}`,
        );
      }
      const handoffRecord = canonicalUnprovenHandoff(
        handoff,
        acceptanceId,
        "acceptance",
      );
      if (
        !handoffRecord ||
        handoffRecord.status !== validation[7] ||
        !sameCanonicalProse(handoffRecord.owner, acceptance[7])
      ) {
        throw new Error(
          `product-designer WCAG conformance acceptance ${acceptanceId} lacks an unproven handoff contract; project=${project}`,
        );
      }
      qualifyingConformance++;
    }
  }

  if (
    requireAccessibilityContract &&
    (qualifyingStructure !== 1 || qualifyingConformance !== 1)
  ) {
    throw new Error(
      `product-designer acceptance context requires one accessibility structure proof and one optional WCAG conformance audit; project=${project}`,
    );
  }
}

function canonicalUnprovenHandoff(
  handoff: string,
  acceptanceId: string,
  subjectKey: "acceptance" | "outcome",
): { status: string; owner: string } | undefined {
  for (const line of handoff.split(/\r?\n/)) {
    if (!containsCanonicalId(line, acceptanceId)) continue;
    if (hasContradictoryProofClaim(line, acceptanceId)) return undefined;
    const match = new RegExp(
      `(?:^|[\\s:])${subjectKey}=${escapeRegExp(acceptanceId)};\\s*status=(not_run|needs_review);\\s*proof=unproven;\\s*owner=([^;\\n]+);\\s*validation_point=before:[a-z0-9]+(?:-[a-z0-9]+)*;\\s*expected_evidence=([^;\\n.]+)`,
      "i",
    ).exec(line);
    if (
      match &&
      isConcreteProductContractValue(match[2]) &&
      isConcreteProductContractValue(match[3])
    ) {
      return { status: match[1].toLowerCase(), owner: match[2].trim() };
    }
  }
  return undefined;
}

function assertAccessibilityPrototypeEvidence(
  acceptanceId: string,
  checks: Set<string>,
  prototypeRows: string[][],
  validation: string[],
  prototypeDetail: string,
  actionKinds: Map<string, string>,
  project: string,
): void {
  const supportingRows = prototypeRows.filter((row) =>
    containsCanonicalId(row[4], acceptanceId),
  );
  if (supportingRows.length !== 1) {
    throw new Error(
      `product-designer accessibility acceptance ${acceptanceId} lacks one supporting Prototype artifact; project=${project}`,
    );
  }
  const prototype = supportingRows[0];
  const evidence = `${prototype[1]}@${prototype[2]}`;
  if (
    validation[5] !== prototype[2] ||
    !containsCanonicalEvidence(validation[8], evidence)
  ) {
    throw new Error(
      `product-designer accessibility acceptance ${acceptanceId} evidence does not match its Prototype artifact and revision; project=${project}`,
    );
  }

  const pathClauses = prototypeDetail.split(/\r?\n/).filter((line) => {
    return (
      hasCanonicalAssignment(line, "acceptance", acceptanceId) &&
      Boolean(canonicalAssignmentValue(line, "keyboard_path")) &&
      hasCanonicalAssignment(line, "evidence", evidence)
    );
  });
  const parsedPaths = pathClauses
    .map((line) => parseAccessibilityPath(line, actionKinds))
    .filter((path): path is string[] => Boolean(path));
  if (checks.has("keyboard_path") && parsedPaths.length !== 1) {
    throw new Error(
      `product-designer accessibility acceptance ${acceptanceId} lacks one valid keyboard_path; project=${project}`,
    );
  }

  const focusClauses = prototypeDetail
    .split(/\r?\n/)
    .filter(
      (line) =>
        hasCanonicalAssignment(line, "acceptance", acceptanceId) &&
        Boolean(canonicalAssignmentValue(line, "focus_after_action")) &&
        hasCanonicalAssignment(line, "evidence", evidence),
    )
    .map((line) => parseFocusAfterClause(line, actionKinds))
    .filter((clause): clause is { actionId: string; outcome: string } =>
      Boolean(clause),
    );
  if (checks.has("focus_after")) {
    const stateChangingActions = new Set(
      (parsedPaths[0] ?? [])
        .filter((reference) => reference.startsWith("action:"))
        .map((reference) => reference.slice("action:".length))
        .filter((actionId) => actionKinds.get(actionId) === "state_change"),
    );
    if (stateChangingActions.size === 0) {
      throw new Error(
        `product-designer accessibility acceptance ${acceptanceId} keyboard_path omits its state-changing action; project=${project}`,
      );
    }
    for (const actionId of stateChangingActions) {
      for (const outcome of ["success", "failure"]) {
        if (
          !focusClauses.some(
            (clause) =>
              clause.actionId === actionId && clause.outcome === outcome,
          )
        ) {
          throw new Error(
            `product-designer accessibility acceptance ${acceptanceId} lacks ${outcome} focus_after evidence for ${actionId}; project=${project}`,
          );
        }
      }
    }
  }
}

function parseAccessibilityPath(
  line: string,
  actionKinds: Map<string, string>,
): string[] | undefined {
  const value = canonicalAssignmentValue(line, "keyboard_path");
  if (!value) return undefined;
  const references = value.split(/\s*(?:->|→)\s*/).map((item) => item.trim());
  if (
    references.length < 2 ||
    new Set(references).size !== references.length ||
    references.some(
      (reference) => !isCanonicalAccessibilityReference(reference),
    ) ||
    references.some(
      (reference) =>
        reference.startsWith("action:") &&
        !actionKinds.has(reference.slice("action:".length)),
    )
  ) {
    return undefined;
  }
  return references;
}

function parseFocusAfterClause(
  line: string,
  actionKinds: Map<string, string>,
): { actionId: string; outcome: string } | undefined {
  const actionId = canonicalAssignmentValue(line, "focus_after_action");
  const outcome = canonicalRawAssignmentValue(line, "outcome");
  const target = canonicalAssignmentValue(line, "target");
  if (
    !actionId ||
    !actionKinds.has(actionId) ||
    !/^(?:success|failure|return)$/.test(outcome ?? "") ||
    !target ||
    !isCanonicalAccessibilityReference(target) ||
    (target.startsWith("action:") &&
      !actionKinds.has(target.slice("action:".length)))
  ) {
    return undefined;
  }
  return { actionId, outcome: outcome! };
}

function isCanonicalAccessibilityReference(value: string): boolean {
  return (
    /^action:ACT-[A-Za-z0-9_-]+$/.test(value) ||
    /^target:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

function containsCanonicalEvidence(
  value: string | undefined,
  evidence: string,
): boolean {
  return Boolean(
    value
      ?.split(/\s*;\s*/)
      .some(
        (token) =>
          token === evidence ||
          token === `evidence=${evidence}` ||
          token === `prototype=${evidence}`,
      ),
  );
}

function canonicalOutcomeHandoff(
  handoff: string,
  acceptanceId: string,
):
  | {
      status: string;
      outcome: string;
      owner: string;
      validationPoint: string;
      expectedEvidence: string;
    }
  | undefined {
  for (const line of handoff.split(/\r?\n/)) {
    if (!containsCanonicalId(line, acceptanceId)) continue;
    if (hasContradictoryProofClaim(line, acceptanceId)) return undefined;
    const match = new RegExp(
      `(?:^|[\\s:])outcome=${escapeRegExp(acceptanceId)};\\s*status=(not_run|needs_review);\\s*proof=unproven;\\s*owner=([^;\\n]+);\\s*(validation_point=before:[a-z0-9]+(?:-[a-z0-9]+)*);\\s*expected_evidence=([^;\\n.]+)`,
      "i",
    ).exec(line);
    if (match && isConcreteProductContractValue(match[4])) {
      return {
        status: match[1].toLowerCase(),
        outcome: acceptanceId,
        owner: match[2].trim(),
        validationPoint: match[3].toLowerCase(),
        expectedEvidence: match[4].trim(),
      };
    }
  }
  return undefined;
}

function hasContradictoryProofClaim(value: string, subjectId: string): boolean {
  return (
    /(?:proof=unproven|unproven|unverified|not (?:yet )?(?:validated|verified)|미입증|검증 전)/i.test(
      value,
    ) &&
    new RegExp(
      `${escapeRegExp(subjectId)}\\s+(?:is|was|=|는|은)?\\s*(?:fully\\s+)?(?:proven|verified|validated in production|released|closed|입증 완료|검증 완료|출시 완료)`,
      "i",
    ).test(value.replace(/proof=unproven/gi, ""))
  );
}

function assertProductDesignerStructuredActionContract(
  output: string,
  acceptanceRows: string[][],
  prototypeRows: string[][],
  validationByAcceptance: Map<string, string[]>,
  requireStateChangingAction: boolean,
  requirePermissionRouteAssumption: boolean,
  requireConfirmedTerminalSuccess: boolean,
  project: string,
): void {
  const flowRows = tableRows(output, "## Flow");
  const dataRows = tableRows(output, "## Content and Data Contract");
  if (flowRows.length === 0) {
    throw new Error(
      `product-designer Flow lacks a structured action contract; project=${project}`,
    );
  }
  if (dataRows.length === 0) {
    throw new Error(
      `product-designer Content and Data Contract lacks structured rows; project=${project}`,
    );
  }

  const actionIds = new Set<string>();
  const stateChangingRows: string[][] = [];
  for (const row of flowRows) {
    if (row.length !== 10) {
      throw new Error(
        `product-designer Flow row must have exactly 10 cells; project=${project}`,
      );
    }
    const [actionId, kind] = row;
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(actionId) || actionIds.has(actionId)) {
      throw new Error(
        `product-designer Flow has an invalid or duplicated Action ID: ${actionId || "<empty>"}; project=${project}`,
      );
    }
    actionIds.add(actionId);
    if (!/^(?:state_change|navigation|read)$/.test(kind)) {
      throw new Error(
        `product-designer Flow has an invalid Kind for ${actionId}; project=${project}`,
      );
    }
    if (kind === "state_change") stateChangingRows.push(row);
  }
  if (requireStateChangingAction && stateChangingRows.length === 0) {
    throw new Error(
      `product-designer acceptance context requires a state_change action; project=${project}`,
    );
  }
  for (const row of flowRows.filter(
    (candidate) => candidate[1] !== "state_change",
  )) {
    const actor = canonicalAssignmentValue(row[2], "actor");
    const eligibility = canonicalAssignmentValue(row[2], "eligibility");
    if (
      !actor ||
      !eligibility ||
      row
        .slice(3, 9)
        .some(
          (cell) =>
            /^(?:unknown|pending|tbd|todo|backend_decides)$/i.test(cell) ||
            !cell.trim(),
        )
    ) {
      throw new Error(
        `product-designer ${row[1]} action ${row[0]} lacks a bounded read or navigation contract; project=${project}`,
      );
    }
  }

  const acceptanceById = new Map(acceptanceRows.map((row) => [row[0], row]));
  const contractIds = new Set<string>();
  const criticalContracts: string[][] = [];
  for (const row of dataRows) {
    if (row.length !== 12) {
      throw new Error(
        `product-designer Content and Data Contract row must have exactly 12 cells; project=${project}`,
      );
    }
    const [contractId, , flowCritical] = row;
    if (
      !/^[A-Za-z][A-Za-z0-9_-]*$/.test(contractId) ||
      contractIds.has(contractId)
    ) {
      throw new Error(
        `product-designer Content and Data Contract has an invalid or duplicated Contract ID: ${contractId || "<empty>"}; project=${project}`,
      );
    }
    contractIds.add(contractId);
    if (!/^(?:yes|true|no|false|예|아니요)$/i.test(flowCritical)) {
      throw new Error(
        `product-designer data contract has invalid Flow critical for ${contractId}; project=${project}`,
      );
    }
    if (/^(?:yes|true|예)$/i.test(flowCritical)) criticalContracts.push(row);
  }

  for (const row of criticalContracts) {
    assertFlowCriticalDataContract(row, output, project);
  }
  for (const row of stateChangingRows) {
    assertStateChangingActionContract(
      row,
      criticalContracts,
      acceptanceById,
      prototypeRows,
      validationByAcceptance,
      project,
    );
  }
  if (requireConfirmedTerminalSuccess) {
    assertConfirmedTerminalLinkage(
      output,
      stateChangingRows,
      criticalContracts,
      project,
    );
  }
  if (requirePermissionRouteAssumption) {
    const permissionRoutes = flowRows.filter(
      (row) =>
        row[1] === "navigation" &&
        canonicalAssignmentValue(row.slice(2, 9).join("; "), "route_kind") ===
          "permission",
    );
    const permissionStateRows = tableRows(output, "## State Matrix").filter(
      (row) =>
        row[0] === "permission" && /^(?:yes|true|예)$/i.test(row[1] ?? ""),
    );
    const prototype = sectionBody(output, "# Prototype");
    if (
      permissionRoutes.length === 0 ||
      permissionRoutes.some((route) => {
        const capabilityAction = canonicalAssignmentValue(
          route.slice(2, 9).join("; "),
          "permission_for",
        );
        return (
          !capabilityAction ||
          !stateChangingRows.some((action) => action[0] === capabilityAction) ||
          !criticalContracts.some(
            (contract) =>
              contract[9] === "design_interface_assumption" &&
              canonicalActionReferences(contract[1]).includes(route[0]),
          ) ||
          !permissionStateRows.some(
            (state) =>
              hasCanonicalAssignment(
                state[2],
                "capability_action",
                capabilityAction,
              ) &&
              hasCanonicalAssignment(state[2], "next_route_action", route[0]),
          ) ||
          !hasCanonicalAssignment(
            prototype,
            "permission_route_action",
            route[0],
          )
        );
      }) ||
      permissionStateRows.length === 0
    ) {
      throw new Error(
        `product-designer permission route is ambiguous or lacks a flow-critical design interface assumption; project=${project}`,
      );
    }
  }
}

function canonicalActionReferences(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...value.matchAll(/(?:^|[;,]\s*)action:([A-Za-z][A-Za-z0-9_-]*)/g),
  ].map((match) => match[1]);
}

function canonicalBindingReferences(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...value.matchAll(/(?:^|[;,]\s*)binding:([A-Za-z][A-Za-z0-9_.-]*)/g),
  ].map((match) => match[1]);
}

function hasCanonicalAssignment(
  value: string | undefined,
  key: string,
  expectedValue: string,
): boolean {
  if (!value) return false;
  return new RegExp(
    `(?:^|[;\\s])${escapeRegExp(key)}=${escapeRegExp(expectedValue)}(?=$|[;,.\\s])`,
  ).test(value);
}

function assertConfirmedTerminalLinkage(
  output: string,
  stateChangingRows: string[][],
  criticalContracts: string[][],
  project: string,
): void {
  const successStates = tableRows(output, "## State Matrix").filter(
    (row) => row[0] === "success" && /^(?:yes|true|예)$/i.test(row[1] ?? ""),
  );
  const prototype = [
    ...tableRows(output, "# Prototype").map((row) => row[4]),
    sectionBody(output, "## Prototype Detail"),
  ].join("\n");
  for (const action of stateChangingRows) {
    const actionId = action[0];
    const targetIdentity = canonicalAssignmentValue(
      action[4],
      "target_identity",
    )?.replace(/^binding:/, "");
    const actionContracts = criticalContracts.filter((contract) =>
      canonicalActionReferences(contract[1]).includes(actionId),
    );
    const terminalSuccess = canonicalAssignmentValue(
      action[6],
      "terminal_success_when",
    );
    const transition = canonicalAssignmentValue(action[8], "transition");
    const terminalBranches = (transition?.split(/\s*(?:->|→)\s*/).at(-1) ?? "")
      .split(/\s+(?:or|또는)\s+/i)
      .map((value) => value.trim())
      .filter(Boolean);
    const successTerminal = terminalBranches[0];
    const acknowledgement = canonicalAssignmentValue(
      action[5],
      "acknowledgement_only_when",
    );
    const stateTerminalValues = successStates
      .map((row) => canonicalAssignmentValue(row[2], "terminal_success_when"))
      .filter((value): value is string => Boolean(value));
    const prototypeTerminalValues = canonicalAssignmentValues(
      prototype,
      "terminal_success_when",
    );
    const prototypeAcknowledgements = canonicalAssignmentValues(
      prototype,
      "acknowledgement_only_when",
    );
    const mentionsAcknowledgementResponse =
      /(?:accepted|submitted|queued)\s+(?:response|acknowledgement)|acknowledgement\s+(?:response|event)/i.test(
        `${action[5]} ${action[6]} ${prototype}`,
      );
    const terminalSurfaceText = [
      terminalSuccess,
      ...stateTerminalValues,
      ...prototypeTerminalValues,
    ].join("\n");
    const prototypeControlLines = prototype
      .split(/\r?\n/)
      .filter((line) =>
        hasCanonicalAssignment(line, "capability_action", actionId),
      );
    if (
      !terminalSuccess ||
      !hasPositiveConfirmedTerminalSuccess(terminalSuccess, successTerminal) ||
      !targetIdentity ||
      !actionContracts.some((contract) => {
        const bindings = canonicalBindingReferences(contract[1]);
        return (
          bindings.includes(targetIdentity) &&
          bindings.some(
            (binding) =>
              binding !== targetIdentity &&
              containsCanonicalPath(terminalSuccess, binding),
          )
        );
      }) ||
      stateTerminalValues.length === 0 ||
      stateTerminalValues.some(
        (value) => !sameCanonicalProse(value, terminalSuccess),
      ) ||
      !prototypeTerminalValues.some((value) =>
        sameCanonicalProse(value, terminalSuccess),
      ) ||
      /(?:\bor\b|\beither\b|또는)/i.test(terminalSurfaceText) ||
      !prototypeControlLines.some((line) =>
        /(?:^|[;\s])control=disabled(?=$|[;,.\s])/i.test(line),
      ) ||
      (mentionsAcknowledgementResponse &&
        (!acknowledgement ||
          !prototypeAcknowledgements.some((value) =>
            sameCanonicalProse(acknowledgement, value),
          ) ||
          !isPositiveNonterminalAcknowledgement(acknowledgement) ||
          sameCanonicalProse(acknowledgement, terminalSuccess)))
    ) {
      throw new Error(
        `product-designer state_change ${actionId} lacks structured non-negated confirmed terminal success linkage (terminal=${terminalSuccess ?? "missing"}; target=${targetIdentity ?? "missing"}; contracts=${actionContracts.length}; states=${stateTerminalValues.length}; prototype=${prototypeTerminalValues.length}; controls=${prototypeControlLines.length}; acknowledgement=${acknowledgement ?? "none"}); project=${project}`,
      );
    }
  }
}

function canonicalAssignmentValues(value: string, key: string): string[] {
  const results: string[] = [];
  for (const line of value.split(/\r?\n/)) {
    const parsed = canonicalAssignmentValue(line, key);
    if (parsed) results.push(parsed);
  }
  return results;
}

function containsCanonicalPath(value: string, path: string): boolean {
  return new RegExp(
    `(?:^|[^A-Za-z0-9_.-])${escapeRegExp(path)}(?=$|[^A-Za-z0-9_.-])`,
  ).test(value);
}

function canonicalAssignmentValue(
  value: string | undefined,
  key: string,
): string | undefined {
  const result = canonicalRawAssignmentValue(value, key);
  return result && isConcreteProductContractValue(result) ? result : undefined;
}

function canonicalRawAssignmentValue(
  value: string | undefined,
  key: string,
): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/^\s*(?:[-*+]\s+)?/, "");
  const match = new RegExp(
    `(?:^|[;.:]\\s*)${escapeRegExp(key)}=([^;\\n]+?)(?=\\s*(?:;|$))`,
    "i",
  ).exec(normalized);
  const result = match?.[1]?.trim();
  return result || undefined;
}

function isPositiveNonterminalAcknowledgement(value: string): boolean {
  const withoutTerminalQualification = value.replace(
    /(?:(?:without (?:a )?(?:confirmed )?|before )terminal confirmation|while terminal confirmation is (?:still )?pending)/gi,
    "",
  );
  return (
    /(?:accepted|submitted|queued|acknowledged|processing|retrying|in[ -]?progress|접수|제출|대기열|처리 중|재시도 중|진행 중)/i.test(
      value,
    ) &&
    !/(?:not|without|unconfirmed|미접수|접수되지 않)/i.test(
      withoutTerminalQualification,
    ) &&
    !/(?:terminal|succeeded|success|complete|done|최종|성공|완료)/i.test(
      withoutTerminalQualification,
    )
  );
}

function hasPositiveConfirmedTerminalSuccess(
  value: string | undefined,
  successTerminal?: string,
): boolean {
  if (!value) return false;
  if (
    (successTerminal &&
      new RegExp(`\\bnot\\s+${escapeRegExp(successTerminal)}\\b`, "i").test(
        value,
      )) ||
    /(?:not (?:yet )?(?:confirmed|terminal)|without (?:a )?(?:confirmed|terminal)|unconfirmed|unverified|미확인|확인되지 않)/i.test(
      value,
    )
  ) {
    return false;
  }
  return (
    !/(?:\bor\b|\beither\b|또는)/i.test(value) &&
    Boolean(successTerminal) &&
    containsCanonicalPath(
      value.toLowerCase(),
      successTerminal!.toLowerCase(),
    ) &&
    /(?:changes?\s+to|updates?\s+to|resolves?\s+to|becomes?|equals?|confirm(?:ed|s)?|(?:state|status)\s*(?:=|\bis\s+(?!not\b))|binding:[A-Za-z][A-Za-z0-9_.-]*\s*=|(?:is|was)\s+observed\s+as|event\s+is|emits?|returns?|확정|변경|전환|된다|됨)/i.test(
      value,
    )
  );
}

function assertStateChangingActionContract(
  row: string[],
  criticalContracts: string[][],
  acceptanceById: Map<string, string[]>,
  prototypeRows: string[][],
  validationByAcceptance: Map<string, string[]>,
  project: string,
): void {
  const [
    actionId,
    ,
    actorEligibility,
    precondition,
    singleSubmission,
    progressControl,
    success,
    failureRecovery,
    transition,
    acceptanceCell,
  ] = row;
  const concreteFields = [
    ["actor eligibility", actorEligibility],
    ["precondition", precondition],
    ["success", success],
  ] as const;
  for (const [label, value] of concreteFields) {
    if (!isConcreteProductContractValue(value)) {
      throw new Error(
        `product-designer state_change ${actionId} lacks a concrete ${label}; project=${project}`,
      );
    }
  }
  const actor = canonicalAssignmentValue(actorEligibility, "actor");
  const eligibility =
    canonicalAssignmentValue(actorEligibility, "eligibility") ??
    canonicalAssignmentValue(actorEligibility, "eligible_when");
  if (!actor || !eligibility) {
    throw new Error(
      `product-designer state_change ${actionId} lacks concrete actor eligibility; project=${project}`,
    );
  }
  if (
    /^(?:banana|everyone|anyone|someone|all users|아무나|모두)$/i.test(actor) ||
    /^(?:banana|anything|always|whatever|조건 없음)$/i.test(eligibility) ||
    /^(?:banana|anything|always|whatever|precondition|banana precondition)$/i.test(
      precondition,
    )
  ) {
    throw new Error(
      `product-designer state_change ${actionId} has an unbounded actor, eligibility, or precondition; project=${project}`,
    );
  }
  const submissionScope = canonicalAssignmentValue(
    singleSubmission,
    "submission_scope",
  );
  const duplicatePolicy = canonicalAssignmentValue(
    singleSubmission,
    "duplicate_policy",
  );
  const targetIdentityValue = canonicalAssignmentValue(
    singleSubmission,
    "target_identity",
  );
  const targetIdentity = /^binding:([A-Za-z][A-Za-z0-9_.-]*)$/.exec(
    targetIdentityValue ?? "",
  )?.[1];
  if (
    submissionScope !== "one_intent" ||
    !duplicatePolicy ||
    /^(?:none|allow(?:ed)?|not_applicable)(?:\b|\()|(?:send|submit|process).*(?:twice|multiple|repeated)/i.test(
      duplicatePolicy,
    ) ||
    !targetIdentity ||
    !/(?:^|[._-])(?:id|identifier|key|identity)$/i.test(targetIdentity)
  ) {
    throw new Error(
      `product-designer state_change ${actionId} lacks one-intent/one-submission duplicate prevention; project=${project}`,
    );
  }
  const inProgressControl = canonicalAssignmentValue(
    progressControl,
    "in_progress_control",
  );
  const feedback = canonicalAssignmentValue(progressControl, "feedback");
  if (
    inProgressControl !== "disabled" ||
    !feedback ||
    /^(?:banana|feedback|processing)$/i.test(feedback) ||
    !/(?:show|display|render|announce|status|progress|spinner|message|label|표시|노출|알림|상태|진행|문구)/i.test(
      feedback,
    )
  ) {
    throw new Error(
      `product-designer state_change ${actionId} lacks in-progress feedback and duplicate control; project=${project}`,
    );
  }
  if (
    !isConcreteProductContractValue(failureRecovery) ||
    !/(?:fail|error|failure|실패|오류)/i.test(failureRecovery) ||
    !/(?:recover|retry|restore|preserve|return|resume|복구|재시도|보존|되돌|재개)/i.test(
      failureRecovery,
    ) ||
    failureRecovery.trim().split(/\s+/).length < 5
  ) {
    throw new Error(
      `product-designer state_change ${actionId} lacks concrete failure recovery; project=${project}`,
    );
  }
  const transitionValue = canonicalAssignmentValue(transition, "transition");
  const states = (transitionValue ?? "")
    .split(/\s*(?:->|→)\s*/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    states.length < 3 ||
    states.some((value) => !isConcreteProductContractValue(value)) ||
    new Set(states.map((value) => value.toLowerCase())).size !==
      states.length ||
    (states
      .at(-1)
      ?.split(/\s+(?:or|또는)\s+/i)
      .filter(Boolean).length ?? 0) < 2
  ) {
    throw new Error(
      `product-designer state_change ${actionId} lacks a start-to-processing-to-terminal transition; project=${project}`,
    );
  }

  if (
    !/^ACC-[A-Za-z0-9_-]+(?:\s*,\s*ACC-[A-Za-z0-9_-]+)*$/.test(acceptanceCell)
  ) {
    throw new Error(
      `product-designer state_change ${actionId} has invalid Required Acceptance IDs; project=${project}`,
    );
  }
  const acceptanceIds = acceptanceCell.split(/\s*,\s*/);
  if (new Set(acceptanceIds).size !== acceptanceIds.length) {
    throw new Error(
      `product-designer state_change ${actionId} duplicates a Required Acceptance ID; project=${project}`,
    );
  }
  const reverseReferenceIds = new Set(
    [...acceptanceById.entries()]
      .filter(
        ([acceptanceId, acceptance]) =>
          parseRequiredCell(acceptance[2], acceptanceId, project) &&
          containsCanonicalId(
            `${acceptance[1] ?? ""} ${acceptance[4] ?? ""}`,
            actionId,
          ),
      )
      .map(([acceptanceId]) => acceptanceId),
  );
  if (!sameStringSet(new Set(acceptanceIds), reverseReferenceIds)) {
    throw new Error(
      `product-designer state_change ${actionId} Required and Acceptance reverse-reference ID sets differ; project=${project}`,
    );
  }
  for (const acceptanceId of acceptanceIds) {
    const acceptance = acceptanceById.get(acceptanceId);
    if (!acceptance) {
      throw new Error(
        `product-designer state_change ${actionId} references unknown acceptance ${acceptanceId}; project=${project}`,
      );
    }
    if (!parseRequiredCell(acceptance[2], acceptanceId, project)) {
      throw new Error(
        `product-designer state_change ${actionId} references optional acceptance ${acceptanceId}; project=${project}`,
      );
    }
    if (!containsCanonicalId(`${acceptance[1]} ${acceptance[4]}`, actionId)) {
      throw new Error(
        `product-designer acceptance ${acceptanceId} is not explicitly bound to state_change ${actionId}; project=${project}`,
      );
    }
    if (
      !isBoundedAcceptanceStatement(acceptance[1], actionId) ||
      !isBoundedAcceptanceStatement(acceptance[4], actionId)
    ) {
      throw new Error(
        `product-designer acceptance ${acceptanceId} lacks a bounded claim or threshold for ${actionId}; project=${project}`,
      );
    }
    const validation = validationByAcceptance.get(acceptanceId);
    if (!validation || !/^(?:pass|approved_exception)$/.test(validation[7])) {
      throw new Error(
        `product-designer state_change ${actionId} acceptance ${acceptanceId} is not currently delivery-ready; project=${project}`,
      );
    }
  }
  const prototypeSupports = prototypeRows.flatMap((prototype) =>
    canonicalPrototypeSupport(prototype[4]).filter(
      (support) => support.actionId === actionId,
    ),
  );
  if (
    prototypeSupports.length !== 1 ||
    !sameStringSet(
      new Set(acceptanceIds),
      new Set(prototypeSupports[0]?.acceptanceIds ?? []),
    )
  ) {
    throw new Error(
      `product-designer prototype support set does not exactly match ${actionId} Required Acceptance IDs; project=${project}`,
    );
  }
  if (!isBoundedAcceptanceStatement(prototypeSupports[0]?.claim, actionId)) {
    throw new Error(
      `product-designer prototype support for ${actionId} lacks a bounded claim; project=${project}`,
    );
  }
  assertDestructiveActionSafety(row, project);
  const actionContracts = criticalContracts.filter((contract) =>
    canonicalActionReferences(contract[1]).includes(actionId),
  );
  if (
    !actionContracts.some((contract) =>
      canonicalBindingReferences(contract[1]).includes(targetIdentity),
    )
  ) {
    throw new Error(
      `product-designer state_change ${actionId} lacks a stable target identity binding; project=${project}`,
    );
  }
  if (actionContracts.length === 0) {
    throw new Error(
      `product-designer state_change ${actionId} lacks a flow-critical data contract; project=${project}`,
    );
  }
}

function isBoundedAcceptanceStatement(
  value: string | undefined,
  actionId: string,
): boolean {
  if (!isConcreteProductContractValue(value)) return false;
  const withoutIds = (value ?? "")
    .replace(new RegExp(`\\b${escapeRegExp(actionId)}\\b`, "g"), " ")
    .replace(/\bACC-[A-Za-z0-9_-]+\b/g, " ")
    .replace(/[^\p{L}\p{N}_-]+/gu, " ")
    .trim();
  const terms = withoutIds.split(/\s+/).filter(Boolean);
  return (
    terms.length >= 3 &&
    !/^(?:banana|generic|placeholder)(?:\s+(?:banana|generic|placeholder|claim|threshold))*$/i.test(
      withoutIds,
    )
  );
}

function assertDestructiveActionSafety(row: string[], project: string): void {
  const [actionId, , , precondition] = row;
  const destructive =
    canonicalRawAssignmentValue(precondition, "risk_class") === "destructive" ||
    /(?:delete|destroy|erase|purge|revoke|remove-account|삭제|파기|폐기|영구 제거)/i.test(
      `${actionId} ${precondition}`,
    );
  if (!destructive) return;
  const confirmation = canonicalAssignmentValue(precondition, "confirmation");
  const reauthentication = canonicalAssignmentValue(
    precondition,
    "reauthentication",
  );
  const undoPolicy = canonicalAssignmentValue(precondition, "undo_policy");
  const retentionPolicy = canonicalAssignmentValue(
    precondition,
    "retention_policy",
  );
  if (
    !confirmation ||
    /^(?:none|no|not_applicable)/i.test(confirmation) ||
    !reauthentication ||
    !undoPolicy ||
    /^(?:none|unknown|tbd)$/i.test(undoPolicy) ||
    !retentionPolicy ||
    /^(?:none|unknown|tbd)$/i.test(retentionPolicy) ||
    /(?:\bor\b|또는)/i.test(`${confirmation} ${undoPolicy} ${retentionPolicy}`)
  ) {
    throw new Error(
      `product-designer destructive action ${actionId} lacks confirmation, reauthentication, undo, or retention safety; project=${project}`,
    );
  }
}

function sameStringSet(left: Set<string>, right: Set<string>): boolean {
  return (
    left.size === right.size && [...left].every((value) => right.has(value))
  );
}

function canonicalPrototypeSupport(value: string | undefined): Array<{
  actionId: string;
  acceptanceIds: string[];
  claim: string;
}> {
  if (!value) return [];
  const supports: Array<{
    actionId: string;
    acceptanceIds: string[];
    claim: string;
  }> = [];
  for (const match of value.matchAll(
    /(?:^|[.;]\s*)action=(ACT-[A-Za-z0-9_-]+);\s*acceptance_set=([^;\n]+);\s*claim=(.+?)(?=(?:[.;]\s*)action=ACT-[A-Za-z0-9_-]+;|$)/g,
  )) {
    const acceptanceIds = match[2]
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (
      acceptanceIds.length === 0 ||
      acceptanceIds.some((id) => !/^ACC-[A-Za-z0-9_-]+$/.test(id)) ||
      new Set(acceptanceIds).size !== acceptanceIds.length ||
      !isConcreteProductContractValue(match[3])
    ) {
      continue;
    }
    supports.push({
      actionId: match[1],
      acceptanceIds,
      claim: match[3].trim(),
    });
  }
  return supports;
}

function assertFlowCriticalDataContract(
  row: string[],
  output: string,
  project: string,
): void {
  const [
    contractId,
    binding,
    ,
    source,
    freshness,
    readActor,
    writeActor,
    nullMeaning,
    fallback,
    status,
    owner,
    validationPoint,
  ] = row;
  for (const [label, value] of [
    ["binding or action", binding],
    ["source/interface", source],
    ["freshness", freshness],
    ["read actor", readActor],
    ["write actor", writeActor],
    ["null meaning", nullMeaning],
    ["safe visible fallback", fallback],
    ["owner", owner],
    ["validation point", validationPoint],
  ] as const) {
    if (!isConcreteProductContractValue(value)) {
      throw new Error(
        `product-designer flow-critical contract ${contractId} lacks a concrete ${label}; project=${project}`,
      );
    }
  }
  if (!/^(?:fact|design_interface_assumption)$/.test(status)) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} has unresolved status; project=${project}`,
    );
  }
  if (
    /^(?:(?:the\s+)?(?:backend\s+)?api(?:\s+(?:endpoint|interface))?|backend|database(?:\s+table)?|db|server|source|interface|system|data|백엔드|서버|데이터)$/i.test(
      source.trim(),
    ) ||
    /(?:backend decides|decided by backend|백엔드에서 (?:정함|결정)|서버에서 (?:정함|결정))/i.test(
      source,
    )
  ) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} has an unbounded source/interface; project=${project}`,
    );
  }
  if (
    /^(?:on load|when ready|when available|later|as needed|로드 시|준비되면)$/i.test(
      freshness.trim(),
    ) ||
    !/(?:\d|revision|version|load|open|render|refresh|request|response|submit|success|failure|session|checkpoint|event|poll|cache|change|on\b|after\b|before\b|when\b|whenever\b|until\b|마다|시점|시\b|때|후|전|요청|응답|렌더|새로고침|로드|성공|실패|세션|체크포인트)/i.test(
      freshness,
    )
  ) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} has a generic freshness rule; project=${project}`,
    );
  }
  if (
    /^(?:user|actor|role|team|everyone|anyone|all|사용자|담당자|역할|팀|누구나|모두)$/i.test(
      readActor,
    ) ||
    /^(?:user|actor|role|team|everyone|anyone|all|사용자|담당자|역할|팀|누구나|모두)$/i.test(
      writeActor,
    )
  ) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} lacks explicit actors; project=${project}`,
    );
  }
  if (
    /^(?:owner|team|(?:product|backend|frontend|engineering|design)(?: team)?|담당자|팀|제품 팀|백엔드(?: 팀)?|프론트엔드(?: 팀)?|엔지니어링(?: 팀)?|디자인(?: 팀)?|제품)$/i.test(
      owner.trim(),
    )
  ) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} lacks a concrete owner; project=${project}`,
    );
  }
  if (
    !/^null_means=\S.+/i.test(nullMeaning.trim()) ||
    /null_means=[^;\n]*(?:(?:has\s+)?no errors?\b|nothing is wrong)/i.test(
      nullMeaning,
    ) ||
    !/(?:null|absent|missing|unrecognized|unavailable|unresolved|\bunknown\b|not (?:yet )?(?:known|resolved|determined|loaded|available|received|present|returned)|cannot (?:be )?(?:(?:safely|reliably|currently)\s+)?(?:confirm(?:ed)?|resolve(?:d)?|determine(?:d)?|identif(?:y|ied)|load(?:ed)?|find|found|match(?:ed)?)|has\s+no\s+[a-z][a-z0-9 _.-]{2,}|no\s+[a-z][a-z0-9 _.-]*\s+(?:(?:is|are)\s+(?:currently\s+)?(?:configured|available|present|returned|bound|selected|loaded|resolved)|(?:currently\s+)?(?:require|need|exist|remain|match|qualify))|없|누락|미수신|미로딩|인식할 수 없)/i.test(
      nullMeaning.slice("null_means=".length),
    )
  ) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} lacks an explicit null meaning; project=${project}`,
    );
  }
  if (
    !/(?:show|display|render|hide|disable|read-only|message|retain|preserve|restore|return|expose|route|never remove|(?:policy|denial) copy|remain(?:s|ing)?\s+(?:visible|hidden|disabled|read-only)|keep\b.{0,120}\b(?:visible|hidden|disabled|read-only|context|state|presentation)|표시|노출|숨김|비활성|조회 전용|안내|유지|보존|복원|되돌|이동)/i.test(
      fallback,
    ) ||
    (/(?:missing|null|unrecognized|unknown|absent|누락|없|미확인)/i.test(
      nullMeaning,
    ) &&
      /(?:show|display|claim).*(?:success|complete)|keep.*(?:enabled|활성)|성공.*표시|활성.*유지/i.test(
        fallback,
      ))
  ) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} lacks a safe visible fallback; project=${project}`,
    );
  }
  if (!isCanonicalBoundedValidationPoint(validationPoint, status)) {
    throw new Error(
      `product-designer flow-critical contract ${contractId} lacks a bounded validation point; project=${project}`,
    );
  }
  if (status === "design_interface_assumption") {
    const handoff = sectionBody(output, "# Handoff");
    const assumptionRisk = handoff
      .split(/\r?\n/)
      .find(
        (line) =>
          line.includes(contractId) &&
          !hasContradictoryProofClaim(line, contractId) &&
          /(?:unproven|unverified|not (?:yet )?validated|not (?:yet )?verified|assumption|미입증|검증 전|가정)/i.test(
            line,
          ),
      );
    if (!assumptionRisk || !assumptionRisk.includes(validationPoint)) {
      throw new Error(
        `product-designer flow-critical assumption ${contractId} is not preserved as unproven through its validation point; project=${project}`,
      );
    }
  } else {
    const factPoint =
      /^validation_point=gate:G[0-6]; evidence=(EVD-[A-Za-z0-9_-]+)$/i.exec(
        validationPoint,
      );
    let evidence: string[] | undefined;
    if (factPoint) {
      evidence = tableRows(output, "# Evidence Register").find(
        (candidate) => candidate[0] === factPoint[1],
      );
      if (!evidence || !/^(?:current|verified)$/i.test(evidence[6] ?? "")) {
        throw new Error(
          `product-designer flow-critical fact ${contractId} references missing or non-current gate evidence; project=${project}`,
        );
      }
    }
    if (evidence) {
      const evidenceText = `${evidence[2] ?? ""} ${evidence[4] ?? ""}`;
      const runtimeClaims = [source, writeActor].filter((value) =>
        /\b(?:api|endpoint|interface|payload|command|query|database|table|service|system|store|queue|topic|stream)\b|(?:API|엔드포인트|인터페이스|페이로드|명령|쿼리|데이터베이스|테이블|서비스|시스템|저장소|큐|토픽|스트림)/i.test(
          value,
        ),
      );
      if (
        runtimeClaims.some(
          (claim) =>
            !evidenceText
              .normalize("NFKC")
              .toLowerCase()
              .includes(claim.normalize("NFKC").toLowerCase()),
        )
      ) {
        throw new Error(
          `product-designer flow-critical fact ${contractId} invents runtime provenance beyond its cited evidence; project=${project}`,
        );
      }
    }
  }
}

function isCanonicalBoundedValidationPoint(
  value: string | undefined,
  status: "fact" | "design_interface_assumption" | string,
): boolean {
  if (!value) return false;
  const normalized = value.replace(/[`*]/g, " ").replace(/\s+/g, " ").trim();
  if (status === "fact") {
    const match = /^validation_point=gate:(G[0-6]); evidence=(.+)$/i.exec(
      normalized,
    );
    return Boolean(
      match &&
      (/^EVD-[A-Za-z0-9_-]+$/i.test(match[2].trim()) ||
        (/(?:revision|SHA-?256)/i.test(match[2]) &&
          !/^(?:revision|SHA-?256)$/i.test(match[2].trim()))),
    );
  }
  const match =
    /^validation_point=before:([a-z0-9]+(?:-[a-z0-9]+)*); expected_evidence=(.+)$/i.exec(
      normalized,
    );
  return Boolean(
    match &&
    isConcreteProductContractValue(match[2]) &&
    !/^(?:banana(?: banana)?|some evidence|proof later)$/i.test(
      match[2].trim(),
    ) &&
    !/^(?:evidence|artifact|document|contract|interface|result|proof|근거|문서|결과)$/i.test(
      match[2].trim(),
    ),
  );
}

function isConcreteProductContractValue(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.replace(/[`*_]/g, " ").replace(/\s+/g, " ").trim();
  return (
    normalized.length >= 4 &&
    !/^(?:unknown|pending|tbd|todo|n\/?a|not_applicable(?:\([^)]*\))?|backend|backend decides|as needed|later|generic|success|successful|failure|recovery|precondition(?: met)?|condition(?:s)?(?: met)?|미정|보류|나중에|백엔드에서 정함|조건 충족|성공|실패|복구)$/i.test(
      normalized,
    ) &&
    !/(?:backend decides|decided by backend|백엔드에서 (?:정함|결정)|owner만|fallback 없는)/i.test(
      normalized,
    )
  );
}

function parseRequiredCell(
  value: string | undefined,
  acceptanceId: string | undefined,
  project: string,
): boolean {
  if (/^(?:yes|true|required|예|필수)$/i.test(value ?? "")) return true;
  if (/^(?:no|false|optional|아니요|선택)$/i.test(value ?? "")) return false;
  throw new Error(
    `product-designer acceptance has invalid required value for ${acceptanceId ?? "<unknown>"}; project=${project}`,
  );
}

function sectionBody(markdown: string, heading: string): string {
  return visibleSectionLines(markdown, heading).join("\n");
}

type LedgerEvent = {
  eventId: string;
  revision: number;
  occurredAt: number;
  ordinal: number;
  heading: string;
  row: string[];
};

function isUtcMillisecondInstant(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))
    return false;
  const instant = Date.parse(value);
  return Number.isFinite(instant) && new Date(instant).toISOString() === value;
}

function compareLedgerEvent(left: LedgerEvent, right: LedgerEvent): number {
  return (
    left.revision - right.revision ||
    left.occurredAt - right.occurredAt ||
    left.eventId.localeCompare(right.eventId)
  );
}

function ledgerEvent(
  row: string[],
  heading: string,
  project: string,
): LedgerEvent {
  const [eventId, revisionValue, occurredAtValue] = row;
  const eventMatch = /^evt-(\d{8})-(\d{4})$/.exec(eventId ?? "");
  if (!eventMatch || !/^\d+$/.test(revisionValue ?? "")) {
    throw new Error(
      `product-designer ledger has invalid Event ID or revision in ${heading}; project=${project}`,
    );
  }
  const revision = Number(revisionValue);
  if (!Number.isSafeInteger(revision) || Number(eventMatch[1]) !== revision) {
    throw new Error(
      `product-designer Event ID revision does not match its row in ${heading}; project=${project}`,
    );
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(occurredAtValue ?? "")
  ) {
    throw new Error(
      `product-designer ledger has invalid Occurred At in ${heading}; project=${project}`,
    );
  }
  const occurredAt = Date.parse(occurredAtValue);
  if (!isUtcMillisecondInstant(occurredAtValue)) {
    throw new Error(
      `product-designer ledger has a non-existent Occurred At instant in ${heading}; project=${project}`,
    );
  }
  return {
    eventId,
    revision,
    occurredAt,
    ordinal: Number(eventMatch[2]),
    heading,
    row,
  };
}

function canonicalLedgerEvents(output: string, project: string): LedgerEvent[] {
  const events: LedgerEvent[] = [];
  const eventIds = new Set<string>();
  for (const heading of [
    "# Ambiguity Ledger",
    "# Decision Log",
    "# Approval Log",
    "# Validation Log",
    "# Change Log",
  ]) {
    for (const row of tableRows(output, heading)) {
      const event = ledgerEvent(row, heading, project);
      if (eventIds.has(event.eventId)) {
        throw new Error(
          `product-designer ledger reused Event ID ${event.eventId}; project=${project}`,
        );
      }
      eventIds.add(event.eventId);
      events.push(event);
    }
  }
  const sorted = [...events].sort(compareLedgerEvent);
  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (
      previous.revision === current.revision &&
      previous.ordinal >= current.ordinal
    ) {
      throw new Error(
        `product-designer ledger ordinals do not increase within a revision; project=${project}`,
      );
    }
  }
  return sorted;
}

function foldSubjectRows(
  rows: string[][],
  indices: { subject: number; supersedes: number },
  heading: string,
  project: string,
): Map<string, string[]> {
  const events = rows
    .map((row) => ledgerEvent(row, heading, project))
    .sort(compareLedgerEvent);
  const heads = new Map<string, LedgerEvent>();
  for (const event of events) {
    const subject = event.row[indices.subject];
    const supersedes = event.row[indices.supersedes];
    if (!subject) {
      throw new Error(
        `product-designer ${heading} event lacks a subject; project=${project}`,
      );
    }
    const head = heads.get(subject);
    if (
      (!head && supersedes !== "none") ||
      (head && supersedes !== head.eventId)
    ) {
      throw new Error(
        `product-designer ${heading} has a broken supersede chain for ${subject}; project=${project}`,
      );
    }
    heads.set(subject, event);
  }
  return new Map([...heads].map(([subject, event]) => [subject, event.row]));
}

function canonicalSubjectEvents(
  rows: string[][],
  indices: { subject: number; supersedes: number },
  heading: string,
  project: string,
): Map<string, LedgerEvent[]> {
  const grouped = new Map<string, LedgerEvent[]>();
  for (const event of rows
    .map((row) => ledgerEvent(row, heading, project))
    .sort(compareLedgerEvent)) {
    const subject = event.row[indices.subject];
    if (!subject) {
      throw new Error(
        `product-designer ${heading} event lacks a subject; project=${project}`,
      );
    }
    const events = grouped.get(subject) ?? [];
    const head = events.at(-1);
    const supersedes = event.row[indices.supersedes];
    if (
      (!head && supersedes !== "none") ||
      (head && supersedes !== head.eventId)
    ) {
      throw new Error(
        `product-designer ${heading} has a broken supersede chain for ${subject}; project=${project}`,
      );
    }
    events.push(event);
    grouped.set(subject, events);
  }
  return grouped;
}

const approvalTransitions = new Map<string, ReadonlySet<string>>([
  ["requested", new Set(["approved", "denied"])],
  ["approved", new Set(["consumed", "expired", "revoked", "stale"])],
]);

function assertProductDesignerSessionIdentity(
  frontMatter: Record<string, unknown>,
  project: string,
  expected?: ProductDesignerExpectedAcceptanceContext,
): void {
  const sessionId = frontMatter.session_id;
  if (
    typeof sessionId !== "string" ||
    !/^[a-z0-9][a-z0-9-]{0,63}$/.test(sessionId)
  ) {
    throw new Error(
      `product-designer SESSION has an invalid session_id; project=${project}`,
    );
  }

  const sessionPath = frontMatter.session_path;
  const canonicalPath = `.opendock/runs/product-designer/${sessionId}/SESSION.md`;
  if (typeof sessionPath !== "string" || sessionPath !== canonicalPath) {
    throw new Error(
      `product-designer SESSION has an invalid session_path; project=${project}`,
    );
  }

  if (
    expected &&
    (sessionId !== expected.sessionId || sessionPath !== expected.sessionPath)
  ) {
    throw new Error(
      `product-designer SESSION identity does not match the expected acceptance context; project=${project}`,
    );
  }
}

function isCanonicalSingleUseScope(value: string | undefined): boolean {
  return value === "single_use" || value === "single_use for this response";
}

function assertApprovalLedger(
  rows: string[][],
  frontMatter: Record<string, unknown>,
  project: string,
  expected?: string | ProductDesignerExpectedAcceptanceContext,
): void {
  for (const row of rows) {
    if (row.length !== 13) {
      throw new Error(
        `product-designer Approval Log row must have exactly 13 cells; project=${project}`,
      );
    }
  }
  const grouped = canonicalSubjectEvents(
    rows,
    { subject: 3, supersedes: 12 },
    "Approval Log",
    project,
  );
  for (const [approvalId, events] of grouped) {
    let previous: LedgerEvent | undefined;
    const immutableColumns = [4, 5, 6, 7, 8, 9, 11] as const;
    const initialScope = immutableColumns.map((index) => events[0]?.row[index]);
    for (const event of events) {
      const status = event.row[10];
      if (
        !/^(?:requested|approved|denied|consumed|expired|revoked|stale)$/.test(
          status,
        )
      ) {
        throw new Error(
          `product-designer Approval Log has invalid status for ${approvalId}; project=${project}`,
        );
      }
      if (
        (!previous && !/^(?:requested|approved|denied)$/.test(status)) ||
        (previous && !approvalTransitions.get(previous.row[10])?.has(status))
      ) {
        throw new Error(
          `product-designer Approval Log has an illegal state transition for ${approvalId}; project=${project}`,
        );
      }
      const scope = immutableColumns.map((index) => event.row[index]);
      if (scope.some((value, index) => value !== initialScope[index])) {
        throw new Error(
          `product-designer Approval Log mutated approval scope for ${approvalId}; project=${project}`,
        );
      }
      previous = event;
    }
  }

  const checkpointId = String(frontMatter.checkpoint_write_approval_id ?? "");
  const checkpointEvents = grouped.get(checkpointId) ?? [];
  const approvedEvents = checkpointEvents.filter(
    (event) => event.row[10] === "approved",
  );
  const approved = approvedEvents[0];
  const consumed = checkpointEvents.at(-1);
  const sessionPath = String(frontMatter.session_path ?? "");
  if (
    checkpointId !== "AP-ACCEPT-001" ||
    approvedEvents.length !== 1 ||
    !approved ||
    !consumed ||
    consumed.row[10] !== "consumed" ||
    consumed.row[12] !== approved.eventId ||
    consumed.revision !== approved.revision ||
    consumed.revision !== Number(frontMatter.checkpoint_revision) ||
    approved.row[4] !== "capability" ||
    approved.row[5] !== "create_or_update_checkpoint" ||
    approved.row[6] !== sessionPath ||
    !isCanonicalSingleUseScope(approved.row[9]) ||
    !isCanonicalSingleUseScope(consumed.row[9])
  ) {
    throw new Error(
      `product-designer did not consume the single-use checkpoint approval; project=${project}`,
    );
  }
  const scenarioSha256 =
    typeof expected === "string" ? expected : expected?.scenarioSha256;
  if (
    scenarioSha256 &&
    !(typeof expected === "object"
      ? approved.row[8] === `SCENARIO.md SHA-256 ${scenarioSha256}`
      : new RegExp(`^SCENARIO\\.md SHA-?256 ${scenarioSha256}$`, "i").test(
          approved.row[8] ?? "",
        ))
  ) {
    throw new Error(
      `product-designer checkpoint approval does not match the expected acceptance context: approval is not bound to the scenario revision; project=${project}`,
    );
  }
  if (
    typeof expected === "string" &&
    (approved.row[7] !== "write non-sensitive design metadata" ||
      approved.row[11] !== "current user")
  ) {
    throw new Error(
      `product-designer checkpoint approval does not match the expected acceptance context; project=${project}`,
    );
  }

  if (
    typeof expected === "object" &&
    (checkpointEvents.length !== 2 ||
      checkpointEvents[0] !== approved ||
      approved.row[12] !== "none" ||
      approved.row[4] !== "capability" ||
      approved.row[5] !== "create_or_update_checkpoint" ||
      approved.row[6] !== expected.sessionPath ||
      approved.row[7] !== expected.accessAndData ||
      approved.row[8] !== `SCENARIO.md SHA-256 ${expected.scenarioSha256}` ||
      approved.row[9] !== "single_use" ||
      approved.row[11] !== expected.humanApprover)
  ) {
    throw new Error(
      `product-designer checkpoint approval does not match the expected acceptance context; project=${project}`,
    );
  }
}

function approvedExceptionError(
  acceptanceId: string,
  reason: string,
  project: string,
): never {
  throw new Error(
    `product-designer required approved_exception is invalid for ${acceptanceId}: ${reason}; project=${project}`,
  );
}

function isBoundedExceptionValue(value: string): boolean {
  return (
    value.trim().length > 0 &&
    !/^(?:\*|all|any|global|none|unknown|unbounded|unlimited)$/i.test(
      value.trim(),
    )
  );
}

function isRfc3339Instant(value: string): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}

function isHumanApprover(value: string): boolean {
  return (
    value.trim().length > 0 &&
    !/(?:^|\b)(?:ai|agent|assistant|claude|codex|gemini|gpt|llm|model|none|unknown)(?:\b|$)/i.test(
      value.trim(),
    )
  );
}

function assertRequiredApprovedValidationExceptions(
  output: string,
  frontMatter: Record<string, unknown>,
  project: string,
  expected?: string | ProductDesignerExpectedAcceptanceContext,
): void {
  const requiredAcceptanceIds = new Set(
    tableRows(output, "# Acceptance Contract")
      .filter((row) => parseRequiredCell(row[2], row[0], project))
      .map((row) => row[0]),
  );
  const validationHeads = foldSubjectRows(
    tableRows(output, "# Validation Log"),
    { subject: 3, supersedes: 10 },
    "Validation Log",
    project,
  );
  const approvalEvents = canonicalSubjectEvents(
    tableRows(output, "# Approval Log"),
    { subject: 3, supersedes: 12 },
    "Approval Log",
    project,
  );
  const sessionUpdatedAt = String(frontMatter.updated_at ?? "");
  const validationNow =
    typeof expected === "object" && expected.validationNow
      ? expected.validationNow
      : new Date().toISOString();
  if (!isRfc3339Instant(validationNow)) {
    throw new Error(
      `product-designer acceptance context has an invalid validationNow; project=${project}`,
    );
  }
  const referencedApprovalIds = new Set<string>();

  for (const acceptanceId of requiredAcceptanceIds) {
    const validation = validationHeads.get(acceptanceId);
    if (!validation || validation[7] !== "approved_exception") continue;

    const evidence =
      /^approval=([A-Za-z][A-Za-z0-9_-]*)@(evt-\d{8}-\d{4}); subject_revision=(.+)$/.exec(
        validation[8] ?? "",
      );
    if (!evidence) {
      approvedExceptionError(
        acceptanceId,
        "Evidence does not use the canonical approval binding",
        project,
      );
    }
    const [, approvalId, referencedEventId, evidenceSubjectRevision] = evidence;
    referencedApprovalIds.add(approvalId);
    if (evidenceSubjectRevision !== validation[5]) {
      approvedExceptionError(
        acceptanceId,
        "Evidence subject revision does not match the validation subject",
        project,
      );
    }

    const exception =
      /^scope=([^;]+); risk=([^;]+); expiry=([^;]+); owner=(.+)$/.exec(
        validation[9] ?? "",
      );
    if (!exception) {
      approvedExceptionError(
        acceptanceId,
        "exception details do not use the canonical scope, risk, expiry, and owner fields",
        project,
      );
    }
    const [, scope, risk, expiry, owner] = exception;
    if (
      !isBoundedExceptionValue(scope) ||
      !isBoundedExceptionValue(risk) ||
      !isBoundedExceptionValue(expiry) ||
      !isBoundedExceptionValue(owner)
    ) {
      approvedExceptionError(
        acceptanceId,
        "scope, risk, expiry, and owner must be explicit and bounded",
        project,
      );
    }

    const events = approvalEvents.get(approvalId);
    const currentHead = events?.at(-1);
    if (!currentHead || currentHead.row[10] !== "approved") {
      approvedExceptionError(
        acceptanceId,
        "Approval Log has no current approved head",
        project,
      );
    }
    if (currentHead.eventId !== referencedEventId) {
      approvedExceptionError(
        acceptanceId,
        "Evidence does not reference the current Approval Log head",
        project,
      );
    }
    if (
      currentHead.row[4] !== "design" ||
      currentHead.row[5] !== "approve_acceptance_exception"
    ) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log head is not a design acceptance-exception approval",
        project,
      );
    }
    if (currentHead.row[6] !== `acceptance:${acceptanceId}`) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log head targets a different Acceptance ID",
        project,
      );
    }
    if (currentHead.row[8] !== validation[5]) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log subject revision does not match the validation subject",
        project,
      );
    }

    const access = /^scope=([^;]+); risk=([^;]+)$/.exec(
      currentHead.row[7] ?? "",
    );
    if (!access || access[1] !== scope || access[2] !== risk) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log scope or risk does not match the validation exception",
        project,
      );
    }
    const approvalExpiry = /^(expires_at|expires_on)=([^;]+)$/.exec(
      currentHead.row[9] ?? "",
    );
    if (!approvalExpiry || approvalExpiry[2] !== expiry) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log expiry does not match the validation exception",
        project,
      );
    }
    if (
      approvalExpiry[1] === "expires_at" &&
      (!isRfc3339Instant(expiry) ||
        !isRfc3339Instant(sessionUpdatedAt) ||
        Date.parse(expiry) <= Date.parse(sessionUpdatedAt) ||
        Date.parse(expiry) <= Date.parse(validationNow))
    ) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log expiry is invalid or no longer current",
        project,
      );
    }
    if (
      approvalExpiry[1] === "expires_on" &&
      !isBoundedExceptionValue(expiry)
    ) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log named expiry is not explicit",
        project,
      );
    }
    if (!isHumanApprover(currentHead.row[11] ?? "")) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log head does not name an actual human approver",
        project,
      );
    }

    const validationEvent = ledgerEvent(validation, "Validation Log", project);
    if (compareLedgerEvent(currentHead, validationEvent) >= 0) {
      approvedExceptionError(
        acceptanceId,
        "Approval Log head was not recorded before the validation exception",
        project,
      );
    }
  }

  const goalApproval = /approval=(AP-[A-Za-z0-9_-]+)@evt-\d{8}-\d{4}/i.exec(
    bulletValue(output, "# Goal", "User approval") ?? "",
  )?.[1];
  if (goalApproval) referencedApprovalIds.add(goalApproval);
  for (const [approvalId, events] of approvalEvents) {
    const head = events.at(-1);
    if (
      head?.row[10] === "approved" &&
      !referencedApprovalIds.has(approvalId)
    ) {
      throw new Error(
        `product-designer Approval Log has an unrelated active approval ${approvalId}; project=${project}`,
      );
    }
  }
}

function assertCanonicalLedgerRows(
  output: string,
  frontMatter: Record<string, unknown>,
  project: string,
): void {
  const events = canonicalLedgerEvents(output, project);
  if (events.length === 0) {
    throw new Error(
      `product-designer SESSION has no ledger events; project=${project}`,
    );
  }
  const checkpointRevision = Number(frontMatter.checkpoint_revision);
  const last = events.at(-1)!;
  if (
    !Number.isSafeInteger(checkpointRevision) ||
    last.revision !== checkpointRevision ||
    last.eventId !== frontMatter.last_event_id ||
    last.heading !== "# Change Log"
  ) {
    throw new Error(
      `product-designer front matter does not point to the final Change Log event; project=${project}`,
    );
  }
}

function assertProductDesignerSemanticCompletion(
  output: string,
  project: string,
  expected?: string | ProductDesignerExpectedAcceptanceContext,
): void {
  const templateSentinel =
    /(?:replace-[a-z0-9-]+|capture-on-create|\{\{[^}\n]+\}\})/i;
  const prototype = sectionBody(output, "# Prototype");
  const prototypeFillIn =
    /(?:\$\{[^}\n]+\}|\$Amount\b|\bHH:MM\b|\bYYYY-MM-DD\b|\bDD(?:\/|-)MM(?:\/|-)YYYY\b|\[(?:insert|enter|placeholder)\b[^\]\n]*\]|<(?:owner|gate|reason|field|participant|date|time|value|text|copy|label|name)>)/i;
  if (templateSentinel.test(output) || prototypeFillIn.test(prototype)) {
    throw new Error(
      `product-designer SESSION contains an unresolved fill-in value; project=${project}`,
    );
  }

  const frontMatter = markdownFrontMatter(output, project);
  assertProductDesignerSessionIdentity(
    frontMatter,
    project,
    typeof expected === "object" ? expected : undefined,
  );
  assertCanonicalLedgerRows(output, frontMatter, project);
  assertCompletedProjection(output, frontMatter, project);
  for (const heading of [
    "# Design Contract Scope Map",
    "# Evidence Register",
    "# Shared Vocabulary and Relationships",
    "# Ambiguity Ledger",
    "# Decision Log",
    "# Approval Log",
    "## Flow",
    "## State Matrix",
    "## Content and Data Contract",
    "# Acceptance Contract",
    "# Prototype",
    "# Validation Log",
    "# Change Log",
  ]) {
    if (
      tableRows(output, heading).some((row) =>
        row.some((cell) => cell.length === 0),
      )
    ) {
      throw new Error(
        `product-designer SESSION has an empty table cell in ${heading}; project=${project}`,
      );
    }
  }

  assertApprovalLedger(
    tableRows(output, "# Approval Log"),
    frontMatter,
    project,
    expected,
  );
  assertRequiredApprovedValidationExceptions(
    output,
    frontMatter,
    project,
    expected,
  );

  const handoff = sectionBody(output, "# Handoff");
  const acceptanceRows = tableRows(output, "# Acceptance Contract");
  assertProductDesignerCurrentBlocker(
    output,
    frontMatter,
    acceptanceRows,
    project,
  );
  const validationHeads = foldSubjectRows(
    tableRows(output, "# Validation Log"),
    { subject: 3, supersedes: 10 },
    "Validation Log",
    project,
  );
  for (const row of acceptanceRows) {
    if (parseRequiredCell(row[2], row[0], project)) continue;
    const validation = validationHeads.get(row[0]);
    if (!validation || !/^(?:not_run|needs_review)$/.test(validation[7] ?? ""))
      continue;
    const handoffLines = handoff
      .split(/\r?\n/)
      .filter((line) => line.includes(row[0]));
    const handoffClauses = handoffLines.flatMap((line) =>
      line
        .split(/(?:;|[.!?](?:\s|$)|,\s+(?=ACC-[A-Za-z0-9_-]+\b))/)
        .map((clause) => clause.trim())
        .filter((clause) => clause.includes(row[0])),
    );
    const riskLine = handoffLines.find((line) =>
      /(?:needs_review|not_run|미입증|측정 필요|future measurement|unproven)/i.test(
        line,
      ),
    );
    if (
      !riskLine ||
      handoffClauses.some((clause) =>
        /(?:\bproven\b|\bpassed\b|\bclosed\b|입증 완료|검증 완료)/i.test(
          clause,
        ),
      )
    ) {
      throw new Error(
        `product-designer handoff lost the unproven optional acceptance ${row[0]} (validation=${validation?.[7] ?? "missing"}, risk_line=${riskLine ? "present" : "missing"}); project=${project}`,
      );
    }
  }

  const canonicalActionLines = prototype
    .split(/\r?\n/)
    .filter(
      (line) =>
        /\bactor\s*=/.test(line) &&
        /\bcapability(?:_action)?\s*=/.test(line) &&
        /\bcontrol\s*=/.test(line),
    );
  assertPermissionStateMatrix(tableRows(output, "## State Matrix"), project);
  assertPrototypePermissionControls(
    canonicalActionLines,
    tableRows(output, "## State Matrix"),
    project,
  );
  if (
    typeof expected === "object" &&
    expected.requireConfirmedTerminalSuccess === true &&
    prototype
      .split(/\r?\n/)
      .some(
        (line) =>
          /(?:accepted|submitted|queued|접수|제출)[^\n]{0,100}(?:removed from|complete|success|완료|성공|목록에서 제거)/i.test(
            line,
          ) &&
          !/(?:confirmed|terminal|status\s*=\s*succeeded|confirmed success|최종|확인된 성공|succeeded 상태)/i.test(
            line,
          ),
      )
  ) {
    throw new Error(
      `product-designer prototype treats request acknowledgement as confirmed terminal success; project=${project}`,
    );
  }
}

function assertProductDesignerCurrentBlocker(
  output: string,
  frontMatter: Record<string, unknown>,
  acceptanceRows: string[][],
  project: string,
): void {
  const value = bulletValue(output, "# Current Checkpoint", "Blockers");
  if (!value) {
    throw new Error(
      `product-designer Current Checkpoint lacks a blocker value; project=${project}`,
    );
  }
  if (value.toLowerCase() === "none") {
    if (frontMatter.gate_state === "waiting_approval") {
      throw new Error(
        `product-designer waiting_approval checkpoint does not identify its current blocker; project=${project}`,
      );
    }
    return;
  }

  const match =
    /^BLK-[A-Z0-9-]+;\s*blocks=(G[0-6]|ACC-[A-Z0-9-]+);\s*evidence=([^;]+);\s*owner=([^;]+);\s*unblock=([^;]+)$/i.exec(
      value,
    );
  if (!match) {
    throw new Error(
      `product-designer Current Checkpoint blocker is not canonical; project=${project}`,
    );
  }
  const [, blockedSubject, evidence, owner, unblock] = match;
  if (
    [evidence, owner, unblock].some(
      (field) =>
        field.trim().length < 3 ||
        /^(?:none|unknown|pending|not_applicable)(?:\b|\()/i.test(field.trim()),
    )
  ) {
    throw new Error(
      `product-designer Current Checkpoint blocker lacks evidence, owner, or unblock condition; project=${project}`,
    );
  }

  if (blockedSubject.startsWith("ACC-")) {
    const acceptance = acceptanceRows.find((row) => row[0] === blockedSubject);
    if (
      !acceptance ||
      !parseRequiredCell(acceptance[2], acceptance[0], project)
    ) {
      throw new Error(
        `product-designer treated a non-delivery item as a current blocker; project=${project}`,
      );
    }
  } else if (blockedSubject !== String(frontMatter.current_gate ?? "")) {
    throw new Error(
      `product-designer Current Checkpoint blocker does not block the current gate; project=${project}`,
    );
  }

  if (
    frontMatter.gate_state === "waiting_approval" &&
    (blockedSubject !== String(frontMatter.current_gate ?? "") ||
      !/(?:approval|approve|revalidation|승인|재검증)/i.test(
        `${evidence} ${unblock}`,
      ))
  ) {
    throw new Error(
      `product-designer waiting_approval blocker is not bound to the current approval or revalidation; project=${project}`,
    );
  }
}

function bulletValue(
  markdown: string,
  heading: string,
  label: string,
): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = sectionBody(markdown, heading)
    .split(/\r?\n/)
    .map((line) =>
      new RegExp(`^[ \\t]*-[ \\t]+${escaped}:[ \\t]*(.*)$`, "i").exec(line),
    )
    .filter((match): match is RegExpExecArray => Boolean(match));
  if (matches.length > 1) {
    throw new Error(
      `product-designer SESSION duplicated bullet ${label} in ${heading}`,
    );
  }
  return matches[0]?.[1]?.trim();
}

function subsectionContent(markdown: string, heading: string): string {
  const body = sectionBody(markdown, heading);
  return body.split(/\r?\n/).slice(1).join("\n").trim();
}

function assertCompletedProjection(
  output: string,
  frontMatter: Record<string, unknown>,
  project: string,
): void {
  const lastPassed = String(frontMatter.last_passed_gate ?? "none");
  if (lastPassed === "none") return;
  const gateNumber = Number(/^G([0-6])$/.exec(lastPassed)?.[1]);
  const requiredBullets = new Map<string, string[]>();
  if (gateNumber >= 0) {
    requiredBullets.set("# Goal", ["One-line goal"]);
    requiredBullets.set("# Project Context and Isolation Boundary", [
      "Source",
      "Target surface",
      "Original workspace remains read-only",
      "Approved write scope",
    ]);
    requiredBullets.set("# Current Checkpoint", [
      "Next action",
      "Blockers",
      "Stale artifacts",
    ]);
  }
  if (gateNumber >= 1) {
    requiredBullets.set("# Goal", ["One-line goal", "User approval"]);
    requiredBullets.set("# Frame", [
      "Problem",
      "Primary user",
      "Core task or job to be done",
      "Desired outcome",
      "Business objective",
      "Stakeholders and operational impact",
      "In scope",
      "Out of scope",
      "Later or unknown",
      "Hard constraints",
      "Success evidence",
    ]);
  }
  if (gateNumber >= 2) {
    requiredBullets.set("## Selected Direction", [
      "Selection",
      "Approval",
      "Single direction reason, if applicable",
    ]);
  }
  if (gateNumber >= 5) {
    requiredBullets.set("# Handoff", [
      "Approved section and decision revisions",
      "Artifact references",
      "Acceptance and evidence references",
      "Open risk and approved exception references",
      "Implementation boundary",
    ]);
  }
  for (const [heading, labels] of requiredBullets) {
    for (const label of labels) {
      const value = bulletValue(output, heading, label);
      if (
        !value ||
        /^(?:unknown|not_applicable|pending)$/i.test(value) ||
        templateSentinelValue(value)
      ) {
        throw new Error(
          `product-designer passed projection has an unresolved ${label}; project=${project}`,
        );
      }
    }
  }
  if (gateNumber >= 1) {
    assertGoalApprovalProjection(output, project);
  }
  const requiredSections = [
    ...(gateNumber >= 2 ? ["## Direction A", "## Direction B"] : []),
    ...(gateNumber >= 3
      ? [
          "## Flow",
          "## Content and Information Hierarchy",
          "## Responsive and Accessibility",
          "## Content and Data Contract",
          "## Design System and Implementation Constraints",
        ]
      : []),
  ];
  for (const heading of requiredSections) {
    const content = subsectionContent(output, heading);
    if (!content || /^(?:unknown|not_applicable|pending)$/i.test(content)) {
      throw new Error(
        `product-designer passed projection has an empty ${heading}; project=${project}`,
      );
    }
  }
  if (gateNumber >= 3 && tableRows(output, "## State Matrix").length === 0) {
    throw new Error(
      `product-designer G3 projection lacks the State Matrix table; project=${project}`,
    );
  }
  if (
    gateNumber >= 3 &&
    tableRows(output, "# Acceptance Contract").length === 0
  ) {
    throw new Error(
      `product-designer G3 projection lacks an acceptance contract; project=${project}`,
    );
  }
  if (gateNumber >= 4 && tableRows(output, "# Prototype").length === 0) {
    throw new Error(
      `product-designer G4 projection lacks a prototype artifact; project=${project}`,
    );
  }
  if (gateNumber >= 5 && tableRows(output, "# Validation Log").length === 0) {
    throw new Error(
      `product-designer G5 projection lacks validation evidence; project=${project}`,
    );
  }
}

function assertGoalApprovalProjection(output: string, project: string): void {
  const approval = bulletValue(output, "# Goal", "User approval");
  const inRequest =
    /^status=approved_in_request;\s*evidence=((?:EVD-[A-Za-z0-9_-]+)(?:\s*,\s*EVD-[A-Za-z0-9_-]+)*);\s*subject_revision=([^;\n]+)$/i.exec(
      approval ?? "",
    );
  if (inRequest) {
    const evidenceIds = inRequest[1].split(",").map((value) => value.trim());
    const evidenceRows = tableRows(output, "# Evidence Register").filter(
      (row) => evidenceIds.includes(row[0]),
    );
    const hasCurrentRequestEvidence = evidenceRows.some((evidence) =>
      isGoalFrameApprovalEvidence(evidence),
    );
    if (
      evidenceRows.length === evidenceIds.length &&
      hasCurrentRequestEvidence &&
      evidenceRows.every((evidence) =>
        /^(?:current|verified|verified_fact|fact)$/i.test(evidence[6] ?? ""),
      ) &&
      isConcreteProductContractValue(inRequest[2])
    ) {
      return;
    }
  }

  const explicit =
    /^status=approved;\s*approval=(AP-[A-Za-z0-9_-]+)@(evt-\d{8}-\d{4});\s*subject_revision=([^;\n]+)$/i.exec(
      approval ?? "",
    );
  if (explicit) {
    const approvalRow = tableRows(output, "# Approval Log").find(
      (row) => row[3] === explicit[1] && row[0] === explicit[2],
    );
    if (
      approvalRow?.[10] === "approved" &&
      isHumanApprover(approvalRow[11] ?? "") &&
      approvalRow[8] === explicit[3] &&
      isConcreteProductContractValue(explicit[3])
    ) {
      return;
    }
  }

  throw new Error(
    `product-designer passed G1 projection lacks a current-request or approval-ledger Goal and Frame approval; project=${project}`,
  );
}

function isGoalFrameApprovalEvidence(evidence: string[]): boolean {
  if (/^SCENARIO\.md(?:#[A-Za-z0-9_.-]+)?$/i.test(evidence[2] ?? "")) {
    return true;
  }
  if (
    !/^(?:scenario|scenario_file|scenario_document|request|current_request|user_request)$/i.test(
      evidence[1] ?? "",
    )
  ) {
    return false;
  }
  const fact = evidence[4] ?? "";
  return (
    /(?:goal|frame|direction|delivery boundary|in scope|out of scope|primary user|problem|목표|프레임|방향|전달 범위|범위|사용자 문제)/i.test(
      fact,
    ) &&
    !(
      /(?:capability|create_or_update_checkpoint|single_use|session_lifetime|checkpoint write|파일 쓰기|체크포인트 쓰기)/i.test(
        fact,
      ) &&
      !/(?:goal|frame|direction|delivery boundary|목표|프레임|방향|전달 범위)/i.test(
        fact,
      )
    )
  );
}

function templateSentinelValue(value: string): boolean {
  return /(?:replace-[a-z0-9-]+|capture-on-create|TODO|TBD|placeholder|\{\{[^}\n]+\}\})/i.test(
    value,
  );
}

function assertPermissionStateMatrix(rows: string[][], project: string): void {
  const byState = new Map<string, string[][]>();
  for (const row of rows) {
    const state = row[0].toLowerCase();
    byState.set(state, [...(byState.get(state) ?? []), row]);
  }
  for (const state of [
    "default",
    "loading",
    "empty",
    "error",
    "permission",
    "disabled",
    "success",
    "recovery",
  ]) {
    if ((byState.get(state) ?? []).length === 0) {
      throw new Error(
        `product-designer State Matrix is missing ${state}; project=${project}`,
      );
    }
  }
  for (const [state, stateRows] of byState) {
    if (
      !new Set(["permission", "disabled"]).has(state) &&
      stateRows.length !== 1
    ) {
      throw new Error(
        `product-designer State Matrix has duplicated ${state} semantics; project=${project}`,
      );
    }
    const semanticKeys = new Set<string>();
    for (const row of stateRows) {
      if (
        row.length !== 4 ||
        !/^(?:yes|true|no|false|예|아니요)$/i.test(row[1])
      ) {
        throw new Error(
          `product-designer State Matrix has an invalid applicability for ${state}; project=${project}`,
        );
      }
      if (/^(?:no|false|아니요)$/i.test(row[1])) {
        if (!/not_applicable\(reason=.+\)/i.test(row[3])) {
          throw new Error(
            `product-designer State Matrix lacks an N/A reason for ${state}; project=${project}`,
          );
        }
        continue;
      }
      assertStateExperienceSemantics(state, row[2], project);
      if (state === "permission") {
        const actor = canonicalRawAssignmentValue(row[2], "actor");
        const requiredRole = canonicalRawAssignmentValue(
          row[2],
          "required_role",
        );
        const capability = canonicalRawAssignmentValue(
          row[2],
          "capability_action",
        );
        const control = canonicalRawAssignmentValue(row[2], "control");
        const denial = canonicalAssignmentValue(row[2], "denial");
        const route = canonicalRawAssignmentValue(row[2], "next_route_action");
        if (
          !actor ||
          !requiredRole ||
          sameCanonicalProse(actor, requiredRole) ||
          !/^ACT-[A-Za-z0-9_-]+$/.test(capability ?? "") ||
          !/^(?:disabled|hidden|not_rendered|view_only)$/.test(control ?? "") ||
          !denial ||
          !/^ACT-[A-Za-z0-9_-]+$/.test(route ?? "")
        ) {
          throw new Error(
            `product-designer permission state lacks actor, required role, denial, or one route; project=${project}`,
          );
        }
        const key = `${actor}\u0000${capability}\u0000${control}`;
        if (semanticKeys.has(key)) {
          throw new Error(
            `product-designer State Matrix has duplicated permission semantics; project=${project}`,
          );
        }
        semanticKeys.add(key);
      }
      if (state === "disabled") {
        const actor = canonicalRawAssignmentValue(row[2], "actor") ?? "";
        const capability =
          canonicalRawAssignmentValue(row[2], "capability_action") ?? "";
        const control = canonicalRawAssignmentValue(row[2], "control");
        const reEnableWhen = canonicalAssignmentValue(row[2], "re_enable_when");
        if (
          control !== "disabled" ||
          !reEnableWhen ||
          !isConcreteConditionClause(reEnableWhen)
        ) {
          throw new Error(
            `product-designer disabled state lacks a precondition and re-enable condition; project=${project}`,
          );
        }
        const key = `${actor}\u0000${capability}`;
        if (semanticKeys.has(key)) {
          throw new Error(
            `product-designer State Matrix has duplicated disabled semantics; project=${project}`,
          );
        }
        semanticKeys.add(key);
      }
    }
  }
}

function assertStateExperienceSemantics(
  state: string,
  experience: string,
  project: string,
): void {
  const contradictions = new Map<string, RegExp>([
    [
      "loading",
      /(?:everything is ready|completed successfully|모두 준비|완료됨)/i,
    ],
    ["empty", /(?:show all transactions|display every item|모든 거래 표시)/i],
    ["error", /(?:success is displayed|show success|성공 표시)/i],
    ["recovery", /(?:do nothing forever|no recovery|복구 없음)/i],
  ]);
  if (
    !isConcreteProductContractValue(experience) ||
    contradictions.get(state)?.test(experience)
  ) {
    throw new Error(
      `product-designer State Matrix has contradictory ${state} semantics; project=${project}`,
    );
  }
}

function assertPrototypePermissionControls(
  lines: string[],
  stateRows: string[][],
  project: string,
): void {
  const permissions = stateRows.filter(
    (row) => row[0] === "permission" && /^(?:yes|true|예)$/i.test(row[1] ?? ""),
  );
  if (permissions.length === 0) return;
  for (const permission of permissions) {
    const permissionText = permission[2];
    const capabilityAction = canonicalRawAssignmentValue(
      permissionText,
      "capability_action",
    );
    const unauthorizedActor = canonicalRawAssignmentValue(
      permissionText,
      "actor",
    );
    const requiredRole = canonicalRawAssignmentValue(
      permissionText,
      "required_role",
    );
    const routeAction = canonicalRawAssignmentValue(
      permissionText,
      "next_route_action",
    );
    if (
      !capabilityAction ||
      !unauthorizedActor ||
      !requiredRole ||
      !routeAction
    ) {
      throw new Error(
        `product-designer prototype has a permission action without actor and control state; project=${project}`,
      );
    }
    const uniqueForAction = [
      ...new Map(
        lines
          .filter((line) =>
            hasCanonicalAssignment(line, "capability_action", capabilityAction),
          )
          .map((line) => [
            JSON.stringify({
              actor: canonicalRawAssignmentValue(line, "actor"),
              requiredRole: canonicalRawAssignmentValue(line, "required_role"),
              capabilityAction: canonicalRawAssignmentValue(
                line,
                "capability_action",
              ),
              control: canonicalRawAssignmentValue(line, "control"),
              enabledWhen: canonicalAssignmentValue(line, "enabled_when"),
              reEnableWhen: canonicalAssignmentValue(line, "re_enable_when"),
              denial: canonicalAssignmentValue(line, "denial"),
              permissionRouteAction: canonicalRawAssignmentValue(
                line,
                "permission_route_action",
              ),
            }),
            line,
          ]),
      ).values(),
    ];
    const enabled = uniqueForAction.filter(
      (line) =>
        hasCanonicalAssignment(line, "actor", requiredRole) &&
        hasCanonicalAssignment(line, "control", "enabled") &&
        Boolean(canonicalAssignmentValue(line, "enabled_when")),
    );
    const disabled = uniqueForAction.filter(
      (line) =>
        hasCanonicalAssignment(line, "actor", requiredRole) &&
        hasCanonicalAssignment(line, "control", "disabled") &&
        Boolean(canonicalAssignmentValue(line, "re_enable_when")),
    );
    const unauthorized = uniqueForAction.filter(
      (line) =>
        hasCanonicalAssignment(line, "actor", unauthorizedActor) &&
        /^(?:disabled|hidden|not_rendered|view_only)$/.test(
          canonicalRawAssignmentValue(line, "control") ?? "",
        ) &&
        hasCanonicalAssignment(line, "permission_route_action", routeAction),
    );
    if (
      enabled.length !== 1 ||
      disabled.length !== 1 ||
      unauthorized.length !== 1 ||
      uniqueForAction.some(
        (line) =>
          hasCanonicalAssignment(line, "actor", unauthorizedActor) &&
          hasCanonicalAssignment(line, "control", "enabled"),
      )
    ) {
      throw new Error(
        `product-designer prototype leaves permission behavior ambiguous; project=${project}`,
      );
    }
  }
}

function isConcreteConditionClause(value: string): boolean {
  const normalized = value.replace(/[`*_]/g, " ").replace(/\s+/g, " ").trim();
  if (
    normalized.length < 3 ||
    /^(?:(?:the\s+)?(?:condition|conditions|criteria|criterion|requirement|requirements|prerequisite|prerequisites)(?:\s+(?:is|are|have been))?\s*(?:met|satisfied|fulfilled|explained|documented|shown|known|clear|ready)?|조건이?\s*(?:충족|설명|명시|문서화|준비)(?:되면|됨|된다)?)$/i.test(
      normalized,
    )
  ) {
    return false;
  }

  const generic = new Set([
    "a",
    "again",
    "an",
    "are",
    "be",
    "been",
    "clear",
    "condition",
    "conditions",
    "criteria",
    "criterion",
    "documented",
    "explained",
    "fulfilled",
    "have",
    "is",
    "known",
    "met",
    "prerequisite",
    "prerequisites",
    "provided",
    "ready",
    "requirement",
    "requirements",
    "satisfied",
    "shown",
    "the",
    "then",
    "when",
  ]);
  const substantive = (normalized.match(/[\p{L}\p{N}_-]+/gu) ?? []).filter(
    (token) => !generic.has(token.toLowerCase()),
  );
  return (
    substantive.length >= 2 ||
    (substantive.length === 1 && /[\uAC00-\uD7A3]{4,}/.test(substantive[0])) ||
    /(?:===?|!==?|>=?|<=?)/.test(normalized)
  );
}

function assertRegularFile(
  project: string,
  relativePath: string,
  label: string,
): void {
  const segments = safeRelativeSegments(relativePath, label, project);
  let full = project;
  for (let index = 0; index < segments.length; index++) {
    full = join(full, segments[index]);
    const stat = lstatIfPresent(full);
    if (!stat) {
      throw new Error(`${label} missing: ${relativePath}; project=${project}`);
    }
    if (stat.isSymbolicLink()) {
      throw new Error(
        `${label} path must not contain a symlink: ${relativePath}; project=${project}`,
      );
    }
    if (index < segments.length - 1 && !stat.isDirectory()) {
      throw new Error(
        `${label} parent must be a directory: ${relativePath}; project=${project}`,
      );
    }
    if (index === segments.length - 1 && (!stat.isFile() || stat.nlink !== 1)) {
      throw new Error(
        `${label} must be a regular single-link file: ${relativePath}; project=${project}`,
      );
    }
  }
}

type AcceptanceWorkspaceMetadata = {
  mode: number;
  dev: number;
  ino: number;
  nlink: number;
};

type AcceptanceWorkspaceEntry =
  | ({ kind: "directory" } & AcceptanceWorkspaceMetadata)
  | ({
      kind: "file";
      sha256: string;
      size: number;
    } & AcceptanceWorkspaceMetadata);

export type AcceptanceWorkspaceSnapshot = ReadonlyMap<
  string,
  AcceptanceWorkspaceEntry
>;

export type AcceptanceConfinementOptions = {
  requireTarget?: boolean;
};

export type AcceptanceTargetSnapshot = AcceptanceWorkspaceMetadata & {
  relativePath: string;
  sha256: string;
  size: number;
};

function workspaceMetadata(
  stat: ReturnType<typeof lstatSync>,
): AcceptanceWorkspaceMetadata {
  return {
    mode: stat.mode,
    dev: stat.dev,
    ino: stat.ino,
    nlink: stat.nlink,
  };
}

function captureRegularFile(
  full: string,
  relativePath: string,
  project: string,
): Extract<AcceptanceWorkspaceEntry, { kind: "file" }> {
  let descriptor: number;
  try {
    descriptor = openSync(full, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    throw new Error(
      `acceptance workspace could not safely open ${relativePath}: ${error instanceof Error ? error.message : String(error)}; project=${project}`,
    );
  }
  try {
    const stat = fstatSync(descriptor);
    if (!stat.isFile() || stat.nlink !== 1) {
      throw new Error(
        `acceptance workspace contains a non-regular or linked file: ${relativePath}; project=${project}`,
      );
    }
    const contents = readFileSync(descriptor);
    return {
      kind: "file",
      ...workspaceMetadata(stat),
      sha256: createHash("sha256").update(contents).digest("hex"),
      size: contents.length,
    };
  } finally {
    closeSync(descriptor);
  }
}

export function captureAcceptanceWorkspace(
  project: string,
): AcceptanceWorkspaceSnapshot {
  const rootStat = lstatSync(project);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(
      `acceptance workspace root must be a real directory: ${project}`,
    );
  }
  const entries = new Map<string, AcceptanceWorkspaceEntry>();
  entries.set(".", { kind: "directory", ...workspaceMetadata(rootStat) });
  const visit = (directory: string, relativeDirectory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name),
    )) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const full = join(directory, entry.name);
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) {
        throw new Error(
          `acceptance workspace contains a symlink: ${relativePath}; project=${project}`,
        );
      }
      if (stat.isDirectory()) {
        entries.set(relativePath, {
          kind: "directory",
          ...workspaceMetadata(stat),
        });
        visit(full, relativePath);
        continue;
      }
      if (!stat.isFile() || stat.nlink !== 1) {
        throw new Error(
          `acceptance workspace contains a non-regular or linked file: ${relativePath}; project=${project}`,
        );
      }
      entries.set(
        relativePath,
        captureRegularFile(full, relativePath, project),
      );
    }
  };
  visit(project, "");
  return entries;
}

export function assertAcceptanceTargetAvailable(
  project: string,
  before: AcceptanceWorkspaceSnapshot,
  target: string,
): void {
  const segments = safeRelativeSegments(target, "acceptance target", project);
  const normalizedTarget = segments.join("/");
  if (
    normalizedTarget === "codex-acceptance.log" ||
    normalizedTarget.startsWith("codex-acceptance.log/")
  ) {
    throw new Error(
      `acceptance target collides with a reserved evidence name: ${target}; project=${project}`,
    );
  }
  if (before.has(normalizedTarget)) {
    throw new Error(
      `acceptance target already exists before Codex runs: ${normalizedTarget}; project=${project}`,
    );
  }
  for (let index = 1; index < segments.length; index++) {
    const ancestor = segments.slice(0, index).join("/");
    const entry = before.get(ancestor);
    if (entry && entry.kind !== "directory") {
      throw new Error(
        `acceptance target parent collides with a non-directory: ${ancestor}; project=${project}`,
      );
    }
  }
}

export function assertAcceptanceWorkspaceConfinement(
  project: string,
  before: AcceptanceWorkspaceSnapshot,
  target: string,
  options: AcceptanceConfinementOptions = {},
): void {
  const targetSegments = safeRelativeSegments(
    target,
    "acceptance target",
    project,
  );
  const normalizedTarget = targetSegments.join("/");
  assertAcceptanceTargetAvailable(project, before, normalizedTarget);
  const allowedAdditions = new Map<string, "directory" | "file">([
    [normalizedTarget, "file"],
  ]);
  for (let index = 1; index < targetSegments.length; index++) {
    allowedAdditions.set(targetSegments.slice(0, index).join("/"), "directory");
  }

  const after = captureAcceptanceWorkspace(project);
  for (const [relativePath, current] of after) {
    if (before.has(relativePath)) continue;
    const expectedKind = allowedAdditions.get(relativePath);
    if (!expectedKind || current.kind !== expectedKind) {
      throw new Error(
        `Codex created an unapproved workspace entry: ${relativePath}; project=${project}`,
      );
    }
  }
  for (const [relativePath, previous] of before) {
    const current = after.get(relativePath);
    if (!current) {
      throw new Error(
        `Codex removed a file or directory outside its approved output: ${relativePath}; project=${project}`,
      );
    }
    const addedDirectEntries = [...allowedAdditions].filter(
      ([candidate]) =>
        !before.has(candidate) &&
        after.has(candidate) &&
        parentWorkspacePath(candidate) === relativePath,
    ).length;
    const directoryLinkCountIsAllowed =
      previous.kind === "directory" &&
      current.kind === "directory" &&
      (current.nlink === previous.nlink ||
        current.nlink === previous.nlink + addedDirectEntries);
    if (
      current.kind !== previous.kind ||
      current.mode !== previous.mode ||
      current.dev !== previous.dev ||
      current.ino !== previous.ino ||
      (previous.kind === "file" && current.nlink !== previous.nlink) ||
      (previous.kind === "directory" && !directoryLinkCountIsAllowed) ||
      (current.kind === "file" &&
        previous.kind === "file" &&
        (current.sha256 !== previous.sha256 || current.size !== previous.size))
    ) {
      throw new Error(
        `Codex changed a file outside its approved output: ${relativePath}; project=${project}`,
      );
    }
  }
  const targetEntry = after.get(normalizedTarget);
  if (options.requireTarget !== false && targetEntry?.kind !== "file") {
    throw new Error(
      `acceptance output is missing or has the wrong type: ${normalizedTarget}; project=${project}`,
    );
  }
  if (targetEntry)
    assertRegularFile(project, normalizedTarget, "expected target");
}

export function captureAcceptanceTarget(
  project: string,
  target: string,
): AcceptanceTargetSnapshot {
  const segments = safeRelativeSegments(target, "acceptance target", project);
  const normalizedTarget = segments.join("/");
  assertRegularFile(project, normalizedTarget, "acceptance target");
  const entry = captureRegularFile(
    join(project, ...segments),
    normalizedTarget,
    project,
  );
  const { kind: _kind, ...snapshot } = entry;
  return { relativePath: normalizedTarget, ...snapshot };
}

export function assertAcceptanceTargetPreserved(
  project: string,
  target: string,
  before: AcceptanceTargetSnapshot,
): void {
  const after = captureAcceptanceTarget(project, target);
  if (
    after.relativePath !== before.relativePath ||
    after.mode !== before.mode ||
    after.dev !== before.dev ||
    after.ino !== before.ino ||
    after.nlink !== before.nlink ||
    after.size !== before.size ||
    after.sha256 !== before.sha256
  ) {
    throw new Error(
      `acceptance target changed during uninstall: ${target}; project=${project}`,
    );
  }
}

export function assertAcceptanceFinalWorkspaceInventory(
  project: string,
  target: string,
  targetBeforeUninstall: AcceptanceTargetSnapshot,
  scenarioBeforeUninstall: AcceptanceTargetSnapshot,
): void {
  const targetSegments = safeRelativeSegments(
    target,
    "acceptance target",
    project,
  );
  const normalizedTarget = targetSegments.join("/");
  const expected = new Map<string, "directory" | "file">([
    [".", "directory"],
    ["SCENARIO.md", "file"],
    [".opendock", "directory"],
    [".opendock/project.yml", "file"],
    [".opendock/dock.lock.yml", "file"],
    [normalizedTarget, "file"],
  ]);
  for (let index = 1; index < targetSegments.length; index++) {
    expected.set(targetSegments.slice(0, index).join("/"), "directory");
  }

  const actual = captureAcceptanceWorkspace(project);
  for (const [relativePath, entry] of actual) {
    const expectedKind = expected.get(relativePath);
    if (!expectedKind || entry.kind !== expectedKind) {
      throw new Error(
        `unexpected post-uninstall workspace entry: ${relativePath}; project=${project}`,
      );
    }
  }
  for (const [relativePath, expectedKind] of expected) {
    if (actual.get(relativePath)?.kind !== expectedKind) {
      throw new Error(
        `missing post-uninstall workspace entry: ${relativePath}; project=${project}`,
      );
    }
  }
  assertAcceptanceTargetPreserved(
    project,
    normalizedTarget,
    targetBeforeUninstall,
  );
  assertAcceptanceTargetPreserved(
    project,
    "SCENARIO.md",
    scenarioBeforeUninstall,
  );
  for (const statePath of [
    ".opendock/project.yml",
    ".opendock/dock.lock.yml",
  ]) {
    const state = YAML.parse(
      readFileSync(join(project, statePath), "utf8"),
    ) as {
      docks?: unknown;
    };
    if (!state || !Array.isArray(state.docks) || state.docks.length !== 0) {
      throw new Error(
        `post-uninstall state is not empty: ${statePath}; project=${project}`,
      );
    }
  }
}

export function acceptancePathExistsByLstat(
  project: string,
  relativePath: string,
): boolean {
  const segments = safeRelativeSegments(relativePath, "managed path", project);
  let full = project;
  for (let index = 0; index < segments.length; index++) {
    full = join(full, segments[index]);
    const stat = lstatIfPresent(full);
    if (!stat) return false;
    if (index < segments.length - 1 && !stat.isDirectory()) return true;
  }
  return true;
}

function parentWorkspacePath(relativePath: string): string {
  const lastSeparator = relativePath.lastIndexOf("/");
  return lastSeparator < 0 ? "." : relativePath.slice(0, lastSeparator);
}

export function prepareAcceptanceTargetParent(
  project: string,
  target: string,
): void {
  const projectStat = lstatSync(project);
  if (projectStat.isSymbolicLink() || !projectStat.isDirectory()) {
    throw new Error(
      `acceptance workspace root must be a real directory: ${project}`,
    );
  }
  const segments = safeRelativeSegments(
    target,
    "product-designer acceptance target",
    project,
  );
  let current = project;
  for (const segment of segments.slice(0, -1)) {
    assertNoAcceptancePathAlias(current, segment, project);
    current = join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) {
      mkdirSync(current);
      continue;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(
        `product-designer acceptance target parent must be a real directory: ${current}; project=${project}`,
      );
    }
  }
  assertNoAcceptancePathAlias(current, segments.at(-1) ?? "", project);
}

function assertNoAcceptancePathAlias(
  parent: string,
  segment: string,
  project: string,
): void {
  if (!segment) return;
  const folded = segment.normalize("NFKC").toLocaleLowerCase("en-US");
  const collision = readdirSync(parent).find(
    (entry) =>
      entry !== segment &&
      entry.normalize("NFKC").toLocaleLowerCase("en-US") === folded,
  );
  if (collision) {
    throw new Error(
      `product-designer acceptance path has a case or Unicode alias collision: ${collision} vs ${segment}; project=${project}`,
    );
  }
}

function lstatIfPresent(
  path: string,
): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return undefined;
    throw error;
  }
}

function ensureAcceptanceEvidenceRoot(): string {
  let current = repositoryRoot;
  for (const segment of [
    ".opendock",
    "reports",
    "workspace-collection-codex-acceptance-evidence",
  ]) {
    current = join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) {
      mkdirSync(current, { mode: 0o700 });
      continue;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(
        `Codex acceptance evidence parent must be a real directory: ${current}`,
      );
    }
  }
  return current;
}

function readSingleLinkRegularFile(path: string, label: string): Buffer {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
    throw new Error(`${label} must be a single-link regular file: ${path}`);
  }
  return readFileSync(path);
}

function safeRelativeSegments(
  relativePath: string,
  label: string,
  project: string,
): string[] {
  if (
    !relativePath ||
    isAbsolute(relativePath) ||
    /^[A-Za-z]:[\\/]/.test(relativePath) ||
    relativePath.startsWith("\\\\") ||
    relativePath.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(relativePath)
  ) {
    throw new Error(
      `${label} must be a safe relative path: ${relativePath}; project=${project}`,
    );
  }
  const segments = relativePath.split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(
      `${label} must be a safe relative path: ${relativePath}; project=${project}`,
    );
  }
  return segments;
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
  const statusText =
    status.exitCode === 0 ? status.stdout.toString() : "unavailable";
  return {
    commit:
      revision.exitCode === 0 ? revision.stdout.toString().trim() : "unknown",
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
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
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
  if (project)
    firstLine = firstLine.replaceAll(project, "<acceptance-project>");
  return firstLine;
}

function tail(value: string, lines = 40): string {
  return value.split(/\r?\n/).slice(-lines).join("\n");
}

// Invoke only after every module-level validator constant has initialized.
// Imported unit tests keep the module inert because import.meta.main is false.
if (isMainModule) await runMainAcceptance();
