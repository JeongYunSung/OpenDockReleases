---
schema: opendock/product-designer-session/v1
session_id: replace-session-id
session_path: replace-approved-relative-session-path
parent_session_id: none
branch_id: main
branch_purpose: primary
fork_checkpoint_revision: none
fork_last_event_id: none
merge_status: not_applicable
checkpoint_revision: 0
workflow_revision: opendock.product-designer-workflow@2
workflow_sha256: capture-on-create
protocol_revision: opendock.product-designer-session-protocol@2
protocol_sha256: capture-on-create
status: active
current_stage: INTAKE
current_gate: G0
gate_state: open
last_passed_gate: none
completion_kind: none
delivery_profile: specification
last_event_id: none
persona: opendock.product-designer@1
skill_sha256: capture-on-create
mode: guided
mode_reason: default-new-session
mode_decision_turn_count: 0
project_mode: greenfield
baseline_kind: none
baseline_ref: none
isolation_strategy: read_only
isolation_approved: false
checkpoint_write_approval_id: none
checkpoint_write_approval_expires_at: none
created_at: replace-utc-rfc3339
updated_at: replace-utc-rfc3339
---

front matter의 `created_at`과 `updated_at`은 UTC RFC3339이며 초 또는 fractional-second 정밀도를 허용합니다. ledger의 `Occurred At`은 millisecond UTC를 유지합니다.

# Goal

- One-line goal:
- User approval: pending

`pending`은 G1 통과 전만 사용합니다. 현재 요청 자체가 Goal·Frame을 승인한 G1+ snapshot은 `User approval: status=approved_in_request; evidence=<EVD-ID>; subject_revision=<concrete Goal and Frame revision>`, 이후 별도 응답으로 승인했다면 `User approval: status=approved; approval=<Approval ID>@<current head Event ID>; subject_revision=<concrete Goal and Frame revision>`을 기록합니다. 이 값은 G6 디자인 전달 또는 구현 경계 승인과 별개입니다.

`approved_in_request`의 Evidence는 SCENARIO.md 자체이거나 verified fact가 Goal·Frame·scope·direction 또는 delivery boundary의 현재 요청을 직접 설명해야 합니다. checkpoint 파일 쓰기나 `single_use` capability만 승인한 Evidence를 Goal 승인에 사용하지 않습니다.

# Project Context and Isolation Boundary

- Source:
- Target surface:
- Original workspace remains read-only: yes
- Approved write scope: none

# Design Contract Scope Map

모든 template table에 같은 작성 규칙을 적용합니다. Cell 안에는 raw `|`를 쓰지 않고 여러 값은 `or`, 쉼표 또는 세미콜론으로 적습니다. `table_arity`는 `Design Contract Scope Map=4; Evidence Register=7; Shared Vocabulary and Relationships=8; Ambiguity Ledger=13; Decision Log=11; Approval Log=13; Flow=10; State Matrix=4; Content and Data Contract=12; Acceptance Contract=9; Prototype=7; Validation Log=11; Change Log=7`이며, 모든 body row는 해당 header와 열 수가 정확히 같아야 합니다.

| Path or temporary contract | Scope        | SHA-256 or revision | Status  |
| -------------------------- | ------------ | ------------------- | ------- |
| session:temporary          | current task | pending             | current |

# Evidence Register

| Evidence ID | Source kind | Locator | Revision or accessed at | Verified fact | Related ambiguity or decision IDs | Status |
| ----------- | ----------- | ------- | ----------------------- | ------------- | --------------------------------- | ------ |

# Frame

- Problem:
- Primary user:
- Core task or job to be done:
- Desired outcome:
- Business objective:
- Stakeholders and operational impact:
- In scope:
- Out of scope:
- Later or unknown:
- Hard constraints:
- Success evidence:

# Shared Vocabulary and Relationships

| ID  | Kind | Term | Meaning in this task | Aliases | Relationship | Source | Status |
| --- | ---- | ---- | -------------------- | ------- | ------------ | ------ | ------ |

# Ambiguity Ledger

Event ID는 `evt-00000001-0001`, Occurred At은 `2026-01-01T00:00:00.000Z` 형식으로 기록합니다. 같은 checkpoint revision 안에서 ordinal을 증가시키고 첫 event의 Supersedes Event ID는 `none`입니다. ordinal과 Event ID는 Ambiguity, Decision, Approval, Validation과 Change Log를 합친 문서 전체에서 전역 유일하며 다른 표에서 재사용하지 않습니다.

| Event ID | Checkpoint Revision | Occurred At | Ambiguity ID | Track | Type | Statement | Status | Impact | Source | Confidence | Resolution or owner | Supersedes Event ID |
| -------- | ------------------- | ----------- | ------------ | ----- | ---- | --------- | ------ | ------ | ------ | ---------- | ------------------- | ------------------- |

# Decision Log

| Event ID | Checkpoint Revision | Occurred At | Decision ID | Status | Decision | Rationale | Alternatives | Approval and subject revision | Affected artifacts | Supersedes Event ID |
| -------- | ------------------- | ----------- | ----------- | ------ | -------- | --------- | ------------ | ----------------------------- | ------------------ | ------------------- |

# Approval Log

Action, resource, access/data class, subject revision과 approver의 canonical 값은 Markdown backtick이나 따옴표로 감싸지 않고 승인받은 plain text 그대로 기록합니다.

| Event ID | Checkpoint Revision | Occurred At | Approval ID | Kind | Action | Resource path or host | Access and data classes | Subject revision | Single use or expiry | Status | Human approver | Supersedes Event ID |
| -------- | ------------------- | ----------- | ----------- | ---- | ------ | --------------------- | ----------------------- | ---------------- | -------------------- | ------ | -------------- | ------------------- |

# Directions

## Direction A

## Direction B

## Selected Direction

- Selection:
- Approval:
- Single direction reason, if applicable:

# Specification

## Flow

이 표는 이번 범위에 실제로 적용되는 제품 action만 기록하는 AI-managed contract입니다. `Kind`는 `state_change`, `navigation`, `read` 중 하나를 사용합니다. `state_change` 행은 모든 열을 구체적으로 채우고 필수 Acceptance ID에 연결합니다. Actor and eligibility cell은 `actor=<role or actor class>; eligibility=<observable authorization and resource condition>`, Single submission cell은 `submission_scope=one_intent; duplicate_policy=<bounded duplicate prevention>; target_identity=binding:<object>.id`, In-progress cell은 `in_progress_control=disabled; feedback=<observable processing feedback>`, Success cell은 `terminal_success_when=<positive observable terminal event>`, State transition cell은 `transition=<start state> -> <processing state> -> <terminal success state> or <terminal failure state>`로 시작합니다. `navigation`과 `read`에서 실행 의미가 없는 열은 빈칸 대신 `not_applicable(reason=<bounded reason>)`으로 기록합니다.

Destructive 또는 irreversible state_change의 Precondition은 `risk_class=destructive; confirmation=<explicit human confirmation>; reauthentication=<required or evidence-bound N/A>; undo_policy=<bounded undo, grace period, or explicitly unavailable>; retention_policy=<bounded deletion and legal-retention scope>`를 모두 포함합니다. HTML comment 안의 text는 contract, evidence, risk 또는 approval로 세지 않습니다.

모든 table cell 안에는 raw `|`를 쓰지 않습니다. separator의 각 cell은 최소 `---` 세 hyphen을 사용하며 `--`는 invalid입니다. 여러 terminal은 `succeeded or failed`처럼 적습니다. state_change 행에는 Claim 또는 Threshold가 같은 Action ID를 완전한 ID token으로 역참조하는 Required Acceptance ID만 기록합니다. Prototype support는 `action=<ACT-ID>; acceptance_set=<comma-separated exact ACC-IDs>; claim=<bounded claim>`으로 적고 Action별 Required, reverse-reference와 prototype support ID 집합을 정확히 같게 합니다. 접근성·권한·반응형 같은 cross-cutting Acceptance도 Claim 또는 Threshold가 exact Action ID를 직접 쓰면 세 집합 모두에 포함합니다.

Accepted, submitted 또는 queued가 별도 비종료 응답이면 In-progress cell에 `acknowledgement_only_when=<positive nonterminal event>`를 기록합니다. 여러 canonical key는 `; `로 분리하고 `feedback` value 안에 `and acknowledgement_only_when=`을 넣지 않습니다. 같은 acknowledgement value를 Prototype Detail에 글자 단위로 복제합니다. Success cell의 `terminal_success_when`은 같은 행 `transition`의 성공 terminal branch를 exact state/event로 가리키며 processing state를 success로 재사용하지 않습니다. 이 terminal clause를 State Matrix success와 Prototype에 동일하게 기록합니다. Permission next route Flow 행의 State transition cell은 `route_kind=permission; permission_for=<capability Action ID>; transition=<start> -> <processing> -> <ready or fallback>`로 직접 시작하며 `not_applicable(reason=...)` 안에 중첩하지 않습니다.

`transition=<start> -> <processing> -> <success> or <failure>`의 네 state token은 첫 세미콜론 전 하나의 value에 모두 둡니다. `terminal_success_when`도 성공 token과 적용되는 `binding:<object>.id`, `binding:<terminal field>`를 첫 세미콜론 전 같은 value에 모두 포함합니다. `transition=... -> success; binding:...; ... or failure`와 `terminal_success_when=success; binding:...`는 required token이 assignment 밖으로 분리되므로 invalid입니다.

`terminal_success_when`이 `binding:<terminal field>=<value>`를 사용하면 그 `<value>`를 transition success branch에 글자 단위로 그대로 씁니다. 예: `binding:transaction.status=succeeded`이면 `transition=failed -> retrying -> succeeded or failed`입니다. `succeeded_confirmed` 같은 새 alias로 바꾸지 않습니다.

| Action ID | Kind | Actor and eligibility | Precondition | Single submission / duplicate prevention | In-progress feedback and control | Success | Failure and recovery | State transition | Required Acceptance IDs |
| --------- | ---- | --------------------- | ------------ | ---------------------------------------- | -------------------------------- | ------- | -------------------- | ---------------- | ----------------------- |

## Content and Information Hierarchy

## State Matrix

Permission 행의 Expected experience는 역할마다 `actor=<role>; required_role=<role>; capability_action=<Action ID>; control=<enabled, disabled, hidden, or not_rendered>; denial=<observable reason or not_applicable(reason=role authorized)>; next_route_action=<Action ID>`를 기록합니다. Disabled 행은 `denial=not_applicable(reason=role authorized); re_enable_when=<observable condition>`도 포함합니다. route Action ID는 Flow, Content and Data Contract와 Prototype의 `permission_route_action=<Action ID>`에 정확히 연결합니다. Success 행에는 Flow와 같은 `terminal_success_when=<positive observable terminal event>`를 기록합니다.

| State      | Applicable | Expected experience | Evidence or N/A reason |
| ---------- | ---------- | ------------------- | ---------------------- |
| default    | yes        |                     |                        |
| loading    | unknown    |                     |                        |
| empty      | unknown    |                     |                        |
| error      | unknown    |                     |                        |
| permission | unknown    |                     |                        |
| disabled   | unknown    |                     |                        |
| success    | unknown    |                     |                        |
| recovery   | unknown    |                     |                        |

## Responsive and Accessibility

keyboard path 또는 post-action focus를 required/pass로 검증한다면 연결된 Acceptance Method는 `claim_kind=accessibility_structure; checks=keyboard_path,focus_after`입니다. 여기에는 requirement와 Acceptance ID를 선언하고, 실제 proof clause는 그 ACC ID를 지원하는 Prototype artifact body에 기록합니다. Structure proof를 WCAG conformance로 표현하지 않습니다. `WCAG AA를 따른다` 같은 target만 있고 현재 delivery가 non-rendered specification 또는 text prototype이면 formal conformance는 승인된 delivery boundary 밖이므로 별도 optional Acceptance Method를 `claim_kind=wcag_conformance; audit=manual_and_automated_rendered`, Minimum prototype level을 `Interactive`, 현재 Validation을 `not_run` 또는 `needs_review`로 기록합니다. 사용자가 rendered conformance audit 또는 proof 자체를 delivery-required로 명시적으로 승인했다면 `Required for delivery=yes`를 유지하고 exact audit 전 `needs_review`로 G5를 막습니다.

## Content and Data Contract

이 표는 Flow, State Matrix와 acceptance 결과를 바꾸는 binding 또는 action만 기록하는 AI-managed contract입니다. `Status`는 `fact`, `design_interface_assumption`, `unknown` 또는 `not_applicable(reason=<bounded reason>)`을 사용합니다. Flow critical이 `yes`인 행은 G3 통과 시 `fact` 또는 bounded `design_interface_assumption`이어야 합니다.

Primary `state_change`는 terminal 판정에 사용하는 같은 flow-critical 행의 Binding or action에 `action:<Action ID>; binding:<object>.id; binding:<terminal field>`를 함께 기록합니다. 이 안정적인 identity는 Flow의 `target_identity`와 같고, Flow·State Matrix·Prototype에 반복하는 동일한 `terminal_success_when` clause 자체에도 exact `binding:<terminal field>`와 `binding:<object>.id` token을 모두 포함합니다. submit부터 processing refresh와 terminal 확인까지 같은 identity를 유지하며 label, index 또는 화면 위치로 대신하지 않습니다.

Flow-critical Null meaning은 `null_means=<absent, null, unknown 또는 unrecognized일 때의 실제 도메인 의미와 안전 영향>`으로 시작합니다. `unknown` 단독, `contract violation`, `invalid`, `none`만 쓰지 않습니다.

Flow-critical Safe visible fallback은 null·missing·unrecognized 상태에서 control이 `disabled`, `hidden`, `not_rendered` 또는 `read-only` 중 무엇인지, 사용자에게 표시할 message/state, 안전하게 다시 진행할 observable recovery trigger를 모두 적습니다. `clear affordance`, `handle safely`, `fallback 제공`처럼 결과가 여러 뜻인 표현은 쓰지 않습니다.

Fact의 Validation point는 `validation_point=gate:<G0-G6>; evidence=<EVD-ID 또는 revision>`, 미입증 assumption은 `validation_point=before:<kebab-case event>; expected_evidence=<bounded locator>`를 사용합니다. `current session`, `when ready`, `later`를 쓰지 않습니다. Due gate나 named event를 evidence 없이 지나면 overdue이므로 의존 gate 또는 claim을 진행하지 않습니다. Source/interface, Freshness, Read actor와 Write actor 중 하나라도 연결된 Evidence Register item이 직접 입증하지 않으면 fact와 가정을 한 행에 섞지 않고 행 전체를 `design_interface_assumption`으로 둡니다. 이 가정의 Freshness는 안전한 assumed read/refresh boundary와 재확인 trigger를 결정하며 `not evidenced`, `unknown` 또는 “backend에서 결정”만 적은 값은 완료값이 아닙니다. Owner는 후속 계약을 실제로 확인할 책임 역할을 적으며 `backend`, `team`, `product` 같은 일반 조직명만 적지 않습니다. Data enum이나 interface shape가 runtime actor, terminal writer, refresh 또는 transition behavior를 자동으로 입증하지 않습니다. Permission next route는 Flow와 같은 exact `action:<Action ID>` 행으로 별도 추적하며 route interface가 입증되지 않았으면 역시 `design_interface_assumption`입니다. 각 flow-critical assumption은 Handoff에 Contract ID와 표의 완전한 `validation_point=before:<event>; expected_evidence=<locator>` clause를 문자열 그대로 복사합니다.

| Contract ID | Binding or action | Flow critical | Source/interface | Freshness | Read actor | Write actor | Null meaning | Safe visible fallback | Status | Owner | Validation point |
| ----------- | ----------------- | ------------- | ---------------- | --------- | ---------- | ----------- | ------------ | --------------------- | ------ | ----- | ---------------- |

## Design System and Implementation Constraints

# Acceptance Contract

현재 evidence로 측정하지 않은 수치형 사용자·비즈니스 outcome은 별도의 optional 행으로 기록합니다. Required for delivery는 `no`, Minimum prototype level은 `Evidence-backed`, Validation은 `not_run` 또는 `needs_review`로 둡니다. Handoff에는 `outcome=<Acceptance ID>; status=<same Validation status>; proof=unproven; owner=<measurement owner>; validation_point=before:<kebab-case event>; expected_evidence=<bounded locator>`를 남깁니다.

| Acceptance ID | Claim | Required for delivery | Method | Threshold | Minimum prototype level | Target participants, if applicable | Owner | Privacy, consent and stop condition |
| ------------- | ----- | --------------------- | ------ | --------- | ----------------------- | ---------------------------------- | ----- | ----------------------------------- |

# Prototype

Action support는 `action=<ACT-ID>; acceptance_set=<comma-separated exact ACC-IDs>; claim=<bounded claim>` clause로 기록합니다. Permission route가 있으면 같은 support cell 또는 Prototype Detail에 `permission_route_action=<exact Flow Action ID>`를 기록합니다. 비종료 acknowledgement가 있으면 `acknowledgement_only_when=<positive nonterminal event>`, success에는 Flow·State Matrix와 같은 `terminal_success_when=<positive observable terminal event>`를 `## Prototype Detail`에 각각 독립된 canonical 줄로 기록합니다. Prototype 표의 자유형 claim 안에만 넣은 assignment는 artifact proof가 아닙니다.

Permission capability를 지원하는 artifact body에는 적용되는 세 state를 각각 기록합니다: `actor=<authorized role>; required_role=<authorized role>; capability_action=<Action ID>; control=enabled; enabled_when=<observable authorization and resource condition>`, `actor=<authorized role>; required_role=<authorized role>; capability_action=<Action ID>; control=disabled; re_enable_when=<observable condition>`, `actor=<unauthorized role>; required_role=<required role>; capability_action=<Action ID>; control=not_rendered; denial=<observable reason>; permission_route_action=<route Action ID>`. 적용되지 않는 state만 bounded N/A로 제외합니다.

State Matrix의 permission body row 하나에는 unauthorized actor 하나만 기록합니다. authorized enabled·disabled clause 또는 다른 actor를 같은 cell에 이어 붙이지 않습니다.

`claim_kind=accessibility_structure; checks=keyboard_path,focus_after` Acceptance를 지원하는 artifact body에는 `acceptance=<ACC-ID>; keyboard_path=<action:<Action ID> or target:<kebab-case id> refs joined by ->>; evidence=<Prototype Relative path or symbol>@<Prototype Revision or SHA-256>`와 path의 각 state-changing action별 `acceptance=<ACC-ID>; focus_after_action=<Action ID>; outcome=<success or failure or return>; target=<action:<Action ID> or target:<kebab-case id>>; evidence=<same exact evidence token>`을 기록합니다. pass에는 같은 ACC ID와 Prototype revision 조합의 keyboard path가 정확히 하나이고 서로 다른 canonical ref가 2개 이상이어야 합니다. 각 focus action은 exact path에 있어야 하며, path의 각 state-changing action마다 success target 정확히 하나와 failure target 정확히 하나가 필요합니다. 중복·상충 path, 같은 action·outcome의 중복·상충 target과 path 밖 focus action은 invalid입니다. Prototype row가 같은 ACC ID를 지원해야 하며 Validation Evidence는 exact evidence token을 반복합니다. Validation `Subject revision` cell은 Prototype row의 raw `Revision or SHA-256` token과 글자 단위로 같아야 하며 `Prototype@`나 artifact 이름 prefix를 붙이지 않습니다.

| Artifact | Relative path or symbol | Revision or SHA-256 | Level | Acceptance IDs and claims supported | Intentional omissions | Status |
| -------- | ----------------------- | ------------------- | ----- | ----------------------------------- | --------------------- | ------ |

## Prototype Detail

# Validation Log

Status는 정확히 `not_run`, `pass`, `fail`, `needs_review`, `approved_exception` 중 하나만 사용합니다. `passed`, `failed`, `pending` 같은 변형은 쓰지 않습니다.

저장 전 optional을 포함한 Acceptance Contract의 모든 Acceptance ID와 current Validation head의 Acceptance ID 집합이 정확히 같은지 대조합니다. Acceptance만 있고 Validation이 없거나 Validation에만 있는 ID는 허용하지 않습니다. 각 current Validation head의 `Required`와 `Method`는 같은 Acceptance ID 행의 `Required for delivery`와 `Method`를 글자 단위로 그대로 복사합니다. Method의 check 일부를 줄이거나 이름을 바꾸면 같은 acceptance의 validation이 아닙니다.

| Event ID | Checkpoint Revision | Occurred At | Acceptance ID | Required | Subject revision | Method | Status | Evidence | Failure, exception or owner | Supersedes Event ID |
| -------- | ------------------- | ----------- | ------------- | -------- | ---------------- | ------ | ------ | -------- | --------------------------- | ------------------- |

`approved_exception`은 기존 column 안에 기록합니다. Evidence는 `approval=<Approval ID>@<current head Event ID>; subject_revision=<revision>`, Failure, exception or owner는 `scope=<bounded scope>; risk=<accepted risk>; expiry=<condition or RFC3339>; owner=<owner>` 형식을 사용합니다.

# Handoff

Flow-critical `design_interface_assumption`마다 Open risk에 Contract ID, Content and Data Contract와 동일한 canonical validation point와 그때까지 `unproven`임을 기록합니다. 미측정 수치형 outcome은 `outcome=<Acceptance ID>; status=<not_run 또는 needs_review>; proof=unproven; owner=<measurement owner>; validation_point=before:<kebab-case event>; expected_evidence=<bounded locator>` 한 clause로 남깁니다. 미검증 WCAG conformance는 `acceptance=<Acceptance ID>; status=<same current Validation head status>; proof=unproven; owner=<same Acceptance owner>; validation_point=before:<kebab-case event>; expected_evidence=<bounded rendered audit locator>`로 별도 기록합니다. status와 owner는 각각 latest Validation head와 Acceptance row에 exact match해야 합니다.

- Approved section and decision revisions:
- Artifact references:
- Acceptance and evidence references:
- Open risk and approved exception references:
- Implementation boundary:
- Product Designer revalidation: pending

# Current Checkpoint

Blockers는 `BLK-<id>; blocks=<G0-G6 또는 ACC-ID>; evidence=<근거>; owner=<해결 주체>; unblock=<해제 조건>` 형식의 plain text로 기록하며 전체 값을 Markdown backtick이나 따옴표로 감싸지 않습니다. blocker가 없으면 `none`을 기록합니다.

- Next action:
- Blockers:
- Stale artifacts:

# Change Log

최종 저장 전 모든 ledger와 Change Log에서 Event ID가 전역 유일한지 확인합니다. 모든 Validation까지 작성한 뒤 아래 Change Log event를 마지막 ordinal로 발급하고, 그 final Change Log Event ID를 front matter의 `last_event_id`에 정확히 복사한 뒤 이것이 문서의 마지막 Event ID인지 대조합니다. 예를 들어 마지막 Validation이 `evt-00000001-0014`이면 Change Log와 `last_event_id`는 `evt-00000001-0015`입니다. Validation 또는 Approval의 마지막 ID를 대신 사용하지 않습니다.

| Event ID | Checkpoint Revision | Occurred At | Actor | Change | Reason | Source revision |
| -------- | ------------------- | ----------- | ----- | ------ | ------ | --------------- |
