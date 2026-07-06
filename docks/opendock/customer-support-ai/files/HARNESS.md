# Customer Support AI Harness

이 harness는 Customer Support AI 작업 결과를 점검합니다. 전체 repo를 무차별로 스캔하지 않고 아래 범위만 봅니다.

## 검사 범위

- `CUSTOMER_SUPPORT.md`
- `.opendock/runs/customer-support/**/*.md`
- `SUPPORT_RUN.md`에서 파생된 run 문서

## 필수 기준

- Run 문서에는 `지원 목표` section이 있어야 합니다.
- Run 문서에는 `톤 원칙` section이 있어야 합니다.
- Run 문서에는 `정책 기준` section이 있어야 합니다.
- Run 문서에는 `매크로` section이 있어야 합니다.
- Run 문서에는 `에스컬레이션` section이 있어야 합니다.
- Run 문서에는 `VOC 인사이트` section이 있어야 합니다.
- Run 문서에는 `다음 행동` section이 있어야 합니다.

## 실행

```bash
node .opendock/harness/opendock__customer-support-ai/check.mjs
```

## 실패 시

1. 실패 메시지의 file과 rule을 확인합니다.
2. 누락된 section 또는 위험 문구를 수정합니다.
3. 수정할 수 없는 항목은 `Approved Exception:`으로 이유와 승인자를 남깁니다.
4. 다시 harness를 실행합니다.

## 안전 경계

- 이 harness는 secret 값을 출력하지 않습니다.
- `.git`, `node_modules`, `.opendock/tools`, `.opendock/runtimes` 같은 무거운 디렉터리를 보지 않습니다.
- 고객에게 보상, 환불, 법적 책임을 확정하는 문구는 담당자 승인 없이 작성하지 않습니다.
