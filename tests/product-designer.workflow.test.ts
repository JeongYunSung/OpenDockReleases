import { describe, expect, test } from "bun:test";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { parseManifestFile } from "../../opendock/packages/cli/src/core/domain/manifest.ts";

const repositoryRoot = join(import.meta.dir, "..");
const dockRoot = join(repositoryRoot, "docks", "opendock", "product-designer");
const filesRoot = join(dockRoot, "files");
const domainRoot = join(filesRoot, ".opendock", "docks", "product-designer");
const workflowPath = join(domainRoot, "PRODUCT_DESIGN_WORKFLOW.md");
const sessionProtocolPath = join(domainRoot, "SESSION_PROTOCOL.md");
const readmePath = join(domainRoot, "README.md");
const sessionTemplatePath = join(
  filesRoot,
  ".opendock",
  "templates",
  "product-designer",
  "DESIGN_SESSION.md",
);
const skillPath = join(
  filesRoot,
  ".agents",
  "skills",
  "opendock-product-designer",
  "SKILL.md",
);

const stages = [
  "INTAKE",
  "DISCOVER",
  "FRAME",
  "DIRECTIONS",
  "SPECIFY",
  "PROTOTYPE",
  "VALIDATE",
  "HANDOFF",
] as const;

type FrontMatter = Record<string, unknown>;

function read(path: string): string {
  expect(existsSync(path), `required file is missing: ${path}`).toBe(true);
  expect(
    lstatSync(path).isSymbolicLink(),
    `symlink is not allowed: ${path}`,
  ).toBe(false);
  return readFileSync(path, "utf8");
}

function expectAll(
  text: string,
  patterns: readonly RegExp[],
  label: string,
): void {
  for (const pattern of patterns) {
    expect(text, `${label}: missing ${pattern}`).toMatch(pattern);
  }
}

function frontMatter(markdown: string): FrontMatter {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  expect(
    match,
    "SESSION.md must start with parseable YAML front matter",
  ).not.toBeNull();
  const parsed = YAML.parse(match?.[1] ?? "");
  expect(parsed).not.toBeNull();
  expect(Array.isArray(parsed)).toBe(false);
  expect(typeof parsed).toBe("object");
  return parsed as FrontMatter;
}

function allKeys(value: unknown, result: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) allKeys(item, result);
    return result;
  }
  if (value === null || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    result.push(key);
    allKeys(child, result);
  }
  return result;
}

function hasKey(value: unknown, expected: string): boolean {
  return allKeys(value).some(
    (key) => key.toLowerCase().replaceAll("-", "_") === expected,
  );
}

function gateBlock(workflow: string, gate: number): string {
  const start = workflow.search(new RegExp(`^### [^\\n]*\\bG${gate}\\b`, "im"));
  expect(start, `workflow must define G${gate}`).toBeGreaterThanOrEqual(0);
  if (gate === 6) return workflow.slice(start);
  const rest = workflow.slice(start + 1);
  const next = rest.search(new RegExp(`^### [^\\n]*\\bG${gate + 1}\\b`, "im"));
  expect(next, `G${gate} must precede G${gate + 1}`).toBeGreaterThanOrEqual(0);
  return workflow.slice(start, start + 1 + next);
}

describe("Product Designer workflow core", () => {
  test("일반 Dock은 외부 도구와 하네스 없이 동일한 플랫폼 계약을 설치한다", () => {
    const macos = parseManifestFile(join(dockRoot, "dock.macos.yml"));
    const windows = parseManifestFile(join(dockRoot, "dock.windows.yml"));

    for (const [platform, manifest] of [
      ["macos", macos],
      ["windows", windows],
    ] as const) {
      expect(Object.keys(manifest.tools ?? {}), `${platform}: tools`).toEqual(
        [],
      );
      expect(
        Object.keys(manifest.dependencies ?? {}),
        `${platform}: dependencies`,
      ).toEqual([]);
      expect(
        Object.keys(manifest.requires?.runtimes ?? {}),
        `${platform}: runtimes`,
      ).toEqual([]);
      expect(manifest.permission, `${platform}: permissions`).toEqual([]);
      expect(manifest.tasks.install, `${platform}: install tasks`).toEqual([]);
      expect(manifest.tasks.update, `${platform}: update tasks`).toEqual([]);

      const targets = manifest.files.map(({ to }) => to);
      expect(targets).toContain("AGENTS.md");
      expect(targets).toContain(
        ".agents/skills/opendock-product-designer/SKILL.md",
      );
      expect(targets).toContain(
        ".opendock/docks/product-designer/PRODUCT_DESIGN_WORKFLOW.md",
      );
      expect(targets).toContain(
        ".opendock/docks/product-designer/SESSION_PROTOCOL.md",
      );
      expect(targets).toContain(
        ".opendock/templates/product-designer/DESIGN_SESSION.md",
      );
      expect(targets).not.toContain("DESIGN.md");
      expect(targets).not.toContain("README.md");
      expect(
        targets.some(
          (target) =>
            target.includes("/harness/") ||
            /HARNESS\.md$/i.test(target) ||
            /quality-gate\.md$/i.test(target),
        ),
        `${platform}: general dock must not install a custom harness`,
      ).toBe(false);

      for (const mapping of manifest.files) read(join(dockRoot, mapping.from));
    }

    expect(windows.summary).toBe(macos.summary);
    expect(windows.readme).toBe(macos.readme);
    expect(windows.logo).toBe(macos.logo);
    expect(windows.tags).toEqual(macos.tags);
    expect(windows.files).toEqual(macos.files);
    expect(windows.tasks.doctor.map(({ id }) => id)).toEqual(
      macos.tasks.doctor.map(({ id }) => id),
    );
  });

  test("카탈로그, 라우팅 문서와 스킬은 workflow core를 직접 실행한다", () => {
    const catalog = read(join(dockRoot, "DOCK.md"));
    const agents = read(join(filesRoot, "AGENTS.md"));
    const claude = read(join(filesRoot, "CLAUDE.md"));
    const skill = read(skillPath);
    const readme = read(join(domainRoot, "README.md"));

    for (const heading of [
      "## 이런 때 사용하세요",
      "## AI에서 이렇게 사용하세요",
      "### 요청 예시",
      "## 검토가 필요할 때",
      "## 사용 후 얻는 것",
    ]) {
      expect(catalog).toContain(heading);
    }
    expect(catalog).toContain("$opendock-product-designer");
    expect(catalog.match(/^> .+/gm)?.length ?? 0).toBeGreaterThanOrEqual(2);

    const effectiveAgentLines = agents
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    expect(effectiveAgentLines.length).toBeLessThanOrEqual(20);
    expectAll(
      agents,
      [
        /PRODUCT_DESIGN_WORKFLOW\.md/,
        /(외부 자료|프로젝트 문서).*?(지시|명령).*?(근거).*?(상위 지시).*?(아니|아닙|않)/,
        /(승인|허락).*?(없이|전에|전).*?(도구|연동|변경|실행)/,
      ],
      "AGENTS.md",
    );
    expectAll(
      `${agents}\n${claude}\n${skill}`,
      [
        /(먼저).*?PRODUCT_DESIGN_WORKFLOW\.md.*?(만|only).*?(읽|시작)/is,
        /SESSION_PROTOCOL\.md.*?(SESSION\.md).*?(생성|저장|재개|분기|병합|validation exception).*?(필요한 section|필요한 부분)/is,
      ],
      "progressive disclosure",
    );

    const skillMeta = frontMatter(skill);
    expect(skillMeta.name).toBe("opendock-product-designer");
    expectAll(
      skill,
      [
        /PRODUCT_DESIGN_WORKFLOW\.md/,
        /(Product Designer|프로덕트 디자이너|제품 디자이너)/i,
        /(한 번에|매 턴).*?(하나|한|1개).*?질문/,
        /(도구|연동).*?(선택|옵션|필수.*(?:아니|아닙)|없어도)/,
        /(승인|허락).*?(전에|없이|먼저).*?(실행|사용|변경)|(연결|실행|사용|변경|외부 전송).*?(승인|허락).*?(먼저|전)/,
      ],
      "SKILL.md",
    );
    expect(skill).toMatch(
      /(첫 도구 호출).*?(Quick).*?(Guided).*?(Deep).*?(첫 사용자 응답)/is,
    );
    for (const routing of [agents, claude]) {
      expect(routing).toMatch(
        /프로젝트 파일이나 도구를 읽기 전에[\s\S]*provisional Quick, Guided 또는 Deep[\s\S]*작업 깊이: <Quick\|Guided\|Deep>[\s\S]*이유: <구체적 이유>[\s\S]*예상 설계 결정 왕복: <정수>회[\s\S]*Quick은 0~2[\s\S]*Guided는 3~7/,
      );
    }
    expectAll(
      readme,
      [
        /(도구|연동).*?(없이|없어도|선택)/,
        /(세션|작업).*?(재개|이어)/,
        /(검토|검증)/,
      ],
      "README.md",
    );
  });

  test("단계, G0-G6와 한 질문 정책이 승인되지 않은 건너뛰기를 막는다", () => {
    const workflow = read(workflowPath);
    const sessionTemplate = read(sessionTemplatePath);
    expect(sessionTemplate).toContain("- Core task or job to be done:");
    expect(sessionTemplate).not.toContain("- Core task or JTBD:");
    expect(sessionTemplate).toMatch(
      /Status.*?`not_run`.*?`pass`.*?`fail`.*?`needs_review`.*?`approved_exception`/s,
    );
    expect(sessionTemplate).toMatch(/`passed`.*?`failed`.*?변형.*?쓰지 않/s);
    expect(sessionTemplate).toMatch(
      /Approval Log[\s\S]*?canonical.*?(?:backtick|백틱).*?(?:감싸지 않|plain text)/i,
    );
    expect(sessionTemplate).toMatch(
      /Blockers.*?BLK-<id>.*?blocks=.*?evidence=.*?owner=.*?unblock=.*?plain text.*?(?:backtick|백틱).*?(?:감싸지 않|none)/is,
    );
    let priorStage = -1;
    for (const stage of stages) {
      const index = workflow.indexOf(stage);
      expect(index, `${stage} is missing or out of order`).toBeGreaterThan(
        priorStage,
      );
      priorStage = index;
    }

    const gates = Array.from({ length: 7 }, (_, gate) =>
      gateBlock(workflow, gate),
    );
    expectAll(gates[0], [/(세션|session)/i, /(맥락|context)/i], "G0");
    expectAll(
      gates[1],
      [
        /(문제|problem)/i,
        /(주 사용자|primary user|actor)/i,
        /(핵심 작업|핵심 task|core task|JTBD)/i,
        /(목표|goal)/i,
        /(사업 목표|business objective)/i,
        /(stakeholder|이해관계자).*?(운영|operation)/i,
        /(비목표|non-goal)/i,
        /(제약|constraint)/i,
      ],
      "G1",
    );
    expectAll(
      gates[2],
      [
        /(2개|두 개|둘 이상).*?(방향|대안)|(방향|대안).*?(2개|두 개|둘 이상)/,
        /(단일|하나).*?(예외|이유|근거)|single_direction_reason/i,
        /(사용자|사람).*?(승인|선택)/,
      ],
      "G2",
    );
    expectAll(
      gates[3],
      [
        /(flow|흐름)/i,
        /(state matrix|상태 매트릭스|상태 표|default.*loading.*empty.*error)/is,
        /(responsive|반응형)/i,
        /(accessibility|접근성)/i,
        /(content|콘텐츠|문구)/i,
        /(data|데이터)/i,
      ],
      "G3",
    );
    expect(workflow).toContain(
      "actor=<authorized role>; required_role=<authorized role>; capability_action=<Action ID>; control=enabled; enabled_when=<observable authorization and resource condition>",
    );
    expect(workflow).toContain(
      "actor=<unauthorized role>; required_role=<required role>; capability_action=<Action ID>; control=not_rendered; denial=<observable reason>; permission_route_action=<route Action ID>",
    );
    expectAll(
      gates[4],
      [
        /(prototype|프로토타입)/i,
        /(primary flow|핵심 흐름)/i,
        /(artifact|산출물).*?(revision|digest|리비전|체크섬)/i,
        /(구현하지|미구현|not implemented)/i,
      ],
      "G4",
    );
    expectAll(
      gates[5],
      [
        /(validate|validation|검증)/i,
        /(acceptance|수용 기준)/i,
        /(evidence|근거)/i,
        /(risk|위험)/i,
        /(not_run|pass|fail|needs_review|approved_exception)/i,
      ],
      "G5",
    );
    expectAll(
      gates[6],
      [
        /(handoff|핸드오프)/i,
        /(decision|결정)/i,
        /(acceptance|수용 기준)/i,
        /(asset|자산)/i,
        /(token|토큰)/i,
        /(미해결|unresolved|open item)/i,
      ],
      "G6",
    );

    expectAll(
      workflow,
      [
        /(한 번에|매 턴).*?(하나|한|1개).*?질문/,
        /(Evidence Register).*?(출처 종류).*?(locator).*?(revision|접근 시점).*?(ambiguity|decision)/is,
        /(이미|기존).*?(답|확인|근거).*?(다시|반복).*?(묻지|질문하지)/,
        /(required item|필수 항목).*?(resolved|해결|승인).*?(gate|게이트).*?(충족|통과)/i,
        /(integration|연동|외부(?: 디자인)? 도구|연결 수단).*?(gate|게이트|단계 통과).*?(필수|조건).*?(아니|아닙|않)/i,
        /Quick[\s\S]{0,260}(decision turn).*?(0~2|0-2)회/i,
        /Guided[\s\S]{0,300}(decision turn).*?(3~7|3-7)회/i,
        /Deep[\s\S]{0,620}5개의 완료된 decision turn.*?요약.*?mode_decision_turn_count.*?(메타 질문).*?(만들지|않)/i,
        /(질문 하나).*?(resolved|assumed|deferred|blocked).*?(전이|바꾸|상태)/is,
        /(공통 용어와 관계).*?(역할).*?(대상).*?(행동).*?(상태).*?(안정된 id)/is,
        /(performs).*?(acts_on).*?(transitions_to).*?(depends_on).*?(excludes).*?(satisfies)/is,
        /(용어).*?(해석).*?(둘 이상).*?(Ambiguity Ledger)/is,
        /Quick[\s\S]{0,720}(delivery profile).*?(필요한 검증).*?(생략).*?(요청하지 않은 prototype).*?(만들지)/i,
        /(decision turn).*?(질문).*?(design approval).*?(capability approval).*?(별도)/is,
        /(첫 응답).*?(자동 선택).*?(mode 선택).*?(질문).*?(하지 않)/is,
        /(Quick).*?(count가 2).*?(Guided).*?(자동 승격)/is,
        /(Guided).*?(count).*?(관측값).*?7.*?(stage).*?(gate_state).*?(completion).*?(강제로).*?(바꾸지|변경하지)/is,
        /(해결된 결정).*?(남은 blocker).*?(가장 영향이 큰).*?(질문 하나)/is,
        /(피로|중단|범위 축소).*?(paused checkpoint)/is,
      ],
      "workflow control",
    );
  });

  test("DESIGN.md는 범위 권한과 명시적 충돌 해결로만 변경된다", () => {
    const workflow = read(workflowPath);
    const combined = `${workflow}\n${read(sessionProtocolPath)}`;

    expectAll(
      combined,
      [
        /DESIGN\.md/,
        /(가장 가까운|nearest).*?(범위|scope|DESIGN\.md)|(범위|scope).*?(가장 가까운|nearest)/i,
        /(checksum|hash|체크섬|해시)/i,
        /(없으면|없는 경우|없다면).*?(임시|세션).*?(계약|contract|Design Contract)/i,
        /(승인된|승인한|명시적 승인).*?(계약 변경|contract change|세션 예외|session exception)/i,
        /(유지|보존).*?(예외).*?(변경|수정)|(유지|보존)[\s\S]{0,240}(예외)[\s\S]{0,240}(변경|수정)/,
        /(자동|조용히|무단).*?(덮어쓰|덮지|override|변경).*?(않|금지|습니다)/i,
        /(충돌).*?(해소|승인).*?(전).*?(정답|확정된 기준).*?(단정|표현).*?(않|금지)/is,
        /(변경|불일치).*?(영향받은|affected).*?(stale|무효|재검증)|DESIGN\.md.*?(hash|해시).*?(바뀌|변경).*?scope.*?(재검토|stale)/i,
        /(같은 권한 등급).*?DESIGN\.md.*?(더 가까운 문서).*?(상위 문서).*?(우선)/is,
        /(변경 불가|불변).*?(scope|범위).*?(불명확).*?(충돌).*?(해소)/is,
      ],
      "DESIGN.md authority",
    );
  });

  test("SESSION.md는 공급자 중립 snapshot과 append-only 로그를 제공한다", () => {
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    const snapshot = frontMatter(template);

    expect(snapshot.schema).toBe("opendock/product-designer-session/v1");
    for (const field of [
      "session_id",
      "session_path",
      "parent_session_id",
      "branch_id",
      "branch_purpose",
      "fork_checkpoint_revision",
      "fork_last_event_id",
      "merge_status",
      "checkpoint_revision",
      "workflow_revision",
      "workflow_sha256",
      "protocol_revision",
      "protocol_sha256",
      "status",
      "current_stage",
      "current_gate",
      "gate_state",
      "last_passed_gate",
      "completion_kind",
      "delivery_profile",
      "last_event_id",
      "persona",
      "skill_sha256",
      "mode",
      "mode_reason",
      "mode_decision_turn_count",
      "checkpoint_write_approval_id",
    ]) {
      expect(hasKey(snapshot, field), `SESSION front matter: ${field}`).toBe(
        true,
      );
    }
    expect(snapshot.persona).toMatch(/^opendock\.product-designer@\d+$/);
    expect(snapshot.workflow_revision).toBe(
      "opendock.product-designer-workflow@2",
    );
    expect(snapshot.protocol_revision).toBe(
      "opendock.product-designer-session-protocol@2",
    );
    expect(stages).toContain(
      String(snapshot.current_stage) as (typeof stages)[number],
    );
    expect(["active", "paused", "complete"]).toContain(snapshot.status);
    expect(["quick", "guided", "deep"]).toContain(snapshot.mode);
    expect([
      "decision",
      "specification",
      "prototype",
      "implementation",
    ]).toContain(snapshot.delivery_profile);
    expect(snapshot.mode_decision_turn_count).toBe(0);

    const forbiddenKey =
      /^(?:api[_-]?key|(?:access|refresh)[_-]?token|secret|password|private[_-]?reasoning|hidden[_-]?reasoning|chain[_-]?of[_-]?thought|codex[_-]?(?:thread|session)(?:[_-]?id)?|claude[_-]?(?:thread|session)(?:[_-]?id)?|provider[_-]?session[_-]?id|tool[_-]?call[_-]?id)$/i;
    for (const key of allKeys(snapshot)) {
      expect(
        key,
        `provider/private field must not be persisted: ${key}`,
      ).not.toMatch(forbiddenKey);
    }
    if (hasKey(snapshot, "integrations")) {
      const integrations = snapshot.integrations;
      expect(
        integrations === undefined ||
          integrations === null ||
          (Array.isArray(integrations) && integrations.length === 0) ||
          (typeof integrations === "object" &&
            Object.keys(integrations as Record<string, unknown>).length === 0),
        "integrations must be absent or empty in the core template",
      ).toBe(true);
    }

    expectAll(
      template,
      [
        /^#{1,2} .*Ambiguit|^#{1,2} .*모호/gim,
        /^#{1,2} .*Decision Log|^#{1,2} .*결정 로그/gim,
        /^# Shared Vocabulary and Relationships$/im,
        /^# Acceptance Contract$/im,
        /^#{1,2} .*Validation Log|^#{1,2} .*검증 로그/gim,
        /^#{1,2} .*Change Log|^#{1,2} .*변경 로그/gim,
        /(Approval and subject revision|승인.*subject revision|승인.*대상 revision)/i,
        /(Relative path or symbol|상대 path|상대 경로).*?(Revision|SHA-256|리비전)/i,
        /^# Current Checkpoint$/im,
        /(Next action|다음 행동):/i,
      ],
      "SESSION.md sections",
    );
    expectAll(
      protocol,
      [
        /opendock\/product-designer-session\/v1/,
        /\.opendock\/runs\/product-designer\/<session-id>\/SESSION\.md/,
        /(front matter|프런트 매터|YAML).*?(snapshot|스냅샷)/i,
        /(Decision|결정).*?(Validation|검증).*?(Change|변경).*?(append-only|추가 전용|뒤에 추가|과거 행.*(?:삭제|수정).*않.*새 행.*추가)/is,
        /(provider|공급자).*?(neutral|중립)/i,
        /(Goal|Frame|Directions|Specification|Prototype|Handoff).*?(projection|프로젝션).*?(checkpoint revision|체크포인트 리비전).*?(Change Log|변경 로그)/is,
        /(Ambiguity|Decision|Approval|Validation).*?(append-only|추가 전용)/is,
        /(secret|credential|비밀|인증).*?(저장|기록).*?(않|금지)/i,
        /(hidden reasoning|private reasoning|chain.of.thought|숨은 (?:추론|reasoning)|비공개 추론).*?(저장|기록).*?(않|금지)/i,
        /(SESSION\.md|세션).*?(신뢰되지 않은|비신뢰).*?(evidence|근거)/i,
        /(next action|다음 행동).*?(제안).*?(실행 권한|자동 실행).*?(아니|않)/i,
        /\[a-z0-9\].*?\{0,63\}/i,
        /(절대 경로|absolute path).*?(\.\.|Windows drive|UNC|NUL).*?(거부|금지)/is,
        /(symlink|심볼릭 링크).*?(hardlink|하드링크).*?(따라가지|거부|금지)/is,
      ],
      "session protocol",
    );
    expectAll(
      template,
      [
        /^# Approval Log$/im,
        /Event ID.*Checkpoint Revision.*Occurred At.*Approval ID.*Kind.*Action.*Resource path or host.*Access and data classes.*Subject revision.*Single use or expiry.*Status.*Human approver.*Supersedes Event ID/i,
      ],
      "SESSION.md approval boundary",
    );
  });

  test("새 세션은 설치된 template 구조를 그대로 보존한다", () => {
    const skill = read(skillPath);
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    expectAll(
      skill,
      [
        /DESIGN_SESSION\.md.*?(관리 envelope).*?(payload).*?(그대로 복제).*?(값과 본문만)/is,
        /(관리 envelope).*?(시작.*끝 주석).*?(사용자 세션).*?(복사하지)/is,
        /(front matter key).*?(heading).*?(table heading).*?(column 순서).*?(바꾸지)/is,
        /(필수 key).*?(heading).*?(table column).*?(빠졌|달라졌).*?(완료로 보고하지)/is,
        /text prototype.*?# Prototype.*?## Prototype Detail.*?H1\/H2/is,
      ],
      "skill template conformance",
    );
    expectAll(
      protocol,
      [
        /DESIGN_SESSION\.md.*?(template payload).*?(관리 envelope).*?(시작.*끝 주석).*?(제외).*?(내부 payload).*?(placeholder value).*?(section 본문)/is,
        /(SESSION\.md).*?`---`.*?(시작).*?(관리 envelope 주석).*?(포함할 수 없)/is,
        /`schema`.*?`schema_id`.*?(바꾸|금지|않)/is,
        /`## State Matrix`.*?`State Coverage`.*?(바꾸지|금지)/is,
        /wireflow.*?text prototype.*?# Prototype.*?## Prototype Detail.*?(?:H1\/H2|viewport별 H2).*?(?:추가하지|만들지)/is,
        /(Acceptance Contract).*?(acceptance 하나당).*?(한 행).*?(합치지)/is,
        /(Validation Log).*?(acceptance 하나당).*?(별도 event).*?(Required).*?(Subject revision).*?(Method).*?(Status).*?(Evidence).*?(Supersedes Event ID)/is,
        /(저장하기 직전).*?(template).*?(필수 front matter key).*?(heading).*?(table heading).*?(column 순서).*?(확인)/is,
        /single_use.*?(메모리).*?(검토).*?(정확히 한 번).*?(atomic 파일 변경).*?consumed.*?(같은 checkpoint revision)/is,
        /(구조가 다른).*?(자동 재작성하지).*?(migration 계획).*?(승인)/is,
      ],
      "protocol template conformance",
    );
    expect(template).toMatch(/^# Prototype$[\s\S]*^## Prototype Detail$/m);
  });

  test("pause, resume, stale과 decision supersede가 이력을 잃지 않는다", () => {
    const workflow = read(workflowPath);
    const combined = `${workflow}\n${read(sessionProtocolPath)}`;

    expectAll(
      combined,
      [
        /status.*paused|paused.*status/i,
        /(paused|일시 중단).*?(current_stage|현재 단계).*?(유지|보존)|(current_stage|현재 단계).*?(유지|보존).*?(paused|일시 중단)/is,
        /(사용자.*응답|응답.*시점|응답 경계).*?(다음 행동|입력|승인|외부 결과).*?(paused)/is,
        /(재개).*?(같은 stage|같은 단계).*?(active)/is,
        /(resume|재개).*?(next_action|다음 행동).*?(부터|이어)/is,
        /(resume|재개).*?(snapshot|스냅샷|schema|스키마).*?(검증|대조|확인)/is,
        /(checksum|hash|체크섬|해시).*?(불일치|변경).*?(stale|무효|재검증)/is,
        /(decision|결정).*?(수정|덮어쓰|삭제).*?(않|금지).*?(supersede|대체|폐기)/is,
        /(append-only|추가 전용|뒤에 추가|과거 행.*(?:삭제|수정).*않.*새 행.*추가)/is,
      ],
      "session continuity",
    );
  });

  test("acceptance, prototype과 validation evidence를 같은 계약으로 연결한다", () => {
    const workflow = read(workflowPath);
    const template = read(sessionTemplatePath);
    expectAll(
      workflow,
      [
        /(acceptance).*?(claim).*?(필수 여부).*?(검증 방법).*?(threshold).*?(최소 prototype 수준).*?(owner)/is,
        /(사용자 사용성|user usability|outcome).*?(participant|참여자).*?(owner).*?(privacy|consent|동의).*?(중단 조건)/is,
        /(Prototype 기록).*?(level).*?(acceptance.*claim).*?(구현하지 않은|의도적으로).*?(artifact revision)/is,
      ],
      "acceptance contract",
    );
    expectAll(
      template,
      [
        /Acceptance ID.*Claim.*Required for delivery.*Method.*Threshold.*Minimum prototype level.*Target participants.*Owner.*Privacy, consent and stop condition/i,
        /Artifact.*Relative path or symbol.*Revision or SHA-256.*Level.*Acceptance IDs and claims supported.*Intentional omissions.*Status/i,
        /Event ID.*Checkpoint Revision.*Occurred At.*Acceptance ID.*Required.*Subject revision.*Method.*Status.*Evidence.*Supersedes Event ID/i,
      ],
      "acceptance template",
    );
  });

  test("G3는 flow-critical data를 bounded interface assumption으로만 확정한다", () => {
    const g3 = gateBlock(read(workflowPath), 3);

    expectAll(
      g3,
      [
        /(eligibility).*?(다음 route).*?(사용자에게 보이는 상태).*?(안내 문구).*?(state transition).*?(acceptance 결과).*?(flow-critical)/is,
        /(flow-critical).*?(source).*?(freshness).*?(permission).*?(null).*?(fallback).*?(unknown).*?G3.*?(통과할 수 없)/is,
        /(backend 사실).*?(Design Interface Assumption).*?(bounded source\/interface).*?(freshness).*?(actor\/role).*?(null).*?(fallback).*?(owner).*?(validation_point)/is,
        /(Owner|owner).*?(책임 역할).*?(backend).*?(team).*?(product).*?(완료값.*?아니|invalid|적지 않)/is,
        /(backend에서 정함).*?(owner만 붙인 unknown).*?(fallback 없는 가정).*?(대체 계약이 아닙니다)/is,
        /(안전하게 되돌릴 수).*?(설계 검증 범위).*?(G3).*?(구현이나 실제 연동).*?(미입증)/is,
      ],
      "G3 content/data boundary",
    );
  });

  test("state-changing action은 같은 대상 identity를 terminal까지 유지한다", () => {
    expectAll(
      `${read(skillPath)}\n${read(workflowPath)}\n${read(sessionProtocolPath)}\n${read(sessionTemplatePath)}`,
      [
        /primary `?state_change`?.*?flow-critical.*?action:<Action ID>.*?binding:<object>\.id/is,
        /(submit).*?(processing|refresh).*?(terminal).*?(같은|유지).*?(identity|binding)/is,
        /(label|표시 label).*?(index|순서).*?(화면 위치|위치).*?(identity|식별자).*?(아니|대신하지 않)/is,
      ],
      "stable target identity",
    );
  });

  test("모든 primary state-changing action은 전달 가능한 실행 계약을 갖는다", () => {
    const g3 = gateBlock(read(workflowPath), 3);
    const skill = read(skillPath);

    expectAll(
      g3,
      [
        /(primary state-changing action).*?(delivery).*?(필수).*?(acceptance coverage)/is,
        /(actor).*?(eligibility).*?(precondition)/is,
        /(한 번의 의도).*?(한 번만 submission).*?(idempotency|duplicate prevention)/is,
        /(in-progress feedback).*?(중복 조작).*?(control)/is,
        /(success).*?(failure).*?(recovery)/is,
        /(시작 상태).*?(처리 중 상태).*?(terminal state).*?(state transition)/is,
        /(하나가 빠진 state-changing action).*?(delivery acceptance).*?(G3).*?(통과할 수 없)/is,
      ],
      "state-changing action delivery contract",
    );
    expectAll(
      skill,
      [
        /(primary state-changing action).*?(actor).*?(precondition).*?(submission).*?(idempotency|duplicate).*?(in-progress).*?(성공).*?(실패).*?(복구).*?(terminal state).*?(G3·G5).*?(통과시키지)/is,
        /(flow-critical data).*?(source).*?(freshness).*?(permission).*?(null).*?(fallback).*?(Design Interface Assumption).*?(owner).*?(validation point).*?(안전한 fallback).*?(unknown).*?(완료값)/is,
      ],
      "skill state-changing action routing",
    );
    expect(`${skill}\n${g3}`).toMatch(
      /state_change 행[\s\S]*Claim 또는 Threshold[\s\S]*같은 Action ID[\s\S]*Prototype[\s\S]*(?:ID 집합|acceptance_set)[\s\S]*(?:정확히 같|동일성)/,
    );
    expect(`${skill}\n${g3}`).toMatch(
      /Markdown table(?:의)? cell[\s\S]*raw `\|`[\s\S]*(?:or|쉼표)/,
    );
    expect(`${skill}\n${g3}`).toMatch(
      /수치형 사용자·비즈니스 outcome[\s\S]*optional (?:Evidence-backed )?Acceptance[\s\S]*Evidence-backed[\s\S]*(?:not_run|needs_review)[\s\S]*Handoff/,
    );
  });

  test("G1 Goal 승인 provenance는 G6 delivery 승인과 별도다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    const skill = read(skillPath);
    const combined = `${workflow}\n${protocol}\n${template}\n${skill}`;

    expect(combined).toContain(
      "User approval: status=approved_in_request; evidence=<EVD-ID>; subject_revision=<concrete Goal and Frame revision>",
    );
    expect(combined).toContain(
      "User approval: status=approved; approval=<Approval ID>@<current head Event ID>; subject_revision=<concrete Goal and Frame revision>",
    );
    expectAll(
      combined,
      [
        /pending.*?(G1을 통과하기 전|G1 통과 전)/is,
        /G1.*?(passed|reused).*?pending.*?(남길 수 없|통과값이 아닙니다)/is,
        /G1.*?(Goal·Frame|Goal.*Frame).*?(G6).*?(별개|서로 대체되지 않|재사용하지 않)/is,
      ],
      "G1 approval provenance",
    );
    expect(skill).toMatch(
      /approved_in_request.*?Evidence.*?Goal.*?Frame.*?scope.*?direction.*?capability.*?재사용하지/is,
    );
    expect(protocol).toMatch(
      /approved_in_request.*?Evidence.*?Goal.*?Frame.*?scope.*?direction.*?checkpoint write.*?아닙니다/is,
    );
    expect(template).toMatch(
      /approved_in_request.*?Evidence.*?Goal.*?Frame.*?scope.*?direction.*?single_use.*?capability.*?사용하지/is,
    );
  });

  test("state-change cell은 exact assignment와 canonical 전이 문법을 공유한다", () => {
    const combined = `${read(skillPath)}\n${read(workflowPath)}\n${read(sessionProtocolPath)}\n${read(sessionTemplatePath)}`;
    const canonicalClauses = [
      "actor=<role or actor class>; eligibility=<observable authorization and resource condition>",
      "submission_scope=one_intent; duplicate_policy=<bounded duplicate prevention>; target_identity=binding:<object>.id",
      "in_progress_control=disabled; feedback=<observable processing feedback>",
      "terminal_success_when=<positive observable terminal event>",
      "transition=<start state> -> <processing state> -> <terminal success state> or <terminal failure state>",
    ] as const;

    for (const clause of canonicalClauses) {
      expect(
        combined,
        `missing canonical state-change clause: ${clause}`,
      ).toContain(clause);
    }
    expectAll(
      combined,
      [
        /acknowledgement_only_when=<positive nonterminal event>.*?(In-progress|processing)/is,
        /(canonical key).*?(prose).*?(G3 projection이 아닙니다|생략하지)/is,
      ],
      "canonical state-change grammar",
    );
  });

  test("terminal data contract는 action, target, terminal binding과 evidence 경계를 고정한다", () => {
    const combined = `${read(skillPath)}\n${read(workflowPath)}\n${read(sessionProtocolPath)}\n${read(sessionTemplatePath)}`;

    expect(combined).toContain(
      "action:<Action ID>; binding:<object>.id; binding:<terminal field>",
    );
    expectAll(
      combined,
      [
        /target_identity.*?(exact identity|같).*?(submit).*?(processing|refresh).*?terminal/is,
        /terminal_success_when.*?exact `binding:<terminal field>`.*?`binding:<object>\.id`.*?(모두 포함)/is,
        /(data enum|interface shape).*?(runtime).*?(terminal writer).*?(refresh).*?(transition behavior).*?(design_interface_assumption)/is,
        /(Source\/interface).*?Freshness.*?Read actor.*?Write actor.*?(Evidence Register).*?(직접 입증|정확한 범위).*?(fact).*?(design_interface_assumption)/is,
        /(Freshness).*?(assumed read\/refresh boundary).*?(재확인 trigger).*?not evidenced.*?완료값이 아닙니다/is,
      ],
      "terminal data provenance",
    );
  });

  test("permission capability는 route와 역할별 prototype control을 exact clause로 연결한다", () => {
    const combined = `${read(skillPath)}\n${read(workflowPath)}\n${read(sessionProtocolPath)}\n${read(sessionTemplatePath)}`;

    for (const clause of [
      "route_kind=permission; permission_for=<capability Action ID>",
      "actor=<authorized role>; required_role=<authorized role>; capability_action=<Action ID>; control=enabled; enabled_when=<observable authorization and resource condition>",
      "actor=<authorized role>; required_role=<authorized role>; capability_action=<Action ID>; control=disabled; re_enable_when=<observable condition>",
      "actor=<unauthorized role>; required_role=<required role>; capability_action=<Action ID>; control=not_rendered; denial=<observable reason>; permission_route_action=<route Action ID>",
    ] as const) {
      expect(
        combined,
        `missing canonical permission clause: ${clause}`,
      ).toContain(clause);
    }
    expectAll(
      combined,
      [
        /permission_for.*?(capability Action ID).*?(Flow).*?(Content and Data Contract).*?(State Matrix).*?(Prototype)/is,
        /(적용되지 않는 state).*?(bounded N\/A|bounded N\/A로|bounded N\/A로만).*?(제외)/is,
        /(State transition cell).*?route_kind=permission; permission_for=<capability Action ID>; transition=<start> -> <processing> -> <ready or fallback>.*?(not_applicable).*?(중첩하지 않|넣지 않)/is,
      ],
      "permission capability contract",
    );
  });

  test("접근성 pass evidence는 exact prototype revision에 묶이고 WCAG를 과장하지 않는다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    const combined = `${read(skillPath)}\n${workflow}\n${protocol}\n${template}`;

    expect(combined).toContain(
      "claim_kind=accessibility_structure; checks=keyboard_path,focus_after",
    );
    expect(combined).toContain(
      "claim_kind=wcag_conformance; audit=manual_and_automated_rendered",
    );
    expectAll(
      combined,
      [
        /acceptance=<ACC-ID>; keyboard_path=.*?evidence=<Prototype Relative path or symbol>@<Prototype Revision or SHA-256>/is,
        /acceptance=<ACC-ID>; focus_after_action=<Action ID>; outcome=<success or failure or return>; target=.*?evidence=<same exact evidence token>/is,
        /(Validation Evidence|Validation head).*?(exact evidence token|같은 token).*?(Subject revision|Prototype revision)/is,
        /(Subject revision).*?(raw `Revision or SHA-256` token|raw `Revision or SHA-256`).*?(글자 단위로 같).*?(Prototype@).*?(붙이지 않)/is,
        /(keyboard path).*?(state-changing action|state_change).*?(success).*?(failure).*?(focus)/is,
        /(같은 ACC ID와 Prototype revision|same ACC ID and Prototype revision).*?(keyboard path|keyboard_path).*?(정확히 하나).*?(서로 다른 canonical ref).*?(2개 이상)/is,
        /(focus action|focus_after_action).*?(exact path).*?(path의 각 state-changing action|path의 각 `state_change` action).*?(success target).*?(정확히 하나).*?(failure target).*?(정확히 하나)/is,
        /(중복·상충 path).*?(중복·상충 target).*?(path 밖).*?(invalid|pass가 아닙니다)/is,
        /(Structure proof|Structure 검토).*?(WCAG conformance).*?(뜻하지 않|표현하지 않)/is,
        /(formal conformance).*?(승인된 delivery boundary 밖).*?(optional).*?(Required for delivery=no).*?(Interactive).*?(not_run).*?(needs_review)/is,
        /(rendered conformance).*?(delivery-required).*?Required for delivery=yes.*?(exact|정확한).*?audit.*?needs_review.*?G5.*?(막|block)/is,
        /acceptance=<Acceptance ID>; status=<same current Validation head status>; proof=unproven; owner=<same Acceptance owner>; validation_point=before:<kebab-case event>; expected_evidence=<bounded rendered audit locator>/,
        /(status).*?(latest|current).*?Validation head.*?(owner).*?Acceptance (?:owner|row).*?(정확히 같|exact match|exact linkage)/is,
        /(approved_exception).*?(waiver|예외).*?(proof|evidence).*?(대신하지 않|새로 만들지 않)/is,
      ],
      "artifact-bound accessibility evidence",
    );
  });

  test("non-rendered WCAG target과 delivery-required conformance proof를 구분한다", () => {
    const texts = [
      read(skillPath),
      read(workflowPath),
      read(sessionProtocolPath),
      read(sessionTemplatePath),
    ];
    for (const text of texts) {
      expect(text).toMatch(/WCAG AA를 따른다/);
      expect(text).toMatch(/(?:non-rendered|text prototype)/i);
      expect(text).toMatch(/(?:audit 또는 proof 자체|audit.*proof)/i);
    }
  });

  test("Action과 Content/Data 계약은 구조화되지만 사용자 의식 비용은 비례한다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const template = read(sessionTemplatePath);

    expect(template).toContain(
      "| Action ID | Kind | Actor and eligibility | Precondition | Single submission / duplicate prevention | In-progress feedback and control | Success | Failure and recovery | State transition | Required Acceptance IDs |",
    );
    expect(template).toContain(
      "| Contract ID | Binding or action | Flow critical | Source/interface | Freshness | Read actor | Write actor | Null meaning | Safe visible fallback | Status | Owner | Validation point |",
    );
    expectAll(
      workflow,
      [
        /Action ID \| Kind \| Actor and eligibility \| Precondition \| Single submission \/ duplicate prevention \| In-progress feedback and control \| Success \| Failure and recovery \| State transition \| Required Acceptance IDs/i,
        /(state_change).*?(actual role|실제 role).*?(eligibility).*?(precondition).*?(한 의도당 한 submission).*?(처리 중 feedback).*?(success).*?(failure).*?(recovery).*?(terminal state).*?(Acceptance ID)/is,
        /(navigation).*?(read).*?(not_applicable\(reason=<bounded reason>\)).*?(표를 덜 채우기).*?(허용하지)/is,
        /Contract ID \| Binding or action \| Flow critical \| Source\/interface \| Freshness \| Read actor \| Write actor \| Null meaning \| Safe visible fallback \| Status \| Owner \| Validation point/i,
        /(Flow critical=yes).*?(bounded fact).*?(design_interface_assumption).*?(unknown).*?(backend_decides).*?G3.*?(통과하지 못)/is,
        /(AI가 내부적으로 유지|AI-managed).*?(매 응답).*?(표 전체).*?(보여주|노출).*?(않).*?(handoff|전달).*?(Action ID).*?(Contract ID).*?(Acceptance ID)/is,
        /(실제 범위).*?(있을 때만 필요|적용되지 않는 범위).*?(not_applicable)/is,
      ],
      "workflow structured handoff contracts",
    );
    expectAll(
      protocol,
      [
        /Action Contract.*?Action ID \| Kind.*?Required Acceptance IDs/is,
        /Content and Data Contract.*?Contract ID \| Binding or action.*?Validation point/is,
        /(state_change).*?(모두 구체적으로).*?(Required Acceptance ID).*?(unknown).*?(backend_decides).*?G3/is,
        /(Flow critical=yes).*?(fact).*?(design_interface_assumption).*?(unknown).*?(safe visible fallback).*?G3/is,
        /(AI-managed session projection).*?(매 응답).*?(표 전체).*?(요구하거나 노출하지 않).*?(handoff).*?(관련 ID)/is,
      ],
      "protocol structured handoff invariants",
    );
    expectAll(
      skill,
      [
        /(AI-managed Action Contract).*?(Action ID).*?(state_change).*?(G3·G5).*?(통과시키지)/is,
        /(Content and Data Contract).*?(Contract ID).*?(bounded fact).*?(Design Interface Assumption).*?(unknown).*?(backend_decides).*?(완료값)/is,
        /(표는 AI가 내부적으로 유지).*?(사용자).*?(전체를 노출하지 않).*?(handoff).*?(Action ID).*?(Contract ID).*?(Acceptance ID)/is,
      ],
      "skill structured handoff routing",
    );
  });

  test("permission과 disabled State Matrix는 역할별 canonical 경로를 고정한다", () => {
    const workflow = read(workflowPath);
    const g3 = gateBlock(workflow, 3);

    expect(g3).toContain(
      "actor=<role>; required_role=<role>; capability_action=<Action ID>; control=<enabled, disabled, hidden, or not_rendered>; denial=<observable reason or not_applicable(reason=role authorized)>; next_route_action=<Action ID>",
    );
    expect(g3).toContain(
      "actor=<role>; required_role=<role>; capability_action=<Action ID>; control=disabled; denial=not_applicable(reason=role authorized); re_enable_when=<observable condition>; next_route_action=<Action ID>",
    );
    expectAll(
      g3,
      [
        /(같은 capability).*?(역할이 다르면).*?(줄을 나누)/is,
        /actor.*?(authorized user).*?(포괄어).*?(actual role|실제 role)/is,
        /(permission 상태).*?(enabled action).*?(노출하지).*?(정확히 하나).*?(다음 경로)/is,
        /(disabled 상태).*?(re_enable_when).*?(정확히).*?(조건 충족 시).*?(허용하지 않)/is,
        /(route).*?(Action ID).*?(Flow).*?(Content and Data Contract).*?(State Matrix).*?(Prototype).*?(exact ID|exact token|완전한 ID token|exact ID 교집합)/is,
      ],
      "canonical State Matrix",
    );
    expect(workflow).not.toMatch(/Retry transaction|Supervisor enabled/i);
  });

  test("모든 SESSION table은 global raw-pipe 금지와 canonical arity를 공유한다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const template = read(sessionTemplatePath);
    const expectedArities = new Map<string, number>([
      ["Design Contract Scope Map", 4],
      ["Evidence Register", 7],
      ["Shared Vocabulary and Relationships", 8],
      ["Ambiguity Ledger", 13],
      ["Decision Log", 11],
      ["Approval Log", 13],
      ["Flow", 10],
      ["State Matrix", 4],
      ["Content and Data Contract", 12],
      ["Acceptance Contract", 9],
      ["Prototype", 7],
      ["Validation Log", 11],
      ["Change Log", 7],
    ]);
    const arityContract = [...expectedArities]
      .map(([heading, arity]) => `${heading}=${arity}`)
      .join("; ");

    expect(protocol).toContain(
      `canonical \`table_arity\`: \`${arityContract}\``,
    );
    expect(template).toContain(`\`table_arity\`는 \`${arityContract}\``);
    expectAll(
      `${skill}\n${workflow}\n${protocol}\n${template}`,
      [
        /(모든).*?(Markdown|SESSION).*?table.*?cell.*?raw `\|`.*?(쓰지 않|금지)/is,
        /(모든 body row|각 header, separator와 body row).*?(열 수).*?(정확히 같)/is,
        /(AI가 내부적으로 수행|AI 내부 검사).*?(사용자).*?(표를 고치게 하지 않|노출하지 않)/is,
      ],
      "global table contract",
    );

    let currentHeading = "";
    const seen = new Set<string>();
    for (const line of template.split(/\r?\n/)) {
      const heading = line.match(/^#{1,2} (.+)$/)?.[1];
      if (heading) currentHeading = heading;
      if (!line.startsWith("|")) continue;
      const expected = expectedArities.get(currentHeading);
      if (expected === undefined) continue;
      seen.add(currentHeading);
      const cells = line.split("|").slice(1, -1);
      expect(
        cells.length,
        `${currentHeading} row must have exactly ${expected} cells: ${line}`,
      ).toBe(expected);
    }
    expect(seen).toEqual(new Set(expectedArities.keys()));
  });

  test("Markdown table delimiter는 cell마다 세 hyphen 이상이다", () => {
    for (const text of [
      read(skillPath),
      read(sessionProtocolPath),
      read(sessionTemplatePath),
    ]) {
      expect(text).toMatch(/(?:delimiter|separator)/i);
      expect(text).toMatch(/---/);
      expect(text).toMatch(/(?:세 hyphen|세 개보다 적|최소.*세 hyphen)/i);
    }
  });

  test("저장 preflight는 exact Action-Acceptance-Prototype ID 집합을 비교한다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const template = read(sessionTemplatePath);

    expectAll(
      `${workflow}\n${protocol}\n${skill}`,
      [
        /(required_set).*?(reverse_reference_set).*?(prototype_support_set).*?(정확히 같은 집합|required_set == reverse_reference_set == prototype_support_set)/is,
        /(접근성·권한·반응형|cross-cutting Acceptance).*?(Claim 또는 Threshold).*?(exact Action ID).*?(세 집합 모두에 포함)/is,
        /(완전한 ID token|완전한 token).*?ACT-1.*?ACT-10.*?(일치하지 않|세지 않)/is,
        /(prefix|substring).*?(일치로 세지 않)/is,
      ],
      "exact ID-set preflight",
    );
    expect(`${workflow}\n${protocol}\n${template}`).toContain(
      "action=<ACT-ID>; acceptance_set=<comma-separated exact ACC-IDs>; claim=<bounded claim>",
    );
  });

  test("null, validation point와 overdue는 canonical machine-readable contract다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const template = read(sessionTemplatePath);
    const combined = `${workflow}\n${protocol}\n${skill}\n${template}`;

    expect(combined).toContain(
      "null_means=<absent, null 또는 unrecognized일 때의 실제 도메인 의미>",
    );
    expectAll(
      combined,
      [
        /contract violation.*?invalid.*?none.*?(완료값이 아닙니다|G3를 막습니다|쓰지 않습니다)/is,
        /validation_point=gate:<G0-G6>; evidence=<EVD-ID 또는 revision>/,
        /validation_point=before:<kebab-case event>; expected_evidence=<bounded locator>/,
        /(Handoff).*?(Contract ID).*?validation_point=before:<event>; expected_evidence=<locator>.*?(문자열 그대로|완전한).*?(expected_evidence).*?(생략|대체하지 않|빼지)/is,
        /current session.*?when ready.*?(later|when available).*?(완료값이 아닙니다|쓰지 않습니다|bounded validation event가 아닙니다)/is,
        /(due gate).*?(named event).*?(evidence가 없으면|새 evidence가 없으면).*?overdue.*?(gate|event|claim).*?(막|진행하지 않)/is,
      ],
      "canonical validation point",
    );
  });

  test("optional numeric outcome은 Handoff의 ID, status, owner와 point를 고정한다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const template = read(sessionTemplatePath);
    const combined = `${workflow}\n${protocol}\n${skill}\n${template}`;

    expect(combined).toContain(
      "outcome=<Acceptance ID>; status=<not_run 또는 needs_review>; proof=unproven; owner=<측정 owner>; validation_point=before:<kebab-case event>; expected_evidence=<bounded locator>",
    );
    expectAll(
      combined,
      [
        /(Acceptance와 Validation head|Acceptance ID와 미입증).*?(exact ID|같은 Acceptance ID).*?(status|상태)/is,
        /(optional Evidence-backed Acceptance|optional Acceptance).*?(not_run|needs_review).*?proof=unproven/is,
      ],
      "optional outcome handoff",
    );
  });

  test("permission route와 terminal success는 네 surface에서 positive exact contract다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const template = read(sessionTemplatePath);
    const combined = `${workflow}\n${protocol}\n${skill}\n${template}`;

    expectAll(
      combined,
      [
        /Flow.*?Action ID.*?Content and Data Contract.*?action:<Action ID>.*?State Matrix.*?next_route_action=<Action ID>.*?Prototype.*?permission_route_action=<Action ID>/is,
        /(accepted|submitted).*?(acknowledgement_only_when=<positive nonterminal event>).*?(processing).*?terminal_success_when=<positive observable terminal event>/is,
        /(Success cell).*?(State Matrix).*?(Prototype).*?(동일한|같은).*?terminal_success_when=/is,
        /terminal_success_when.*?(Flow 행|같은 행).*?transition.*?(성공 terminal branch).*?(processing state).*?(재사용하지 않|달라야)/is,
        /(accepted가 아닐 때|부정 표현).*?(terminal evidence가 아니)/is,
      ],
      "permission and terminal exact contract",
    );
  });

  test("Prototype terminal proof는 자유형 claim이 아니라 Detail의 독립 assignment다", () => {
    for (const text of [
      read(skillPath),
      read(workflowPath),
      read(sessionProtocolPath),
      read(sessionTemplatePath),
    ]) {
      expect(text).toMatch(/Prototype Detail/);
      expect(text).toMatch(/각각 독립된 canonical/);
      expect(text).toMatch(/자유형 claim/);
    }
  });

  test("canonical cell key와 acknowledgement surface는 exact delimiter를 공유한다", () => {
    for (const text of [
      read(skillPath),
      read(sessionProtocolPath),
      read(sessionTemplatePath),
    ]) {
      expect(text).toMatch(/acknowledgement_only_when/);
      expect(text).toMatch(/; /);
      expect(text).toMatch(/(?:글자 단위로 같|exact same value)/i);
    }
  });

  test("최종 preflight는 terminal branch, permission actor, last event를 함께 대조한다", () => {
    const skill = read(skillPath);
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    expect(skill).toMatch(
      /terminal_success_when.*?transition.*?성공 branch token/is,
    );
    expect(skill).toMatch(/permission 행.*?unauthorized actor 하나/is);
    expect(skill).toMatch(
      /optional.*?Acceptance ID 집합.*?Validation head.*?정확히 같/is,
    );
    expect(skill).toMatch(
      /Validation head.*?Required.*?Method.*?Acceptance Contract.*?Required for delivery.*?Method.*?글자 단위/is,
    );
    expect(skill).toMatch(
      /Safe visible fallback.*?disabled.*?hidden.*?not_rendered.*?read-only.*?message.*?recovery trigger/is,
    );
    expect(skill).toMatch(
      /transition=<start>.*?<processing>.*?<success> or <failure>.*?첫 세미콜론.*?terminal_success_when.*?binding:<object>\.id.*?binding:<terminal field>/is,
    );
    expect(skill).toMatch(
      /binding:<terminal field>=<value>.*?transition.*?success branch.*?exact token.*?succeeded_confirmed/is,
    );
    expect(skill).toMatch(/last_event_id.*?Change Log.*?마지막 Event ID/is);
    expect(skill).toMatch(
      /마지막 Validation.*?evt-00000001-0014.*?Change.*?evt-00000001-0015.*?last_event_id.*?evt-00000001-0015/is,
    );
    expect(skill).toMatch(/문서 전체.*?같은 Event ID.*?재사용하지/is);
    expect(protocol).toMatch(
      /permission body row 하나.*?unauthorized actor 하나/is,
    );
    expect(protocol).toMatch(/last_event_id.*?Change Log의 마지막 Event ID/is);
    expect(protocol).toMatch(
      /마지막 Validation.*?evt-00000001-0014.*?Change Log.*?evt-00000001-0015.*?last_event_id.*?evt-00000001-0015/is,
    );
    expect(protocol).toMatch(
      /optional.*?Acceptance Contract.*?current Validation head.*?정확히 같/is,
    );
    expect(protocol).toMatch(
      /Validation head.*?Required.*?Method.*?Required for delivery.*?Method.*?exact match/is,
    );
    expect(protocol).toMatch(
      /Safe visible fallback.*?disabled.*?hidden.*?not_rendered.*?read-only.*?message.*?recovery trigger/is,
    );
    expect(protocol).toMatch(
      /transition=<start>.*?<processing>.*?<success> or <failure>.*?첫 세미콜론.*?terminal_success_when.*?target.*?terminal binding/is,
    );
    expect(protocol).toMatch(
      /binding:<terminal field>=<value>.*?transition success branch.*?exact same token.*?alias/is,
    );
    expect(protocol).toMatch(/SESSION 전체.*?같은 Event ID.*?재사용할 수 없/is);
    expect(template).toMatch(/전역 유일.*?last_event_id.*?마지막 Event ID/is);
    expect(template).toMatch(
      /마지막 Validation.*?evt-00000001-0014.*?Change Log.*?last_event_id.*?evt-00000001-0015/is,
    );
    expect(template).toMatch(
      /optional.*?Acceptance ID.*?current Validation head.*?정확히 같/is,
    );
    expect(template).toMatch(
      /Validation head.*?Required.*?Method.*?Required for delivery.*?Method.*?글자 단위/is,
    );
    expect(template).toMatch(
      /Safe visible fallback.*?disabled.*?hidden.*?not_rendered.*?read-only.*?message.*?recovery trigger/is,
    );
    expect(template).toMatch(
      /transition=<start>.*?<processing>.*?<success> or <failure>.*?첫 세미콜론.*?terminal_success_when.*?binding:<object>\.id.*?binding:<terminal field>/is,
    );
    expect(template).toMatch(
      /binding:<terminal field>=<value>.*?transition success branch.*?글자 단위.*?succeeded_confirmed/is,
    );
  });

  test("완료된 checkpoint는 placeholder, 승인 재사용, 가짜 blocker와 권한 모순을 남기지 않는다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);

    expectAll(
      workflow,
      [
        /(permission 상태).*?(enabled action).*?(노출하지).*?(정확히 하나).*?(다음 경로)/is,
        /(disabled 상태).*?(다시 활성화).*?(조건)/is,
        /(권한을 아직 모르면).*?(loading|view-only).*?(실행 action).*?(노출하지)/is,
        /(숨기거나 비활성화|A 또는 B).*?(미결정).*?(permission acceptance).*?(통과시킬 수 없)/is,
        /(\$Amount).*?(HH:MM).*?(YYYY-MM-DD).*?(placeholder).*?(남기지)/is,
        /(binding:transaction\.amount).*?(synthetic)/is,
        /(권한 제한 action).*?(actor).*?(enabled.*disabled.*hidden.*not rendered)/is,
        /(필수가 아닌 acceptance).*?(미입증).*?(open risk|later item)/is,
        /(actor 또는 control state).*?(권한 안내).*?(enabled action).*?(or|또는).*?(pass가 아닙니다)/is,
      ],
      "semantic completion rules",
    );

    expectAll(
      protocol,
      [
        /(통과한 gate).*?(빈 scalar).*?(빈 table cell).*?(replace-\*).*?(capture-on-create).*?(TODO).*?(TBD).*?(placeholder).*?(\$Amount).*?(HH:MM).*?(YYYY-MM-DD).*?(남기지)/is,
        /(unknown\(owner=<owner>; resolve_before=<gate>\)).*?(not_applicable\(reason=<reason>\)).*?(binding:<field>)/is,
        /(Blockers).*?(현재 gate).*?(필수 항목|요청된 completion).*?(실제로 막고).*?(가역적인 대안).*?(없는 조건)/is,
        /BLK-<id>.*?blocks=.*?evidence=.*?owner=.*?unblock=/is,
        /(waiting_approval).*?(현재 gate).*?(승인|재검증).*?(해제 조건)/is,
        /(비필수 acceptance).*?(future measurement).*?(blocker가 아니며).*?(open risk|later item)/is,
        /(기본 파일 쓰기 범위).*?(single_use).*?(명시적으로).*?(session_lifetime).*?(승인)/is,
        /(single_use approval).*?(저장).*?(성공).*?(같은 checkpoint revision).*?(consumed event).*?(supersede)/is,
        /(checkpoint_write_approval_id).*?(감사 참조).*?(실행 권한이 아니며).*?(Approval Log).*?(최신 head)/is,
        /(expires_at).*?none.*?(single_use approval).*?(다시 쓸 수).*?(뜻이 아닙니다)/is,
        /(requested).*?(approved).*?(denied).*?(consumed).*?(expired).*?(revoked).*?(stale)/is,
        /(terminal approval).*?(approved).*?(되돌리|재사용하지)/is,
        /(같은 Approval ID).*?(kind).*?(action).*?(resource path|host).*?(access).*?(data class).*?(subject revision).*?(human approver).*?(불변)/is,
      ],
      "session semantic invariants",
    );

    expect(skill).toMatch(
      /(빈 값.*채우기 token).*?(single_use approval).*?(future item).*?(actor\/control state)/is,
    );
    expect(skill).toMatch(
      /(첫 checkpoint).*?(single_use).*?(session_lifetime).*?(프로젝트 소스).*?(권한).*?(포함하지|않)/is,
    );
    expect(read(readmePath)).toMatch(
      /(처음 저장).*?(이번 저장만).*?(이 세션 동안 갱신).*?(파일 저장 없이 진행).*?(코드 수정).*?(허용하지 않)/is,
    );
    expect(protocol).toMatch(
      /(session_lifetime).*?(paused).*?(provider 전환).*?(유지).*?(complete).*?(abandoned).*?(끝)/is,
    );
  });

  test("append-only fold와 workflow version drift를 결정적으로 처리한다", () => {
    const protocol = read(sessionProtocolPath);
    expectAll(
      protocol,
      [
        /현재 규칙 revision.*?opendock\.product-designer-session-protocol@2/is,
        /(subject ledger event).*?(event id).*?(checkpoint revision).*?(occurred at).*?(supersedes event id)/is,
        /(Change Log).*?(audit stream).*?(supersedes event id).*?(갖지 않)/is,
        /event는 checkpoint revision, occurred at, event id 순으로 읽습니다/i,
        /같은 subject id의 다음 상태는 현재 head event를 명시적으로 supersede한 event만 인정합니다/i,
        /(stable Decision ID).*?(유지).*?(새 Event ID).*?(head event).*?(supersede)/is,
        /(중복 event id).*?(존재하지 않는 supersedes).*?(경쟁 branch).*?(conflict)/is,
        /(snapshot projection).*?(event head).*?(최신 상태)/is,
        /(workflow.*protocol.*skill digest).*?(다르면).*?(읽기 전용).*?(pin|migration)/is,
        /(checkpoint revision).*?(base-10 integer).*?(occurred at).*?(UTC millisecond RFC 3339).*?(created at).*?(updated at).*?(UTC RFC3339).*?(Event ID).*?evt-<8자리 checkpoint revision>-<4자리 ordinal>/is,
        /(fold).*?(숫자).*?(RFC 3339 instant).*?(ASCII 문자열).*?(conflict|read-only)/is,
      ],
      "event fold and migration",
    );
  });

  test("stage와 gate 전이, rollback과 두 terminal tuple이 완전하다", () => {
    const protocol = read(sessionProtocolPath);
    for (const row of [
      /INTAKE.*G0.*DISCOVER.*G1.*open/i,
      /(DISCOVER, FRAME|DISCOVER.*FRAME).*G1.*DIRECTIONS.*G2.*open/i,
      /DIRECTIONS.*G2.*SPECIFY.*G3.*open/i,
      /SPECIFY.*G3.*PROTOTYPE.*G4.*open/i,
      /PROTOTYPE.*G4.*VALIDATE.*G5.*open/i,
      /VALIDATE.*G5.*HANDOFF.*G6.*open/i,
      /HANDOFF.*G6.*waiting_approval.*waiting_external.*VALIDATE.*G5.*open.*terminal complete/i,
    ]) {
      expect(protocol).toMatch(row);
    }
    expectAll(
      protocol,
      [
        /(rollback).*?(stale).*?(last_passed_gate).*?(직전).*?(stage.*gate).*?open/is,
        /(G6).*?open.*?waiting_approval.*?waiting_external.*?nonterminal.*?complete.*?(없|아니)/is,
        /status=complete.*?current_stage=HANDOFF.*?current_gate=G6.*?gate_state=not_applicable.*?last_passed_gate=G5.*?completion_kind=design_delivery/is,
        /status=complete.*?current_stage=HANDOFF.*?current_gate=G6.*?gate_state=passed.*?last_passed_gate=G6.*?completion_kind=implemented_and_revalidated/is,
      ],
      "state machine",
    );
  });

  test("병렬 design branch는 lineage와 명시적 3-way merge를 보존한다", () => {
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    expectAll(
      template,
      [
        /parent_session_id:/,
        /branch_id:/,
        /branch_purpose:/,
        /fork_checkpoint_revision:/,
        /fork_last_event_id:/,
        /merge_status:/,
      ],
      "branch lineage fields",
    );
    expectAll(
      protocol,
      [
        /(한 세션).*?(한 writer)/is,
        /(child session).*?(parent session id).*?(branch id).*?(fork checkpoint revision).*?(fork last event id).*?(branch purpose)/is,
        /parent의 fork revision.*?현재 parent.*?child head.*?3-way merge/is,
        /(merge_status).*?not_applicable.*?open.*?waiting_approval.*?merged.*?abandoned/is,
        /(같은 기존 subject).*?(자동 선택하지).*?(waiting_approval)/is,
        /(approval).*?(다른 branch).*?(자동 이전하지)/is,
        /(child의 raw Event ID).*?(parent ledger).*?(복사하지)/is,
        /(non-conflict child head).*?(stable subject ID).*?(새 parent Event ID).*?(supersede).*?(template column).*?(추가하지).*?(Ambiguity).*?Source.*?(Decision).*?Rationale.*?(Approval).*?Subject revision.*?(Validation).*?Evidence.*?(child session ID).*?(child head Event ID).*?(digest)/is,
        /(snapshot projection).*?(last_passed_gate).*?(stale).*?(재계산)/is,
        /(merge Change Log).*?(fork revision).*?(parent head).*?(child head).*?(last_event_id)/is,
        /(parent checkpoint 저장).*?(성공).*?(child merge_status).*?merged.*?(읽기 전용)/is,
      ],
      "branch merge",
    );
  });

  test("작업 깊이는 canonical mode와 명시적 전환 근거를 보존한다", () => {
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    expect(template).toMatch(/^mode: guided$/m);
    expect(template).toMatch(/^mode_reason: default-new-session$/m);
    expect(template).toMatch(/^mode_decision_turn_count: 0$/m);
    expectAll(
      protocol,
      [
        /mode: quick, guided, deep.*?소문자 canonical value/is,
        /(새 세션).*?(기본 mode).*?guided/is,
        /(quick).*?(새 방향|새 blocker|넓어진 scope|high-risk assumption).*?(guided|deep)/is,
        /(guided).*?(규제|안전|민감 데이터|큰 비용|명시 요청).*?deep/is,
        /(깊이를 낮추).*?(gate checkpoint).*?(risk).*?(사용자).*?(승인)/is,
        /(mode 변경).*?(이유).*?(이전 mode).*?(Change Log)/is,
        /(mode_decision_turn_count).*?(0 이상의 base-10 integer)/is,
        /(제품 설계 질문|design approval).*?(실제 사용자).*?(resolved|assumed|deferred|blocked|approved|denied).*?(1을 더)/is,
        /(질문을 보낸 시점).*?(상태를 바꾸지 않은 답).*?(모델의 추론).*?(세지 않)/is,
        /(capability approval).*?(mode 진행 방식).*?(세지 않)/is,
        /(Quick).*?(count가 2).*?(질문 전에 guided).*?(count를 0).*?(guided의 첫 turn).*?1/is,
        /(Guided).*?(count).*?(관측값).*?7.*?(stage).*?(gate_state).*?(completion).*?(강제로).*?(바꾸지|변경하지)/is,
        /(해결된 결정).*?(남은 blocker).*?(다음 질문의 가치).*?(가장 영향이 큰).*?(질문 하나)/is,
        /(피로|중단|범위 축소).*?(paused checkpoint)/is,
        /(terminal SESSION).*?(terminal invariant).*?(count 값).*?(무관).*?complete/is,
        /(pause).*?(resume).*?(provider 전환).*?(mode와 count).*?(그대로 유지)/is,
        /(child session).*?(count를 복사).*?(merge).*?(합산하지).*?(parent).*?(보존)/is,
        /(Quick).*?`reused`.*?(canonical gate outcome).*?(prior session.*checkpoint revision|artifact digest).*?(Change Log).*?(passed).*?(last_passed_gate)/is,
        /`not_applicable`.*?(실제로 적용되지).*?(단순 생략|근거 없는 재사용).*?(쓰지 않)/is,
      ],
      "mode transitions",
    );
  });

  test("project, baseline, isolation metadata는 문서화된 canonical enum이다", () => {
    const skill = read(skillPath);
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    for (const text of [skill, workflow]) {
      expect(text).toMatch(/baseline_kind=scenario_document/);
      expect(text).toMatch(/isolation_strategy=session_metadata_only/);
      expect(text).toMatch(/canonical enum/i);
    }
    expect(protocol).toMatch(/canonical enum/i);
    expect(protocol).toMatch(/project_mode=greenfield\|git\|non_git\|remote/);
    expect(protocol).toMatch(
      /baseline_kind=none\|git_ref\|snapshot\|scenario_document\|remote_ref/,
    );
    expect(protocol).toMatch(
      /isolation_strategy=read_only\|snapshot\|worktree\|session_metadata_only\|conversation_only\|remote_copy/,
    );
  });

  test("front matter 시각과 ledger 시각 정밀도를 구분한다", () => {
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    expect(protocol).toMatch(/created_at.*?updated_at.*?UTC RFC3339/is);
    expect(protocol).toMatch(/초 단위.*?fractional-second/is);
    expect(protocol).toMatch(/Occurred At.*?millisecond UTC/is);
    expect(template).toMatch(/replace-utc-rfc3339/);
  });

  test("Event ID는 checkpoint revision 뒤에 증가 ordinal을 둔다", () => {
    const skill = read(skillPath);
    const protocol = read(sessionProtocolPath);
    expect(skill).toMatch(
      /evt-<8자리 checkpoint_revision>-<4자리 증가 ordinal>/,
    );
    expect(skill).toMatch(/evt-00000001-0001.*?evt-00000001-0002/s);
    expect(protocol).toMatch(/evt-<8자리 checkpoint revision>-<4자리 ordinal>/);
    expect(protocol).toMatch(/ordinal과 revision을 뒤집지/);
  });

  test("prototype 수준과 validation verdict가 검증 주장을 과장하지 않는다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const template = read(sessionTemplatePath);
    expectAll(
      workflow,
      [
        /Structure[\s\S]{0,220}(구조|상태 coverage).*?(시각 품질|사용성).*?(pass|판정하지)/i,
        /(파일을 저장하지 않는 ephemeral 작업).*?(prototype 본문).*?(conversation-local inline artifact).*?Structure.*?(canonical SESSION id|canonical SESSION).*?(꾸미지 않)/is,
        /(persistent SESSION).*?(저장 범위).*?(승인).*?(actual|실제).*?(revision|SHA-256).*?(evidence|근거)/is,
        /Visual[\s\S]{0,260}(hierarchy|위계).*?(typography|타이포그래피).*?(spacing|간격).*?(DESIGN\.md).*?(사용성|outcome).*?(입증하지|아니)/i,
        /Interactive[\s\S]{0,220}(상호작용|상태|기술 적합성).*?(사용자 outcome|사용자 결과).*?(입증하지|아니)/i,
        /Evidence-backed[\s\S]{0,220}(참여자|과업|방법).*?(표본|조건)/i,
        /(prototype 수준|프로토타입 수준).*?(낮으면).*?(needs_review|not_run)/i,
        /fail[\s\S]{0,160}(가장 가까운 단계).*?stale/i,
        /needs_review[\s\S]{0,180}(gate|게이트|주장).*?(막|통과할 수 없)/i,
        /not_run[\s\S]{0,220}(필수 acceptance|필수 수용).*?(G5).*?(통과할 수 없)/i,
        /(모든 필수 acceptance).*?(pass).*?(approved_exception).*?(G5).*?(통과)/is,
        /(conformance|적합성).*?(사용성).*?(outcome|결과).*?(대신|대체).*?(않|금지)/is,
      ],
      "prototype and validation truthfulness",
    );
    expectAll(
      `${workflow}\n${protocol}`,
      [
        /(approved_exception).*?(Kind=design).*?(Action=approve_acceptance_exception).*?(acceptance:<Acceptance ID>)/is,
        /(approved_exception).*?(같은 Subject revision).*?(scope=<bounded scope>).*?(risk=<accepted risk>).*?(expiry)/is,
        /(모델이 만든 문장).*?(승인).*?(아니|없|수 없)/is,
        /(Validation Log).*?(column).*?(추가하지|바꾸지).*?Status.*?approved_exception.*?Evidence.*?approval=<Approval ID>@<current head Event ID>/is,
        /(Failure, exception or owner).*?scope=<bounded scope>.*?risk=<accepted risk>.*?expiry=<condition or RFC3339>.*?owner=<owner>/is,
        /(expired|revoked|stale|denied|consumed).*?(needs_review|fail).*?(required acceptance).*?(G5).*?(막)/is,
      ],
      "approved exception authority",
    );
    expect(template).toMatch(
      /approved_exception.*?Evidence.*?approval=<Approval ID>@<current head Event ID>.*?Failure, exception or owner.*?scope=<bounded scope>.*?risk=<accepted risk>.*?expiry=<condition or RFC3339>.*?owner=<owner>/is,
    );
  });

  test("delivery profile은 요청한 산출물만 만들고 scoped terminal을 결정한다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const readme = read(readmePath);
    const template = read(sessionTemplatePath);

    expect(template).toMatch(/^delivery_profile: specification$/m);
    expectAll(
      workflow,
      [
        /(product-neutral delivery profile).*?(제품 종류|도구 이름).*?(아니|아닌).*?(결정|산출물)/is,
        /`decision`[\s\S]{0,260}G0, G1, G2, G5[\s\S]{0,260}(상세 specification|prototype).*?(구현).*?(별도 handoff 문서)/i,
        /`specification`[\s\S]{0,280}G0, G1, G2, G3, G5[\s\S]{0,260}(standalone prototype).*?(구현).*?(별도 handoff 문서)/i,
        /`prototype`[\s\S]{0,260}G0, G1, G2, G3, G4, G5[\s\S]{0,260}(제품 구현).*?(요청하지 않은 별도 handoff 문서)/i,
        /`implementation`[\s\S]{0,280}G0, G1, G2, G3, G4, G5, G6[\s\S]{0,260}(Product Designer).*?(재검증)/i,
        /(사용자가 요청하지 않은 prototype).*?(구현).*?(별도 handoff 파일).*?(자동 생성하지)/is,
        /(모든 profile).*?(현재 subject revision).*?(G5).*?(안전).*?(접근성).*?(생략하지)/is,
        /decision[\s\S]{0,420}G3.*?not_applicable[\s\S]{0,240}G4.*?not_applicable[\s\S]{0,240}G5/is,
        /specification[\s\S]{0,420}G4.*?not_applicable[\s\S]{0,240}G5/is,
        /(앞의 세 profile).*?(design-delivery terminal tuple).*?status=complete.*?current_stage=HANDOFF.*?current_gate=G6.*?gate_state=not_applicable.*?last_passed_gate=G5.*?completion_kind=design_delivery/is,
        /implementation.*?(existing|기존) full path.*?G0.*?G5.*?구현.*?재검증.*?G6/is,
      ],
      "delivery profile",
    );
    expectAll(
      protocol,
      [
        /delivery_profile: decision, specification, prototype, implementation/is,
        /decision.*?G0, G1, G2, G5.*?G3 not_applicable.*?G4 not_applicable.*?G5 passed.*?design-delivery terminal/is,
        /specification.*?G0, G1, G2, G3, G5.*?G4 not_applicable.*?G5 passed.*?design-delivery terminal/is,
        /prototype.*?G0, G1, G2, G3, G4, G5.*?G5 passed.*?design-delivery terminal/is,
        /implementation.*?G0, G1, G2, G3, G4, G5, G6.*?G6 passed implementation terminal/is,
        /(G5).*?(현재 revision).*?(안전).*?(접근성).*?(not_applicable).*?(사용할 수 없)/is,
        /delivery_profile=implementation.*?status=complete.*?gate_state=passed.*?last_passed_gate=G6.*?completion_kind=implemented_and_revalidated/is,
      ],
      "delivery profile state machine",
    );
    expectAll(
      `${skill}\n${readme}`,
      [
        /decision.*?specification.*?prototype.*?implementation/is,
        /(요청하지 않은|요청하지 않았).*?(prototype).*?(구현).*?(handoff)/is,
        /(전체 제품|전체 구현|구현 완료).*?(표현하지|말하지)/is,
      ],
      "delivery profile UX",
    );
  });

  test("파일 저장 없는 작업은 SESSION이 아닌 conversation-local capsule이다", () => {
    const protocol = read(sessionProtocolPath);
    const skill = read(skillPath);
    const readme = read(readmePath);

    expectAll(
      protocol,
      [
        /(파일 저장 없이 대화로 진행).*?(canonical SESSION).*?(복제하지)/is,
        /(ephemeral capsule).*?(current goal).*?(bounded scope).*?(accepted decisions).*?(open ambiguity).*?(next action)/is,
        /(schema).*?(session path).*?(checkpoint revision).*?(event ID).*?(append-only ledger).*?(SESSION\.md가 아닙)/is,
        /(task\/thread 종료).*?(persistence|resume).*?(Codex).*?(Claude Code).*?(보장하지)/is,
        /(tool-free core workflow).*?(delivery profile).*?(정상 수행)/is,
        /(provider 또는 task 전환).*?(target path).*?(single_use).*?(session_lifetime).*?(승인).*?(full SESSION).*?(materialize)/is,
        /(capsule에 없던 revision).*?(승인).*?(evidence).*?(꾸미지)/is,
        /(구조 불변식|Specification contract 불변식).*?persistent/is,
      ],
      "ephemeral capsule protocol",
    );
    expectAll(
      `${skill}\n${readme}`,
      [
        /(파일 저장 없이).*?(SESSION\.md가 아닙|canonical SESSION\.md).*?(ephemeral capsule)/is,
        /(goal|목표).*?(scope|범위).*?(decisions|결정).*?(ambiguity|모호함).*?(next action|다음 행동)/is,
        /(task\/thread).*?(재개|보존).*?(보장하지|가정할 수 없)/is,
        /(single_use).*?(session_lifetime).*?(승인).*?(full SESSION).*?(materialize)/is,
      ],
      "ephemeral capsule UX",
    );
  });

  test("design-only 완료와 구현 후 재검증을 분리한다", () => {
    const workflow = read(workflowPath);
    const protocol = read(sessionProtocolPath);
    expectAll(
      workflow,
      [
        /waiting_external.*?(구현이 범위에 포함).*?VALIDATE.*?재검증.*?complete/is,
        /`decision`.*?`specification`.*?`prototype`.*?(최종 범위).*?(필수 gate).*?G5.*?(승인).*?Product Designer revalidation.*?not_applicable.*?(design-delivery terminal tuple).*?complete/is,
        /(구현이 요청 범위에 포함).*?(재검증).*?implemented_and_revalidated.*?(완료가 아닙|complete가 아닙)/is,
        /(Handoff|핸드오프).*?(복제하지|중복하지).*?(revision|리비전|참조)/is,
      ],
      "completion profiles",
    );
    expectAll(
      `${workflow}\n${protocol}`,
      [
        /(G6).*?`open`.*?(조립|확인 중).*?(외부 주체).*?(없)/is,
        /`waiting_approval`.*?(실제 사용자).*?(응답|승인).*?(기다)/is,
        /`waiting_external`.*?(구현|외부 evidence).*?(기다).*?(VALIDATE|G5).*?open/is,
        /(open).*?(waiting_approval).*?(waiting_external).*?(nonterminal|비종료).*?(complete).*?(없|아니)/is,
        /not_applicable.*?passed.*?terminal tuple/is,
      ],
      "G6 nonterminal states",
    );
  });

  test("격리 공간과 외부 작업은 명시적 승인 뒤에만 사용한다", () => {
    const workflow = read(workflowPath);
    const skill = read(skillPath);
    const readme = read(readmePath);
    const combined = `${workflow}\n${skill}\n${read(sessionProtocolPath)}\n${readme}`;

    expectAll(
      combined,
      [
        /(sandbox|worktree|snapshot|격리)/i,
        /(dirty|수정 중|미커밋)/i,
        /(stash|reset|clean).*?(하지|금지)|(?:하지|금지).*?(stash|reset|clean)/is,
        /(non-git|Git이 아닌|Git 없음|Git 저장소가 아닌)/i,
        /(Git 저장소).*?(확인).*?(경우에만|뒤).*?(Git 명령|git command)/is,
        /(non-Git).*?(git status).*?(git diff).*?(시도하지|금지)/is,
        /(non-Git).*?(상대 경로).*?(SHA-256|hash|해시).*?(snapshot manifest|스냅샷 manifest)/is,
        /(GitHub).*?(전제|가정).*?(않|금지)|(?:GitHub가 아니|다른 Git|일반 Git URL)/i,
        /(clone|git init|worktree).*?(승인|허락).*?(전|후|없이)/is,
        /(package|패키지|dependency|의존성).*?(설치).*?(승인|허락).*?(전|후|없이)/is,
        /(외부 도구|외부 연동|외부 연결|network|MCP).*?(목적).*?(범위).*?(read\/write|읽기\/쓰기|권한).*?(승인|허락)/is,
        /(원본|source).*?(직접|실험|변경).*?(않|금지).*?(독립|격리|승인)/is,
        /(snapshot|스냅샷).*?(포함 경로).*?(제외 경로).*?(예상 크기).*?(민감 데이터)/is,
        /\.git.*?\.env.*?(credential|secret|비밀).*?(제외)/is,
        /(design approval|디자인 승인|방향 선택).*?(capability approval|실행 승인|실행 승인이).*?(재사용|아니|않)/is,
        /(최초 checkpoint|첫 checkpoint).*?(session path|경로).*?(한 번.*approval|한 번.*승인)/is,
        /(checkpoint|체크포인트).*?(갱신).*?(stage|단계).*?(유효).*?(project source|프로젝트 소스).*?(권한).*?(주지|아니)/is,
        /(같은 단계).*?(동일한 경로|동일 path|동일 path).*?(host).*?(데이터).*?(하나의 실행 계획).*?(범위가 넓어질 때).*?(다시 묻)/is,
      ],
      "isolation and approval",
    );

    expect(combined).toMatch(
      /(도구|연동).*?(거절|실패|없어도|사용하지).*?(workflow|워크플로우|G0|G5|완료).*?(중단하지|진행|동작|완료)/is,
    );
  });
});
