# Kitchen Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. 요청을 메뉴, recipe, substitution, meal plan, shopping list로 분류하고 household constraints와 pantry를 확인합니다.
2. current run manifest에 이번 target만 기록하고 분량, 대체재, leftovers, 알레르기, 보관·재가열과 근거를 확인합니다.
3. `node .opendock/harness/kitchen-ultrawork/check.mjs`를 실행하고 실패를 수정합니다.
4. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 현재 요청의 재료, 분량, 대체재, leftovers, 알레르기와 식품 안전 근거를 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
