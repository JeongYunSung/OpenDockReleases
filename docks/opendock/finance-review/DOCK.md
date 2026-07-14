# Finance Review

수입, 지출, 반복 결제, 목표와 예산 차이를 개인정보 없는 집계로 검토합니다.

## 설치 후 생기는 것

- `.opendock/docks/finance-review/README.md`: 빠른 사용 안내
- `.opendock/docks/finance-review/FINANCE_REVIEW_PLAYBOOK.md`: 예산 검토 기준
- `.opendock/templates/finance-review/RUN.md`: 선택형 작업 메모
- `.agents/skills/opendock-finance-review/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

검토할 기간, 기준 통화, 수입·지출 합계, 예산, 반복 결제와 목표를 알려주면 요청된 보고서를 바로 작성합니다. 템플릿은 정리가 필요할 때만 사용하고 현재 작업에 필요한 section만 선택합니다.

> 6월 수입·지출 합계와 예산을 줄게. 계좌번호는 빼고 다음 달 조정안을 정리해줘.

## 검토 방법

사용자가 검토를 요청하면 현재 결과물만 `FINANCE_REVIEW_PLAYBOOK.md` 기준으로 AI가 직접 검토합니다. 요청하지 않은 과거 결과물이나 프로젝트 전체는 검사하지 않습니다.

## 안전

계좌·카드 번호, credential, 원본 명세서와 전체 거래 메모를 결과에 넣지 않습니다. 개인화된 투자·세무·법률 자문, 자동 거래·이체 또는 결과 보장을 제공하지 않습니다.
