# Code Review Agent

이 프로젝트에는 `code-review-agent` dock이 설치되어 있습니다.

## 바로 쓰는 법

1. `CODE_REVIEW.md`를 읽습니다.
2. `.opendock/templates/code-review-agent/CODE_REVIEW_RUN.md`를 복사해 `.opendock/runs/code-review-agent/<run-id>.md`를 만듭니다.
3. run 문서에 이번 작업의 목적, 입력, 결과, 검증 내용을 적습니다.
4. 작업 후 `node .opendock/harness/opendock__code-review-agent/check.mjs`를 실행합니다.

## Tool

`pr-agent` CLI가 project-local tool로 설치됩니다. 원격 PR 연동 token은 자동 생성하거나 저장하지 않습니다.

## 주의

리뷰 도중 credential, private token, customer data를 외부 서비스로 보내지 않습니다.
