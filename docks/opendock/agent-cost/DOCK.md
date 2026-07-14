# Agent Cost

AI 도구 사용량과 비용 추정 근거를 작업별로 남깁니다.

## 설치 후 생기는 것

- `.opendock/docks/agent-cost/README.md`: 사용 안내
- `.opendock/docks/agent-cost/COST.md`: 비용 기록 기준
- `.opendock/templates/agent-cost/USAGE_LOG.md`: 선택형 사용량 기록 템플릿
- `.opendock/templates/agent-cost/COST_REVIEW.md`: 선택형 비용 리뷰 템플릿
- `.agents/skills/opendock-agent-cost/SKILL.md`: AI 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 `COST.md` 기준으로 요청을 바로 처리합니다. 템플릿은 선택 사항이며 현재 작업에 필요한 섹션과 필드만 골라 사용합니다.

> 이번 AI 작업의 모델, 사용 이유, 예상 비용과 결과를 기록해줘.

사용자가 검토를 요청하면 AI가 현재 결과물만 `COST.md` 기준으로 직접 검토하고 누락된 근거, 불명확한 추정치, 민감 정보 위험을 설명합니다.

## 안전

API key, 결제 정보, invoice 원문과 개인 계정 식별 정보는 기록하지 않습니다. 승인 없이 관련 없는 파일을 변경하거나 credential에 접근하거나 배포, 이전, 파괴적 명령을 실행하지 않습니다.
