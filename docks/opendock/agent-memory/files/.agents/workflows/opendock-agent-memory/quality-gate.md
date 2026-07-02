# Agent Memory Quality Gate

1. `MEMORY.md`를 읽습니다.
2. 이번 작업에서 남길 기억의 scope를 정합니다.
3. 사실, 추측, 근거, 다음 확인을 분리합니다.
4. secret 또는 private prompt가 포함되지 않았는지 확인합니다.
5. `node .opendock/harness/opendock__agent-memory/check.mjs`를 실행합니다.
6. 통과/실패/미확인 항목을 handoff에 포함합니다.
