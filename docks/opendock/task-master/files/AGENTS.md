# Task Master 도구 라우팅

- PRD 분해와 task graph 관리에는 `task-master`를 사용합니다.
- 명령 예시와 task 기준은 `.opendock/docks/task-master/README.md`를 확인합니다.
- 설치 상태는 `opendock doctor`로 확인합니다.

## 안전 경계

- `init`, `parse-prd`, `models --setup` 전 변경될 파일과 설정을 확인합니다.
- project mutation과 provider 설정 변경은 사용자 승인 없이 실행하지 않습니다.
- API key, credential, private PRD를 작업 기록에 저장하지 않습니다.
- 생성된 task는 범위, dependency, risk, acceptance criteria를 검토한 뒤 사용합니다.
