---
name: opendock-dock-builder
description: OpenDock Dock을 만들거나 고치고, 사용자가 이해할 카탈로그 설명부터 manifest·도구·검수 정책·실제 설치까지 확인할 때 사용합니다. 평소에는 대상만 빠르게 보고, 검수나 ultrawork 요청에서는 현재 결과를 강하게 검증합니다.
---

# OpenDock Dock Builder

## 목적

Dock을 설치·업데이트·제거할 수 있을 뿐 아니라, 비개발자도 Registry 설명만 보고 무엇을 얻고 AI에게 어떻게 요청할지 이해하는 패키지로 만듭니다. 평소에는 현재 작업 범위만 빠르게 확인하고, 사용자가 검수 강도를 높였을 때만 실패 상황과 실제 동작을 꼼꼼하게 확인합니다.

## 작업 원칙

- 실제 사용자 프로젝트와 분리된 임시 workspace에서 검증합니다.
- host가 `.agents/`를 SSOT로 관리하면 직접 수정하지 않습니다.
- 일반 요청에서는 대상 Dock에 정적 checker만 실행합니다.
- 사용자가 `검수` 또는 `ultrawork`를 명시한 경우 현재 Dock과 현재 결과에 정밀 harness와 실제 동작 검증을 실행합니다.
- 프로젝트 전체나 배포 범위 검사는 사용자가 전체 범위를 명확히 요청한 경우에만 실행합니다.
- 승인 없이 deploy, registry 상태 변경, commit, push를 하지 않습니다.

## 제작 흐름

1. **목적과 유형을 정합니다.**
   - 설치 후 사용자가 바로 할 수 있는 일을 한 문장으로 정리합니다.
   - top-level `tools`가 있으면 Tool Dock, 이름이 `-ultrawork`로 끝나거나 `dock-builder`이면 품질 Dock, 나머지는 일반 Dock으로 구분합니다.

2. **문서 위치를 정합니다.**
   - `DOCK.md`는 Registry에서 처음 보는 사용자를 위한 자연스러운 한국어 설명입니다. 내부 경로 목록이나 구현 구조를 먼저 설명하지 않습니다.
   - 모든 `DOCK.md`에는 `이런 때 사용하세요`, `AI에서 이렇게 사용하세요`, 정확한 `$opendock-<dock-name>` 스킬명, 구체적인 요청 예시 2개 이상, `사용 후 얻는 것`을 둡니다.
   - Tool Dock은 `설치되는 도구`와 실제 command를, 일반 Dock은 가벼운 결과 검토 방식을, Ultrawork와 Dock Builder는 `검수` 또는 `ultrawork` 요청에서 현재 결과물에 강한 하네스를 적용한다는 차이를 설명합니다.
   - `설치 후 안내와 기준 문서는 ...` 같은 경로 나열, `출시 전 검수` 같은 내부 운영 문구, manifest 구조를 사용자 가치보다 앞세우는 설명은 금지합니다.
   - root `AGENTS.md`는 routing과 safety만 담고 규칙을 20개 이하로 제한합니다.
   - root `README.md`, root `HARNESS.md`, root `*PLAYBOOK*.md`는 만들거나 설치하지 않습니다.
   - 사용자가 읽을 README와 필요한 playbook·domain guide는 `.opendock/docks/<dock-name>/`에 설치합니다.

3. **최신 manifest를 작성합니다.**
   - `DOCK.md`, `logo.png`, `dock.macos.yml`, `dock.windows.yml`, `files/`를 기본으로 둡니다.
   - `id`, `version`, `lifecycle`, manifest `uninstall`, `requires.packages`, `requires.tools`, top-level `commands`, tool `bin`, `files[].update`를 쓰지 않습니다.
   - runtime은 `requires.runtimes`, project-local CLI는 `tools`, 복사된 폴더의 dependency는 `dependencies`로 선언합니다.
   - `tools.manager`가 실제로 실행할 package manager도 runtime에 선언합니다. npm은 node와 npm, bun은 bun, pip는 python, uv는 python과 uv가 필요합니다.
   - task command와 `permissions`에는 shell operator와 package-manager mutation을 넣지 않습니다.
   - macOS와 Windows의 catalog metadata, file mapping, tool/dependency 이름, doctor id를 맞춥니다.

4. **유형에 맞게 확인합니다.**
   - Tool Dock에는 custom harness, HARNESS, quality-gate workflow를 추가하지 않습니다.
   - Tool Dock은 install, update, doctor를 확인하고 설치된 명령을 대표 입력으로 실제 실행합니다.
   - AI 기능과 준비된 작업 공간 같은 일반 Dock에는 custom harness, HARNESS, quality-gate workflow를 추가하지 않습니다. 짧은 AGENTS, 실제 도메인 가이드, 필요한 skill과 선택적 template만 제공합니다.
   - 일반 Dock의 검수 요청은 AI가 현재 산출물을 도메인 가이드와 직접 비교합니다. 검사 script나 run manifest를 강제하지 않습니다.
   - `*-ultrawork`와 `dock-builder`는 `.opendock/docks/<dock-name>/HARNESS.md`와 `.opendock/harness/<dock-name>/check.mjs`를 함께 설치합니다.
   - custom checker는 명시한 대상만 검사합니다. 의미 품질을 regex 점수로 흉내 내지 않고 파일 존재, 안전한 경로, 기계 판정 가능한 형식과 보안 조건만 확인합니다.
   - custom checker는 일반 요청에서 자동 실행하지 않습니다. 검수와 ultrawork는 지정한 현재 결과만 검사하고, 전체 범위는 사용자가 명확히 요청한 경우에만 검사하며 실패 시 non-zero로 끝나야 합니다.

5. **요청 깊이에 맞춰 검증합니다.**
   - 일반 작업: `scripts/check_dock_package.py <dock-folder>`로 대상만 확인합니다.
   - 검수·ultrawork: `references/test-matrix.md`와 `references/release-checklist.md`를 따라 임시 workspace에서 현재 Dock의 install, update, doctor, uninstall, 충돌, 플랫폼과 대표 AI 요청을 확인합니다.
   - 전체 배포 검증은 사용자가 전체 범위를 명확히 요청했을 때만 넓힙니다.
   - 보안 검수는 `references/security-review.md`의 blocker를 먼저 확인합니다.

## 참고 자료

- `references/dock-quality-gates.md`
- `references/security-review.md`
- `references/test-matrix.md`
- `references/release-checklist.md`

## Checker

```bash
python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py <dock-folder>
```

checker는 최신 manifest를 보존하면서 root 문서 금지, namespaced README, 도구 관리자에 필요한 runtime, Dock 유형별 harness 허용 여부, root AGENTS 규칙 수, macOS/Windows 일치 여부를 함께 확인합니다. 카탈로그 설명이 사용자 상황·정확한 스킬명·요청 예시·기대 결과를 제공하는지, Tool과 Ultrawork의 사용 방식이 올바르게 설명됐는지도 검사합니다.
