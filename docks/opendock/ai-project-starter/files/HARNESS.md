## AI Project Starter Harness

```bash
node .opendock/harness/opendock__ai-project-starter/check.mjs
node .opendock/harness/opendock__ai-project-starter/check.mjs .opendock/runs/ai-project-starter/<run-id>/manifest.md
```

인자가 없으면 run root 바로 아래 manifest의 status만 읽습니다. `draft`, `active`, `in-progress`, `review`, `ready`는 활성 상태이며 0개는 Ready, 1개는 검사, 2개 이상은 실패입니다. 인자가 있으면 해당 안전한 manifest 하나만 검증하고 다른 run을 발견하지 않습니다.

검사 범위는 manifest와 그 `Target Files`에 선언된 `.ai/` text 파일뿐입니다. `.md`, `.json`, `.yaml`, `.yml`, `.toml`을 허용하되 필수 topic을 담은 Markdown이 하나 이상 있어야 합니다. JSON은 Node parser로 문법을 확인하고 YAML/TOML은 text·보안·빈 내용 여부만 검사하므로 별도 parser validation이 필요합니다. 저장소 전체를 재귀 검사하지 않습니다.

- Context, Goals, Non-Goals, Roles, Rules, Tools, Workflows, Quality Gates, Decisions, Security/Privacy, Onboarding coverage를 확인합니다.
- OpenDock starter이며 업계 표준이 아니라는 설명, vendor config 비덮어쓰기 정책, 최소 데이터·redaction evidence를 확인합니다.
- 절대 경로, traversal, NUL, 보호 경로, binary·과대 파일, symlink, placeholder, 실제 credential 값, 실행형 위험 지시, prompt injection, 근거 없는 보장을 거부합니다.
- 실행하지 않은 분석용 위험 문자열 인용은 evidence 문맥이 분명하면 거부하지 않습니다.

harness는 deterministic 정적 검사이며 특정 vendor가 `.ai/`를 자동 인식한다고 보장하지 않습니다. Codex acceptance는 별도이며 외부 모델 결정성을 전제하지 않습니다.
