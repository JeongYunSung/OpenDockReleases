# Browser Agent

설치하면 `agent-browser` CLI를 이 프로젝트에서만 쓰는 명령으로 바로 사용할 수 있습니다. 브라우저 탐색, UI smoke test, 화면 상태 확인을 자동화할 때 사용합니다.

## 설치 후 준비되는 것

- `agent-browser` 명령
- 루트 `AGENTS.md`의 도구 연결 안내과 브라우저 안전 경계
- `.opendock/docks/browser-agent/README.md`와 상세 가이드
- 선택적으로 작업 기록에 쓸 `BROWSER_AGENT_RUN.md`

## 사용 방법

```sh
agent-browser --help
opendock doctor
```

자동화 전에 대상 URL과 허용 domain을 정하고, login·결제·삭제·제출처럼 상태를 바꾸는 동작은 사용자 승인을 받은 뒤 실행합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `agent-browser --version` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

브라우저 binary, login session, 외부 서비스 인증 정보은 자동으로 준비하지 않습니다. 필요한 추가 다운로드나 외부 전송은 사용자에게 범위와 영향을 먼저 알립니다.
