# SEO Growth Harness

이 harness는 SEO Growth 작업 결과를 점검합니다. 전체 repo를 무차별로 스캔하지 않고 아래 범위만 봅니다.

## 검사 범위

- `SEO_GROWTH.md`
- `.opendock/runs/seo-growth/**/*.md`
- `SEO_RUN.md`에서 파생된 run 문서

## 필수 기준

- Run 문서에는 `대상 독자` section이 있어야 합니다.
- Run 문서에는 `검색 의도` section이 있어야 합니다.
- Run 문서에는 `메타데이터` section이 있어야 합니다.
- Run 문서에는 `기술 SEO` section이 있어야 합니다.
- Run 문서에는 `콘텐츠 계획` section이 있어야 합니다.
- Run 문서에는 `측정 지표` section이 있어야 합니다.
- Run 문서에는 `다음 행동` section이 있어야 합니다.

## 실행

```bash
node .opendock/harness/opendock__seo-growth/check.mjs
```

## 실패 시

1. 실패 메시지의 file과 rule을 확인합니다.
2. 누락된 section 또는 위험 문구를 수정합니다.
3. 수정할 수 없는 항목은 `Approved Exception:`으로 이유와 승인자를 남깁니다.
4. 다시 harness를 실행합니다.

## 안전 경계

- 이 harness는 secret 값을 출력하지 않습니다.
- `.git`, `node_modules`, `.opendock/tools`, `.opendock/runtimes` 같은 무거운 디렉터리를 보지 않습니다.
- 검색 순위 보장은 하지 않고, 통제 가능한 품질 개선과 측정 계획 중심으로 답합니다.
