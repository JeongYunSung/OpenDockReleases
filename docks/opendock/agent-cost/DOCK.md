# Agent Cost

AI agent 사용량, 모델, 작업 단위, 비용 추정을 workspace별로 기록해 비용이 보이지 않는 상태를 줄입니다.

## 설치되는 것

- `COST.md`: agent 비용/사용량 기록 기준
- `HARNESS.md`: 비용 기록 품질 체크리스트
- `.opendock/templates/agent-cost/USAGE_LOG.md`: 사용량 로그 템플릿
- `.opendock/templates/agent-cost/COST_REVIEW.md`: 비용 리뷰 템플릿
- `.agents/skills/opendock-agent-cost/SKILL.md`: 비용 추적 skill
- `.opendock/harness/opendock__agent-cost/check.mjs`: 비용 기록 harness

## 사용 시점

- 여러 agent나 모델을 번갈아 쓰는 프로젝트
- 팀 단위로 AI 비용을 설명해야 하는 프로젝트
- 비싼 모델 사용 이유와 결과를 남겨야 하는 작업
- 자동화/장기 작업의 비용 폭주를 방지하고 싶을 때

## 원칙

- 비용은 완벽한 회계가 아니라 의사결정 가능한 추정치를 목표로 합니다.
- 모델, provider, task, date, owner, reason을 남깁니다.
- API key나 invoice 원문은 기록하지 않습니다.
- codeburn 같은 사용량 추적 도구를 연결할 수 있지만, 글로벌 설치를 기본으로 하지 않습니다.
