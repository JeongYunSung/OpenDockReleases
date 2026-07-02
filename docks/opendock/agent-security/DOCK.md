# Agent Security

AI agent가 변경한 내용에 대해 secret, credential, auth, permission, threat model, rollback risk를 놓치지 않도록 workspace-local 보안 기준을 설치합니다.

## 설치되는 것

- `SECURITY.md`: agent 작업용 보안 기준
- `HARNESS.md`: 보안 리뷰 체크리스트
- `.opendock/templates/agent-security/SECURITY_REVIEW.md`: 보안 리뷰 템플릿
- `.agents/skills/opendock-agent-security/SKILL.md`: 보안 리뷰 skill
- `.opendock/harness/opendock__agent-security/check.mjs`: 보안 harness

## 사용 시점

- auth, permission, token, secret, admin 기능을 수정할 때
- 외부 API, webhook, MCP, registry, deploy 경로를 건드릴 때
- agent가 만든 코드에 민감한 데이터 흐름이 포함될 때
- 릴리스 전에 보안 공백을 간단히 점검할 때

## 원칙

- 보안 skill pack은 검수된 소수 기준만 가져옵니다.
- secret 값 자체를 문서에 남기지 않습니다.
- 보안상 민감한 변경에는 evidence, owner, rollback 또는 mitigation이 필요합니다.
- 이 dock은 보안 도구를 글로벌 설치하지 않습니다. 필요한 scanner는 프로젝트별 정책에 맞춰 별도로 연결합니다.
