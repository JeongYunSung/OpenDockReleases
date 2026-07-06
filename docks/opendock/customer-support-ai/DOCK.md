# Customer Support AI

FAQ, CS 매크로, 환불/교환 정책, 티켓 분류, 톤 가이드, VOC 분석을 정리하는 고객지원 workspace.

## 설치 후 제공되는 것

- `CUSTOMER_SUPPORT.md`: 이 dock의 작업 원칙과 검토 기준
- `README.md`: 프로젝트 안에서 바로 보는 사용 안내
- `HARNESS.md`: 최종 handoff 전 확인 목록
- `.opendock/templates/customer-support/SUPPORT_RUN.md`: 작업 run 기록 템플릿
- `.opendock/harness/opendock__customer-support-ai/check.mjs`: 로컬 품질 검사
- `.agents/skills/opendock-customer-support-ai/SKILL.md`: Codex/OMA 계열 agent가 읽는 skill
- `.claude/commands/opendock-customer-support-ai/quality-gate.md`: Claude Code에서 호출할 수 있는 품질 게이트 문서

## 바로 쓰는 방법

1. `CUSTOMER_SUPPORT.md`를 먼저 읽습니다.
2. `.opendock/templates/customer-support/SUPPORT_RUN.md`를 `.opendock/runs/customer-support/<run-id>.md`로 복사합니다.
3. 목표, 범위, 근거, 결정, 남은 리스크를 기록합니다.
4. 작업 후 `node .opendock/harness/opendock__customer-support-ai/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 human-approved exception으로 남깁니다.

## 주요 기준

- FAQ는 고객 질문 언어로 작성하고 내부 정책 용어를 노출하지 않습니다.
- CS 매크로는 공감, 사실 확인, 해결 경로, 다음 행동을 포함합니다.
- 환불/교환/취소 정책은 조건, 예외, 처리 시간, 담당 채널을 분리합니다.
- 티켓 분류는 intent, urgency, owner, SLA, escalation rule을 포함합니다.
- VOC 분석은 반복 이슈, 원인 가설, 제품/운영 개선안, 근거를 남깁니다.
- 보상/환불/법적 약속처럼 민감한 문구는 확정 표현보다 검토 필요 표시를 사용합니다.

## 안전 경계

고객에게 보상, 환불, 법적 책임을 확정하는 문구는 담당자 승인 없이 작성하지 않습니다.

이 dock은 판단을 자동으로 확정하지 않습니다. 사용자가 바로 실행 가능한 문서와 agent 지시, 그리고 handoff 전 품질 게이트를 제공합니다.
