---
name: opendock-agent-cost
description: AI agent 사용량, 모델, 작업 단위, 비용 추정을 workspace별로 기록해야 할 때 사용합니다.
---

# Agent Cost

## 절차

1. `COST.md`를 읽습니다.
2. 장기 작업, 반복 agent 실행, 고비용 모델 사용을 식별합니다.
3. `.opendock/templates/agent-cost/USAGE_LOG.md` 또는 `COST_REVIEW.md`로 기록합니다.
4. 비용은 추정치면 estimate라고 표시합니다.
5. handoff 전에 `node .opendock/harness/opendock__agent-cost/check.mjs`를 실행합니다.
