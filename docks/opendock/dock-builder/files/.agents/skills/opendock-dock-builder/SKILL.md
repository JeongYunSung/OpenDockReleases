---
name: opendock-dock-builder
description: OpenDock Dock을 만들거나 고치고, manifest·설치 문서·도구·Dock 유형별 custom harness 정책을 확인할 때 사용합니다. 일반 수정은 대상만 빠르게 검사하고, 검수·ultrawork·release 요청에서는 install/update/doctor/uninstall과 실제 동작까지 확인합니다.
---

# OpenDock Dock Builder

## 목적

Dock을 설치 가능하고 업데이트와 제거가 가능하며 Registry에서 이해하기 쉬운 패키지로 만듭니다. 평소에는 현재 작업 범위만 빠르게 확인하고, 출시 전에는 실패 상황과 실제 동작까지 꼼꼼하게 확인합니다.

## 작업 원칙

- 실제 사용자 프로젝트와 분리된 임시 workspace에서 검증합니다.
- host가 `.agents/`를 SSOT로 관리하면 직접 수정하지 않습니다.
- 일반 요청에서는 대상 Dock에 정적 checker만 실행합니다.
- 사용자가 `검수`, `ultrawork`, `release`를 명시한 경우에만 정밀 harness와 전체 동작 검증을 실행합니다.
- 승인 없이 deploy, registry 상태 변경, commit, push를 하지 않습니다.

## 제작 흐름

1. **목적과 유형을 정합니다.**
   - 설치 후 사용자가 바로 할 수 있는 일을 한 문장으로 정리합니다.
   - top-level `tools`가 있으면 Tool Dock, 이름이 `-ultrawork`로 끝나거나 `dock-builder`이면 품질 Dock, 나머지는 일반 Dock으로 구분합니다.

2. **문서 위치를 정합니다.**
   - `DOCK.md`는 Registry 카탈로그용 한국어 설명으로 작성합니다.
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
   - custom checker는 일반 요청에서 자동 실행하지 않습니다. 검수와 ultrawork는 지정한 작업만, release는 명시적 전체 모드만 검사하고 실패 시 non-zero로 끝나야 합니다.

5. **요청 깊이에 맞춰 검증합니다.**
   - 일반 작업: `scripts/check_dock_package.py <dock-folder>`로 대상만 확인합니다.
   - 검수·ultrawork·release: `references/test-matrix.md`와 `references/release-checklist.md`를 따라 임시 workspace에서 install, update, doctor, uninstall, 충돌, 플랫폼을 확인합니다.
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

checker는 최신 manifest를 보존하면서 root 문서 금지, namespaced README, 도구 관리자에 필요한 runtime, Dock 유형별 harness 허용 여부, root AGENTS 규칙 수, macOS/Windows 일치 여부를 함께 확인합니다. 일반 Dock의 custom harness 잔재와 품질 Dock의 누락된 objective checker도 오류로 처리합니다.
