# Finance Review Quality Gate

1. 검토 기간과 통화를 고정하고 source-data 포함·제외 경계를 작성합니다.
2. 원본 자료를 복제하지 않고 식별자·credential·개인 위치를 제거한 집계만 준비합니다.
3. `RUN.md`에서 dock별 run manifest를 만들고 `finance/` target을 선언합니다.
4. 수입, 지출 카테고리, 반복 결제, 목표, 예산·실제·차이를 같은 통화로 계산합니다.
5. 큰 지출과 이상 항목의 대안 설명, 확인 단계, 불확실성을 기록합니다.
6. 공식 URL·조회일과 사실·가정·조정안을 분리하고 교육 목적 경계를 명시합니다.
7. finance-review harness를 실행하고 rule id별로 수정·재실행합니다.
8. 사람 또는 Codex가 예산 적합성을 별도로 검토하며 외부 모델 재현성을 주장하지 않습니다.

