# Launch Ultrawork Quality Gate

1. `LAUNCH.md`를 읽습니다.
2. `.opendock/runs/launch/` 아래 이번 작업 run 문서를 확인하거나 새로 만듭니다.
3. 아래 기준으로 산출물을 검토합니다.

- 랜딩 페이지에는 대상 고객, 핵심 문제, 가치 제안, CTA, 신뢰 근거가 있어야 합니다.
- 가격/플랜은 포함 범위, 제한, 과금 주기, 환불/해지 경로가 명확해야 합니다.
- 약관/개인정보/쿠키/동의 문구는 법률 자문이 아니라 누락 체크와 검토 필요 표시로 다룹니다.
- 온보딩은 첫 성공 행동까지 5분 안에 도달할 수 있어야 합니다.
- 결제/회원가입/비밀번호/에러/빈 상태/로딩 상태를 실제 사용자 흐름으로 점검합니다.
- SEO metadata, OG image, sitemap, robots, analytics event, conversion funnel을 확인합니다.
- 출시 blocker는 owner, severity, fix path, release decision으로 기록합니다.

4. `node .opendock/harness/opendock__launch-ultrawork/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 `Approved Exception:`으로 승인된 예외를 남깁니다.
6. 최종 응답에는 통과/실패/미검증 항목을 구분해서 보고합니다.

## 안전 경계

법률/세무/결제 규정의 최종 판단은 담당 전문가 검토 대상으로 표시합니다.
