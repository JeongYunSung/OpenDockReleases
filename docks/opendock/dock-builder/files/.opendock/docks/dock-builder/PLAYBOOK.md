# Dock Builder 제작 기준

OpenDock Dock은 버전이 관리되고 설치·업데이트·제거할 수 있는 workspace 기능입니다. 평소에는 현재 요청 범위만 빠르게 확인하고, 출시 전에는 실제 동작과 실패 상황까지 꼼꼼하게 확인합니다.

## 기본 구조

```text
dock-folder/
  DOCK.md
  logo.png
  dock.macos.yml
  dock.windows.yml
  files/
    AGENTS.md
    .opendock/docks/<dock-name>/README.md
```

- `DOCK.md`는 Registry 카탈로그에서 읽는 자연스러운 한국어 설명입니다.
- root `AGENTS.md`는 routing과 safety만 담은 20개 이하의 짧은 규칙으로 제한합니다.
- root `README.md`, root `HARNESS.md`, root `*PLAYBOOK*.md`는 설치하지 않습니다.
- 사용자 안내와 선택적 playbook·domain guide는 `.opendock/docks/<dock-name>/`에 둡니다.
- `tools`가 있는 Tool Dock에는 custom harness, HARNESS, quality-gate workflow를 덧붙이지 않습니다. 대신 install, update, doctor와 설치된 실제 명령을 확인합니다.
- AI 기능과 준비된 작업 공간 Dock에도 custom harness를 두지 않습니다. 짧은 지침과 도메인 가이드로 바로 작업하고, 템플릿은 결과물에 도움이 될 때만 선택적으로 사용합니다.
- 이름이 `-ultrawork`로 끝나는 Dock과 `dock-builder`만 `.opendock/docks/<dock-name>/HARNESS.md`와 `.opendock/harness/<dock-name>/check.mjs`를 함께 설치합니다.
- Ultrawork checker는 지정한 대상만 확인하며, 의미·문체·창의성 같은 판단은 AI 리뷰에 맡기고 존재·형식·범위·안전처럼 결정 가능한 조건만 검사합니다.

## Manifest

- macOS와 Windows manifest를 분리하고, 설치 파일·도구·dependency·doctor 항목은 두 플랫폼에서 같은 계약을 유지합니다.
- `dock.yml`에는 `id`와 `version`을 넣지 않습니다. 배포와 설치 reference가 identity와 version을 결정합니다.
- task는 top-level `install`, `update`, `doctor`만 사용하며 manifest `uninstall`은 만들지 않습니다.
- runtime은 `requires.runtimes`, project-local CLI는 top-level `tools`, 복사된 폴더의 package dependency는 top-level `dependencies`에 선언합니다.
- `requires.packages`, `requires.tools`, top-level `commands`, tool `bin`, `files[].update`는 사용하지 않습니다.
- task command와 `permissions`에는 shell operator나 package manager mutation을 넣지 않습니다.
- `files.from`은 Dock 안에 실제로 있어야 하고 `files.to`는 안전한 project-relative 경로여야 합니다.

## 확인 깊이

일반 작업은 정적 checker로 바뀐 Dock만 확인합니다. 문서와 manifest를 빠르게 맞추고, 실패한 항목만 수정합니다.

검수·ultrawork·release 요청에서는 임시 workspace를 사용해 다음을 확인합니다.

- install과 doctor
- update no-change와 managed file 충돌
- uninstall 후 사용자 파일 보존
- dependency 설치·갱신·정리
- 일반 Dock의 가이드 기반 대표 AI 작업
- Ultrawork checker의 대상 한정 성공·실패 사례
- Tool Dock의 설치된 명령과 대표 실제 실행
- macOS/Windows manifest 선택과 경로 차이

검증되지 않은 명령은 실제 프로젝트에서 실행하지 않습니다. 보안 blocker나 검증하지 못한 플랫폼은 결과에 분명히 남깁니다.
