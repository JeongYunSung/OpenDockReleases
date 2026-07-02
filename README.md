# OpenDock Dock 저장소

이 저장소는 OpenDock 카탈로그에 올라가는 dock들의 원본 작업 공간입니다.

현재 카탈로그는 두 갈래로 운영합니다.

- **Ultrawork dock**: 디자인, 프론트엔드, 백엔드, QA처럼 특정 업무 산출물의 품질을 강하게 점검합니다.
- **Agent Capability dock**: 특정 글로벌 CLI를 깔기보다, 현재 workspace 안에 AI 작업 능력을 추가합니다. 기억, 계획, 보안, 비용 추적처럼 여러 agent가 함께 쓰는 기반을 프로젝트별로 설치하고 추적합니다.

각 dock은 작은 체크리스트, 에이전트 가이드, workflow 어댑터, hook 메타데이터, 실행 가능한 harness를 설치합니다. 글로벌 설치가 꼭 필요한 도구는 기본값으로 두지 않고, 가능하면 `.opendock/` 아래에서 workspace-local로 관리하는 방향을 우선합니다.

## 카탈로그

```text
docks/
  opendock/
        agent-memory/
        agent-planning/
        agent-security/
        agent-cost/
        design-ultrawork/
        paper-shaders-ultrawork/
        creative-gen-ultrawork/
        frontend-ultrawork/
        backend-ultrawork/
        kotlin-spring-ultrawork/
        data-ultrawork/
        devops-ultrawork/
        docs-ultrawork/
        ux-writing-ultrawork/
        business-ultrawork/
        mobile-ultrawork/
        qa-ultrawork/
```

## Agent Capability dock

이 라인은 “무엇을 설치했는가”보다 “이 workspace가 어떤 능력을 갖게 되는가”를 기준으로 설계합니다.

| Dock | 목적 | 기반 아이디어 |
|------|------|---------------|
| `opendock/agent-memory` | 코드, 문서, 의사결정, 구조 탐색 결과를 workspace-local 지식으로 남깁니다. | Graphify 같은 project knowledge graph 흐름 |
| `opendock/agent-planning` | 긴 작업의 계획, 발견 사항, 진행률을 파일 기반으로 유지합니다. | planning-with-files 같은 crash-proof planning 흐름 |
| `opendock/agent-security` | 보안 리뷰, threat model, secret/credential 주의, 변경 위험 기록을 표준화합니다. | curated cybersecurity skill pack 흐름 |
| `opendock/agent-cost` | agent 사용량, 모델, 작업 단위, 비용 추정을 workspace별로 추적합니다. | codeburn 같은 token/cost tracking 흐름 |

이 dock들은 기본적으로 시스템 전역 도구를 설치하지 않습니다. 필요한 실행 도구가 있을 때도 `brew install`, `npm install -g`, daemon 설치보다 `.opendock/tools/` 또는 프로젝트-local wrapper를 우선합니다.

## Visual Library dock

외부 visual/effect 라이브러리는 단순 설치 명령보다 “어떤 컴포넌트와 prop을 어떻게 써야 하는지”가 더 중요합니다.

| Dock | 목적 | 기준 |
|------|------|------|
| `opendock/paper-shaders-ultrawork` | Paper Shaders의 image filter, logo animation, effect 29개를 정확한 React component/prop/range로 쓰게 합니다. | `shaders.paper.design` 상세 페이지와 `@paper-design/shaders-react` 예시 |

## 배포

배포할 때는 정확한 버전과 플랫폼별 manifest를 지정합니다.

```bash
opendock deploy opendock/design-ultrawork@1.0.0 --platform macos --file docks/opendock/design-ultrawork/dock.macos.yml
opendock deploy opendock/design-ultrawork@1.0.0 --platform windows --file docks/opendock/design-ultrawork/dock.windows.yml
```

릴리스 버전은 `dock.*.yml` 안에 넣지 않습니다. 버전은 `opendock deploy` 명령에서만 관리합니다.

## 리뷰 규칙

- 품질 게이트 dock id는 `opendock/<domain>-ultrawork` 형식을 유지합니다.
- Agent capability dock id는 `opendock/agent-<capability>` 형식을 유지합니다.
- 외부 visual/effect 라이브러리 품질 게이트는 `opendock/<library>-ultrawork` 형식으로 둡니다.
- 플랫폼별 파일은 `dock.macos.yml`, `dock.windows.yml`처럼 분리합니다.
- `DOCK.md`와 `logo.png`는 manifest와 같은 dock 폴더에 둡니다.
- 설치될 agent 파일, workflow, command, hook, harness 파일은 `files/` 아래에 둡니다.
- 가능하면 커밋된 소스 기준으로만 배포합니다.
- 글로벌 설치를 기본값으로 만들지 않습니다. workspace-local 추적, update, uninstall이 가능한 구조를 먼저 검토합니다.
