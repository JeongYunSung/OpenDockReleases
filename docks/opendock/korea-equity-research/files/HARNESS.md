# Korea Equity Research Harness

## 목적

한국 주식 리서치 결과물이 기준일, 출처, 공시 확인, 리스크, 반대 시나리오 없이 매수/매도 추천처럼 작성되는 것을 막습니다.

## 검사 범위

- `KOREA_EQUITY_RESEARCH.md`
- `.opendock/runs/korea-equity-research/**/*.md`
- `.opendock/templates/korea-equity-research/EQUITY_RESEARCH_RUN.md`

## 실행

```bash
node .opendock/harness/opendock__korea-equity-research/check.mjs
```

## 실패 예시

- 기준일 또는 출처가 없음
- 종목 코드나 시장 구분이 없음
- 공시 확인과 리스크가 없음
- "매수 추천", "상한가 간다"처럼 투자 판단을 단정함
