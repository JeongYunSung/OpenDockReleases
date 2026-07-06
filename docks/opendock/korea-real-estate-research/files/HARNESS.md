# Korea Real Estate Research Harness

## 목적

한국 부동산 리서치 결과물이 출처, 기준일, 지역, 거래유형, 한계, 반대 시나리오 없이 단정적으로 작성되는 것을 막습니다.

## 검사 범위

- `KOREA_REAL_ESTATE_RESEARCH.md`
- `.opendock/runs/korea-real-estate-research/**/*.md`
- `.opendock/templates/korea-real-estate-research/REAL_ESTATE_RESEARCH_RUN.md`

## 실행

```bash
node .opendock/harness/opendock__korea-real-estate-research/check.mjs
```

## 실패 예시

- 출처 URL 또는 기준일이 없음
- 지역, 기간, 거래유형이 없음
- 데이터 한계와 반대 시나리오가 없음
- "지금 사라", "무조건 오른다"처럼 투자 판단을 단정함
