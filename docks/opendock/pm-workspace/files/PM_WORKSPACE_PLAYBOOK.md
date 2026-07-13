# PM Workspace Playbook

## 1. 문서 상단

모든 target 상단에 `Product`, `Scope`, `Decision Date`를 ISO 날짜와 함께 기록합니다.

## 2. 정보 분리

- `Facts`: 관찰, 확정된 정책, 제공된 데이터처럼 확인 가능한 내용
- `Assumptions`: 검증 전이지만 설계를 진행하기 위해 둔 가정
- `Open Questions`: 결정을 막거나 후속 확인이 필요한 질문

출처가 없는 추정은 fact로 쓰지 않습니다.

## 3. 필수 섹션

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

## 4. 필수 계약 표식

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

## 7. 완료 조건

- 필수 섹션과 계약 표식이 모두 구체적입니다.
- facts, assumptions, open questions가 섞이지 않습니다.
- 각 story에 검증 가능한 acceptance criteria가 있습니다.
- risk에 mitigation, dependency에 owner가 있습니다.
- decision log에 날짜와 rationale이 있습니다.
- harness가 통과합니다.
