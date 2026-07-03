# Dock Builder Quality Gate

1. `DOCK_BUILDER.md`와 `.agents/skills/opendock-dock-builder/SKILL.md`를 읽습니다.
2. 대상 dock의 목적, platform, 설치 파일, harness 범위를 확인합니다.
3. manifest가 최신 spec인지 확인합니다: `id`, `version`, `lifecycle`, `requires.packages`, `requires.tools`, `files[].update`, manifest `uninstall`, `bin` 금지.
4. task command와 `permissions`가 shell operator 없이 정확한 command shape인지, package install/update mutation이 없는지 확인합니다.
5. `python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py <dock-folder>`를 실행합니다.
6. harness가 있으면 valid case와 invalid case를 모두 실행합니다.
7. install/update/uninstall이 바뀌었으면 임시 workspace에서 실제 동작을 검증합니다.
8. `RELEASE_EVIDENCE.md` 형식으로 결과를 정리합니다.
9. blocker가 있으면 완료라고 말하지 말고 수정하거나 hold 사유를 적습니다.
