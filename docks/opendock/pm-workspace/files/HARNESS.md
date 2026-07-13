# PM Workspace Harness

## 실행 모드

```bash
node .opendock/harness/opendock__pm-workspace/check.mjs
node .opendock/harness/opendock__pm-workspace/check.mjs .opendock/runs/pm-workspace/<run-id>/manifest.md
```

- 인자 없음: dock run directory 바로 아래 manifest의 status만 확인하고 active run 하나를 검증합니다. active run이 없으면 `Ready`, 둘 이상이면 실패합니다.
- 인자 있음: 상대 또는 절대 경로로 지정한 project 내부 manifest 하나만 검증합니다. discovery를 수행하지 않으며 status가 완료 상태여도 내용을 검증합니다.
- 어떤 모드에서도 저장소나 `product/` 전체를 재귀 탐색하지 않습니다.

## 검사 항목

- run의 source separation, acceptance criteria, metric, decision, validation, limitation evidence
- target의 Problem, Users, Goals, Non-goals, Success Metrics, Requirements, User Stories with Acceptance Criteria, Edge Cases, Risks, Dependencies, Release / Decision Log
- facts, assumptions, open questions의 분리
- metric의 baseline·target·measurement와 story의 Given/When/Then
- 안전한 `product/` 상대 경로, 허용 text 확장자, 크기, regular non-symlink file
- 미완성 표식, 실제 secret 형태, 능동적인 prompt injection·파괴 명령 지시, 근거 없는 결과 보장

위험 문자열을 분석 목적으로 fenced code, inline code, blockquote에 인용한 경우 능동 지시로 간주하지 않습니다. 실제 secret처럼 보이는 값은 인용 여부와 관계없이 차단합니다.

## Remediation

실패 출력의 `[rule-id]`와 파일을 확인하고 해당 evidence 또는 target만 수정합니다. 관련 없는 파일을 target에 추가해 검사를 우회하지 않습니다. 통과 결과는 deterministic 문서 검사이며 외부 모델의 동일 출력을 보장하지 않습니다.
Codex 정성 acceptance는 harness 결과와 분리해 별도로 기록합니다.
