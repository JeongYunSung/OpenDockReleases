# Research Desk Quality Gate

현재 작업이 Research Desk 산출물과 관련될 때 이 command를 사용합니다.

1. `RESEARCH_DESK.md`를 읽고 리서치 질문과 출처 기준을 확인합니다.
2. `.opendock/runs/research-desk/<run-id>.md`가 없으면 만들고, 있으면 현재 작업 내용을 업데이트합니다.
3. `HARNESS.md` 기준으로 자료 수집, 출처 비교, 주장/근거 분리, 인용 정리, 빈틈과 다음 행동을 점검합니다.
4. 아래 harness를 실행합니다.

```bash
node .opendock/harness/opendock__research-desk/check.mjs
```

5. 실패 항목은 최종 응답 전에 수정합니다. 수정하지 않을 항목은 human-approved exception으로 이유와 승인자를 남깁니다.

안전 경계: 출처를 확인하지 못한 내용을 사실처럼 단정하지 않습니다.
