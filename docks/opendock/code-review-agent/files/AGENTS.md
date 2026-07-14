# Code Review Agent 도구 라우팅

- Pull Request와 변경 사항의 AI 리뷰에는 `pr-agent`를 사용합니다.
- 사용 예시와 리뷰 기준은 `.opendock/docks/code-review-agent/README.md`를 확인합니다.
- 설치 상태는 `opendock doctor`로 확인합니다.

## 안전 경계

- finding에는 파일·라인, 영향, 재현 조건, 확인 방법을 포함합니다.
- 보안, 권한, 데이터, migration 변경은 근거와 rollback 가능성을 함께 검토합니다.
- credential, private token, customer data를 외부 provider로 보내지 않습니다.
- tool output을 그대로 확정하지 말고 실제 diff와 project rule로 다시 확인합니다.
