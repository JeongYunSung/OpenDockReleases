# Prompt Eval 도구 라우팅

- Prompt, agent, RAG 응답의 반복 평가에는 `promptfoo`를 사용합니다.
- 평가 예시와 기준은 `.opendock/docks/prompt-eval/README.md`를 확인합니다.
- 설치 상태는 `opendock doctor`로 확인합니다.

## 안전 경계

- 평가 목적, pass 기준, dataset, provider를 실행 전에 명시합니다.
- 성공 케이스와 위험·실패 케이스를 함께 평가합니다.
- API key, credential, private prompt, customer data를 설정이나 결과에 기록하지 않습니다.
- model output은 근거, 안전성, 일관성, 형식 준수 기준으로 다시 검토합니다.
