# Browser Agent

`agent-browser`를 사용해 웹 탐색, UI smoke test, screenshot 확인을 수행합니다.

## 빠른 확인

```sh
agent-browser --version
agent-browser --help
opendock doctor
```

실행 전 대상 URL과 허용 domain을 정합니다. login, 결제, 삭제, 제출, 계정 변경은 사용자 승인을 받은 뒤 수행합니다.

상세 원칙은 `BROWSER_AGENT.md`, 선택적 작업 기록 양식은 `BROWSER_AGENT_RUN.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 실제 `agent-browser` 명령으로 진행합니다.
