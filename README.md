# OpenDock Dock 저장소

이 저장소는 OpenDock 카탈로그에 올라가는 dock들의 원본 작업 공간입니다.

현재 카탈로그는 특정 업무 영역에 집중한 Ultrawork 품질 게이트만 유지합니다. 각 dock은 작은 체크리스트, 에이전트 가이드, workflow 어댑터, hook 메타데이터, 실행 가능한 harness를 설치합니다.

## 카탈로그

```text
docks/
  opendock/
        design-ultrawork/
        creative-gen-ultrawork/
        frontend-ultrawork/
        backend-ultrawork/
        kotlin-spring-ultrawork/
        data-ultrawork/
        devops-ultrawork/
        docs-ultrawork/
        business-ultrawork/
        mobile-ultrawork/
        qa-ultrawork/
```

## 배포

배포할 때는 정확한 버전과 플랫폼별 manifest를 지정합니다.

```bash
opendock deploy opendock/design-ultrawork@1.0.0 --platform macos --file docks/opendock/design-ultrawork/dock.macos.yml
opendock deploy opendock/design-ultrawork@1.0.0 --platform windows --file docks/opendock/design-ultrawork/dock.windows.yml
```

릴리스 버전은 `dock.*.yml` 안에 넣지 않습니다. 버전은 `opendock deploy` 명령에서만 관리합니다.

## 리뷰 규칙

- dock id는 `opendock/<domain>-ultrawork` 형식을 유지합니다.
- 플랫폼별 파일은 `dock.macos.yml`, `dock.windows.yml`처럼 분리합니다.
- `DOCK.md`와 `logo.png`는 manifest와 같은 dock 폴더에 둡니다.
- 설치될 agent 파일, workflow, command, hook, harness 파일은 `files/` 아래에 둡니다.
- 가능하면 커밋된 소스 기준으로만 배포합니다.
