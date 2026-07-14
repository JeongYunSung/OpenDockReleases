# 출시 전 체크리스트

이 체크리스트는 사용자가 `검수`, `ultrawork`, `release`를 명시했을 때 사용합니다. 일반 요청에서는 대상 Dock의 정적 checker까지만 실행합니다.

## 공통 증거

- deploy reference와 대상 Registry
- macOS와 Windows manifest 목록
- 정적 package checker 결과
- root 문서 금지와 namespaced README 확인
- 두 platform의 file mapping, tool/dependency, doctor parity 확인
- 보안 blocker와 warning
- 임시 workspace install, update, doctor, uninstall 결과
- path collision과 managed file 보존 결과
- 남은 위험과 검증하지 못한 항목

## 유형별 증거

Tool Dock:

- tool 설치 경로와 shim
- doctor 결과
- 설치된 실제 command 실행 결과
- tool manager와 필요한 runtime이 clean workspace에서 함께 준비되는지 확인
- update와 uninstall 뒤 tool 정리 결과

일반 Dock:

- custom harness, HARNESS, quality-gate가 없다는 확인
- AGENTS가 20개 이하의 핵심 규칙만 담는다는 확인
- domain guide를 사용한 대표 AI 요청과 결과
- template이 필수가 아니라 선택 사항이라는 안내

Ultrawork와 Dock Builder:

- namespaced HARNESS와 `check.mjs` 경로
- valid case 성공
- invalid case non-zero 실패
- 현재 산출물로 제한된 검사 범위
- 기계적으로 판정 가능한 조건과 AI가 판단할 의미 품질의 분리

## Handoff 형식

```text
Dock: opendock/name
Version: x.y.z
Platforms: macos, windows
Decision: ready | hold | blocked
Changed: 변경 요약
Checks:
- static:
- install:
- update:
- doctor:
- uninstall:
- real tool 또는 custom harness:
Security:
- blockers:
- warnings:
Residual risk:
- ...
```

설치 source가 없거나, 최신 manifest를 위반하거나, platform 계약이 다르거나, 보안 blocker가 남아 있으면 출시 준비가 끝났다고 말하지 않습니다. Tool Dock의 실제 명령, 일반 Dock의 대표 AI 작업, Ultrawork checker의 실패 사례 중 해당 증거를 확인하지 못했을 때도 그 사실을 남깁니다.
