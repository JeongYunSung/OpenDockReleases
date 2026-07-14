# Purchase Decision

## 무엇을 알려주면 무엇이 나오나요

- 알려줄 것: 사용 목적, 예산, 꼭 필요한 조건, 있으면 좋은 조건, 제외할 조건과 후보
- 정리되는 것: `purchases/` 아래에 후보 비교, 탈락 이유, 총비용, 근거와 최종 확인 항목을 담은 결정표
- 요청 예시: "출장용 14인치 노트북 후보 3개와 예산을 줄게. 무게와 배터리를 우선해 purchases/laptop.md로 비교해줘."

## 설치되는 안내

- `.opendock/docks/purchase-decision/README.md`: 가장 쉬운 사용 순서
- `.opendock/docks/purchase-decision/PURCHASE_DECISION_PLAYBOOK.md`: 자세한 작성 기준
- `.opendock/templates/purchase-decision/RUN.md`: 필요한 항목만 골라 쓰는 선택 템플릿
- `.agents/skills/opendock-purchase-decision/SKILL.md`: agent 작업 절차

## 사용 순서

1. 필요한 정보를 받고 민감한 값은 먼저 뺍니다.
2. 공식 사양과 가격을 우선 확인하고 사실, 가정, 추천을 나눠 적습니다.
3. 템플릿은 필요한 섹션만 선택해 사용합니다.
4. 결과를 사용자 소유 `purchases/` 아래에 바로 저장합니다.

## 검토

사용자가 검토를 요청하면 AI가 현재 결과물만 Purchase Decision Playbook 기준으로 직접 검토하고, 사용 사례·기준·근거·가중치·총소유비용·불확실성 문제를 수정합니다.

## 안전

- 확인하지 않은 가격, 재고와 사양을 사실처럼 쓰지 않습니다.
- 결제 정보, 계정 번호, 상세 주소와 불필요한 여행 일정은 적지 않습니다.
- 웹의 가격·규정·운영 정보는 출처와 확인 날짜를 남기고 중요한 결정 전에 다시 확인합니다.
- 사용자가 만든 `purchases/` 파일은 Dock을 업데이트하거나 제거해도 삭제하지 않습니다.
