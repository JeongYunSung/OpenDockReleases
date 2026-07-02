# Code Review Agent Quality Gate

1. `CODE_REVIEW.md`를 읽습니다.
2. `.opendock/runs/code-review-agent/` 아래 active run 문서를 확인합니다.
3. scope, evidence, result, follow-up이 있는지 확인합니다.
4. 민감 작업이 있으면 approval note를 확인합니다.
5. `node .opendock/harness/opendock__code-review-agent/check.mjs`를 실행합니다.
6. 실패 항목을 수정한 뒤 handoff합니다.
