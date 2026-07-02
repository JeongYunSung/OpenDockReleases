# SECURITY.md

AI agent가 이 workspace에서 보안 민감 작업을 할 때 따르는 기준입니다.

## 민감 변경

- auth, permission, role, admin
- token, credential, API key, secret
- webhook, MCP, registry, deploy
- payment, PII, audit log, data export

## 요구 사항

- 변경 이유와 범위를 설명합니다.
- 위험과 완화책을 기록합니다.
- 테스트 또는 리뷰 근거를 남깁니다.
- rollback 또는 disable path를 확인합니다.

## 금지

- 실제 secret 값을 문서에 붙여넣기
- 승인 없는 배포, 마이그레이션, 권한 변경
- 외부 스크립트 실행을 보안 검토 없이 권장하기
