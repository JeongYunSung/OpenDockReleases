# Data Ultrawork

SQL 안전성, 파괴적인 query, timezone 명확성, metric 정의, PII masking, dashboard 비용을 확인하는 데이터 품질 게이트입니다.

## 확인하는 것

- 공유 분석용 SQL에서는 `select *`를 피해야 합니다.
- 파괴적인 query에는 review와 rollback note가 필요합니다.
- 날짜와 timezone 가정은 명확히 적어야 합니다.
- dashboard에서 쓰기 전에 metric 정의를 문서화해야 합니다.
- PII column은 masking하거나 제외해야 합니다.
- dashboard query 비용과 cardinality를 검토해야 합니다.

데이터와 분석 산출물의 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
