# Security Privacy Ultrawork Quality Gate

현재 작업이 Security Privacy Ultrawork 산출물과 관련될 때 이 command를 사용합니다.

1. `SECURITY_PRIVACY.md`를 읽고 데이터/보안 점검 범위를 확인합니다.
2. `.opendock/runs/security-privacy/<run-id>.md`가 없으면 만들고, 있으면 현재 작업 내용을 업데이트합니다.
3. `HARNESS.md` 기준으로 secret, PII, auth guard, dependency risk, prompt injection, data handling을 점검합니다.
4. 아래 harness를 실행합니다.

```bash
node .opendock/harness/opendock__security-privacy-ultrawork/check.mjs
```

5. 실패 항목은 최종 응답 전에 수정합니다. 수정하지 않을 항목은 human-approved exception으로 이유와 승인자를 남깁니다.

안전 경계: 보안 검사는 발견 가능성을 높이는 절차이며, 침투테스트나 법적 컴플라이언스 보증으로 표현하지 않습니다.
