# QA Ultrawork

회귀 범위, smoke test, 보안 점검, release confidence, 최종 handoff 기준을 확인하는 QA 품질 게이트입니다.

## 확인하는 것

- regression, smoke, acceptance coverage가 명확해야 합니다.
- skipped test나 focused test가 남아 있으면 안 됩니다.
- 보안에 민감한 변경에는 scan 또는 review evidence가 필요합니다.
- 접근성 완료 표시에는 keyboard-only, screen reader, focus visible, contrast, axe/Lighthouse 또는 role/name 테스트 중 관련 증거가 필요합니다.
- bug report에는 재현 절차, 기대 결과, 실제 결과, 환경 정보가 필요합니다.
- release handoff에는 알려진 risk와 rollback note가 포함되어야 합니다.
- 최종 응답에는 테스트한 것과 테스트하지 못한 것을 명확히 적어야 합니다.

QA, test, security, release 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
