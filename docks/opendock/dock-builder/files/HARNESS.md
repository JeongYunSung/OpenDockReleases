# Dock Builder Harness

실행:

```bash
node .opendock/harness/opendock__dock-builder/check.mjs
```

## 검사 항목

- `DOCK_BUILDER.md`, `HARNESS.md`, dock-builder skill, reference, script가 설치되어 있어야 합니다.
- `docks/opendock/*/dock*.yml`이 있으면 manifest의 `files.from`과 `files.to`를 검사합니다.
- manifest에는 `opendock: 1`이 있어야 하고, `id`, `version`, `schema`, `kind`, `lifecycle`, `needs`, `supports`, `uninstall` 같은 제거된 top-level field가 있으면 실패합니다.
- `requires.packages`, `requires.tools`, `files[].update`, tool `bin`은 실패합니다.
- `tools.commands`가 OpenDock reserved command 이름을 재사용하면 실패합니다.
- `dependencies`가 있으면 supported manager/mode인지, `path`가 safe project-relative인지, 보호 경로가 아닌지, 일반적으로 `files.to`로 설치되는 folder를 가리키는지 확인합니다.
- task `run`, `check`, `permissions`에 shell operator나 package-manager mutation command가 있으면 실패합니다.
- task `workdir`가 `root` 또는 `dock`이 아니면 실패합니다.
- runtime 위치를 예전 project-local toolchain path로 설명하는 오래된 문구가 있으면 stale term으로 잡습니다. 현재 runtime store는 `~/.opendock/runtimes/`입니다.
- `files.to`는 absolute path나 `..`를 사용할 수 없습니다.
- 공용 harness path처럼 다른 dock과 충돌하기 쉬운 target을 잡습니다.
- task command에 destructive command, remote shell bootstrap, privilege escalation 패턴이 있으면 실패합니다.
- 문서와 manifest에 오래된 OpenDock 용어가 남아 있으면 실패합니다.

## 의도

이 harness는 dock 제작 workspace를 검사합니다. 일반 앱 코드 전체를 검사하지 않고, OpenDock dock package와 builder 기준 파일만 대상으로 삼습니다.
