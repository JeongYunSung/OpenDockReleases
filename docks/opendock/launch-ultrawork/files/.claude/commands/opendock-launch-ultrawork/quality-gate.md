# Launch Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. launch guide와 current run 문서를 읽고 가치 제안, CTA, 가격, onboarding, 핵심 흐름, SEO·분석과 blocker를 검토합니다.
2. `node .opendock/harness/launch-ultrawork/check.mjs --release`를 실행하고 승인된 예외만 기록합니다.
3. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 이번 출시 산출물의 가치 제안, CTA, 신뢰 근거, 핵심 흐름, blocker와 rollback을 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
