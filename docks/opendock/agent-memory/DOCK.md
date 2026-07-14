# Agent Memory

다음 작업에 필요한 결정, 근거와 미해결 맥락만 안전하게 기억으로 남깁니다.

## 설치 후 생기는 것

- `.opendock/docks/agent-memory/README.md`: 사용 안내
- `.opendock/docks/agent-memory/MEMORY.md`: 기억 작성 기준
- `.opendock/templates/agent-memory/MEMORY_RUN.md`: 선택형 작업 메모 템플릿
- `.agents/skills/opendock-agent-memory/SKILL.md`: AI 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 `MEMORY.md` 기준으로 요청을 바로 처리합니다. 템플릿은 선택 사항이며 현재 작업에 필요한 섹션만 골라 사용합니다.

> 이번 작업에서 다음 세션에 남길 결정과 미해결 항목만 정리해줘.

사용자가 검토를 요청하면 AI가 현재 결과물만 `MEMORY.md` 기준으로 직접 검토하고 사실과 추측의 구분, 근거, 최신성, 민감 정보 위험을 설명합니다.

## 안전

Credential, private prompt, 불필요한 대화 원문과 개인 식별정보는 기억에 남기지 않습니다. 승인 없이 관련 없는 파일을 변경하거나 배포, 이전, 파괴적 명령을 실행하지 않습니다.
