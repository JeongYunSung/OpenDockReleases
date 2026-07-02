# Agent Memory

프로젝트 구조, 의사결정, 코드 탐색 결과를 agent가 다시 사용할 수 있는 workspace-local 지식으로 정리합니다.

## 설치되는 것

- `MEMORY.md`: 이 workspace에서 기억해야 할 정보와 금지해야 할 정보의 기준
- `HARNESS.md`: memory 기록 품질 체크리스트
- `.opendock/templates/agent-memory/MEMORY_RUN.md`: 탐색/요약 작업 템플릿
- `.agents/skills/opendock-agent-memory/SKILL.md`: Codex, Claude Code, Gemini 등에서 사용할 skill
- `.agents/workflows/opendock-agent-memory/quality-gate.md`: memory refresh workflow
- `.opendock/harness/opendock__agent-memory/check.mjs`: workspace-local memory harness

## 사용 시점

- 새 프로젝트를 처음 분석할 때
- 큰 리팩터링 전후에 구조와 의사결정을 남길 때
- 여러 agent가 같은 프로젝트를 이어서 볼 때
- 코드/문서/DB/인프라 구조를 요약해 다음 작업의 시작 비용을 낮추고 싶을 때

## 원칙

- credential, token, secret, private prompt는 memory에 저장하지 않습니다.
- 추측과 확인된 사실을 분리합니다.
- 현재 작업과 무관한 전체 프로젝트 재스캔을 강요하지 않습니다.
- 필요한 경우 Graphify 같은 knowledge graph 도구를 workspace-local 보조 도구로 사용할 수 있지만, 이 dock은 글로벌 설치를 기본으로 하지 않습니다.
