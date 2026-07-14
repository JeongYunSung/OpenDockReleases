# Task Master

`task-master`를 사용해 PRD와 요구사항을 실행 가능한 task graph로 나눕니다.

## 빠른 확인

```sh
task-master --version
task-master --help
task-master list
task-master next
opendock doctor
```

`task-master init -y`, `task-master parse-prd`, `models --setup`은 project 파일이나 provider 설정을 바꿀 수 있으므로 사용자 승인 후 실행합니다.

상세 원칙은 `TASK_MASTER.md`, 선택적 실행 기록 양식은 `TASK_MASTER_RUN.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 실제 `task-master` 명령으로 진행합니다.
