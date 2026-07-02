# Code Review Agent

PR-Agent 기반 코드 리뷰 기준, evidence, severity, 수정 확인 루프를 workspace-local로 준비하는 dock.

## 설치 후 생기는 것

- `CODE_REVIEW.md`: 이 dock의 작업 기준과 안전 경계
- `HARNESS.md`: handoff 전 품질 체크리스트
- `.opendock/templates/code-review-agent/CODE_REVIEW_RUN.md`: run 기록 템플릿
- `.opendock/harness/opendock__code-review-agent/check.mjs`: dock별 범위만 검사하는 harness
- `.agents/skills/opendock-code-review-agent/SKILL.md`: agent가 이 dock을 사용할 때 읽는 skill
- `.agents/workflows/opendock-code-review-agent/quality-gate.md`: handoff 전 검증 흐름

## 활용 방식

AI 코드 리뷰를 severity, evidence, reproduction, fix verification 기준으로 정리합니다.

`pr-agent` CLI가 project-local tool로 설치됩니다. 원격 PR 연동 token은 자동 생성하거나 저장하지 않습니다.

## 권장 흐름

1. `CODE_REVIEW.md`를 읽고 이번 작업의 범위를 정합니다.
2. `.opendock/templates/code-review-agent/CODE_REVIEW_RUN.md`를 `.opendock/runs/code-review-agent/<run-id>.md`로 복사합니다.
3. run 문서에 scope, evidence, result를 기록합니다.
4. 작업 결과를 만들거나 검토합니다.
5. `node .opendock/harness/opendock__code-review-agent/check.mjs`를 실행합니다.
6. 실패 항목을 수정한 뒤 handoff합니다.

## Harness 범위

Harness는 이 dock의 run 문서와 핵심 기준 파일만 검사합니다. 기존 프로젝트 전체를 훑어서 unrelated file을 막지 않습니다.

## 알려진 한계

- provider API key, login token, remote service credential은 자동 생성하거나 저장하지 않습니다.
- 외부 서비스로 데이터를 보내야 하는 작업은 human approval 후 진행합니다.
- tool 자체의 상세 설정은 각 upstream 프로젝트 정책을 따릅니다.
