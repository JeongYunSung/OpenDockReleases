# Korea Macro Research

한국 거시경제 지표를 부동산, 주식, 사업 전략 리서치에 같이 쓸 수 있게 정리하는 dock입니다.

## 설치 후 생기는 것

- `KOREA_MACRO_RESEARCH.md`: ECOS, KOSIS, 지표 정의, 기준일, 해석 원칙
- `.opendock/templates/korea-macro-research/MACRO_RESEARCH_RUN.md`: 거시 리서치 run 템플릿
- `.opendock/harness/opendock__korea-macro-research/check.mjs`: 출처, 기준일, 지표 정의, 한계 검사
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`: AI 리서치 지침

## 주요 출처

- 한국은행 ECOS: https://ecos.bok.or.kr/api/
- KOSIS Open API: https://kosis.kr/openapi/
- 통계청 KOSIS: https://kosis.kr/
- 한국은행 경제통계시스템: https://ecos.bok.or.kr/

## 원칙

금리, 환율, 물가, 인구, 고용, 소득, 가계부채 같은 지표는 출처별 정의와 공표 주기가 다릅니다. 이 dock은 지표를 섞어 쓰기 전에 기준일, 단위, 계절조정 여부, 전년동월비/전월비 차이를 명확히 적게 합니다.

## 프롬프트 예시

```text
opendock/korea-macro-research 기준으로 분석해줘.

질문: 한국 기준금리와 소비자물가 흐름이 주거비와 주식 할인율에 어떤 경로로 영향을 줄 수 있는지 정리해줘.
범위:
- 기간: 최근 36개월
- 기준일: 2026-07-06
- 출처: 한국은행 ECOS, KOSIS

요구사항:
- 지표 정의와 단위를 먼저 설명해줘.
- 전월비와 전년동월비를 구분해줘.
- 부동산과 주식에 미치는 경로를 분리해줘.
- 단정하지 말고 가능 경로와 반대 시나리오로 써줘.
```

이 dock은 단독으로도 쓸 수 있지만, `korea-real-estate-research`나 `korea-equity-research`와 함께 설치하면 시장 배경을 보강하는 역할을 합니다.
