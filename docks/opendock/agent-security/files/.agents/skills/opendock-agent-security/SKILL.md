---
name: opendock-agent-security
description: auth, permission, secret, deploy, registry, MCP 등 보안 민감 변경을 검토할 때 사용합니다.
---

# Agent Security

## 절차

1. `SECURITY.md`를 읽습니다.
2. 변경이 민감 영역에 닿는지 분류합니다.
3. evidence, risk, owner, rollback 또는 mitigation을 기록합니다.
4. secret 값은 redacted 또는 sample로만 표현합니다.
5. handoff 전에 `node .opendock/harness/opendock__agent-security/check.mjs`를 실행합니다.
