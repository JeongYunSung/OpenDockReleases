# Agent Security

이 dock은 AI agent가 보안 민감 변경을 할 때 필요한 최소 보안 기준과 리뷰 기록을 제공합니다.

## 핵심

- secret, token, credential 노출을 막습니다.
- auth, permission, admin, webhook, deploy 변경에 evidence를 요구합니다.
- 보안 리뷰를 workspace-local 문서로 남깁니다.
- 글로벌 scanner 설치가 아니라 프로젝트별 정책에 맞춘 리뷰 기준을 제공합니다.

## 확인

```bash
node .opendock/harness/opendock__agent-security/check.mjs
```
