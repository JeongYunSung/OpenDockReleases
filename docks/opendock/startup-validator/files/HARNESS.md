# Startup Validator Harness

## 실행 모드

```bash
node .opendock/harness/opendock__startup-validator/check.mjs
node .opendock/harness/opendock__startup-validator/check.mjs .opendock/runs/startup-validator/<run-id>/manifest.md
```

- 인자 없음: dock run directory 바로 아래 manifest status를 확인하고 active run 하나만 검증합니다. active가 없으면 `Ready`, 둘 이상이면 실패합니다.
- 인자 있음: 상대 또는 절대 경로로 지정한 project 내부 manifest만 검증하고 discovery는 수행하지 않습니다.
- 저장소, `validation/`, 과거 output을 재귀 탐색하지 않습니다.

## 검사 항목

- run의 facts, assumptions, recommendations, source URL·access date, threshold, decision, validation, limitation evidence
- target의 Problem Hypothesis, ICP, Current Alternatives, Risky Assumptions, Evidence / Sources, Validation Method, Interview Questions, Pass / Fail Thresholds, MVP Scope·Non-goals, Pricing Hypothesis, Next Decision
- facts, assumptions, recommendations의 구분
- 최소 세 개의 interview question과 구체적인 pass/fail threshold
- `validation/` 내부 안전한 relative text file, 크기 제한, regular non-symlink file
- 미완성 표식, actual secret 형태, 능동 prompt injection·파괴 명령, 출처 없는 market-size 수치와 결과 보장

분석 목적으로 fenced code, inline code, blockquote에 인용한 위험 문자열은 능동 명령으로 판정하지 않습니다. 실제 secret처럼 보이는 값은 인용 여부와 무관하게 실패합니다.

## Remediation

실패 rule과 파일을 확인해 해당 evidence나 target만 고칩니다. 불확실한 주장은 assumption으로 이동하고 source URL과 access date를 보강합니다. Harness 통과는 deterministic 문서 검사이며 외부 모델의 동일 응답을 보장하지 않습니다.
Codex 정성 acceptance는 harness 결과와 분리해 별도로 기록합니다.
