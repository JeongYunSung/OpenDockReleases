# Customer Support AI Workspace

FAQ, CS 매크로, 환불/교환 정책, 티켓 분류, 톤 가이드, VOC 분석을 정리하는 고객지원 workspace.

## 설치된 Agent Context

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 Customer Support AI 작업 규칙이 추가됩니다.
- `.agents/skills/opendock-customer-support-ai/SKILL.md`는 Codex/OMA 계열 agent가 직접 참고할 수 있는 skill입니다.
- `.claude/commands/opendock-customer-support-ai/quality-gate.md`는 Claude Code에서 품질 게이트를 호출할 때 쓰는 문서입니다.
- `.cursor/rules/opendock-customer-support-ai.mdc`는 Cursor 작업 시 같은 기준을 알려줍니다.

## 먼저 할 일

1. `CUSTOMER_SUPPORT.md`를 읽습니다.
2. 이번 작업의 run id를 정합니다.
3. 템플릿을 복사합니다.

```bash
mkdir -p .opendock/runs/customer-support
cp .opendock/templates/customer-support/SUPPORT_RUN.md .opendock/runs/customer-support/<run-id>.md
```

4. 작업 목표와 근거를 채운 뒤 agent에게 요청합니다.
5. 완료 전 harness를 실행합니다.

```bash
node .opendock/harness/opendock__customer-support-ai/check.mjs
```

## 자주 쓰는 workflow

- 지원 대상과 정책 기준을 먼저 확인합니다.
- 고객의 감정과 실제 해결 행동을 분리해 답변합니다.
- 반복 문의는 FAQ/매크로/VOC 개선으로 연결합니다.
- 민감한 약속은 human approval이 필요하다고 표시합니다.

## 품질 체크

- FAQ는 고객 질문 언어로 작성하고 내부 정책 용어를 노출하지 않습니다.
- CS 매크로는 공감, 사실 확인, 해결 경로, 다음 행동을 포함합니다.
- 환불/교환/취소 정책은 조건, 예외, 처리 시간, 담당 채널을 분리합니다.
- 티켓 분류는 intent, urgency, owner, SLA, escalation rule을 포함합니다.
- VOC 분석은 반복 이슈, 원인 가설, 제품/운영 개선안, 근거를 남깁니다.
- 보상/환불/법적 약속처럼 민감한 문구는 확정 표현보다 검토 필요 표시를 사용합니다.

## 유용한 프롬프트

- 아래 고객 문의를 Customer Support AI 기준으로 분류하고 답변 매크로를 작성해줘.
- 우리 환불 정책 설명을 고객이 이해하기 쉬운 FAQ로 바꿔줘.
- VOC 목록에서 반복 이슈와 제품 개선 기회를 뽑아줘.

## 주의

고객에게 보상, 환불, 법적 책임을 확정하는 문구는 담당자 승인 없이 작성하지 않습니다.
