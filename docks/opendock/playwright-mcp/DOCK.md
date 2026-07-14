# Playwright MCP

설치하면 `playwright-mcp` CLI를 이 프로젝트에서만 쓰는 명령으로 사용할 수 있습니다. Agent가 browser UI를 탐색하고 screenshot, console, network 상태를 확인할 때 사용합니다.

## 설치 후 준비되는 것

- `playwright-mcp` 명령
- root `AGENTS.md`의 browser MCP routing과 안전 경계
- `.opendock/docks/playwright-mcp/README.md`와 실행 가이드
- 선택적으로 실행 범위를 기록할 `PLAYWRIGHT_MCP_RUN.md`

## 사용 방법

```sh
playwright-mcp --help
playwright-mcp --headless --isolated --allowed-hosts localhost,127.0.0.1
opendock doctor
```

실행 전에 대상 URL, 허용 host, login 필요 여부를 정합니다. 실제 계정이나 상태를 바꾸는 action은 사용자 승인을 받은 범위에서만 수행합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `playwright-mcp --version` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

브라우저 binary와 기존 login session은 자동 준비하지 않습니다. unrestricted file access나 외부 사이트로의 private data 입력은 기본 사용 범위에 포함하지 않습니다.
