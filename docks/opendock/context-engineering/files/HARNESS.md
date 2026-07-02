# Context Engineering Harness

## 목적

context pack must include question, target scope, source files, exclusions, and token budget.

## 검사 범위

- `CONTEXT_ENGINEERING.md`
- `HARNESS.md`
- `.opendock/runs/context-engineering/**/*.md`
- `.opendock/templates/context-engineering/CONTEXT_PACK.md`

## 실행

```bash
node .opendock/harness/opendock__context-engineering/check.mjs
```

## 실패 예시

- run 문서가 scope나 result 없이 비어 있음
- secret처럼 보이는 token을 run 문서에 기록함
- 위험 작업에 human approval 여부를 남기지 않음
- evidence 없이 완료라고 표시함
