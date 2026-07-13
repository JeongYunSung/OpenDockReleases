# OpenDock Dock 저장소

이 저장소는 OpenDock 카탈로그에 올라가는 dock들의 원본 작업 공간입니다.

현재 카탈로그는 세 갈래로 운영합니다.

- **Ultrawork dock**: 디자인, 프론트엔드, 백엔드, QA처럼 특정 업무 산출물의 품질을 강하게 점검합니다.
- **Agent Capability dock**: 특정 글로벌 CLI를 깔기보다, 현재 workspace 안에 AI 작업 능력을 추가합니다. 기억, 계획, 보안, 비용 추적처럼 여러 agent가 함께 쓰는 기반을 프로젝트별로 설치하고 추적합니다.
- **Ready Workspace dock**: UX 감사, 제품 문서, 여행, 이사, 구매 비교처럼 반복되는 준비 과정을 바로 시작할 수 있는 작업공간으로 설치합니다.

각 dock은 목적에 맞는 플레이북, 에이전트 가이드, workflow, run 템플릿과 실행 가능한 harness를 조합합니다. hook이나 별도 도구는 실제 사용성이 있을 때만 포함합니다. 글로벌 설치가 꼭 필요한 도구는 기본값으로 두지 않고, 가능하면 `.opendock/` 아래에서 workspace-local로 관리하는 방향을 우선합니다.

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

예를 들어 `opendock install opendock/oma@1.0.0`은 대략 다음 순서로 진행됩니다.

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
        agent-memory/
        agent-planning/
        agent-security/
        agent-cost/
        dock-builder/
        ux-audit/
        website-genome/
        design-system/
        portfolio-case-study/
        product-roast/
        pm-workspace/
        startup-validator/
        error-investigator/
        readme-doctor/
        ai-project-starter/
        trip-planner/
        travel-research/
        group-trip/
        packing-assistant/
        travel-journal/
        moving/
        home-setup/
        purchase-decision/
        life-admin/
        finance-review/
        memory-book/
        korea-real-estate-research/
        korea-equity-research/
        korea-macro-research/
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

## 바로 쓰는 작업공간 dock

이 컬렉션은 반복되는 준비 과정을 템플릿, agent 지침, workflow, run 기록과 결정적 harness로 묶습니다. 실제 결과물은 사용자가 소유하므로 dock을 업데이트하거나 제거해도 감사 보고서, 여행 계획, 생활 기록 같은 작업 결과는 남습니다.

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
| `opendock/dock-builder` | OpenDock dock 제작, 보안 검토, harness, install/update/uninstall 테스트를 표준화합니다. | 우리가 반복해온 dock 제작/검증/release gate 흐름 |

이 dock들은 기본적으로 시스템 전역 도구를 설치하지 않습니다. 필요한 실행 도구가 있을 때도 `brew install`, `npm install -g`, daemon 설치보다 `.opendock/tools/` 또는 프로젝트-local wrapper를 우선합니다.

## Visual Library dock

외부 visual/effect 라이브러리는 단순 설치 명령보다 “어떤 컴포넌트와 prop을 어떻게 써야 하는지”가 더 중요합니다.

| Dock | 목적 | 기준 |
|------|------|------|
| `opendock/paper-shaders-ultrawork` | Paper Shaders의 image filter, logo animation, effect 29개를 정확한 React component/prop/range로 쓰게 합니다. | `shaders.paper.design` 상세 페이지와 `@paper-design/shaders-react` 예시 |

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
- 설치할 agent 파일, workflow, template, harness와 선택적 command·hook은 `files/` 아래에 둡니다.
- 가능하면 커밋된 소스 기준으로만 배포합니다.
- 글로벌 설치를 기본값으로 만들지 않습니다. workspace-local 추적, update, uninstall이 가능한 구조를 먼저 검토합니다.
