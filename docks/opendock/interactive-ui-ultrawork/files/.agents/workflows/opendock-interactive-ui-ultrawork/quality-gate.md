# Interactive UI Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. playbook을 읽고 trigger, feedback, 완료 조건, 복구 경로, focus 계약과 구현 tier를 정합니다.
2. run manifest에 이번 target과 state matrix, input parity, motion, async, cleanup, overflow 증거를 기록합니다.
3. `node .opendock/harness/interactive-ui-ultrawork/check.mjs`를 실행하고 실패를 수정합니다.
4. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 이번 interaction의 상태표, keyboard·touch parity, reduced motion, async failure와 cleanup을 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
