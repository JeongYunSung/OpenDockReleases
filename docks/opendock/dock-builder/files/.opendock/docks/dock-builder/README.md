# Dock Builder 사용 안내

Dock Builder는 OpenDock Dock을 만들고 고칠 때 필요한 기준과 검사 도구를 제공합니다.

평소 작업에서는 바꾼 Dock 하나만 빠르게 확인합니다. 사용자가 `검수`, `ultrawork`, `release`를 명시했을 때만 전체 harness와 설치·업데이트·제거 시나리오를 꼼꼼하게 확인합니다.

## 빠른 확인

```bash
python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py docks/opendock/<dock-name>
```

이 검사는 manifest 최신 규격, 설치 경로, 문서 namespace, Dock 유형별 custom harness 정책, macOS/Windows 일치 여부를 확인합니다.

## 출시 전 검수

```bash
node .opendock/harness/dock-builder/check.mjs --release docks/opendock/<dock-name>
```

출시 전에는 임시 workspace에서 install, update, doctor, uninstall과 실제 도구 실행 여부까지 확인합니다. 일반 Dock은 별도 harness 없이 실제 AI 작업과 가이드 적용을 확인하고, Ultrawork는 지정 산출물에 한정된 객관 검사까지 확인합니다. 자세한 기준은 같은 폴더의 `PLAYBOOK.md`, Dock Builder harness 사용법은 `HARNESS.md`에 있습니다.

검증되지 않은 task command를 사용자의 실제 프로젝트에서 실행하지 않으며, deploy·commit·push는 명시적인 승인 없이 수행하지 않습니다.
