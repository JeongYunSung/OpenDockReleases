# SEO Growth

검색 의도, 메타데이터, 콘텐츠 구조, 내부 링크, technical SEO, 측정 계획을 점검하는 성장 dock.

## 설치 후 제공되는 것

- `SEO_GROWTH.md`: 이 dock의 작업 원칙과 검토 기준
- `README.md`: 프로젝트 안에서 바로 보는 사용 안내
- `HARNESS.md`: 최종 handoff 전 확인 목록
- `.opendock/templates/seo-growth/SEO_RUN.md`: 작업 run 기록 템플릿
- `.opendock/harness/opendock__seo-growth/check.mjs`: 로컬 품질 검사
- `.agents/skills/opendock-seo-growth/SKILL.md`: Codex/OMA 계열 agent가 읽는 skill
- `.claude/commands/opendock-seo-growth/quality-gate.md`: Claude Code에서 호출할 수 있는 품질 게이트 문서

## 바로 쓰는 방법

1. `SEO_GROWTH.md`를 먼저 읽습니다.
2. `.opendock/templates/seo-growth/SEO_RUN.md`를 `.opendock/runs/seo-growth/<run-id>.md`로 복사합니다.
3. 목표, 범위, 근거, 결정, 남은 리스크를 기록합니다.
4. 작업 후 `node .opendock/harness/opendock__seo-growth/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 human-approved exception으로 남깁니다.

## 주요 기준

- 대상 독자, 검색 의도, 핵심 query, 페이지 목적을 먼저 정의합니다.
- title, description, canonical, OG/Twitter metadata는 페이지별로 구체적이어야 합니다.
- H1/H2 구조는 검색 의도와 사용자 흐름을 모두 반영합니다.
- sitemap, robots, indexing risk, redirect, 404, pagination, duplicate content를 점검합니다.
- 콘텐츠에는 주장, 근거, 예시, 다음 행동이 있어야 합니다.
- 성과 측정은 impression, CTR, conversion, assisted conversion, content decay를 구분합니다.

## 안전 경계

검색 순위 보장은 하지 않고, 통제 가능한 품질 개선과 측정 계획 중심으로 답합니다.

이 dock은 판단을 자동으로 확정하지 않습니다. 사용자가 바로 실행 가능한 문서와 agent 지시, 그리고 handoff 전 품질 게이트를 제공합니다.
