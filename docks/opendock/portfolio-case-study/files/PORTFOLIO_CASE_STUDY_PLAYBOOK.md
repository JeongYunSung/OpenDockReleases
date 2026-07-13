# Portfolio Case Study Playbook

## 1. 공개 계약

독자, 목적, 공개 가능한 고객·제품명, 본인 역할, 팀 기여, NDA·계약·미출시 범위를 먼저 정합니다. 본인이 하지 않은 결정을 1인칭 성과로 바꾸지 않습니다.

## 2. Claim Ledger

각 핵심 주장에 claim, source, source owner, 확인 상태, 공개 가능 여부, redaction을 연결합니다. source가 없으면 사실이 아니라 `Assumption` 또는 `Proxy`로 표시하고 검증 방법을 남깁니다.

## 3. 서사 구조

- Background: 조직·제품·시점의 공개 가능한 맥락
- Problem: 사용자와 비즈니스 문제가 관찰된 근거
- Role / Constraints: 본인 책임, 협업자, 시간·기술·정책 제약
- Research / Evidence: 사용한 자료, 방법, 한계
- Decisions / Process: 대안, trade-off, 선택 근거
- Solution: 실제로 전달한 결과와 범위
- Results: 측정 evidence 또는 honest proxy, attribution, limitation
- Reflection: 배운 점, 다시 할 결정, 남은 질문
- Privacy / Redaction: 제거·범주화·승인한 정보

## 4. 결과와 수치

전환율, 매출, 사용자 수, 처리 시간, 비용 절감, 만족도는 source와 측정 기간이 있을 때만 사용합니다. 측정이 없으면 출시 여부, task completion 관찰, stakeholder decision, adoption milestone 같은 proxy를 쓰고 proxy임을 명시합니다. 상관관계를 단독 인과로 표현하지 않습니다.

## 5. 개인정보와 최소 데이터

목적에 필요하지 않은 고객·직원·사용자 정보는 보존하지 않습니다. 여행 일정, 예약번호, 집 주소, 생활 패턴, 정확한 위치, 실명, 연락처, 주문·계정 식별자는 삭제하거나 넓은 범주와 합성 값으로 대체합니다. 스크린샷의 작은 텍스트, URL query, EXIF·metadata도 확인합니다.

## 6. 완료

기준 문서를 `portfolio/` 아래에 저장하고 run manifest에 선언합니다. Harness 통과 뒤 fact owner와 privacy owner의 별도 검토가 필요한 항목을 handoff에 남깁니다.
