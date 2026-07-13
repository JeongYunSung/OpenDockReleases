# Kitchen Ultrawork Harness

이 gate는 `.opendock/runs/kitchen/`의 현재 active run manifest와 그 manifest가 명시한 `kitchen/` target file만 검사합니다.

## 검사 항목

- 요청, household constraints, 보유 식자재, target file, 알레르기, 식품 안전, 출처·불확실성, validation 기록
- `.opendock/runs/kitchen` 전체 ancestry와 target path의 traversal, symlink, project 외부 해석, 과도한 개수·크기
- 동시에 존재하는 둘 이상의 draft/active/review run
- 의료적 치료·완치 표현
- 교차오염 검토 없이 allergen-free 또는 안전을 단정하는 표현
- poultry, 다짐육, whole cut, 달걀 요리, 생선·해산물의 C/F 최소 내부 온도와 whole cut 3분 휴지
- 안전 온도 사용 시 알려진 공공 보건 기관의 HTTPS URL, `YYYY-MM-DD` 조회일, 적용 범위·한계 누락
- cup/tsp/tbsp 사용 시 g/ml 변환 또는 변환 불확실성 누락
- 대체재 사용 시 기능, 비율, 주의점 누락
- 영양 수치 또는 건강 claim의 출처와 조회일 누락
- 레시피의 servings, ingredients, steps, time, storage, allergen 정보 누락

## 실행

```bash
node .opendock/harness/opendock__kitchen-ultrawork/check.mjs
```

active run이 없으면 설치 준비 상태로 통과합니다. 이 gate는 저장소 전체나 과거의 모든 레시피를 검사하지 않습니다.
