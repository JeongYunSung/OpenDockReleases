# OpenDock Dock Builder

이 workspace는 OpenDock dock을 만들고 출시 전 검증까지 진행하기 위해 Dock Builder 기준을 사용합니다.

## 핵심

- dock manifest, 설치 파일, harness, skill, workflow, hook을 같은 기준으로 작성합니다.
- 새 dock은 macOS와 Windows manifest를 분리해서 관리합니다.
- manifest에는 `id`와 `version`을 쓰지 않고, `opendock deploy owner/name@version` reference를 기준으로 배포합니다.
- runtime은 `requires.runtimes`, project-local CLI는 top-level `tools`, 복사된 folder 내부 package dependency는 top-level `dependencies`, 실행 허용은 정확한 `permissions`로 표현합니다.
- task에는 package install/update command를 넣지 않습니다.
- release 전에는 보안, path safety, 실행 여부, install/update/uninstall, harness 성공/실패 케이스를 확인합니다.
- uninstall은 manifest task가 아니라 OpenDock의 lock과 managed file 기록으로 검증합니다.
- 검증되지 않은 명령은 실제 프로젝트에서 실행하지 않습니다.

## 먼저 볼 파일

- `DOCK_BUILDER.md`: dock 제작 기준
- `HARNESS.md`: 검증 실행 방법
- `.agents/skills/opendock-dock-builder/SKILL.md`: agent가 사용할 dock 제작 skill
- `.agents/skills/opendock-dock-builder/references/`: 품질, 보안, 테스트, 릴리스 체크리스트

## 확인

```bash
node .opendock/harness/opendock__dock-builder/check.mjs
python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py docks/opendock/<dock-name>
```

## 권장 흐름

1. 만들 dock의 목적과 설치 후 즉시 가능한 일을 정의합니다.
2. `dock.macos.yml`, `dock.windows.yml`을 나눠 작성합니다.
3. `id`, `version`, `lifecycle`, `requires.packages`, `requires.tools`, `files[].update`, manifest `uninstall`, `bin`을 쓰지 않습니다.
4. 설치 파일은 `files/` 아래에 두고 모든 `from` 경로가 실제 존재하는지 확인합니다.
5. 복사된 folder dependency가 필요하면 task command 대신 `dependencies`에 manager/path/mode를 선언합니다.
6. harness는 해당 dock의 산출물만 검사하도록 제한합니다.
7. 임시 workspace에서 install, update, uninstall, dependency cleanup, conflict, force 케이스를 검증합니다.
8. registry deploy 전에 `RELEASE_EVIDENCE.md` 형식으로 증거를 남깁니다.
