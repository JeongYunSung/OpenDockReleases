# Research Desk

자료 수집, 출처 비교, 주장/근거 분리, 인용 정리, 신뢰도 판단, 리서치 노트를 만드는 조사 workspace.

## 설치 후 제공되는 것

- `RESEARCH_DESK.md`: 이 dock의 작업 원칙과 검토 기준
- `README.md`: 프로젝트 안에서 바로 보는 사용 안내
- `HARNESS.md`: 최종 handoff 전 확인 목록
- `.opendock/templates/research-desk/RESEARCH_RUN.md`: 작업 run 기록 템플릿
- `.opendock/harness/opendock__research-desk/check.mjs`: 로컬 품질 검사
- `.agents/skills/opendock-research-desk/SKILL.md`: Codex/OMA 계열 agent가 읽는 skill
- `.claude/commands/opendock-research-desk/quality-gate.md`: Claude Code에서 호출할 수 있는 품질 게이트 문서

## 바로 쓰는 방법

1. `RESEARCH_DESK.md`를 먼저 읽습니다.
2. `.opendock/templates/research-desk/RESEARCH_RUN.md`를 `.opendock/runs/research-desk/<run-id>.md`로 복사합니다.
3. 목표, 범위, 근거, 결정, 남은 리스크를 기록합니다.
4. 작업 후 `node .opendock/harness/opendock__research-desk/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 human-approved exception으로 남깁니다.

## 주요 기준

- 리서치 질문, 의사결정 맥락, 필요한 최신성, 제외 범위를 먼저 정합니다.
- 출처는 primary/secondary/community/opinion으로 구분합니다.
- 주장과 근거를 분리하고, 각 근거에는 출처, 날짜, 신뢰도, 반대 증거를 기록합니다.
- 불확실하거나 오래된 정보는 결론이 아니라 gap으로 표시합니다.
- 최종 답변은 recommendation, confidence, next research action을 포함합니다.
- 실시간/법률/의료/금융 판단은 최신 출처 확인과 전문가 검토 필요성을 표시합니다.

## 안전 경계

출처를 확인하지 못한 내용을 사실처럼 단정하지 않습니다.

이 dock은 판단을 자동으로 확정하지 않습니다. 사용자가 바로 실행 가능한 문서와 agent 지시, 그리고 handoff 전 품질 게이트를 제공합니다.
