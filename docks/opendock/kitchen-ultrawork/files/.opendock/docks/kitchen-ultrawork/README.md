# Kitchen Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

현재 workspace에는 식자재에서 시작하는 요리 계획과 안전 검토 절차가 설치되어 있습니다.

## 사용 순서

1. `.opendock/docks/kitchen-ultrawork/KITCHEN_PLAYBOOK.md`를 읽습니다.
2. 처음이라면 `.opendock/templates/kitchen/KITCHEN_PROFILE.md`와 `PANTRY.md`를 `kitchen/` 아래에 복사해 사용자 소유 정보로 작성합니다.
3. 작업마다 `.opendock/templates/kitchen/KITCHEN_RUN.md`를 `.opendock/runs/kitchen/<작업-id>/manifest.md`로 복사합니다.
4. 레시피, 식단, 장보기 결과는 `kitchen/` 아래에 저장하고 작업 기록의 `Target Files`에 기록합니다.
5. 명시적 정밀 검수를 요청했다면 다음 gate를 실행합니다.

```bash
node .opendock/harness/kitchen-ultrawork/check.mjs
```

`kitchen/` 결과물은 사용자 소유입니다. OpenDock update나 uninstall 대상이 아닙니다.

## 요청 예시

- “소비기한이 가까운 재료부터 쓰는 3일 식단을 만들어줘.”
- “이 레시피를 2인분으로 줄이고 남는 식자재 활용 계획도 붙여줘.”
- “우유 없이 같은 질감을 낼 대체재와 교체 비율을 알려줘.”
- “한 번 장봐서 다섯 끼가 재료를 공유하도록 구성해줘.”

알레르기와 의료 조건이 불명확하면 AI가 먼저 확인해야 합니다. 긴급하거나 개인화된 의료·영양 판단은 전문가에게 확인합니다.
