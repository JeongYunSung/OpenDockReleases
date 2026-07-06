# Content Creator Workspace

블로그, 뉴스레터, 유튜브 스크립트, 썸네일 브리프, 업로드 체크리스트를 운영 가능한 콘텐츠 패키지로 정리하는 dock.

## 설치된 Agent Context

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 Content Creator 작업 규칙이 추가됩니다.
- `.agents/skills/opendock-content-creator/SKILL.md`는 Codex/OMA 계열 agent가 직접 참고할 수 있는 skill입니다.
- `.claude/commands/opendock-content-creator/quality-gate.md`는 Claude Code에서 품질 게이트를 호출할 때 쓰는 문서입니다.
- `.cursor/rules/opendock-content-creator.mdc`는 Cursor 작업 시 같은 기준을 알려줍니다.

## 먼저 할 일

1. `CONTENT_CREATOR.md`를 읽습니다.
2. 이번 작업의 run id를 정합니다.
3. 템플릿을 복사합니다.

```bash
mkdir -p .opendock/runs/content-creator
cp .opendock/templates/content-creator/CONTENT_RUN.md .opendock/runs/content-creator/<run-id>.md
```

4. 작업 목표와 근거를 채운 뒤 agent에게 요청합니다.
5. 완료 전 harness를 실행합니다.

```bash
node .opendock/harness/opendock__content-creator/check.mjs
```

## 자주 쓰는 workflow

- audience와 channel을 먼저 고릅니다.
- 초안보다 brief와 evidence를 먼저 만듭니다.
- 제목/썸네일/CTA를 채널별로 검증합니다.
- 권리/출처/업로드 체크리스트를 완료합니다.

## 품질 체크

- 콘텐츠는 audience, promise, angle, evidence, CTA를 먼저 정의합니다.
- 블로그/뉴스레터/영상/숏폼은 채널별 hook, structure, length, reuse plan이 달라야 합니다.
- 썸네일/제목은 과장보다 구체적인 기대효과와 시각적 대비를 우선합니다.
- 출처 없는 claim, 과장된 수치, 타인 저작물 무단 사용을 금지합니다.
- 업로드 전 title, description, tags, captions, asset rights, schedule, repurpose plan을 점검합니다.
- 브랜드 톤과 금지어는 프로젝트의 WRITING.md 또는 README 정책을 우선합니다.

## 유용한 프롬프트

- 이 주제로 블로그, 뉴스레터, 유튜브 스크립트를 각각 다른 각도로 만들어줘.
- 아래 초안을 Content Creator 기준으로 hook, 구조, CTA, 근거 측면에서 고쳐줘.
- 이 콘텐츠를 5개 숏폼, 1개 뉴스레터, 1개 링크드인 글로 재활용하는 계획을 만들어줘.

## 주의

저작권 있는 본문/이미지/음원을 그대로 재사용하지 않고, source note와 rights note를 남깁니다.
