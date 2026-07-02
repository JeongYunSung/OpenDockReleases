---
name: opendock-prompt-eval
description: promptfoo 기반 prompt/agent 평가, red-team, 회귀 평가를 설계하고 결과를 정리할 때 사용합니다.
---

# Prompt Eval

## 절차

1. `PROMPT_EVAL.md`를 읽습니다.
2. `.opendock/templates/prompt-eval/PROMPT_EVAL_RUN.md`를 복사해 run 문서를 만듭니다.
3. scope, evidence, result, follow-up을 기록합니다.
4. output이나 review를 만들 때 `PROMPT_EVAL.md`의 금지 항목을 지킵니다.
5. handoff 전에 `node .opendock/harness/opendock__prompt-eval/check.mjs`를 실행합니다.

## 완료 기준

- run 문서에 목적, 입력, 결과, evidence가 있습니다.
- 민감 작업은 human approval 여부가 남아 있습니다.
- secret이나 private token이 문서에 없습니다.
- harness가 통과합니다.
