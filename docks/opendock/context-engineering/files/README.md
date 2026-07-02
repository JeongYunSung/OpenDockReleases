# Context Engineering

이 프로젝트에는 `context-engineering` dock이 설치되어 있습니다.

## 바로 쓰는 법

1. `CONTEXT_ENGINEERING.md`를 읽습니다.
2. `.opendock/templates/context-engineering/CONTEXT_PACK.md`를 복사해 `.opendock/runs/context-engineering/<run-id>.md`를 만듭니다.
3. run 문서에 이번 작업의 목적, 입력, 결과, 검증 내용을 적습니다.
4. 작업 후 `node .opendock/harness/opendock__context-engineering/check.mjs`를 실행합니다.

## Tool

`code-review-graph`와 `codectx`가 project-local tool로 설치됩니다. 색인은 workspace 안에서만 다룹니다.

## 주의

context pack에 .env, keychain, SSH key, cloud credential, private token을 포함하지 않습니다.
