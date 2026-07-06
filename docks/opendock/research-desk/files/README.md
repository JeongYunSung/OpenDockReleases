# Research Desk Workspace

자료 수집, 출처 비교, 주장/근거 분리, 인용 정리, 신뢰도 판단, 리서치 노트를 만드는 조사 workspace.

## 설치된 Agent Context

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 Research Desk 작업 규칙이 추가됩니다.
- `.agents/skills/opendock-research-desk/SKILL.md`는 Codex/OMA 계열 agent가 직접 참고할 수 있는 skill입니다.
- `.claude/commands/opendock-research-desk/quality-gate.md`는 Claude Code에서 품질 게이트를 호출할 때 쓰는 문서입니다.
- `.cursor/rules/opendock-research-desk.mdc`는 Cursor 작업 시 같은 기준을 알려줍니다.

## 먼저 할 일

1. `RESEARCH_DESK.md`를 읽습니다.
2. 이번 작업의 run id를 정합니다.
3. 템플릿을 복사합니다.

```bash
mkdir -p .opendock/runs/research-desk
cp .opendock/templates/research-desk/RESEARCH_RUN.md .opendock/runs/research-desk/<run-id>.md
```

4. 작업 목표와 근거를 채운 뒤 agent에게 요청합니다.
5. 완료 전 harness를 실행합니다.

```bash
node .opendock/harness/opendock__research-desk/check.mjs
```

## 자주 쓰는 workflow

- 질문과 결정 맥락을 먼저 확정합니다.
- 출처 유형과 최신성을 분리합니다.
- 주장/근거/반대근거/gap을 표로 정리합니다.
- 결론에는 confidence와 다음 확인 행동을 붙입니다.

## 품질 체크

- 리서치 질문, 의사결정 맥락, 필요한 최신성, 제외 범위를 먼저 정합니다.
- 출처는 primary/secondary/community/opinion으로 구분합니다.
- 주장과 근거를 분리하고, 각 근거에는 출처, 날짜, 신뢰도, 반대 증거를 기록합니다.
- 불확실하거나 오래된 정보는 결론이 아니라 gap으로 표시합니다.
- 최종 답변은 recommendation, confidence, next research action을 포함합니다.
- 실시간/법률/의료/금융 판단은 최신 출처 확인과 전문가 검토 필요성을 표시합니다.

## 유용한 프롬프트

- 이 주제를 Research Desk 기준으로 조사 계획, 출처 우선순위, 근거 표 형태로 정리해줘.
- 아래 자료의 주장과 근거를 분리하고 신뢰도를 평가해줘.
- 상반된 출처들을 비교해서 결론, confidence, 추가 확인 질문을 제안해줘.

## 주의

출처를 확인하지 못한 내용을 사실처럼 단정하지 않습니다.
