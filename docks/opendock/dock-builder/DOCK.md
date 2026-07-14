# Dock Builder

OpenDock Dock을 만들고 다듬을 때 필요한 제작 기준과 검사 도구를 설치합니다.

Dock Builder의 원칙은 단순합니다. 평소에는 지금 바꾼 Dock만 빠르게 확인하고, 검수나 출시를 준비할 때는 설치부터 제거까지 실제 흐름을 꼼꼼하게 확인합니다. 작은 수정 때문에 저장소 전체 검사가 매번 실행되지 않으면서도, Registry에 올리기 전에는 필요한 증거를 빠뜨리지 않게 합니다.

## 제공 기능

- 최신 OpenDock manifest와 안전한 설치 경로를 확인하는 정적 checker
- macOS와 Windows manifest가 같은 설치 계약을 유지하는지 확인하는 검사
- 도구, 일반 작업공간, Ultrawork에 맞는 문서·검수 구조 안내
- install, update, doctor, uninstall과 보안 검토를 위한 release 자료
- Dock별 사용자 안내와 필요한 경우에만 쓰는 namespaced template

## 사용 방식

일반 제작과 수정에서는 대상 Dock 하나만 확인합니다.

```bash
python3 .agents/skills/opendock-dock-builder/scripts/check_dock_package.py docks/opendock/<dock-name>
```

사용자가 `검수`, `ultrawork`, `release`를 명시한 경우에만 정밀 검사 도구를 실행하고, 임시 workspace에서 실제 설치·업데이트·제거 흐름을 확인합니다.

```bash
node .opendock/harness/dock-builder/check.mjs --release docks/opendock/<dock-name>
```

설치 후 자세한 안내는 `.opendock/docks/dock-builder/README.md`에서 확인할 수 있습니다.

## 기본 정책

- `DOCK.md`는 Registry에서 읽는 한국어 카탈로그 설명입니다.
- root에는 간결한 `AGENTS.md`만 두며, 사용자 문서는 `.opendock/docks/<dock-name>/`에 설치합니다.
- 도구 Dock은 custom harness를 덧붙이지 않고 실제 도구가 설치되고 실행되는지 확인합니다.
- AI 기능과 준비된 작업 공간 Dock은 짧은 지침, 도메인 가이드와 선택적 템플릿만 제공합니다.
- `*-ultrawork`와 `dock-builder`만 Dock별 HARNESS 문서와 `check.mjs`를 같은 이름으로 묶습니다.
- custom checker는 의미 품질을 점수화하지 않고 지정 산출물의 존재, 범위, 형식과 안전 조건만 판정합니다.
- 검증되지 않은 명령은 실제 사용자 프로젝트에서 실행하지 않습니다.
