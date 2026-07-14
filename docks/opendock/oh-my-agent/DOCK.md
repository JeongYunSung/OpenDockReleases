# oh-my-agent

설치하면 oh-my-agent의 `oma`, `oh-my-agent` 명령을 workspace-local로 사용할 수 있습니다. Dock의 분리된 config를 기준으로 OMA agent 설정을 설치·업데이트하고 상태를 진단합니다.

## 설치 후 준비되는 것

- `oh-my-agent@10.10.0`과 `oma`, `oh-my-agent` 명령
- Dock 전용 작업 공간에 준비되는 `.agents/oma-config.yaml` 초기 설정
- OMA install/update가 생성해 project로 export하는 agent 설정
- `.opendock/docks/oh-my-agent/README.md`와 운영 가이드

## 사용 방법

```sh
oma --version
opendock doctor
```

OpenDock install은 dock workdir에서 `oma -y install`을, update는 `oma update --ci --all`을 실행합니다.

## 검수 방식

이 도구 Dock 자체는 별도 정밀 검사 도구를 설치하지 않습니다. `opendock doctor`는 `oma --version`, 설정 파일, 설치 문서를 읽기 전용으로 확인합니다. `oma doctor`는 필요하면 파일을 내려받거나 바꿀 수 있으므로 사용자가 직접 실행합니다.

## 알려진 한계

`oma-config.yaml`은 실행 가능한 AI 도구 설정과 같은 수준으로 검토해야 합니다. 사용자 홈의 공유 설정, 전역 설치, 인증 정보 저장은 기본 범위에 포함하지 않습니다.
