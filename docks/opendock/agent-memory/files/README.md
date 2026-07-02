# Agent Memory

이 dock은 프로젝트마다 AI가 다시 사용할 수 있는 기억 레이어를 준비합니다.

## 핵심

- 프로젝트 구조와 의사결정을 workspace 안에 남깁니다.
- 여러 agent가 같은 기준을 공유하도록 `MEMORY.md`를 둡니다.
- Graphify 같은 지식 그래프 도구와 함께 쓸 수 있지만, 글로벌 설치를 기본으로 하지 않습니다.
- secret과 private prompt는 저장하지 않습니다.

## 확인

```bash
node .opendock/harness/opendock__agent-memory/check.mjs
```
