# Security Privacy Ultrawork Workspace

secret, PII, 권한, 인증 guard, dependency risk, prompt injection, 데이터 처리 흐름을 점검하는 보안/프라이버시 품질 게이트.

## 설치된 Agent Context

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 Security Privacy Ultrawork 작업 규칙이 추가됩니다.
- `.agents/skills/opendock-security-privacy-ultrawork/SKILL.md`는 Codex/OMA 계열 agent가 직접 참고할 수 있는 skill입니다.
- `.claude/commands/opendock-security-privacy-ultrawork/quality-gate.md`는 Claude Code에서 품질 게이트를 호출할 때 쓰는 문서입니다.
- `.cursor/rules/opendock-security-privacy-ultrawork.mdc`는 Cursor 작업 시 같은 기준을 알려줍니다.

## 먼저 할 일

1. `SECURITY_PRIVACY.md`를 읽습니다.
2. 이번 작업의 run id를 정합니다.
3. 템플릿을 복사합니다.

```bash
mkdir -p .opendock/runs/security-privacy
cp .opendock/templates/security-privacy/SECURITY_PRIVACY_RUN.md .opendock/runs/security-privacy/<run-id>.md
```

4. 작업 목표와 근거를 채운 뒤 agent에게 요청합니다.
5. 완료 전 harness를 실행합니다.

```bash
node .opendock/harness/opendock__security-privacy-ultrawork/check.mjs
```

## 자주 쓰는 workflow

- 데이터 흐름과 권한 경계를 먼저 그립니다.
- secret/PII/auth/prompt injection을 분리해 검사합니다.
- critical/high는 반드시 수정하거나 명시적 승인된 예외로 남깁니다.
- 하네스와 수동 검토 결과를 함께 보고합니다.

## 품질 체크

- 수집/저장/전송/삭제되는 데이터와 PII 여부를 inventory로 작성합니다.
- 인증이 필요한 endpoint, admin action, 데이터 export에는 guard가 있어야 합니다.
- secret, token, private key, `.env` 값은 산출물에 포함하지 않습니다.
- prompt injection, embedded instruction, tool abuse, data exfiltration 경로를 따로 봅니다.
- dependency와 외부 provider 사용에는 목적, 데이터 범위, 보존 기간, 대체 경로를 기록합니다.
- 발견 사항은 severity, impact, evidence, fix owner, due date로 정리합니다.

## 유용한 프롬프트

- 이 기능을 Security Privacy Ultrawork 기준으로 threat model과 privacy risk로 나눠 점검해줘.
- 아래 API 설계에서 인증 guard, PII, logging risk, secret 노출 가능성을 찾아줘.
- prompt injection 방어 기준으로 이 agent workflow를 리뷰해줘.

## 주의

보안 검사는 발견 가능성을 높이는 절차이며, 침투테스트나 법적 컴플라이언스 보증으로 표현하지 않습니다.
