# Code Review Agent

설치하면 PR-Agent의 `pr-agent` CLI를 이 프로젝트에서만 쓰는 명령으로 사용할 수 있습니다. Pull Request와 변경 사항을 근거, 심각도, 재현 조건 중심으로 검토할 때 사용합니다.

## 설치 후 준비되는 것

- `pr-agent` 명령
- root `AGENTS.md`의 코드 리뷰 routing과 안전 경계
- `.opendock/docks/code-review-agent/README.md`와 리뷰 가이드
- 선택적으로 리뷰 기록에 쓸 `CODE_REVIEW_RUN.md`

## 사용 방법

```sh
pr-agent --help
opendock doctor
```

원격 PR provider를 연결할 때는 필요한 token과 전송 범위를 먼저 확인하고, findings에는 파일·라인·영향·재현 근거를 포함합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `pr-agent --help` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

GitHub, GitLab 등의 인증 token과 provider 설정은 자동 생성하지 않습니다. 비공개 코드가 외부 서비스로 전송될 수 있는 구성은 사용자 승인 후 적용합니다.
