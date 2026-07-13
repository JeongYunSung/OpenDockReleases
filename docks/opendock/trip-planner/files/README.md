# Trip Planner 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

이 관리 블록은 여행 계획 작업의 실행 순서와 산출물 경계를 정의합니다. 상세 기준은 `TRIP_PLANNING_PLAYBOOK.md`를 따릅니다.

## 빠른 시작

1. `.opendock/templates/trip-planner/RUN.md`를 `.opendock/runs/trip-planner/<run-id>/manifest.md`로 복사합니다.
2. `Status`를 `draft`로 두고 여행자·날짜·예산·선호·제약을 채웁니다.
3. 최신 교통, 날씨, 휴무, 예약 출처의 URL과 접근일을 기록합니다.
4. `trips/` 아래 결과를 만들고 `대상 파일 (Target Files)`에 선언합니다.
5. 아래 명령으로 검사하고 실패 규칙을 수정합니다.

```bash
node .opendock/harness/opendock__trip-planner/check.mjs
node .opendock/harness/opendock__trip-planner/check.mjs .opendock/runs/trip-planner/<run-id>/manifest.md
```

하네스는 활성 실행이 없으면 `Ready`로 통과합니다. `draft`, `active`, `in-progress`, `review`, `ready`는 활성 상태이며 동시에 하나만 존재할 수 있습니다. 명시적 manifest 인자를 주면 자동 발견을 하지 않고 그 파일 하나만 검사합니다.

결정론적 검사는 경로, 필수 근거, 민감정보, 위험 지시와 산출물 구조를 확인합니다. Codex 검토는 별도 승인 단계이며 외부 모델의 동일 응답을 보장하지 않습니다.
