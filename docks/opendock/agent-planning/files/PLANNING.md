# PLANNING.md

이 파일은 workspace에서 AI 작업 계획을 만들고 유지하는 기준입니다.

## 기본 구조

- Goal: 무엇을 완료할 것인가
- Scope: 이번 작업에 포함되는 것과 제외되는 것
- Steps: 순서가 있는 작은 실행 단위
- Evidence: 완료를 증명할 테스트, 리뷰, 로그, 산출물
- Risks: 실패 가능성과 대응
- Handoff: 다음 agent 또는 사용자가 이어받을 내용

## 상태 값

- `todo`: 아직 시작하지 않음
- `in_progress`: 작업 중
- `blocked`: 외부 입력 없이는 진행 불가
- `needs_review`: 검토 필요
- `done`: 검증 근거가 있는 완료

`done`은 근거 없이 사용하지 않습니다.
