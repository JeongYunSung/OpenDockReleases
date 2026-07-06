# 한국 주식 리서치

이 프로젝트에는 `opendock/korea-equity-research`가 설치되어 있습니다.

## 빠른 시작

1. `KOREA_EQUITY_RESEARCH.md`를 읽습니다.
2. `.opendock/templates/korea-equity-research/EQUITY_RESEARCH_RUN.md`를 `.opendock/runs/korea-equity-research/<이름>.md`로 복사합니다.
3. 종목, 시장, 기준일, 출처, 공시 확인 범위를 채웁니다.
4. 결과를 작성한 뒤 아래 검사를 실행합니다.

```bash
node .opendock/harness/opendock__korea-equity-research/check.mjs
```

## 보고서 기준

보고서는 KRX, OpenDART, 공공데이터, 한국은행 같은 출처를 명확히 보여줘야 합니다. 결론은 리서치 의견으로만 쓰고 매수/매도 추천처럼 보이는 문장은 쓰지 않습니다.

## 이렇게 물어보세요

이 dock은 "이 종목 사도 돼?"에 바로 답하는 도구가 아닙니다. 대신 종목, 기준일, 공시, 가격 흐름, 리스크, 반대 시나리오를 같은 형식으로 정리하게 합니다.

좋은 프롬프트 공식:

```text
opendock/korea-equity-research 기준으로 분석해줘.

대상:
질문:
범위:
- 종목명:
- 단축코드:
- 시장:
- 기준일:
- 비교 기간:

요구사항:
- KRX 기준 가격/거래량 흐름을 봐줘.
- OpenDART 또는 KIND 공시 확인을 포함해줘.
- 상승 시나리오와 하락 시나리오를 둘 다 써줘.
- 매수/매도 추천은 하지 말고 리스크와 추가 확인 질문을 정리해줘.
```

종목 예시:

```text
opendock/korea-equity-research 기준으로 분석해줘.

대상: 삼성전자 005930
질문: 최근 투자 판단 전에 확인해야 할 포인트를 정리해줘.
기준일: 2026-07-06

반드시 포함:
- KRX 기준 가격/거래량 흐름
- OpenDART 최근 공시 확인
- 실적, 현금흐름, 부채 관련 핵심 지표
- 상승 시나리오
- 하락 시나리오
- 내가 추가로 확인해야 할 질문

매수/매도 추천이나 목표가 보장은 하지 말고 리서치 형태로 정리해줘.
```

섹터 비교 예시:

```text
opendock/korea-equity-research 기준으로 비교해줘.

대상: 국내 2차전지 관련 대형주 3개
질문: 최근 공시와 실적 리스크를 비교하고 싶어.

요구사항:
- 종목별 기준일을 맞춰줘.
- 공시 이벤트와 가격 흐름을 분리해줘.
- 밸류에이션 단정은 피하고 확인해야 할 지표를 정리해줘.
- 투자 추천 없이 리스크 테이블로 정리해줘.
```
