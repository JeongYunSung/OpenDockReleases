# SuperClaude

설치하면 `superclaude` CLI를 이 프로젝트에서만 쓰는 명령으로 사용할 수 있습니다. Claude Code의 command, persona, workflow 구성을 확인하고 승인된 범위에서 설치할 때 사용합니다.

## 설치 후 준비되는 것

- `superclaude` 명령
- root `AGENTS.md`의 SuperClaude routing과 안전 경계
- `.opendock/docks/superclaude/README.md`와 설정 가이드
- 선택적으로 변경 내용을 기록할 `SUPERCLAUDE_RUN.md`

## 사용 방법

```sh
superclaude --help
superclaude --version
opendock doctor
```

`superclaude install`처럼 Claude Code 설정을 바꾸는 명령은 변경 위치와 영향을 확인하고 사용자 승인을 받은 뒤 실행합니다.

## 검수 방식

이 도구 Dock은 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`가 실제 `superclaude --version` 실행과 설치 문서 존재 여부를 확인합니다.

## 알려진 한계

Claude Code HOME 설정이나 user command를 자동 변경하지 않습니다. SuperClaude가 생성한 지시는 기존 project rule보다 우선하지 않습니다.
