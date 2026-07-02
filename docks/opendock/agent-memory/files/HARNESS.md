# Agent Memory Harness

프로젝트 기억과 탐색 결과가 다음 작업에 안전하게 재사용될 수 있는지 점검합니다.

## 필수 기준

- `MEMORY.md`가 있어야 합니다.
- memory 기록에는 사실, 추측, 출처, 갱신 시점이 구분되어야 합니다.
- secret, token, private prompt, 개인 식별정보는 저장하지 않습니다.
- 오래된 내용은 stale로 표시하거나 갱신합니다.
- run 단위 탐색은 `.opendock/templates/agent-memory/MEMORY_RUN.md` 형식을 따릅니다.

## 명령

```bash
node .opendock/harness/opendock__agent-memory/check.mjs
```
