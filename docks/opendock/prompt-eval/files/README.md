# Prompt Eval

이 프로젝트에는 `prompt-eval` dock이 설치되어 있습니다.

## 바로 쓰는 법

1. `PROMPT_EVAL.md`를 읽습니다.
2. `.opendock/templates/prompt-eval/PROMPT_EVAL_RUN.md`를 복사해 `.opendock/runs/prompt-eval/<run-id>.md`를 만듭니다.
3. run 문서에 이번 작업의 목적, 입력, 결과, 검증 내용을 적습니다.
4. 작업 후 `node .opendock/harness/opendock__prompt-eval/check.mjs`를 실행합니다.

## Tool

`promptfoo` CLI가 project-local tool로 설치됩니다. 실제 provider key는 사용자가 별도 관리합니다.

## 주의

평가 데이터에 secret, credential, private customer data를 넣지 않습니다.
