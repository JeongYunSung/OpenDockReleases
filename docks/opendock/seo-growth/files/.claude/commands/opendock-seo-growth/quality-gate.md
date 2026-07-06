# SEO Growth Quality Gate

현재 작업이 SEO Growth 산출물과 관련될 때 이 command를 사용합니다.

1. `SEO_GROWTH.md`를 읽고 검색 의도와 성장 목표를 확인합니다.
2. `.opendock/runs/seo-growth/<run-id>.md`가 없으면 만들고, 있으면 현재 작업 내용을 업데이트합니다.
3. `HARNESS.md` 기준으로 메타태그, sitemap, robots, 콘텐츠 브리프, 키워드 구조, OG 이미지, 측정 지표를 점검합니다.
4. 아래 harness를 실행합니다.

```bash
node .opendock/harness/opendock__seo-growth/check.mjs
```

5. 실패 항목은 최종 응답 전에 수정합니다. 수정하지 않을 항목은 human-approved exception으로 이유와 승인자를 남깁니다.

안전 경계: 검색 순위 보장은 하지 않고, 통제 가능한 품질 개선과 측정 계획 중심으로 답합니다.
