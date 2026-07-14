# Context7 MCP

`context7-mcp`를 사용해 library와 framework의 최신 문서를 agent workflow에서 조회합니다.

## 빠른 확인

```sh
context7-mcp --version
context7-mcp --help
context7-mcp --transport stdio
opendock doctor
```

MCP 연결은 사용하는 agent 설정에서 구성합니다. 조회할 library와 version을 먼저 정하고, 결과를 현재 project dependency와 대조합니다.

상세 원칙은 `CONTEXT7_MCP.md`, 선택적 조회 기록 양식은 `CONTEXT7_MCP_RUN.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 실제 `context7-mcp` 명령으로 진행합니다.
