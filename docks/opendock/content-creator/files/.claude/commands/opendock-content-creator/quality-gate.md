# Content Creator Quality Gate

현재 작업이 Content Creator 산출물과 관련될 때 이 command를 사용합니다.

1. `CONTENT_CREATOR.md`를 읽고 채널, 독자, 권리 기준을 확인합니다.
2. `.opendock/runs/content-creator/<run-id>.md`가 없으면 만들고, 있으면 현재 작업 내용을 업데이트합니다.
3. `HARNESS.md` 기준으로 블로그, 뉴스레터, 유튜브 스크립트, 썸네일 브리프, 업로드 체크리스트를 점검합니다.
4. 아래 harness를 실행합니다.

```bash
node .opendock/harness/opendock__content-creator/check.mjs
```

5. 실패 항목은 최종 응답 전에 수정합니다. 수정하지 않을 항목은 human-approved exception으로 이유와 승인자를 남깁니다.

안전 경계: 저작권 있는 본문/이미지/음원을 그대로 재사용하지 않고, source note와 rights note를 남깁니다.
