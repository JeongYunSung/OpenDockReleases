# oh-my-agent 운영 가이드

oh-my-agent는 `.agents/`를 SSOT로 사용해 여러 AI runtime에 skills, workflows, rules, hooks를 투영합니다.

## OpenDock 구성

- `oh-my-agent` package와 `oma` command는 workspace-local tool로 설치됩니다.
- seed config는 Dock workdir의 `.agents/oma-config.yaml`에 복사됩니다.
- install과 update는 Dock workdir에서 실행되고 필요한 결과만 project로 export됩니다.

## 기본 명령

```sh
oma --version
oma doctor
oma doctor --profile
```

`oma-config.yaml`은 code-equivalent 설정입니다. vendor, model, command, env 변경은 실행 전에 검토합니다. HOME 공유 설정, global install, credential 저장은 사용자 승인 없이 수행하지 않습니다.
