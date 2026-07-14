---
name: opendock-customer-support-ai
description: FAQ, CS 매크로, 환불·교환 정책, 티켓 분류, 톤 가이드와 VOC 분석을 정리할 때 사용합니다.
---

# Customer Support AI

## 사용 조건

- 고객 문의 답변, FAQ, CS 매크로, 정책 문서, 티켓 분류 또는 VOC 분석을 만들거나 검토할 때 사용합니다.
- 작업 전 `.opendock/docks/customer-support-ai/CUSTOMER_SUPPORT.md`에서 정책과 이관 기준을 확인합니다.

## 작업 순서

1. 문의 내용, 적용 정책, 고객 상태와 필요한 추가 정보를 구분합니다.
2. 요청된 답변이나 운영 문서를 바로 작성합니다.
3. 작업 메모가 유용하면 선택 템플릿에서 필요한 section만 사용합니다.
4. 공감, 사실 확인, 해결 경로, 다음 행동과 이관 조건을 확인합니다.
5. 사용자가 검토를 요청하면 현재 결과물만 domain guide 기준으로 AI가 직접 검토합니다.

## 체크리스트

- FAQ는 고객이 사용하는 언어로 작성합니다.
- CS 매크로는 사실과 해결 가능한 다음 행동을 분명히 합니다.
- 정책은 조건, 예외, 처리 시간과 담당 채널을 구분합니다.
- 민감한 보상·환불·법적 약속은 담당자 검토 필요로 표시합니다.

## 안전 경계

- secret, credential, private token과 불필요한 고객 개인정보를 출력하지 않습니다.
- 고객에게 보상, 환불 또는 법적 책임을 담당자 승인 없이 확정하지 않습니다.
- destructive command, deploy, migration 또는 billing action을 명시적 승인 없이 실행하지 않습니다.
