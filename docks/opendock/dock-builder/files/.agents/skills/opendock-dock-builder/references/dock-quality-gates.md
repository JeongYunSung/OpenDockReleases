# Dock 품질 기준

## 기본 방향

평소에는 현재 요청에서 바꾼 Dock만 빠르게 확인합니다. 사용자가 `검수`, `ultrawork`, `release`를 명시했을 때만 정밀 harness와 전체 설치 흐름을 확인합니다.

## 공통 구조

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

- `DOCK.md`는 Registry에서 읽는 자연스러운 한국어 설명입니다.
- root `AGENTS.md`는 routing과 safety만 담은 20개 이하의 규칙입니다.
- root `README.md`, root `HARNESS.md`, root `*PLAYBOOK*.md`는 설치하지 않습니다.
- 사용자 문서와 필요한 playbook·domain guide는 `.opendock/docks/<dock-name>/`에 둡니다.
- vendor별 AI 파일은 실제 동작이 있을 때만 추가합니다.

## Dock 유형

### Tool Dock

top-level `tools`가 있으면 Tool Dock으로 봅니다.

- custom harness, HARNESS 문서, quality-gate workflow를 설치하지 않습니다.
- install과 update 뒤 `.opendock/bin/` shim과 `.opendock/tools/<dock>/<tool>/` 설치 상태를 확인합니다.
- doctor가 설치 상태를 설명하는지 확인합니다.
- 설치된 실제 명령을 대표 입력으로 실행해 도구 자체가 동작하는지 확인합니다.

### 일반 Dock

AI 기능과 준비된 작업 공간처럼 `tools`가 없고 이름이 `-ultrawork`로 끝나지 않는 Dock입니다.

- custom harness, HARNESS 문서, quality-gate workflow를 설치하지 않습니다.
- root AGENTS는 라우팅과 핵심 안전 규칙만 20개 이하로 유지합니다.
- 실제 작업 방법은 domain guide와 skill에 두고, 템플릿은 사용자가 필요할 때만 선택합니다.
- 검수 요청이 오면 AI가 현재 산출물을 domain guide와 비교합니다. script 실행이나 run manifest 작성을 강제하지 않습니다.

### Ultrawork와 Dock Builder

이름이 `-ultrawork`로 끝나는 Dock과 `dock-builder`만 다음 두 경로를 함께 사용합니다.

```text
.opendock/docks/<dock-name>/HARNESS.md
.opendock/harness/<dock-name>/check.mjs
```

custom harness는 일반 요청에서 자동 실행하지 않습니다. 검수와 ultrawork에서는 명시한 작업만, release에서는 명시적 전체 모드만 검사합니다. 파일 존재, 안전한 경로, 허용된 형식, 보안 위반처럼 객관적으로 판정 가능한 조건만 확인하고 의미·문체·창의성은 AI 리뷰가 맡습니다. 실패 이유를 읽기 쉽게 출력하고 잘못된 사례에서 non-zero로 끝나야 합니다.

## Manifest

- `opendock: 1`과 현재 catalog metadata를 사용합니다.
- `id`와 release `version`은 manifest에 넣지 않습니다.
- top-level task는 `install`, `update`, `doctor`만 사용하며 manifest `uninstall`은 만들지 않습니다.
- runtime은 `requires.runtimes`, project-local CLI는 `tools`, 복사된 folder dependency는 `dependencies`로 선언합니다.
- `tools.manager`가 사용하는 package manager도 runtime에 선언합니다: npm은 node와 npm, bun은 bun, pip/pip3는 python, uv는 python과 uv가 필요합니다.
- `requires.packages`, `requires.tools`, top-level `commands`, tool `bin`, `files[].update`는 사용하지 않습니다.
- dependency manager와 mode는 현재 지원 조합을 사용하고 path는 안전한 project-relative folder를 가리킵니다.
- task command와 `permissions`에는 shell operator와 package-manager mutation을 넣지 않습니다.
- `workdir`는 `root` 또는 `dock`만 사용합니다.
- `files.from`은 실제 payload 안에 있어야 하고, `files.to`는 absolute path나 `..`를 포함할 수 없습니다.

## macOS와 Windows

두 platform manifest에는 같은 catalog metadata와 설치 계약이 있어야 합니다.

- file source와 target mapping
- tag
- tool과 dependency 이름
- doctor id

운영체제에 따라 command 표현은 달라질 수 있지만, 설치되는 기능과 진단 항목은 같아야 합니다.

## 검증 깊이

일반 요청에서는 대상 Dock 하나에 정적 checker를 실행하고 실패 항목만 고칩니다.

출시 전 정밀 검수에서는 임시 workspace에서 install, update, doctor, uninstall, managed file 충돌, dependency 정리, platform 선택을 확인합니다. Tool Dock은 실제 명령 실행을, 일반 Dock은 대표 AI 작업을, Ultrawork와 Dock Builder는 대상 한정 checker의 성공·실패 사례를 증거로 남깁니다.
