# SEO Growth Quality Gate

1. `SEO_GROWTH.md`를 읽습니다.
2. `.opendock/runs/seo-growth/` 아래 이번 작업 run 문서를 확인하거나 새로 만듭니다.
3. 아래 기준으로 산출물을 검토합니다.

- 대상 독자, 검색 의도, 핵심 query, 페이지 목적을 먼저 정의합니다.
- title, description, canonical, OG/Twitter metadata는 페이지별로 구체적이어야 합니다.
- H1/H2 구조는 검색 의도와 사용자 흐름을 모두 반영합니다.
- sitemap, robots, indexing risk, redirect, 404, pagination, duplicate content를 점검합니다.
- 콘텐츠에는 주장, 근거, 예시, 다음 행동이 있어야 합니다.
- 성과 측정은 impression, CTR, conversion, assisted conversion, content decay를 구분합니다.

4. `node .opendock/harness/opendock__seo-growth/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 `Approved Exception:`으로 승인된 예외를 남깁니다.
6. 최종 응답에는 통과/실패/미검증 항목을 구분해서 보고합니다.

## 안전 경계

검색 순위 보장은 하지 않고, 통제 가능한 품질 개선과 측정 계획 중심으로 답합니다.
