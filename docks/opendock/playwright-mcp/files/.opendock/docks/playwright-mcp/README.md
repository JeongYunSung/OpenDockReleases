# Playwright MCP

`playwright-mcp`를 사용해 browser UI, screenshot, console, network 상태를 확인합니다.

## 빠른 확인

```sh
playwright-mcp --version
playwright-mcp --help
playwright-mcp --headless --isolated --allowed-hosts localhost,127.0.0.1
opendock doctor
```

대상 URL과 허용 host를 먼저 정합니다. login, 결제, 삭제, 제출은 사용자 승인을 받은 범위에서만 실행합니다.

상세 원칙은 `PLAYWRIGHT_MCP.md`, 선택적 실행 기록 양식은 `PLAYWRIGHT_MCP_RUN.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 실제 `playwright-mcp` 명령으로 진행합니다.
