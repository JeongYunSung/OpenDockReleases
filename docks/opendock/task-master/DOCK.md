# Task Master

설치하면 Task Master AI의 `task-master`, `task-master-mcp`, `task-master-ai` 명령을 workspace-local로 사용할 수 있습니다. PRD와 요구사항을 실행 가능한 task로 나누고 순서를 관리할 때 사용합니다.

## 설치 후 준비되는 것

- Task Master AI CLI 명령
- root `AGENTS.md`의 planning 도구 routing과 안전 경계
- `.opendock/docks/task-master/README.md`와 task 작성 가이드
- 선택적으로 실행 결과를 기록할 `TASK_MASTER_RUN.md`

## 사용 방법

```sh
task-master --help
task-master list
task-master next
opendock doctor
```

`init`, `parse-prd`, `models --setup`처럼 project 파일이나 provider 설정을 바꾸는 명령은 예상 변경을 확인하고 사용자 승인 후 실행합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `task-master --version` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

Task Master가 만든 task는 자동 승인되지 않습니다. 범위, dependency, risk, acceptance criteria를 현재 project 구조와 대조한 뒤 확정합니다.
