# Interactive UI Ultrawork

화면 인터랙션을 설계하고 구현한 뒤 입력 방식, 상태, 모션, 정리(cleanup), 반응형 위험을 현재 작업 범위에서 검증하는 독립 품질 게이트입니다.

## 설치 내용

- `README.md`, `AGENTS.md`, `HARNESS.md`, `INTERACTION_PLAYBOOK.md`
- `.agents/skills/opendock-interactive-ui-ultrawork/SKILL.md`
- `.agents/workflows/opendock-interactive-ui-ultrawork/quality-gate.md`
- `.opendock/templates/interactive-ui/INTERACTION_RUN.md`
- `.opendock/harness/opendock__interactive-ui-ultrawork/check.mjs`와 플랫폼 wrapper

사용자가 만드는 component, page, stylesheet, test, story 파일은 manifest `files`에 포함하지 않습니다. OpenDock은 dock 자체의 문서와 검사 도구만 소유합니다.

## 사용 방법

1. `.opendock/templates/interactive-ui/INTERACTION_RUN.md`를 `.opendock/runs/interactive-ui/<run-id>/manifest.md`로 복사합니다.
2. `Status: active`로 바꾸고 현재 작업에서 생성하거나 수정한 UI 파일만 `Target Files`에 기록합니다.
3. `INTERACTION_PLAYBOOK.md`에 따라 구현 계층과 상태 모델을 결정하고 top-level completion/recovery/focus contract와 evidence를 채웁니다.
4. 아래 명령을 실행합니다.

```bash
node .opendock/harness/opendock__interactive-ui-ultrawork/check.mjs
```

active run이 없으면 harness는 설치 준비 상태로 통과합니다. active run이 있으면 해당 run manifest와 거기에 명시된 target 파일만 검사하며 repository 전체를 재귀 탐색하지 않습니다.

## 구현 정책

- 단순 상태 전환과 micro-interaction은 CSS를 우선합니다.
- imperative sequence 또는 cancel 가능한 element animation은 WAAPI를 우선합니다.
- React의 복합 mount/unmount, layout, gesture 상태에는 프로젝트에 이미 있는 Motion을 명시적으로 선택할 수 있습니다.
- 특수 timeline 또는 SVG choreography는 필요성과 대안을 run manifest에 기록한 경우에만 선택합니다.
- dock은 Motion, GSAP, anime.js 등 어떤 라이브러리도 자동 설치하지 않습니다.

## 검사 범위

- keyboard, touch/pointer, focus parity와 hover-only behavior
- reduced motion과 loading, error, disabled 상태
- target 파일별 timer, animation frame, event listener cleanup
- `transition-all`과 horizontal overflow 위험
- interaction state matrix와 validation evidence의 완결성
- Motion 또는 특수 timeline/SVG 선택 근거와 자동 설치 금지

## 한계

정적 검사는 실제 브라우저의 focus order, screen reader announcement, device별 gesture, animation frame 안정성을 완전히 증명하지 못합니다. run manifest의 수동·자동 validation evidence와 함께 사용해야 합니다.
