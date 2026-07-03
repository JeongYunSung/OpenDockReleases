---
name: opendock-dock-builder
description: OpenDock dock을 만들고, 리팩터링하고, 보안 검토와 install/update/uninstall 테스트까지 출시 가능한 수준으로 검증할 때 사용합니다. 새 dock 제작, 기존 examples 개선, platform별 manifest 추가, files/export/task/harness/dependencies 설계, registry deploy 준비, dock 보안 점검 요청에 사용합니다.
---

# OpenDock Dock Builder

## 목적

OpenDock dock을 설치 가능하고, 업데이트 가능하고, 제거 가능하고, 리뷰 가능한 패키지로 만듭니다. dock은 단순 스크립트 묶음이 아니라 versioned workspace capability로 취급합니다.

## 운영 규칙

- dock 작업은 사용자의 실제 프로젝트와 분리된 임시 workspace에서 테스트합니다.
- host repository가 `.agents/`를 SSOT로 관리한다고 말하면 직접 수정하지 않습니다.
- 검증되지 않은 task command를 실제 프로젝트에서 실행하지 않습니다.
- 사용자가 명시적으로 요청하지 않으면 deploy, approve, reject, revoke, commit, push를 하지 않습니다.
- 글로벌 설치보다 `.opendock/` 아래 workspace-local artifact를 우선합니다.
- 주변 OpenDock repo가 한국어 문서를 쓰면 사용자-facing 문서도 한국어로 작성합니다.

## 작업 흐름

1. **Scope 정의**
   - 설치 후 workspace가 즉시 할 수 있는 일을 정의합니다.
   - Ultrawork 품질 게이트, agent capability, visual/effect catalog, generator, writing aid, third-party adapter 중 성격을 정합니다.
   - platform 분기를 먼저 정합니다. 복잡한 조건문보다 `dock.macos.yml`, `dock.windows.yml` 분리를 우선합니다.

2. **패키지 설계**
   - `DOCK.md`, `logo.png`, platform별 manifest, `files/` payload를 둡니다.
   - catalog 발견을 위해 `tags`를 작성합니다.
   - `dock.yml`에는 `id`와 release `version`을 넣지 않습니다. deploy/install reference가 identity와 version을 결정합니다.
   - task는 top-level `install`, `update`, `doctor`만 사용합니다. `lifecycle`과 manifest `uninstall`은 쓰지 않습니다.
   - runtime은 `requires.runtimes`, project-local CLI는 top-level `tools`, 복사된 폴더 안의 package dependency는 top-level `dependencies`에 선언합니다. `requires.packages`, `requires.tools`, `bin`은 쓰지 않습니다.
   - runtime은 home `~/.opendock/runtimes/`에 version별로 준비되고, project에는 `.opendock/bin/` shim으로 노출됩니다.
   - tool은 project `.opendock/tools/<dock>/<tool>/`에 설치되고, declared command는 `.opendock/bin/` shim으로 노출됩니다.
   - dependency는 dock이 `files`로 복사한 folder 안에서 설치됩니다. 예: `.codex/skills/image2html`에 `package.json`이 있으면 `dependencies.image2html.path`를 그 folder로 지정합니다.
   - dependency는 command를 노출하지 않습니다. 실행할 CLI가 필요하면 `tools`, payload folder 내부 dependency가 필요하면 `dependencies`를 사용합니다.
   - dependency manager는 현재 `npm`, `pnpm`, `bun`, `uv`, `pip`, `pip3`를 사용합니다. `npm`은 `ci`/`install`, `pnpm`/`bun`은 `install`, `uv`는 `sync`, `pip`/`pip3`는 `requirements.txt` 기반 `install`입니다.
   - dependency path는 project-relative여야 하며 `.opendock`, `.git`, `.ssh`, `.env*`, symlink path를 대상으로 하지 않습니다.
   - generator 작업은 `workdir: dock`과 `.opendock/workdirs/<dock>/`를 우선하고, project root에는 `export.include/exclude`로 필요한 파일만 반영합니다.
   - task command는 OpenDock policy를 통과해야 합니다. non-default command는 `tools.commands`에 선언하고 정확한 shape만 `permissions`에 둡니다.
   - task 안에 `npm install`, `bun add`, `pip install`, `brew install`, `winget install` 같은 mutation command를 넣지 않습니다. package dependency 설치가 필요하면 `dependencies`로 표현합니다.
   - 설치 파일은 project-local이고 deterministic해야 합니다.
   - harness는 `.opendock/harness/opendock__name/check.mjs`처럼 dock별 경로를 사용합니다.
   - templates는 `.opendock/templates/<dock>/`, run output은 `.opendock/runs/<dock>/<run-id>/`를 사용합니다.

3. **AI 파일 작성**
   - `AGENTS.md`는 설치 후 agent 동작과 안전 경계를 설명합니다.
   - `CLAUDE.md`, `GEMINI.md`, Cursor rules, skills, workflows, commands, hooks는 실제 사용성이 있을 때만 둡니다.
   - installed README는 마케팅 문구가 아니라 프로젝트 안에서 바로 쓰는 안내여야 합니다.

4. **Harness 작성**
   - harness는 현재 task output이나 dock package만 검사합니다. 관련 없는 repo 전체를 막지 않습니다.
   - 실패 시 non-zero exit를 반환합니다.
   - valid case와 invalid case를 모두 테스트합니다.

5. **보안 검토**
   - `references/security-review.md`를 읽고 blocker를 확인합니다.
   - OpenDock CLI, Registry, auth, archive extraction, command execution, path ownership, lock/update/uninstall 로직을 바꾸는 작업이면 repository security scan을 고려합니다.
   - 단일 dock payload는 먼저 targeted artifact review와 package checker로 검토합니다.
   - `tools.commands`가 reserved command 이름을 재사용하지 않는지, `permissions`가 broad하지 않은지 확인합니다.

6. **동작 테스트**
   - `references/test-matrix.md`를 읽고 install, update, uninstall, conflict, force, platform, harness 케이스를 적용합니다.
   - `dependencies`가 있으면 install 후 dependency output 생성, update 시 stale output 정리와 재설치, uninstall 시 dependency output 정리까지 확인합니다.
   - 여러 dock이 함께 설치될 수 있으면 path collision을 테스트합니다.

7. **릴리스 준비**
   - `references/release-checklist.md`를 읽습니다.
   - 정적 검증:
     ```bash
     python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py <dock-folder>
     ```
   - 최종 응답에는 파일 검증, harness, install/update/uninstall, security 결과와 남은 risk를 요약합니다.

## References

- `references/dock-quality-gates.md`
- `references/security-review.md`
- `references/test-matrix.md`
- `references/release-checklist.md`

## Script

- `scripts/check_dock_package.py <dock-folder>`: manifest path, payload safety, risky command, common OpenDock mistake를 검사하는 dependency-free static validator입니다.
