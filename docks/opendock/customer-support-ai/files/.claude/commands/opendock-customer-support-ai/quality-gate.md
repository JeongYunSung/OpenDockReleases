# Customer Support AI Quality Gate

현재 작업이 Customer Support AI 산출물과 관련될 때 이 command를 사용합니다.

1. `CUSTOMER_SUPPORT.md`를 읽고 지원 범위와 톤 원칙을 확인합니다.
2. `.opendock/runs/customer-support/<run-id>.md`가 없으면 만들고, 있으면 현재 작업 내용을 업데이트합니다.
3. `HARNESS.md` 기준으로 FAQ, CS 매크로, 환불/교환 정책, 티켓 분류, VOC 분석을 점검합니다.
4. 아래 harness를 실행합니다.

```bash
node .opendock/harness/opendock__customer-support-ai/check.mjs
```

5. 실패 항목은 최종 응답 전에 수정합니다. 수정하지 않을 항목은 human-approved exception으로 이유와 승인자를 남깁니다.

안전 경계: 고객에게 보상, 환불, 법적 책임을 확정하는 문구는 담당자 승인 없이 작성하지 않습니다.
