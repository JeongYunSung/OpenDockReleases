## OpenDock AI Project Starter

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

프로젝트의 AI 협업 계약을 `.ai/` 아래에 만드는 시작 안내입니다. `.opendock/templates/ai-project-starter/RUN.md`로 run을 만들고 context, goals/non-goals, roles, rules, tools, workflows, quality gates, decisions, security/privacy, onboarding을 실제 프로젝트 evidence에 맞춰 작성합니다.

```bash
node .opendock/harness/opendock__ai-project-starter/check.mjs
```

이 구조는 OpenDock starter이며 업계 표준이 아닙니다. 기존 vendor 설정은 직접 덮어쓰지 않고 `.ai/` 안에 제안만 남깁니다. secret과 집·숙소·여행·개인 위치·연락처 같은 데이터는 최소화하고 제거 또는 일반화합니다. Codex acceptance는 deterministic harness와 별도입니다.
