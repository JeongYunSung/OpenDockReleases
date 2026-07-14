# Security Privacy Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. security guide와 current run에서 데이터 inventory, access control, secret, provider, prompt injection과 위협 시나리오를 검토합니다.
2. 검수와 ultrawork에서는 current run 문서에 `node .opendock/harness/security-privacy-ultrawork/check.mjs --target <run-document>`를 실행합니다. 사용자가 release 전체 검사를 명시한 경우에만 `--release`를 사용합니다.
3. 승인된 예외만 기록하고 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 이번 변경의 데이터 inventory, access control, secret, 외부 provider와 위협 시나리오를 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
