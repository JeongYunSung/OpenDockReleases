# Agent Cost

이 dock은 AI agent 사용량과 비용 추정을 workspace별로 남기는 기준을 제공합니다.

## 핵심

- 어떤 agent와 model을 왜 썼는지 남깁니다.
- 비용이 큰 작업은 owner와 reason을 기록합니다.
- 실제 secret, invoice 원문, 결제 정보는 저장하지 않습니다.
- codeburn 같은 도구와 함께 쓸 수 있지만 글로벌 설치를 기본으로 하지 않습니다.

## 확인

```bash
node .opendock/harness/opendock__agent-cost/check.mjs
```
