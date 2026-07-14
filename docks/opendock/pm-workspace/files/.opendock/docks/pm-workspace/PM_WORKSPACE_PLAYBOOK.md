# PM Workspace Playbook

## 1. 문서 맥락

결정이나 출시 범위를 다루는 문서에는 `Product`, `Scope`, `Decision Date`를 기록합니다. 짧은 메모에는 필요한 맥락만 남깁니다.

## 2. 정보 분리

- `Facts`: 관찰, 확정된 정책, 제공된 데이터처럼 확인 가능한 내용
- `Assumptions`: 검증 전이지만 설계를 진행하기 위해 둔 가정
- `Open Questions`: 결정을 막거나 후속 확인이 필요한 질문

출처가 없는 추정은 fact로 쓰지 않습니다.

## 3. 선택 섹션

문서 목적과 독자에 필요한 섹션만 선택합니다. PRD에는 문제·목표·비목표·요구사항·성공 지표를 우선하고, user story에는 acceptance criteria를 포함합니다.

- `Facts`
- `Assumptions`
- `Open Questions`
- `Problem`
- `Users`
- `Goals`
- `Non-goals`
- `Success Metrics`
- `Requirements`
- `User Stories with Acceptance Criteria`
- `Edge Cases`
- `Risks`
- `Dependencies`
- `Release / Decision Log`
- `Validation Evidence`

## 4. 표현 예시

선택한 섹션을 명확하게 구조화해야 할 때 다음 표식을 사용할 수 있습니다.

- Problem: `Problem Statement:`, `Problem Evidence:`
- Users: `Primary User:`, `User Need:`
- Goals/Non-goals: `Goal:`, `Non-goal:`
- Metrics: `Metric:`, `Baseline:`, `Target:`, `Measurement:`
- Requirements: `Requirement ID:`, `Priority:`
- Story: `User Story:`, `Acceptance Criteria:`, `Given:`, `When:`, `Then:`
- Edge case: `Edge Case:`, `Expected Behavior:`
- Risk: `Risk:`, `Mitigation:`
- Dependency: `Dependency:`, `Owner:`
- Log: `Date:`, `Decision:`, `Rationale:`

## 5. Metric과 acceptance criteria

Metric은 이름만 쓰지 않고 baseline, target, 측정 방법·기간을 명시합니다. 수치는 달성 보장이 아니라 검증 기준입니다. Acceptance criteria는 구현 세부가 아니라 사용자 관점의 관찰 가능한 결과로 쓰며 Given/When/Then을 연결합니다.

## 6. 개인정보

사용자 연구나 support 사례는 필요한 최소 맥락만 남깁니다. 집 주소, 정확한 위치·여행 일정, 예약·주문 번호, 실명, 연락처, 계정 식별자와 민감한 건강·재무 정보는 삭제하거나 합성 값으로 대체합니다.

## 7. 검토 기준

- 선택한 섹션이 구체적이고 서로 모순되지 않습니다.
- facts, assumptions, open questions가 섞이지 않습니다.
- 포함한 story에는 검증 가능한 acceptance criteria가 있습니다.
- 포함한 risk에는 mitigation, dependency에는 owner가 있습니다.
- decision log를 사용했다면 날짜와 rationale이 있습니다.

평소에는 요청한 PM 문서를 바로 작성하고, 선택 템플릿에서는 관련 섹션만 사용합니다. 사용자가 검토를 요청하면 AI가 현재 결과물만 이 playbook 기준으로 직접 확인하고 facts·assumptions 분리, 요구사항, acceptance criteria, metric, risk와 decision 문제를 수정합니다.
