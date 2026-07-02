# Agent Planning Harness

장기 작업 계획이 이어받기 가능한 상태인지 점검합니다.

## 필수 기준

- `PLANNING.md`가 있어야 합니다.
- 계획에는 목표, 범위, 단계, 검증 기준이 있어야 합니다.
- 완료 항목에는 evidence, test, review, verified 중 하나 이상의 근거가 있어야 합니다.
- blocker, needs-input, risk는 구분해야 합니다.
- `.opendock/plans/` 아래 plan 문서는 템플릿 구조를 유지합니다.

## 명령

```bash
node .opendock/harness/opendock__agent-planning/check.mjs
```
