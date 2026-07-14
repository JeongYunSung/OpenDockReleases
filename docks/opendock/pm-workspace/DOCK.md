# PM Workspace

제품 문제, 요구사항, 우선순위, 지표와 의사결정을 한 작업 흐름으로 관리합니다.

## 설치 후 생기는 것

- `.opendock/docks/pm-workspace/README.md`: 사용 안내
- `.opendock/docks/pm-workspace/PM_WORKSPACE_PLAYBOOK.md`: PM 문서 기준
- `.opendock/templates/pm-workspace/RUN.md`: 필요한 항목만 골라 쓰는 선택 템플릿
- `.agents/skills/opendock-pm-workspace/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용

> 이 기능 요청을 문제, 비목표, 요구사항과 성공 지표로 정리해줘.

별도 작업 기록을 먼저 만들 필요 없이 결과를 바로 작성합니다. 템플릿은 요청에 필요한 섹션만 선택해 사용합니다.

## 검토

사용자가 검토를 요청하면 AI가 현재 결과물만 PM Workspace Playbook 기준으로 직접 검토하고, 사실·가정 분리, 요구사항, acceptance criteria, metric, risk와 의사결정 문제를 수정합니다.

## 안전

확인된 사실과 가정을 분리하고 승인 없이 범위·일정·출시 약속을 확정하지 않습니다. 관련 없는 파일 수정·삭제, credential 접근, 배포, migration과 파괴적 작업을 실행하지 않습니다.
