# Korea Macro Research Harness

## 목적

한국 거시경제 리서치 결과물이 출처, 기준일, 지표 정의, 단위, 해석 한계 없이 작성되는 것을 막습니다.

## 검사 범위

- `KOREA_MACRO_RESEARCH.md`
- `.opendock/runs/korea-macro-research/**/*.md`
- `.opendock/templates/korea-macro-research/MACRO_RESEARCH_RUN.md`

## 실행

```bash
node .opendock/harness/opendock__korea-macro-research/check.mjs
```

## 실패 예시

- 출처 또는 기준일이 없음
- 지표 정의, 단위, 공표 주기가 없음
- 계절조정 여부나 전년동월비/전월비 차이가 없음
- 한계와 반대 시나리오가 없음
