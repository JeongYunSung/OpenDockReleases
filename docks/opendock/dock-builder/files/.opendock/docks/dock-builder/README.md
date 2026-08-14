# Dock Builder 사용 안내

Dock Builder는 OpenDock Dock을 만들고 고칠 때 필요한 기준과 검사 도구를 제공합니다. manifest만 맞추는 것이 아니라, 처음 보는 사람도 무엇을 설치하고 AI에게 어떻게 요청할지 이해하는 카탈로그 설명까지 완성합니다.

평소 작업에서는 바꾼 Dock 하나만 빠르게 확인합니다. 사용자가 `검수` 또는 `ultrawork`를 요청하면 그 Dock의 설치·업데이트·제거와 현재 결과를 강하게 확인합니다. 프로젝트 전체 검사는 전체 범위를 명확히 요청한 경우에만 실행합니다.

## AI에서 바로 사용하기

AI에서 `$opendock-dock-builder` 스킬을 선택한 뒤 만들고 싶은 Dock의 대상과 결과를 설명합니다.

> 회의록을 정리하는 Dock을 만들어줘. 비개발자도 이해할 설명과 실제 요청 예시를 포함해줘.

> 이 Dock을 ultrawork로 검수해서 macOS와 Windows 설치, 업데이트, 제거와 보안 문제를 모두 고쳐줘.

## 빠른 확인

```bash
python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py docks/opendock/<dock-name>
```

이 검사는 manifest 최신 규격, 설치 경로, 문서 namespace, Dock 유형별 custom harness 정책, macOS/Windows 일치 여부를 확인합니다.

## 강한 검수가 필요할 때

```bash
node .opendock/harness/dock-builder/check.mjs --release docks/opendock/<dock-name>
```

검수나 ultrawork에서는 임시 workspace에서 install, update, doctor, uninstall과 실제 도구 실행 여부까지 확인합니다. 일반 Dock은 별도 harness 없이 실제 AI 작업과 가이드 적용을 확인하고, Ultrawork는 현재 지정한 결과물에만 강한 하네스를 적용합니다. 자세한 제작 기준은 `PLAYBOOK.md`, 하네스 사용법은 `HARNESS.md`에서 확인할 수 있습니다.

검증되지 않은 task command를 사용자의 실제 프로젝트에서 실행하지 않으며, deploy·commit·push는 명시적인 승인 없이 수행하지 않습니다.
