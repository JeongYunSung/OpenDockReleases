# Prompt Eval

`promptfoo`를 사용해 prompt, agent 지시문, RAG 응답의 품질과 안전성을 평가합니다.

## 빠른 확인

```sh
promptfoo --version
promptfoo --help
promptfoo eval
opendock doctor
```

평가 목적, pass 기준, dataset, provider를 먼저 정합니다. 실제 provider key와 모델 접근 권한은 별도로 관리합니다.

상세 원칙은 `PROMPT_EVAL.md`, 선택적 평가 기록 양식은 `PROMPT_EVAL_RUN.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 실제 `promptfoo` 명령으로 진행합니다.
