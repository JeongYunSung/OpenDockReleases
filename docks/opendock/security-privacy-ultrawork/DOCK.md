# Security Privacy Ultrawork

secret, PII, 권한, 인증 guard, dependency risk, prompt injection, 데이터 처리 흐름을 점검하는 보안/프라이버시 품질 게이트.

## 설치 후 제공되는 것

- `SECURITY_PRIVACY.md`: 이 dock의 작업 원칙과 검토 기준
- `README.md`: 프로젝트 안에서 바로 보는 사용 안내
- `HARNESS.md`: 최종 handoff 전 확인 목록
- `.opendock/templates/security-privacy/SECURITY_PRIVACY_RUN.md`: 작업 run 기록 템플릿
- `.opendock/harness/opendock__security-privacy-ultrawork/check.mjs`: 로컬 품질 검사
- `.agents/skills/opendock-security-privacy-ultrawork/SKILL.md`: Codex/OMA 계열 agent가 읽는 skill
- `.claude/commands/opendock-security-privacy-ultrawork/quality-gate.md`: Claude Code에서 호출할 수 있는 품질 게이트 문서

## 바로 쓰는 방법

1. `SECURITY_PRIVACY.md`를 먼저 읽습니다.
2. `.opendock/templates/security-privacy/SECURITY_PRIVACY_RUN.md`를 `.opendock/runs/security-privacy/<run-id>.md`로 복사합니다.
3. 목표, 범위, 근거, 결정, 남은 리스크를 기록합니다.
4. 작업 후 `node .opendock/harness/opendock__security-privacy-ultrawork/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 human-approved exception으로 남깁니다.

## 주요 기준

- 수집/저장/전송/삭제되는 데이터와 PII 여부를 inventory로 작성합니다.
- 인증이 필요한 endpoint, admin action, 데이터 export에는 guard가 있어야 합니다.
- secret, token, private key, `.env` 값은 산출물에 포함하지 않습니다.
- prompt injection, embedded instruction, tool abuse, data exfiltration 경로를 따로 봅니다.
- dependency와 외부 provider 사용에는 목적, 데이터 범위, 보존 기간, 대체 경로를 기록합니다.
- 발견 사항은 severity, impact, evidence, fix owner, due date로 정리합니다.

## 안전 경계

보안 검사는 발견 가능성을 높이는 절차이며, 침투테스트나 법적 컴플라이언스 보증으로 표현하지 않습니다.

이 dock은 판단을 자동으로 확정하지 않습니다. 사용자가 바로 실행 가능한 문서와 agent 지시, 그리고 handoff 전 품질 게이트를 제공합니다.
