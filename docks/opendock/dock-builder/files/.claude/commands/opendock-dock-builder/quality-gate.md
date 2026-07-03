# Dock Builder Quality Gate

OpenDock dock 작업이 끝나기 전에 다음을 수행합니다.

1. `DOCK_BUILDER.md`를 읽습니다.
2. 대상 dock folder를 정합니다.
3. 최신 spec 위반을 먼저 확인합니다: manifest `id`, `version`, `lifecycle`, `requires.packages`, `requires.tools`, `files[].update`, manifest `uninstall`, tool `bin`, task package mutation 금지.
4. `python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py <dock-folder>`를 실행합니다.
5. harness valid/invalid 케이스를 확인합니다.
6. install/update/uninstall 검증 범위와 남은 risk를 요약합니다.
