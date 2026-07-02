# Agent Security Harness

보안 민감 변경이 근거 없이 넘어가지 않도록 점검합니다.

## 필수 기준

- `SECURITY.md`가 있어야 합니다.
- secret 값은 기록하지 않습니다.
- auth, permission, admin, token, credential 관련 변경에는 review evidence가 필요합니다.
- deploy, webhook, registry, MCP 변경에는 owner와 rollback 또는 mitigation이 필요합니다.
- 보안 예외는 담당자와 이유를 문서화합니다.

## 명령

```bash
node .opendock/harness/opendock__agent-security/check.mjs
```
