# Agent Planning

복잡한 작업을 목표, 범위, 단계, 의존성, 진행 상태와 완료 근거로 나눕니다.

## 설치 후 생기는 것

- `.opendock/docks/agent-planning/README.md`: 사용 안내
- `.opendock/docks/agent-planning/PLANNING.md`: 계획 작성 기준
- `.opendock/templates/agent-planning/TASK_PLAN.md`: 선택형 계획 템플릿
- `.opendock/templates/agent-planning/FINDINGS.md`: 선택형 발견 사항 템플릿
- `.opendock/templates/agent-planning/PROGRESS.md`: 선택형 진행 기록 템플릿
- `.agents/skills/opendock-agent-planning/SKILL.md`: AI 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 `PLANNING.md` 기준으로 요청을 바로 처리합니다. 템플릿은 선택 사항이며 작업 규모에 필요한 섹션만 골라 사용합니다.

> 이 요구사항을 실행 가능한 단계와 완료 조건으로 나눠줘.

사용자가 검토를 요청하면 AI가 현재 결과물만 `PLANNING.md` 기준으로 직접 검토하고 범위, 의존성, 완료 근거, 위험과 blocker를 설명합니다.

## 안전

계획은 승인된 범위를 넓히는 권한이 아닙니다. 승인 없이 관련 없는 파일을 변경하거나 credential에 접근하거나 배포, 이전, 파괴적 명령을 실행하지 않습니다.
