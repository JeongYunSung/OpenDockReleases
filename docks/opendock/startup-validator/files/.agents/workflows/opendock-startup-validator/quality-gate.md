# Startup Validator Quality Gate

## 1. Run 생성

- template을 새 `.opendock/runs/startup-validator/<run-id>/manifest.md`로 복사합니다.
- venture, scope, date와 `validation/` target을 확정합니다.

## 2. 가설과 Evidence

- problem, ICP, alternatives와 risky assumptions를 정리합니다.
- source URL과 access date를 기록합니다.
- facts, assumptions, recommendations를 분리하고 개인정보를 redact합니다.

## 3. 실험과 결정

- 최소 비용 validation method와 interview questions를 작성합니다.
- 데이터 수집 전에 pass/fail threshold를 고정합니다.
- MVP scope/non-goals, pricing hypothesis, next decision trigger를 연결합니다.

## 4. 검증과 수정

```bash
node .opendock/harness/opendock__startup-validator/check.mjs .opendock/runs/startup-validator/<run-id>/manifest.md
```

실패 rule을 해당 manifest 또는 target에서 수정하고 같은 경로로 재실행합니다. source 없는 주장을 삭제하거나 assumption으로 이동합니다.

## 5. Handoff

- 결과를 pass/fail/insufficient evidence로 구분합니다.
- 다음 결정, 필요한 추가 표본, privacy·research 한계를 기록합니다.
- 완료 후 `Status: completed`로 전환합니다.
