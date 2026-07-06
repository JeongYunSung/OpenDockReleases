# SEO Growth Workspace

검색 의도, 메타데이터, 콘텐츠 구조, 내부 링크, technical SEO, 측정 계획을 점검하는 성장 dock.

## 설치된 Agent Context

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 SEO Growth 작업 규칙이 추가됩니다.
- `.agents/skills/opendock-seo-growth/SKILL.md`는 Codex/OMA 계열 agent가 직접 참고할 수 있는 skill입니다.
- `.claude/commands/opendock-seo-growth/quality-gate.md`는 Claude Code에서 품질 게이트를 호출할 때 쓰는 문서입니다.
- `.cursor/rules/opendock-seo-growth.mdc`는 Cursor 작업 시 같은 기준을 알려줍니다.

## 먼저 할 일

1. `SEO_GROWTH.md`를 읽습니다.
2. 이번 작업의 run id를 정합니다.
3. 템플릿을 복사합니다.

```bash
mkdir -p .opendock/runs/seo-growth
cp .opendock/templates/seo-growth/SEO_RUN.md .opendock/runs/seo-growth/<run-id>.md
```

4. 작업 목표와 근거를 채운 뒤 agent에게 요청합니다.
5. 완료 전 harness를 실행합니다.

```bash
node .opendock/harness/opendock__seo-growth/check.mjs
```

## 자주 쓰는 workflow

- 검색 의도와 페이지 목적을 먼저 나눕니다.
- 메타데이터와 heading을 사용자의 언어로 정리합니다.
- technical SEO blocker와 content improvement를 분리합니다.
- 측정 지표와 다음 실험을 기록합니다.

## 품질 체크

- 대상 독자, 검색 의도, 핵심 query, 페이지 목적을 먼저 정의합니다.
- title, description, canonical, OG/Twitter metadata는 페이지별로 구체적이어야 합니다.
- H1/H2 구조는 검색 의도와 사용자 흐름을 모두 반영합니다.
- sitemap, robots, indexing risk, redirect, 404, pagination, duplicate content를 점검합니다.
- 콘텐츠에는 주장, 근거, 예시, 다음 행동이 있어야 합니다.
- 성과 측정은 impression, CTR, conversion, assisted conversion, content decay를 구분합니다.

## 유용한 프롬프트

- 이 페이지를 SEO Growth 기준으로 점검하고 title/description/H1/H2 개선안을 줘.
- 아래 제품 설명으로 검색 의도별 콘텐츠 브리프를 만들어줘.
- sitemap, robots, canonical, OG metadata 기준의 technical SEO 체크리스트를 만들어줘.

## 주의

검색 순위 보장은 하지 않고, 통제 가능한 품질 개선과 측정 계획 중심으로 답합니다.
