# Kitchen Ultrawork

집에 있는 식자재에서 시작해 레시피, 주간 식단, 남은 재료 활용, 장보기 목록까지 이어지는 주방 작업용 dock입니다.

## 설치되는 것

- `KITCHEN_PLAYBOOK.md`: 냉장고 털기, 분량 환산, 대체재, meal prep 원칙
- `.opendock/templates/kitchen/`: 프로필, pantry, recipe, meal plan, shopping list, run manifest 템플릿
- `.agents/skills/opendock-kitchen-ultrawork/`: 식자재 기반 요리 작업 skill
- `.agents/workflows/opendock-kitchen-ultrawork/`: 계획부터 안전 검토까지의 workflow
- `.opendock/harness/opendock__kitchen-ultrawork/`: 현재 kitchen run 결과물만 검사하는 품질 gate

## 바로 쓰기

```text
냉장고에 두부 1모, 달걀 4개, 양파 반 개가 있어. 2명이 30분 안에 먹을 저녁 후보를 3개 제안하고, 하나를 고르면 레시피와 장보기 목록까지 만들어줘.
```

AI는 먼저 알레르기, 인원, 시간, 장비처럼 결과를 바꾸는 조건을 확인합니다. 생성 결과는 OpenDock이 관리하지 않는 `kitchen/` 아래에 두므로 dock을 업데이트하거나 제거해도 사용자의 레시피와 pantry는 남습니다.

## 품질 기준

- 알레르기와 교차오염 가능성을 추측으로 안전하다고 단정하지 않습니다.
- poultry, 다짐육, whole cut, 달걀 요리, 생선·해산물은 범주별 최소 내부 온도와 공식 근거를 남기고 whole cut은 3분 휴지합니다.
- 영양 수치나 건강 주장은 출처와 조회일이 없으면 확정하지 않습니다.
- cup, tsp 같은 원문 단위를 쓸 때는 g/ml 변환 또는 변환 불확실성을 함께 적습니다.
- 대체재는 맛뿐 아니라 재료가 맡는 기능, 교체 비율, 달라지는 결과를 설명합니다.

## 한계

이 dock은 의료·영양 진단을 제공하지 않고, 외부 레시피 서버나 pantry daemon을 설치하지 않습니다. 식품 안전과 영양 정보는 국가와 제품에 따라 달라질 수 있으므로 공식 출처와 제품 표시를 우선합니다.

## 참고 데이터

- 식품의약품안전처 식품영양성분 데이터베이스: https://various.foodsafetykorea.go.kr/nutrient/
- USDA FoodData Central: https://fdc.nal.usda.gov/
- Open Food Facts: https://world.openfoodfacts.org/
- Schema.org Recipe: https://schema.org/Recipe
