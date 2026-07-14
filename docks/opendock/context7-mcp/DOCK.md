# Context7 MCP

설치하면 `context7-mcp` CLI를 이 프로젝트에서만 쓰는 명령으로 사용할 수 있습니다. Agent가 library와 framework의 최신 문서를 MCP로 조회해야 할 때 사용합니다.

## 설치 후 준비되는 것

- `context7-mcp` 명령
- root `AGENTS.md`의 문서 조회 routing과 안전 경계
- `.opendock/docks/context7-mcp/README.md`와 MCP 연결 가이드
- 선택적으로 조회 근거를 기록할 `CONTEXT7_MCP_RUN.md`

## 사용 방법

```sh
context7-mcp --help
context7-mcp --transport stdio
opendock doctor
```

MCP 연결은 사용하는 agent 설정에서 명시적으로 구성합니다. 조회 결과는 현재 project의 실제 dependency version과 다시 대조합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `context7-mcp --version` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

MCP server를 자동으로 장기 실행하거나 agent 설정에 등록하지 않습니다. API key가 필요한 구성은 secret을 문서나 작업 기록에 저장하지 않습니다.
