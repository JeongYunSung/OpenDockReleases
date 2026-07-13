# Kitchen Ultrawork

현재 workspace에는 식자재에서 시작하는 요리 계획과 안전 검토 절차가 설치되어 있습니다.

## 사용 순서

1. `KITCHEN_PLAYBOOK.md`를 읽습니다.
2. 처음이라면 `.opendock/templates/kitchen/KITCHEN_PROFILE.md`와 `PANTRY.md`를 `kitchen/` 아래에 복사해 사용자 소유 정보로 작성합니다.
3. 작업마다 `.opendock/templates/kitchen/KITCHEN_RUN.md`를 `.opendock/runs/kitchen/<run-id>/manifest.md`로 복사합니다.
4. 레시피, 식단, 장보기 결과는 `kitchen/` 아래에 저장하고 run manifest의 `Target Files`에 기록합니다.
5. 완료 전에 다음 gate를 실행합니다.

```bash
node .opendock/harness/opendock__kitchen-ultrawork/check.mjs
```

`kitchen/` 결과물은 사용자 소유입니다. OpenDock update나 uninstall 대상이 아닙니다.

## 요청 예시

- “소비기한이 가까운 재료부터 쓰는 3일 식단을 만들어줘.”
- “이 레시피를 2인분으로 줄이고 남는 식자재 활용 계획도 붙여줘.”
- “우유 없이 같은 질감을 낼 대체재와 교체 비율을 알려줘.”
- “한 번 장봐서 다섯 끼가 재료를 공유하도록 구성해줘.”

알레르기와 의료 조건이 불명확하면 AI가 먼저 확인해야 합니다. 긴급하거나 개인화된 의료·영양 판단은 전문가에게 확인합니다.
