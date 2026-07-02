# Agent Cost Quality Gate

1. `COST.md`를 읽습니다.
2. provider, model, task, owner, reason이 기록됐는지 확인합니다.
3. 고비용 작업의 budget note와 source를 확인합니다.
4. secret, invoice 원문, 결제 정보가 없는지 확인합니다.
5. `node .opendock/harness/opendock__agent-cost/check.mjs`를 실행합니다.
