# Browser Agent

이 프로젝트에는 `browser-agent` dock이 설치되어 있습니다.

## 바로 쓰는 법

1. `BROWSER_AGENT.md`를 읽습니다.
2. `.opendock/templates/browser-agent/BROWSER_AGENT_RUN.md`를 복사해 `.opendock/runs/browser-agent/<run-id>.md`를 만듭니다.
3. run 문서에 이번 작업의 목적, 입력, 결과, 검증 내용을 적습니다.
4. 작업 후 `node .opendock/harness/opendock__browser-agent/check.mjs`를 실행합니다.

## Tool

`agent-browser` CLI가 project-local tool로 설치됩니다. 브라우저 바이너리 다운로드가 필요한 경우 명시적으로 승인 후 진행합니다.

## 주의

credential 입력, 결제, destructive action, 계정 설정 변경은 자동 수행하지 않습니다.
