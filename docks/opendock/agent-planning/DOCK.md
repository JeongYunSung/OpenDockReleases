# Agent Planning

긴 AI 작업이 context loss, 세션 종료, 중간 재시작에도 이어질 수 있도록 계획과 진행 상태를 workspace-local 파일로 남깁니다.

## 설치되는 것

- `PLANNING.md`: 계획 문서 작성 기준
- `HARNESS.md`: 계획 품질 체크리스트
- `.opendock/templates/agent-planning/TASK_PLAN.md`: 작업 계획 템플릿
- `.opendock/templates/agent-planning/FINDINGS.md`: 발견 사항 템플릿
- `.opendock/templates/agent-planning/PROGRESS.md`: 진행률 템플릿
- `.agents/skills/opendock-agent-planning/SKILL.md`: 계획 유지 skill
- `.opendock/harness/opendock__agent-planning/check.mjs`: planning harness

## 사용 시점

- 작업이 여러 단계로 나뉘는 경우
- 여러 agent가 같은 목표를 나눠 수행하는 경우
- 중간에 context가 사라져도 이어서 작업해야 하는 경우
- “완료”라고 말하기 전에 근거와 남은 일을 분리해야 하는 경우

## 원칙

- 계획은 실행 가능한 step으로 쪼갭니다.
- 완료 상태에는 검증 근거가 있어야 합니다.
- blocker와 needs-input은 명확히 분리합니다.
- 임시 계획은 `.opendock/plans/` 아래에 두고, root 문서는 기준만 담습니다.
