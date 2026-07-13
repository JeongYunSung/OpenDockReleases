---
name: opendock-kitchen-ultrawork
description: 보유 식자재를 기반으로 레시피, 식단, 대체재, 장보기 목록을 만들고 알레르기와 식품 안전을 검증할 때 사용합니다.
---

# Kitchen Ultrawork

1. `KITCHEN_PLAYBOOK.md`와 `kitchen/KITCHEN_PROFILE.md`, `kitchen/PANTRY.md`가 있으면 먼저 읽습니다.
2. 인원, 알레르기, 시간, 장비, 예산 중 결과를 바꾸는 누락 정보만 질문합니다.
3. 소비기한과 pantry 재고를 우선해 후보 2-3개를 제안합니다.
4. 선택된 작업에 대해 `.opendock/runs/kitchen/<run-id>/manifest.md`를 작성합니다.
5. 결과는 `kitchen/` 아래 사용자 소유 파일로 만듭니다.
6. 대체재에는 기능·비율·변화·주의점을 기록합니다.
7. 안전 온도는 poultry 74°C/165°F, 다짐육·달걀 요리 71°C/160°F, whole beef/pork/lamb cut과 생선·해산물 63°C/145°F를 적용하고 whole cut은 3분 휴지합니다.
8. 영양과 식품 안전 값은 알려진 공공 보건 기관의 HTTPS URL, 조회일, 적용 범위·한계를 기록하고 불확실성을 숨기지 않습니다.
9. `node .opendock/harness/opendock__kitchen-ultrawork/check.mjs`를 실행하고 실패를 수정합니다.

의료 진단, 치료, 알레르기 안전 보장, pantry에 없는 재료의 임의 가정은 하지 않습니다.
