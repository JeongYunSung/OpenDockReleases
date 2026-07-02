# Browser Agent Harness

## 목적

browser run manifest must include target, allowed domains, disallowed actions, and result notes.

## 검사 범위

- `BROWSER_AGENT.md`
- `HARNESS.md`
- `.opendock/runs/browser-agent/**/*.md`
- `.opendock/templates/browser-agent/BROWSER_AGENT_RUN.md`

## 실행

```bash
node .opendock/harness/opendock__browser-agent/check.mjs
```

## 실패 예시

- run 문서가 scope나 result 없이 비어 있음
- secret처럼 보이는 token을 run 문서에 기록함
- 위험 작업에 human approval 여부를 남기지 않음
- evidence 없이 완료라고 표시함
