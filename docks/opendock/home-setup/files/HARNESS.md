# Home Setup Harness

자동 탐색 시 이 하네스는 `.opendock/runs/home-setup/`의 직접 하위 `manifest.md`만 상태 판별에 사용하고, 정확히 하나인 활성 manifest와 그 manifest가 선언한 `Target Files`만 내용 검사합니다. 저장소 전체, 비활성 run의 결과, 미선언 파일은 검사하지 않습니다.

## 실행

```bash
node .opendock/harness/opendock__home-setup/check.mjs
```

```bash
node .opendock/harness/opendock__home-setup/check.mjs .opendock/runs/home-setup/<run-id>/manifest.md
```

인자가 없을 때 `draft`, `active`, `in-progress`, `review`, `ready` 상태가 0개이면 Ready, 1개이면 검증, 2개 이상이면 실패합니다. manifest 상대 경로를 하나 전달하면 해당 파일만 검증하고 다른 run은 탐색하지 않습니다.

## 검사 범위

- manifest의 `Target Files`와 집 설정 도메인 증거 section
- `home-setup/` 범위, 안전한 상대 경로, UTF-8 텍스트 형식, 파일 수와 크기
- 절대 경로, traversal, 보호 경로, symlink segment, 누락·binary·과대 파일
- 가구·스타일·제약, 방별 치수, 보유·필요 재고, 기능 구역과 우선순위
- 방별·범주별 예산, 구매 순서, fit·clearance, 전원·네트워크·안전, 보류 목록과 결정 기록
- 치수와 예산 가정이 없는 추천, 출처 URL·조회일 누락, 사실·가정·권고 혼합
- 미완성 표식, 실제 secret처럼 보이는 값, 능동형 prompt injection, 파괴 명령, 근거 없는 절대 보장
- 주민등록번호, 출입·Wi-Fi 비밀번호 등 불필요한 민감정보

위험 문자열을 코드나 blockquote로 인용하거나 실행 금지 분석으로 설명한 경우에는 능동 지시로 판단하지 않습니다. 실제 credential 형태의 값은 문맥과 관계없이 유출 위험으로 실패할 수 있습니다.

실패 `[rule-id]`를 기준으로 manifest 또는 선언된 대상만 수정한 뒤 재실행합니다. 이 검사는 네트워크나 외부 프로세스를 사용하지 않고 파일을 변경하지 않습니다.
