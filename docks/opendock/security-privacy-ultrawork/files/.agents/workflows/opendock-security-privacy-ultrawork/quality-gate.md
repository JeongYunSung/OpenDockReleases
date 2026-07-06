# Security Privacy Ultrawork Quality Gate

1. `SECURITY_PRIVACY.md`를 읽습니다.
2. `.opendock/runs/security-privacy/` 아래 이번 작업 run 문서를 확인하거나 새로 만듭니다.
3. 아래 기준으로 산출물을 검토합니다.

- 수집/저장/전송/삭제되는 데이터와 PII 여부를 inventory로 작성합니다.
- 인증이 필요한 endpoint, admin action, 데이터 export에는 guard가 있어야 합니다.
- secret, token, private key, `.env` 값은 산출물에 포함하지 않습니다.
- prompt injection, embedded instruction, tool abuse, data exfiltration 경로를 따로 봅니다.
- dependency와 외부 provider 사용에는 목적, 데이터 범위, 보존 기간, 대체 경로를 기록합니다.
- 발견 사항은 severity, impact, evidence, fix owner, due date로 정리합니다.

4. `node .opendock/harness/opendock__security-privacy-ultrawork/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 `Approved Exception:`으로 승인된 예외를 남깁니다.
6. 최종 응답에는 통과/실패/미검증 항목을 구분해서 보고합니다.

## 안전 경계

보안 검사는 발견 가능성을 높이는 절차이며, 침투테스트나 법적 컴플라이언스 보증으로 표현하지 않습니다.
