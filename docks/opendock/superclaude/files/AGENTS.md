# SuperClaude 도구 라우팅

- Claude Code command, persona, workflow 관리에는 `superclaude`를 사용합니다.
- 설정 변경 예시와 기준은 `.opendock/docks/superclaude/README.md`를 확인합니다.
- 설치 상태는 `opendock doctor`로 확인합니다.

## 안전 경계

- `superclaude install` 전 변경될 HOME과 project 설정 경로를 확인합니다.
- Claude Code user 설정 변경은 사용자 승인 없이 실행하지 않습니다.
- credential, account token, private data를 설정이나 작업 기록에 저장하지 않습니다.
- 생성된 command와 persona는 기존 project rule보다 우선하지 않습니다.
