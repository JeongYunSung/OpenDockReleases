# Code Review Agent 사용 가이드

## 리뷰 원칙

- finding은 파일·라인, 영향, 재현 조건을 포함합니다.
- 심각도는 실제 사용자·보안·데이터 영향에 근거해 정합니다.
- 보안, 권한, 데이터, migration 변경은 rollback 가능성도 확인합니다.
- 수정 후 같은 항목을 다시 검증합니다.

## 권장 기록

- review scope와 changed files
- findings와 severity
- evidence와 reproduction
- fix plan과 verification

## 금지

- secret, credential, token, private code를 승인 없이 외부 provider로 보내지 않습니다.
- tool output만으로 finding을 확정하지 않습니다.
- 관련 없는 파일 수정, deploy, destructive action을 자동 수행하지 않습니다.
