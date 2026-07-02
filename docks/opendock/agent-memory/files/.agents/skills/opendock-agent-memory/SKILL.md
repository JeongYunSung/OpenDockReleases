---
name: opendock-agent-memory
description: 프로젝트 구조, 의사결정, 탐색 결과를 workspace-local memory로 남겨야 할 때 사용합니다.
---

# Agent Memory

## 언제 사용하나

- 새 프로젝트를 처음 파악할 때
- 큰 기능/리팩터링 전후에 구조와 결정 이유를 남길 때
- 다른 agent가 이어받을 수 있게 context를 줄여야 할 때

## 절차

1. `MEMORY.md`를 읽습니다.
2. 필요한 범위만 탐색합니다.
3. 사실, 추측, 근거, 다음 확인을 분리합니다.
4. run 기록이 필요하면 `.opendock/templates/agent-memory/MEMORY_RUN.md`를 사용합니다.
5. 최종 handoff 전에 `node .opendock/harness/opendock__agent-memory/check.mjs`를 실행합니다.

## 주의

- secret과 private prompt는 절대 기록하지 않습니다.
- 오래된 정보를 확정 사실처럼 말하지 않습니다.
