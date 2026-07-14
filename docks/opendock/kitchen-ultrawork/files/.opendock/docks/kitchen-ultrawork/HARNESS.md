# Kitchen Ultrawork Harness

## 실행 범위

이 정밀 검수 문서는 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 적용합니다. 평소 요청에서는 현재 작업의 명시 target 또는 활성 run manifest target만 빠르게 확인하고 프로젝트 전체를 재귀 검사하지 않습니다.

이 gate는 `.opendock/runs/kitchen/`의 현재 active run manifest와 그 manifest가 명시한 `kitchen/` target file만 검사합니다.

## 검사 항목

- active run에 명시된 target file 존재와 안전한 경로
- `.opendock/runs/kitchen` 전체 ancestry와 target path의 traversal, symlink, project 외부 해석, 과도한 개수·크기
- 동시에 존재하는 둘 이상의 draft/active/review run
- 의료적 치료·완치 표현
- 교차오염 검토 없이 allergen-free 또는 안전을 단정하는 표현
- poultry, 다짐육, whole cut, 달걀 요리, 생선·해산물의 C/F 최소 내부 온도와 whole cut 3분 휴지
- 안전 온도 사용 시 알려진 공공 보건 기관의 HTTPS URL, `YYYY-MM-DD` 조회일, 적용 범위·한계 누락
- 레시피의 servings, ingredients, steps, time, storage, allergen 정보 누락

맛, 조리 편의성, 대체재의 적절성, 장보기 구성과 문장 품질은 `KITCHEN_PLAYBOOK.md`를 기준으로 AI가 현재 산출물을 직접 검토합니다. checker는 경로와 파일 구조, 의료·알레르기·식품 안전처럼 객관적인 위험만 자동 판정합니다.

## 실행

```bash
node .opendock/harness/kitchen-ultrawork/check.mjs
```

active run이 없으면 설치 준비 상태로 통과합니다. 이 gate는 저장소 전체나 과거의 모든 레시피를 검사하지 않습니다.
