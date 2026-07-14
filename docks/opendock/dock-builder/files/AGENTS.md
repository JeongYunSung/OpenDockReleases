# OpenDock Dock Builder

1. Dock 작업에는 `.agents/skills/opendock-dock-builder/SKILL.md`를 사용합니다.
2. 일반 요청에서는 현재 대상 Dock만 정적 checker로 빠르게 확인합니다.
3. 사용자가 `검수`, `ultrawork`, `release`를 명시한 경우에만 정밀 harness를 실행합니다.
4. `DOCK.md`는 Registry 카탈로그용 자연스러운 한국어 설명으로 작성합니다.
5. root `AGENTS.md`는 routing과 safety 규칙 20개 이하로 유지합니다.
6. root `README.md`, `HARNESS.md`, `*PLAYBOOK*.md`는 생성하거나 설치하지 않습니다.
7. 사용자 문서는 `.opendock/docks/<dock-name>/`에 설치합니다.
8. Tool Dock에는 custom harness, HARNESS, quality-gate workflow를 추가하지 않습니다.
9. Tool Dock은 install, update, doctor와 설치된 실제 명령을 확인합니다.
10. custom harness가 필요한 비-tool Dock은 정해진 Dock별 문서와 script 경로를 함께 사용합니다.
11. macOS와 Windows manifest의 설치 계약을 같은 상태로 유지합니다.
12. 검증되지 않은 task command는 사용자의 실제 프로젝트에서 실행하지 않습니다.
13. 임시 workspace 밖의 관련 없는 파일을 삭제하거나 되돌리지 않습니다.
14. 명시적인 승인 없이 deploy, approve, reject, revoke, commit, push를 하지 않습니다.
15. credential, secret, private key를 manifest, 문서, 검수 기록에 남기지 않습니다.
16. 실패 항목을 수정하거나 남은 위험을 밝히기 전에는 완료라고 말하지 않습니다.
