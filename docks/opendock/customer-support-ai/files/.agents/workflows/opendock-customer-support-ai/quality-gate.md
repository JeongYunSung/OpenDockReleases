# Customer Support AI Quality Gate

1. `CUSTOMER_SUPPORT.md`를 읽습니다.
2. `.opendock/runs/customer-support/` 아래 이번 작업 run 문서를 확인하거나 새로 만듭니다.
3. 아래 기준으로 산출물을 검토합니다.

- FAQ는 고객 질문 언어로 작성하고 내부 정책 용어를 노출하지 않습니다.
- CS 매크로는 공감, 사실 확인, 해결 경로, 다음 행동을 포함합니다.
- 환불/교환/취소 정책은 조건, 예외, 처리 시간, 담당 채널을 분리합니다.
- 티켓 분류는 intent, urgency, owner, SLA, escalation rule을 포함합니다.
- VOC 분석은 반복 이슈, 원인 가설, 제품/운영 개선안, 근거를 남깁니다.
- 보상/환불/법적 약속처럼 민감한 문구는 확정 표현보다 검토 필요 표시를 사용합니다.

4. `node .opendock/harness/opendock__customer-support-ai/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 `Approved Exception:`으로 승인된 예외를 남깁니다.
6. 최종 응답에는 통과/실패/미검증 항목을 구분해서 보고합니다.

## 안전 경계

고객에게 보상, 환불, 법적 책임을 확정하는 문구는 담당자 승인 없이 작성하지 않습니다.
