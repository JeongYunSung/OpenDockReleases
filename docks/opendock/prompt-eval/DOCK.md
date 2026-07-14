# Prompt Eval

설치하면 `promptfoo` CLI를 이 프로젝트에서만 쓰는 명령으로 사용할 수 있습니다. Prompt, agent 지시문, RAG 응답의 품질과 안전성을 반복 평가할 때 사용합니다.

## 설치 후 준비되는 것

- `promptfoo` 명령
- root `AGENTS.md`의 평가 도구 routing과 안전 경계
- `.opendock/docks/prompt-eval/README.md`와 평가 가이드
- 선택적으로 평가 결과를 기록할 `PROMPT_EVAL_RUN.md`

## 사용 방법

```sh
promptfoo --help
promptfoo eval
opendock doctor
```

평가 목적, pass 기준, dataset 범위를 먼저 정하고 provider key와 모델 접근 권한은 사용자가 별도로 관리합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `promptfoo --version` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

모델 provider, API key, 평가 dataset은 자동으로 준비하지 않습니다. 비공개 prompt나 customer data를 외부 provider에 보낼 수 있는 평가는 사용자 승인 후 실행합니다.
