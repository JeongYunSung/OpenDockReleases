# Dock Builder 기준

OpenDock dock은 “설치 스크립트”가 아니라 버전 관리되는 workspace capability입니다.

## 실행 모델

| 개념 | 예시 | 누가 관리? | 설치/기록 위치 |
|---|---|---|---|
| Host package manager | Homebrew, WinGet | `opendock bootstrap` | system |
| Runtime | Node, npm, Python, pip, Bun, Git | OpenDock | `~/.opendock/runtimes/<name>/<version>/` |
| Package manager | npm, pip, bun | runtime에 포함 | project `.opendock/bin/` shim |
| Tool | codex, claude, oma, eslint | OpenDock `tools` | project `.opendock/tools/<dock>/<tool>/` |
| Bin | `codex`, `oma`, `node`, `npm` 실행 shim | OpenDock | project `.opendock/bin/` |
| Dependency | 복사된 payload folder의 package dependency | OpenDock `dependencies` | 복사된 project folder 내부 |
| Workdir | generator가 파일을 만드는 작업 폴더 | task `workdir` | project `.opendock/workdirs/<dock>/` 또는 root |
| Files / export | `AGENTS.md`, `.codex/**`, generated output | OpenDock file engine | project root와 lock 기록 |

install 흐름은 Registry download → runtime 준비 → tool 설치 → `.opendock/bin` 생성 → manifest file 수집 → dock workdir 준비 → `install` step 실행 → `export` 수집 → managed file/export 적용 → dependency 설치 → lock 기록 순서로 봅니다.

## 필수 구조

```text
dock-folder/
  DOCK.md
  logo.png
  dock.macos.yml
  dock.windows.yml
  files/
    AGENTS.md
    README.md
    HARNESS.md
    .opendock/harness/<dock-name-safe>/check.mjs
```

## 제작 기준

- 설치 후 사용자가 바로 무엇을 할 수 있는지 먼저 정의합니다.
- macOS와 Windows는 manifest 파일을 분리합니다.
- `dock.yml`에는 `id`와 `version`을 쓰지 않습니다. dock identity와 release version은 `opendock deploy owner/name@version` 또는 `opendock install owner/name@version` reference가 기준입니다.
- 현재 manifest task는 top-level `install`, `update`, `doctor`입니다. `lifecycle`, `tasks.install`, `uninstall` field를 만들지 않습니다.
- `requires`는 `requires.runtimes`만 사용합니다. package 검증/설치 선언을 `requires.packages`나 `requires.tools`에 넣지 않습니다.
- project-local CLI는 top-level `tools`에 `manager`, `package`, `version`, `commands`로 선언합니다. `bin` field는 사용하지 않습니다.
- 복사된 folder 안의 package dependency는 top-level `dependencies`에 `manager`, `path`, 선택적 `mode`, 선택적 `timeout_ms`로 선언합니다.
- `tools`는 command shim을 노출하는 project-local CLI용이고, `dependencies`는 `files`로 복사한 folder 내부 dependency 설치용입니다.
- 지원 dependency manager/mode는 `npm ci|install`, `pnpm install`, `bun install`, `uv sync`, `pip/pip3 install`입니다.
- dependency `path`는 project-relative여야 하며 `.opendock`, `.git`, `.ssh`, `.env*`, symlink path를 가리키면 안 됩니다.
- `tools.commands`는 `git`, `node`, `npm`, `bun`, `python`, `test`, `brew`, `winget` 같은 OpenDock reserved command 이름을 재사용하지 않습니다.
- task의 `run`, `check`, `permissions`는 shell string이 아니라 OpenDock이 token 단위로 검증하는 단일 command입니다. `|`, `&&`, `||`, `;`, backticks, `$(`, `>`, `<`를 쓰지 않습니다.
- `npm install`, `bun add`, `pnpm update`, `pip install`, `pipx install`, `uv tool install`, `brew install`, `winget install` 같은 mutation command를 task에 넣지 않습니다. 런타임은 `requires.runtimes`, project-local CLI는 `tools`, 복사 folder dependency는 `dependencies`, Homebrew/WinGet 전제는 bootstrap으로 분리합니다.
- task `workdir`는 `root` 또는 `dock`만 사용합니다. generator output은 `workdir: dock`에서 만들고 `export.include/exclude`로 project root에 반영합니다.
- `files.from`은 dock folder 안에 실제 존재해야 합니다.
- `files.to`는 프로젝트 상대 경로여야 하며 absolute path와 `..`는 금지합니다.
- harness, templates, run folder는 dock별 namespace를 가집니다.
- README와 DOCK.md는 설치 목적, 사용법, 검증 방법을 한국어로 설명합니다.
- logo는 Hub 카드에서 식별 가능한 256x256 PNG를 둡니다.
- `readme`, `logo`, `tags`는 Registry catalog metadata입니다. project에 설치해야 하는 파일은 별도로 `files`에 넣습니다.
- `uninstall`은 OpenDock이 lock과 managed file/tool/runtime 기록을 기반으로 처리하므로 `dock.yml`에 작성하지 않습니다.

## 보안 기준

- `curl | sh`, `wget | bash`, `eval`, `sudo`, `rm -rf`, shell profile 변경, launch agent, crontab은 blocker로 봅니다.
- secret, token, credential, private key를 문서나 manifest에 남기지 않습니다.
- 외부 명령 실행은 왜 필요한지, 어느 scope에서 실행되는지, update/uninstall에 어떤 영향이 있는지 설명합니다.
- non-default command는 `tools.commands`에 선언하고, 실행이 필요한 정확한 shape만 `permissions`에 넣습니다.
- `permissions`에 하나를 허용해도 같은 program의 다른 subcommand가 자동 허용되지 않습니다.

## 테스트 기준

- 빈 workspace install
- 기존 workspace install
- update no-change
- user modified managed file conflict
- uninstall 후 managed file 제거
- user file이 있는 directory 보존
- harness valid case
- harness invalid case
- platform manifest path check
- dependencies가 있으면 install 후 output 생성, update 시 stale output 정리와 재설치, uninstall 시 dependency output 정리

## 릴리스 전 증거

`RELEASE_EVIDENCE.md`에 다음을 남깁니다.

- deploy reference (`owner/name@version`)
- platform manifest 목록
- static package check 결과
- harness 결과
- install/update/uninstall 결과
- dependencies가 있으면 dependency install/update/uninstall 결과
- security blocker/warning
- 남은 risk
