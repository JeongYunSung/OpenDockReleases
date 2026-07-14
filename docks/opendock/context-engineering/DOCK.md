# Context Engineering

설치하면 `code-review-graph`와 `codectx` CLI를 이 프로젝트에서만 쓰는 명령으로 사용할 수 있습니다. 큰 저장소에서 질문과 관련된 코드·문서 맥락만 좁혀 읽을 때 사용합니다.

## 설치 후 준비되는 것

- `code-review-graph`, `codectx` 명령
- root `AGENTS.md`의 context 도구 routing과 안전 경계
- `.opendock/docks/context-engineering/README.md`와 상세 가이드
- 선택적으로 조사 범위를 기록할 `CONTEXT_PACK.md`

## 사용 방법

```sh
code-review-graph --help
codectx --help
opendock doctor
```

질문, 대상 경로, 제외 경로를 먼저 정하고 생성되는 index와 context output은 workspace 범위 안에서 관리합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 두 CLI의 실제 `--help` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

생성된 graph나 context는 최신 source와 다를 수 있으므로 중요한 판단 전 현재 파일을 다시 확인해야 합니다. secret과 민감 설정 파일은 입력 범위에서 제외합니다.
