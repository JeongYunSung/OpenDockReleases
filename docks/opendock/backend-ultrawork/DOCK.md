# Backend Ultrawork

API 계약, 검증, 인증, 마이그레이션, 로깅, 서비스 안전성을 확인하는 백엔드 품질 게이트입니다.

## 확인하는 것

- 백엔드 서비스에 formatter, lint, test, build가 준비되어 있어야 합니다.
- request body는 사용하기 전에 검증해야 합니다.
- 인증이 필요한 endpoint에는 명시적인 guard가 있어야 합니다.
- 하드코딩된 secret과 민감정보 로깅을 막습니다.
- 데이터베이스 마이그레이션은 dry-run과 rollback을 고려해야 합니다.
- OpenAPI나 schema 문서가 실제 route와 어긋나면 안 됩니다.

백엔드 API와 서비스 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
