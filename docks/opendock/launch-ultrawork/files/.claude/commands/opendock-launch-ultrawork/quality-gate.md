# Launch Ultrawork Quality Gate

현재 작업이 Launch Ultrawork 산출물과 관련될 때 이 command를 사용합니다.

1. `LAUNCH.md`를 읽고 출시 전 점검 범위를 확인합니다.
2. `.opendock/runs/launch/<run-id>.md`가 없으면 만들고, 있으면 현재 작업 내용을 업데이트합니다.
3. `HARNESS.md` 기준으로 랜딩, 가격, 약관, SEO, 온보딩, 결제, 분석, 에러 상태를 점검합니다.
4. 아래 harness를 실행합니다.

```bash
node .opendock/harness/opendock__launch-ultrawork/check.mjs
```

5. 실패 항목은 최종 응답 전에 수정합니다. 수정하지 않을 항목은 human-approved exception으로 이유와 승인자를 남깁니다.

안전 경계: 법률/세무/결제 규정의 최종 판단은 담당 전문가 검토 대상으로 표시합니다.
