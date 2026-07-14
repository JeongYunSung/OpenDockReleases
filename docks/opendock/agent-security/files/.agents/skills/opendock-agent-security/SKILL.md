---
name: opendock-agent-security
description: Auth, permission, secret, deploy, registry, MCP 등 보안 민감 변경을 분석하거나 현재 결과를 검토할 때 사용합니다.
---

# Agent Security

## 절차

1. `.opendock/docks/agent-security/SECURITY.md`를 읽고 요청한 보안 작업을 바로 수행합니다.
2. 현재 변경이 닿는 민감 영역과 신뢰 경계를 식별합니다.
3. 위협, 영향, 근거, owner, 완화책과 rollback 또는 disable 경로를 필요한 수준으로 기록합니다.
4. Secret 값은 redacted 또는 sample로만 표현합니다.
5. 정형화된 문서가 필요할 때만 `SECURITY_REVIEW.md`를 사용하고 관련 섹션만 남깁니다.
6. 사용자가 검토를 요청하면 현재 결과물만 도메인 가이드 기준으로 직접 검토합니다.

승인 없이 실제 공격, 권한 변경, 배포, 이전 또는 파괴적 작업을 실행하지 않습니다.
