# Korea Real Estate Research

한국 부동산 리서치를 공식 데이터 기준으로 정리하게 해주는 dock입니다.

## 설치 후 생기는 것

- `KOREA_REAL_ESTATE_RESEARCH.md`: 공식 출처, 분석 순서, 금지 표현, 체크리스트
- `.opendock/templates/korea-real-estate-research/REAL_ESTATE_RESEARCH_RUN.md`: 리서치 run 템플릿
- `.opendock/harness/opendock__korea-real-estate-research/check.mjs`: 결과물 검사 하네스
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`: AI가 부동산 리서치를 수행할 때 따라야 할 기준

## 주요 출처

- 국토교통부 실거래가 공개시스템: https://rt.molit.go.kr/
- 국토교통부 아파트 매매 실거래가 API: https://www.data.go.kr/data/15126469/openapi.do
- 국토교통부 아파트 전월세 실거래가 API: https://www.data.go.kr/data/15126474/openapi.do
- 한국부동산원 R-ONE Open API: https://www.reb.or.kr/r-one/portal/openapi/openApiIntroPage.do
- 한국은행 ECOS: https://ecos.bok.or.kr/api/
- KOSIS Open API: https://kosis.kr/openapi/

## 원칙

이 dock은 매수, 매도, 투자 추천을 만들기 위한 도구가 아닙니다. 지역, 기간, 거래유형, 면적, 출처, 기준일, 데이터 한계를 분명히 적고 의사결정에 필요한 리서치 초안을 만드는 데 사용합니다.

## 프롬프트 예시

```text
opendock/korea-real-estate-research 기준으로 분석해줘.

대상: 서울 마포구 아현동 A아파트
질문: 최근 실거래가와 거래량 추이가 어떤지 알고 싶어.
범위:
- 주택유형: 아파트
- 거래유형: 매매
- 면적: 전용 84m2 중심
- 기간: 최근 24개월
- 기준일: 오늘 조회 가능한 최신 데이터 기준

요구사항:
- 국토교통부 실거래가 기준으로 봐줘.
- 호가와 실거래가는 분리해줘.
- 상승/하락 시나리오를 둘 다 써줘.
- 투자 추천은 하지 말고 추가로 확인해야 할 질문을 정리해줘.
```

토지나 상권도 같은 방식으로 묻습니다. 대상, 기간, 자산유형, 출처, 기준일, 리스크를 먼저 고정하고, 결론은 매수 추천이 아니라 비교와 확인 질문으로 정리합니다.
