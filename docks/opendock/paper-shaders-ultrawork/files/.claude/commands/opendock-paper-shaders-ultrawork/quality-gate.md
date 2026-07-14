# Paper Shaders Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. guide와 catalog에서 목적에 맞는 후보 2~3개를 제시하고, 사용자가 선택하기 전에는 적용하지 않습니다.
2. 선택 후 실제 dependency, component, prop, 값 범위, contrast와 motion을 확인합니다.
3. `node .opendock/harness/paper-shaders-ultrawork/check.mjs --release`를 실행하고 실패를 수정합니다.
4. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 선택된 shader, 실제 dependency, documented prop, 값 범위, contrast와 motion 부담을 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
