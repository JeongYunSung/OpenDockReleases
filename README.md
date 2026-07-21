# OpenDock Dock 저장소

이 저장소는 OpenDock 카탈로그에 올라가는 dock들의 원본 작업 공간입니다.

Dock은 하는 일에 따라 네 종류로 나뉩니다.

- **Ultrawork Dock**: 디자인, 프론트엔드, 백엔드, QA처럼 결과물의 품질을 꼼꼼하게 확인합니다.
- **AI 기능 Dock**: 기억, 계획, 보안, 비용 추적처럼 여러 AI 도구가 함께 쓸 능력을 프로젝트에 더합니다.
- **준비된 작업 공간 Dock**: UX 감사, 제품 문서, 여행, 이사, 구매 비교처럼 반복되는 준비 과정을 바로 시작할 수 있게 합니다.
- **도구 Dock**: MCP나 외부 명령줄 도구를 이 프로젝트 안에 설치하고 `opendock doctor`로 상태를 확인합니다.

각 Dock은 꼭 필요한 구성만 담습니다. 도구 Dock은 설치와 상태 확인에 집중하고, AI 기능·준비된 작업 공간 Dock은 짧은 지침과 도메인 가이드로 바로 일합니다. 전용 검사 도구는 `*-ultrawork`와 `dock-builder`에만 둡니다. 전역 설치 대신 가능하면 `.opendock/` 아래에서 프로젝트별로 관리합니다.

## 평소에는 빠르게, 필요할 때는 꼼꼼하게

Dock을 설치했다고 해서 요청할 때마다 프로젝트 전체를 검사하지 않습니다.

- **평소 요청**: 이번에 만들거나 수정한 파일만 빠르게 확인합니다.
- **`검수` 요청**: AI가 도메인 가이드와 현재 산출물을 비교해 필요한 부분만 자세히 확인합니다.
- **`ultrawork` 요청**: 수정과 재검사를 반복해 실패 항목을 해결합니다.
- **`release` 요청**: 설치, 문서, 보안, 업데이트와 제거까지 출시 기준으로 확인합니다.

설치 안내와 품질 기준은 root를 어지럽히지 않도록 `.opendock/docks/<dock>/` 아래에 둡니다. root `AGENTS.md`에는 여러 Dock이 함께 사용할 수 있는 짧은 안내만 합쳐집니다.

Ultrawork의 **작업 기록**은 이번에 검사할 파일과 결과를 적은 `manifest`를, **정밀 검사 도구**는 그 범위의 객관적 조건만 확인하는 `harness`를 뜻합니다. 일반 Dock은 이런 파일을 강제하지 않으며 템플릿도 필요할 때만 사용합니다.

## OpenDock 실행 모델

현재 OpenDock은 “명령어를 그대로 실행하는 스크립트 러너”가 아니라, runtime, tool, bin, file, workdir을 분리해서 추적하는 workspace packaging layer입니다.

| 개념 | 예시 | 누가 관리? | 설치/기록 위치 |
|---|---|---|---|
| Host package manager | Homebrew, WinGet | `opendock bootstrap` | system |
| Runtime | Node, npm, Python, pip, Bun, Git | OpenDock | `~/.opendock/runtimes/<name>/<version>/` |
| Package manager | npm, pip, bun | Runtime에 포함 | `.opendock/bin/` shim으로 project에 노출 |
| Tool | codex, claude, oma, eslint | OpenDock `tools` | project `.opendock/tools/<dock>/<tool>/` |
| Bin | `codex`, `oma`, `node`, `npm` 실행 shim | OpenDock | project `.opendock/bin/` |
| Workdir | oma 같은 generator가 파일을 만드는 작업 폴더 | task `workdir` | project `.opendock/workdirs/<dock>/` 또는 root |
| Files / export | `AGENTS.md`, `.codex/**`, generated output | OpenDock file engine | project root, lock에 checksum/owner 기록 |

예를 들어 `opendock install opendock/oh-my-agent@0.1.0`은 대략 다음 순서로 진행됩니다.

1. Registry에서 승인된 dock release를 다운로드합니다.
2. 기존 설치 상태를 확인하고 `files`에 선언된 file candidate를 수집합니다. 이 시점에는 project root를 쓰지 않습니다.
3. private workdir을 준비하고 `requires.runtimes`의 runtime, `tools`의 project-local CLI와 command shim을 준비합니다.
4. top-level `install` step을 실행하고 `workdir: dock`의 `export` 결과를 수집합니다.
5. manifest file과 export 전체를 한 번에 preflight하여 충돌과 안전 조건을 확인합니다.
6. preflight가 모두 통과한 뒤에만 project root에 managed output을 적용합니다.
7. `dependencies`가 있으면 managed output 적용 후 dock-local dependency를 준비하고 무결성을 확인합니다.
8. `.opendock/dock.lock.yml`에 runtime, tool, dependency, bin, file, workdir 기록을 남깁니다.

따라서 dock manifest에는 global install command를 숨기지 않습니다. runtime은 `requires.runtimes`, project-local CLI는 `tools`, host package manager 준비는 `opendock bootstrap`, 파일 생성 작업은 `workdir`과 `export`로 표현합니다.

## 카탈로그

```text
docks/
  opendock/
    <dock-name>/
      DOCK.md
      logo.png
      dock.macos.yml
      dock.windows.yml
      files/
```

현재 카탈로그는 Tool 9개, 일반 작업공간 33개, Ultrawork 18개와 Dock Builder 1개로 구성됩니다. 실제 목록은 `docks/opendock/`가 기준이며, 새 Dock을 추가할 때 문서의 수동 목록을 갱신할 필요가 없습니다.

## 바로 쓰는 작업공간 dock

이 컬렉션은 반복되는 준비 과정을 짧은 agent 지침, 도메인 가이드와 선택적 템플릿으로 묶습니다. 별도 검사 스크립트나 run 기록을 강제하지 않으며, 사용자는 바로 요청해서 작업할 수 있습니다. 실제 결과물은 사용자가 소유하므로 dock을 업데이트하거나 제거해도 감사 보고서, 여행 계획, 생활 기록 같은 작업 결과는 남습니다.

### 업무와 제품

| Dock | 바로 할 수 있는 일 |
|------|--------------------|
| `opendock/ux-audit` | 화면 근거를 바탕으로 UX 문제, 심각도, 우선순위와 개선안을 정리합니다. |
| `opendock/website-genome` | 웹사이트의 색상, 타이포그래피, 간격, 컴포넌트, 반응형과 기술 근거를 분석합니다. |
| `opendock/design-system` | semantic token, component state, 접근성, 거버넌스와 도입 계획을 설계합니다. |
| `opendock/portfolio-case-study` | 역할과 근거를 과장하지 않는 포트폴리오 사례 연구를 작성합니다. |
| `opendock/product-roast` | 가치 제안, CTA, 정보 구조, 가격, 온보딩과 전환 방해 요소를 비평합니다. |
| `opendock/pm-workspace` | 아이디어와 회의 기록을 PRD, acceptance criteria, metric과 decision log로 바꿉니다. |
| `opendock/startup-validator` | 문제 가설, ICP, 위험 가정, 검증 실험과 go/pivot/stop 기준을 만듭니다. |
| `opendock/error-investigator` | 오류 재현, 가설, 검증, 최소 수정과 재발 방지를 추적합니다. |
| `opendock/readme-doctor` | 구현과 공식 근거에 맞춰 README의 빠른 시작, 예제와 누락 내용을 진단합니다. |
| `opendock/ai-project-starter` | AI 협업용 context, 규칙, workflow, 의사결정과 보안 구조를 `.ai/`에 준비합니다. |

### 여행과 생활

| Dock | 바로 할 수 있는 일 |
|------|--------------------|
| `opendock/trip-planner` | 일정, 이동, 예산, 예약, 우천 대안과 안전 계획을 함께 작성합니다. |
| `opendock/travel-research` | 지역, 교통, 날씨, 규정과 비용을 출처·기준일과 함께 조사합니다. |
| `opendock/group-trip` | 동행자의 선호, 제약, 갈등, 비용 배분과 합의 방식을 정리합니다. |
| `opendock/packing-assistant` | 날씨, 활동, 세탁과 수하물 조건에 맞춘 수량 기반 준비물을 만듭니다. |
| `opendock/travel-journal` | 사진과 메모를 동의·개인정보 경계를 지킨 여행 기록으로 구성합니다. |
| `opendock/moving` | 이사 일정, 업체, 서비스 이전, 주소 변경, 재고와 비상 계획을 관리합니다. |
| `opendock/home-setup` | 방별 치수, 보유 물품, 동선, 예산과 구매·설치 순서를 계획합니다. |
| `opendock/purchase-decision` | 요구사항, 후보, 총소유비용과 불확실성을 근거로 큰 구매를 비교합니다. |
| `opendock/life-admin` | 구독, 갱신, 보증, 문서 metadata와 반복 행정 업무를 관리합니다. |
| `opendock/finance-review` | 민감정보 없이 월별 현금 흐름, 예산 차이와 다음 달 조정안을 검토합니다. |
| `opendock/memory-book` | 사진과 메모를 출처, 동의, 가림 범위가 명확한 타임라인과 이야기로 정리합니다. |

## Agent Capability dock

이 라인은 “무엇을 설치했는가”보다 “이 workspace가 어떤 능력을 갖게 되는가”를 기준으로 설계합니다.

| Dock | 목적 | 기반 아이디어 |
|------|------|---------------|
| `opendock/agent-memory` | 코드, 문서, 의사결정, 구조 탐색 결과를 workspace-local 지식으로 남깁니다. | Graphify 같은 project knowledge graph 흐름 |
| `opendock/agent-planning` | 긴 작업의 계획, 발견 사항, 진행률을 파일 기반으로 유지합니다. | planning-with-files 같은 crash-proof planning 흐름 |
| `opendock/agent-security` | 보안 리뷰, threat model, secret/credential 주의, 변경 위험 기록을 표준화합니다. | curated cybersecurity skill pack 흐름 |
| `opendock/agent-cost` | agent 사용량, 모델, 작업 단위, 비용 추정을 workspace별로 추적합니다. | codeburn 같은 token/cost tracking 흐름 |

이 dock들은 기본적으로 시스템 전역 도구를 설치하지 않습니다. 필요한 실행 도구가 있을 때도 `brew install`, `npm install -g`, daemon 설치보다 `.opendock/tools/` 또는 프로젝트-local wrapper를 우선합니다.

`opendock/dock-builder`는 별도의 품질 Dock입니다. 일반 Dock에는 전용 하네스를 만들지 않고, `*-ultrawork`와 Dock Builder에만 현재 산출물 범위의 객관적 조건을 검사하는 도구를 허용합니다.

## Visual Library dock

외부 visual/effect 라이브러리는 단순 설치 명령보다 “어떤 컴포넌트와 prop을 어떻게 써야 하는지”가 더 중요합니다.

| Dock | 목적 | 기준 |
|------|------|------|
| `opendock/paper-shaders-ultrawork` | Paper Shaders의 image filter, logo animation, effect 29개를 정확한 React component/prop/range로 쓰게 합니다. | `shaders.paper.design` 상세 페이지와 `@paper-design/shaders-react` 예시 |
| `opendock/img2threejs` | 참고 이미지를 procedural Three.js 코드로 재구성하고 단계별 렌더링을 원본과 비교합니다. | `hoainho/img2threejs` 1.2.0 품질 게이트와 프로젝트 로컬 preview runtime |

## Research dock

리서치 dock은 외부 데이터를 직접 투자 판단으로 바꾸지 않습니다. 공식 출처, 기준일, 범위, 한계, 반대 시나리오를 강제해서 AI가 리서치 초안을 안전하게 만들도록 돕습니다.

| Dock | 목적 | 기준 |
|------|------|------|
| `opendock/korea-real-estate-research` | 한국 부동산 리서치에서 지역, 기간, 거래유형, 실거래가/전월세/지수 출처와 비추천 고지를 점검합니다. | 국토교통부 실거래가, 한국부동산원 R-ONE, ECOS, KOSIS |
| `opendock/korea-equity-research` | 한국 주식 리서치에서 종목, 기준일, KRX 데이터, OpenDART 공시, 리스크와 비추천 고지를 점검합니다. | KRX, OpenDART, KIND, 금융위원회 공공데이터, ECOS |
| `opendock/korea-macro-research` | 금리, 환율, 물가, 인구, 고용 같은 거시 지표를 기준일과 지표 정의 중심으로 점검합니다. | 한국은행 ECOS, KOSIS |

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
- Ready Workspace dock id는 사용자가 얻는 결과가 드러나는 짧은 이름을 사용합니다.
- 외부 visual/effect 라이브러리 품질 게이트는 `opendock/<library>-ultrawork` 형식으로 둡니다.
- 플랫폼별 파일은 `dock.macos.yml`, `dock.windows.yml`처럼 분리합니다.
- `DOCK.md`와 `logo.png`는 manifest와 같은 dock 폴더에 둡니다.
- 설치할 agent 파일, domain guide와 선택적 template을 `files/` 아래에 둡니다.
- 설명용 README, HARNESS, playbook은 root가 아니라 `.opendock/docks/<dock>/` 아래에 설치합니다.
- Tool Dock과 일반 Dock에는 custom harness, HARNESS, quality-gate workflow를 두지 않습니다.
- `*-ultrawork`와 `dock-builder`의 checker는 현재 지정한 산출물의 존재·형식·안전처럼 객관적으로 판정 가능한 조건만 확인합니다.
- 가능하면 커밋된 소스 기준으로만 배포합니다.
- 글로벌 설치를 기본값으로 만들지 않습니다. workspace-local 추적, update, uninstall이 가능한 구조를 먼저 검토합니다.
