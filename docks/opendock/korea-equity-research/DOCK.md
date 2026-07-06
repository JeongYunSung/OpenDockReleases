# Korea Equity Research

한국 주식 리서치를 공시, 거래소 데이터, 기준일, 리스크 중심으로 정리하게 해주는 dock입니다.

## 설치 후 생기는 것

- `KOREA_EQUITY_RESEARCH.md`: KRX, OpenDART, 가격/공시/재무 확인 기준
- `.opendock/templates/korea-equity-research/EQUITY_RESEARCH_RUN.md`: 종목 리서치 run 템플릿
- `.opendock/harness/opendock__korea-equity-research/check.mjs`: 투자 추천성 표현과 출처 누락 검사
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`: AI 리서치 지침

## 주요 출처

- KRX Open API: https://openapi.krx.co.kr/
- KRX 정보데이터시스템: https://data.krx.co.kr/
- 금융위원회 KRX 상장종목정보: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15094775
- 금융위원회 주식시세정보: https://www.data.go.kr/data/15094808/openapi.do
- OpenDART: https://opendart.fss.or.kr/intro/main.do
- KIND: https://kind.krx.co.kr/main.do?method=loadInitPage&scrnmode=3
- 한국은행 ECOS: https://ecos.bok.or.kr/api/

## 원칙

이 dock은 매수/매도 추천을 만들지 않습니다. 기준일, 종목 코드, 시장 구분, 공시 확인, 리스크, 반대 시나리오, 데이터 한계를 갖춘 리서치 초안을 만듭니다.

## 프롬프트 예시

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

핵심은 종목, 단축코드, 시장, 기준일을 먼저 고정하는 것입니다. 답변은 추천이 아니라 공시 기반 리서치와 리스크 체크리스트여야 합니다.
