# Agent Cost Harness

AI agent 사용량과 비용 추정 기록이 의사결정에 충분한지 점검합니다.

## 필수 기준

- `COST.md`가 있어야 합니다.
- usage log에는 provider, model, task, date, owner가 있어야 합니다.
- 고비용 또는 장기 작업에는 reason과 budget note가 있어야 합니다.
- 비용 추정에는 근거 또는 source가 있어야 합니다.
- secret, invoice 원문, 결제 정보는 저장하지 않습니다.

## 명령

```bash
node .opendock/harness/opendock__agent-cost/check.mjs
```
