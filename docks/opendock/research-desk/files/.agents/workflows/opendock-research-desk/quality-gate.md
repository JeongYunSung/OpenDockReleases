# Research Desk Quality Gate

1. `RESEARCH_DESK.md`를 읽습니다.
2. `.opendock/runs/research-desk/` 아래 이번 작업 run 문서를 확인하거나 새로 만듭니다.
3. 아래 기준으로 산출물을 검토합니다.

- 리서치 질문, 의사결정 맥락, 필요한 최신성, 제외 범위를 먼저 정합니다.
- 출처는 primary/secondary/community/opinion으로 구분합니다.
- 주장과 근거를 분리하고, 각 근거에는 출처, 날짜, 신뢰도, 반대 증거를 기록합니다.
- 불확실하거나 오래된 정보는 결론이 아니라 gap으로 표시합니다.
- 최종 답변은 recommendation, confidence, next research action을 포함합니다.
- 실시간/법률/의료/금융 판단은 최신 출처 확인과 전문가 검토 필요성을 표시합니다.

4. `node .opendock/harness/opendock__research-desk/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 `Approved Exception:`으로 승인된 예외를 남깁니다.
6. 최종 응답에는 통과/실패/미검증 항목을 구분해서 보고합니다.

## 안전 경계

출처를 확인하지 못한 내용을 사실처럼 단정하지 않습니다.
