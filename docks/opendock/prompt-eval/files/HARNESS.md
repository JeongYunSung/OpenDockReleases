# Prompt Eval Harness

## 목적

prompt eval run manifest must include objective, dataset, pass criteria, and result notes.

## 검사 범위

- `PROMPT_EVAL.md`
- `HARNESS.md`
- `.opendock/runs/prompt-eval/**/*.md`
- `.opendock/templates/prompt-eval/PROMPT_EVAL_RUN.md`

## 실행

```bash
node .opendock/harness/opendock__prompt-eval/check.mjs
```

## 실패 예시

- run 문서가 scope나 result 없이 비어 있음
- secret처럼 보이는 token을 run 문서에 기록함
- 위험 작업에 human approval 여부를 남기지 않음
- evidence 없이 완료라고 표시함
