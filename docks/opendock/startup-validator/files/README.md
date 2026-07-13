# Startup Validator 운영 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

창업 가설 검증은 `STARTUP_VALIDATION_PLAYBOOK.md`와 run별 manifest를 사용합니다. 결과 문서는 `validation/` 아래에 만들며 OpenDock 설치 파일로 관리하지 않습니다.

## 빠른 시작

1. `.opendock/templates/startup-validator/RUN.md`를 `.opendock/runs/startup-validator/<run-id>/manifest.md`로 복사합니다.
2. `[[...]]`를 실제 값으로 바꾸고 target을 선언합니다.
3. 가설, ICP, 대안, risky assumptions, source URL·access date, validation method와 threshold를 기록합니다.
4. facts, assumptions, recommendations를 분리하고 MVP, pricing, next decision을 작성합니다.
5. discovery 또는 특정 manifest 모드로 검증합니다.

```bash
node .opendock/harness/opendock__startup-validator/check.mjs
node .opendock/harness/opendock__startup-validator/check.mjs .opendock/runs/startup-validator/<run-id>/manifest.md
```

## 데이터 최소화

인터뷰와 사례에는 목적상 필요한 맥락만 남깁니다. 실명, 연락처, 집 주소, 정확한 위치·여행 일정, 예약·계정 식별자, 민감한 건강·재무 정보는 수집하지 않거나 redact합니다.

Harness는 지정된 문서 계약만 deterministic하게 검사합니다. 출처를 네트워크로 확인하지 않으며 Codex나 다른 외부 모델 출력의 결정성을 주장하지 않습니다.
