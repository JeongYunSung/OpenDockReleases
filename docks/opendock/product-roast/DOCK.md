# Product Roast

제품 경험의 문제를 근거, 영향과 우선순위 중심으로 날카롭게 비평합니다.

## 설치 후 생기는 것

- `.opendock/docks/product-roast/README.md`: 사용 안내
- `.opendock/docks/product-roast/PRODUCT_ROAST_PLAYBOOK.md`: 제품 비평 기준
- `.opendock/templates/product-roast/RUN.md`: 필요한 항목만 골라 쓰는 선택 템플릿
- `.agents/skills/opendock-product-roast/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용

> 이 가입 흐름을 사용성 근거와 개선 우선순위 중심으로 비평해줘.

별도 작업 기록을 먼저 만들 필요 없이 결과를 바로 작성합니다. 템플릿은 요청에 필요한 섹션만 선택해 사용합니다.

## 검토

사용자가 검토를 요청하면 AI가 현재 결과물만 Product Roast Playbook 기준으로 직접 검토하고, 관찰 근거·영향·severity·keep/change·우선순위 문제를 수정합니다.

## 안전

사람이 아닌 제품 경험을 비평하며 근거 없는 비난이나 성과 보장을 만들지 않습니다. 관련 없는 파일 수정·삭제, credential 접근, 배포와 파괴적 작업을 승인 없이 실행하지 않습니다.
