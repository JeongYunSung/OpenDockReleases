---
name: opendock-agent-planning
description: 긴 AI 작업의 plan, findings, progress를 workspace-local 파일로 유지해야 할 때 사용합니다.
---

# Agent Planning

## 절차

1. `PLANNING.md`를 읽습니다.
2. 필요하면 `.opendock/templates/agent-planning/TASK_PLAN.md`를 복사해 계획을 만듭니다.
3. 진행 중 알게 된 사실은 findings에, 상태는 progress에 남깁니다.
4. 완료 항목에는 evidence를 남깁니다.
5. handoff 전에 `node .opendock/harness/opendock__agent-planning/check.mjs`를 실행합니다.

## 기준

- 계획은 산출물이 아니라 작업을 관리하는 수단입니다.
- done에는 검증 근거가 필요합니다.
- blocker는 사용자 입력이 필요한지, 외부 상태 변화가 필요한지 구분합니다.
