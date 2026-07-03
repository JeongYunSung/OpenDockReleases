# Dock Builder

OpenDock dock을 만들고, 검토하고, 출시 가능한 수준까지 테스트하는 작업 기준을 설치합니다.

이 dock은 `opendock-dock-builder` skill과 정적 패키지 검증 스크립트를 workspace 안에 제공합니다. 새 dock을 만들 때 최신 OpenDock manifest, files, dependencies, harness, command policy, 보안 검토, install/update/uninstall 테스트, registry 제출 전 증거 정리를 빠뜨리지 않게 돕습니다.

## 설치되는 것

- `DOCK_BUILDER.md`: dock 제작과 출시 전 점검 기준
- `HARNESS.md`: dock-builder harness 사용법
- `.agents/skills/opendock-dock-builder/SKILL.md`: dock 제작 전용 skill
- `.agents/skills/opendock-dock-builder/references/`: 품질, 보안, 테스트, 릴리스 체크리스트
- `.agents/skills/opendock-dock-builder/scripts/check_dock_package.py`: dock 패키지 정적 검증 스크립트
- `.opendock/harness/opendock__dock-builder/check.mjs`: 현재 workspace의 dock 구조 점검 harness
- `.opendock/templates/dock-builder/`: 리뷰와 릴리스 증거 템플릿

## 사용 시점

- 새 OpenDock dock을 만들 때
- 기존 dock의 manifest, README, harness, skill, workflow를 정리할 때
- registry deploy 전에 보안과 테스트 증거를 정리할 때
- install/update/uninstall, dependency cleanup, managed file, path collision, platform split을 검증할 때
- `id`, `version`, `lifecycle`, `requires.packages`, task package install command처럼 구버전 spec 잔재를 제거할 때

## 확인

```bash
node .opendock/harness/opendock__dock-builder/check.mjs
python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py docks/opendock/<dock-name>
```

## 원칙

- dock은 단순 스크립트 묶음이 아니라 versioned workspace capability입니다.
- `dock.yml`은 `opendock: 1`, catalog metadata, `requires.runtimes`, top-level `tools`, top-level `dependencies`, `files`, `install`, `update`, `doctor`를 기준으로 작성합니다.
- `tools`는 command shim을 노출하는 project-local CLI용이고, `dependencies`는 `files`로 복사한 folder 내부 package dependency 설치용입니다.
- dock identity와 release version은 `opendock deploy owner/name@version` reference가 기준입니다.
- 글로벌 설치보다 workspace-local 추적, update, uninstall 가능한 구조를 우선합니다.
- uninstall은 `dock.yml` task가 아니라 OpenDock이 lock과 managed file 기록을 기반으로 처리하는 제거 흐름입니다.
- 검증되지 않은 task command는 실제 프로젝트에서 실행하지 않습니다.
- 보안, 실행 여부, 테스트 여부, 품질관리 증거가 있어야 출시 준비가 끝난 것으로 봅니다.
