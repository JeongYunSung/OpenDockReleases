# Moving Harness

이 하네스는 자동 탐색 시 `.opendock/runs/moving/`의 직접 하위 `manifest.md`만 상태 판별에 사용하고, 정확히 하나인 활성 manifest와 그 `Target Files`에 선언된 파일만 내용 검사합니다. 저장소 전체, 비활성 run의 결과, 미선언 `moving/` 파일은 검사하지 않습니다.

## 실행

```bash
node .opendock/harness/opendock__moving/check.mjs
```

```bash
node .opendock/harness/opendock__moving/check.mjs .opendock/runs/moving/<run-id>/manifest.md
```

인자가 없을 때 활성 상태 `draft`, `active`, `in-progress`, `review`, `ready`가 0개이면 Ready, 1개이면 검증, 2개 이상이면 실패합니다. 상대 manifest 경로를 하나 전달하면 그 파일만 검증하고 다른 run은 탐색하지 않습니다.

## 검사 범위

- manifest의 `Target Files`와 이사 도메인 증거 section
- `moving/` 범위, 상대 경로, 허용된 UTF-8 텍스트 형식, 파일 수와 크기
- 절대 경로, traversal, 보호 경로, symlink segment, 누락·binary·과대 파일
- 이사 기본 정보와 D-30, D-14, D-7, D-1, 당일, 이사 후 일정
- 업체·견적, 서비스 이전, 주소 변경, 재고, 치수, 처분·기부, 예산, 귀중품, 비상 계획, 완료 체크리스트
- 출처 URL·조회일과 사실·가정·권고 구분
- 미완성 표식, 실제 secret처럼 보이는 값, 능동형 prompt injection, 파괴 명령, 근거 없는 절대 보장
- 주민등록번호와 출입 비밀번호 등 불필요한 민감정보

안전 분석에서 위험 문자열을 인라인 코드, fenced code, blockquote로 인용하거나 실행 금지 근거로 설명한 경우에는 능동 지시로 판단하지 않습니다. 반면 실제 credential 형태의 할당값은 인용 형식이어도 실패할 수 있습니다.

실패 메시지의 `[rule-id]`를 기준으로 manifest 또는 선언된 대상만 수정한 뒤 같은 명령을 다시 실행합니다. 이 검사는 외부 네트워크나 프로세스를 사용하지 않고 파일을 변경하지 않습니다.
