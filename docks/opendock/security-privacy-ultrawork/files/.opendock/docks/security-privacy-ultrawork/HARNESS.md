# Security Privacy Ultrawork Harness

## 실행 범위

이 정밀 검수 문서는 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 적용합니다. 평소 요청에서는 현재 작업의 명시 target 또는 활성 run manifest target만 빠르게 확인하고 프로젝트 전체를 재귀 검사하지 않습니다.

이 harness는 Security Privacy Ultrawork 작업 결과를 점검합니다. 전체 repo를 무차별로 스캔하지 않고 아래 범위만 봅니다.

## 검사 범위

- `.opendock/docks/security-privacy-ultrawork/SECURITY_PRIVACY.md`
- `.opendock/runs/security-privacy/**/*.md`
- `SECURITY_PRIVACY_RUN.md`에서 파생된 run 문서

## 필수 기준

- Run 문서에는 `데이터 인벤토리` section이 있어야 합니다.
- Run 문서에는 `접근 제어` section이 있어야 합니다.
- Run 문서에는 `시크릿 처리` section이 있어야 합니다.
- Run 문서에는 `프라이버시 리스크` section이 있어야 합니다.
- Run 문서에는 `위협 시나리오` section이 있어야 합니다.
- Run 문서에는 `수정 계획` section이 있어야 합니다.
- Run 문서에는 `다음 행동` section이 있어야 합니다.

## 실행

```bash
node .opendock/harness/security-privacy-ultrawork/check.mjs
```

## 실패 시

1. 실패 메시지의 file과 rule을 확인합니다.
2. 누락된 section 또는 위험 문구를 수정합니다.
3. 수정할 수 없는 항목은 `Approved Exception:`으로 이유와 승인자를 남깁니다.
4. 다시 harness를 실행합니다.

## 안전 경계

- 이 harness는 secret 값을 출력하지 않습니다.
- `.git`, `node_modules`, `.opendock/tools`, `.opendock/runtimes` 같은 무거운 디렉터리를 보지 않습니다.
- 보안 검사는 발견 가능성을 높이는 절차이며, 침투테스트나 법적 컴플라이언스 보증으로 표현하지 않습니다.
