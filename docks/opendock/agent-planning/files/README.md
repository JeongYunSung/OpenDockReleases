# Agent Planning

이 dock은 긴 AI 작업을 이어가기 쉬운 파일 기반 계획 구조로 정리합니다.

## 핵심

- `task_plan`, `findings`, `progress`를 분리합니다.
- context loss나 세션 재시작 후에도 이어서 볼 수 있습니다.
- 완료 주장에는 검증 근거를 요구합니다.
- 계획 파일은 `.opendock/plans/` 아래에 두어 OpenDock update와 충돌하지 않게 합니다.

## 확인

```bash
node .opendock/harness/opendock__agent-planning/check.mjs
```
