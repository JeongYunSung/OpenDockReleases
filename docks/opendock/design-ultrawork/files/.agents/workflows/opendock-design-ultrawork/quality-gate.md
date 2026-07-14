# Design Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. `DESIGN.md`와 namespaced design guide를 읽고 layout, first gaze, primary action, palette role, token, state와 접근성 계획을 확정합니다.
2. `.opendock/templates/design/DESIGN_RUN.md`로 run manifest를 만들고 이번 작업의 target만 기록합니다.
3. StyleSeed 기준과 실제 UI 상태를 검토한 뒤 `node .opendock/harness/design-ultrawork/check.mjs`를 실행합니다.
4. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 이번 UI의 layout, palette, token, 상태, 접근성과 StyleSeed 일관성을 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
