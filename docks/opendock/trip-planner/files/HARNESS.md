# Trip Planner 하네스 계약

## 실행

```bash
node .opendock/harness/opendock__trip-planner/check.mjs
node .opendock/harness/opendock__trip-planner/check.mjs .opendock/runs/trip-planner/<run-id>/manifest.md
```

인자가 없으면 `.opendock/runs/trip-planner/`의 바로 아래 run 디렉터리만 확인해 활성 manifest를 찾습니다. 활성 실행이 없으면 `Ready`, 하나면 검사, 둘 이상이면 실패합니다. 인자가 있으면 안전한 도크 전용 상대 경로인지 확인한 뒤 그 manifest만 검사합니다.

## 검사 범위

- 활성 또는 명시된 `manifest.md`
- 해당 manifest의 `대상 파일 (Target Files)`에 선언된 `trips/` 아래 텍스트 파일

저장소 전체, 선언되지 않은 파일, 다른 도크 run은 재귀 검사하지 않습니다.

## 주요 규칙

- 절대 경로, 상위 경로 이동, 금지 디렉터리, 심볼릭 링크, 비정규 파일, 바이너리 확장자와 과대 파일을 거부합니다.
- 여행자·날짜·예산·선호·제약, 최신 출처, 사실·가정·추천 구분과 도메인별 근거 섹션을 요구합니다.
- 일정, 동선 현실성, 예산 내역, 예약 재확인, 짐, 날씨·휴무, 우천 대안, 안전·비상, 미결정 사항을 확인합니다.
- 활성 근거와 대상 파일의 미완성 표시, 실제 비밀값 형태, 명령형 prompt injection, 실행형 파괴 명령과 근거 없는 보장을 거부합니다.
- 인용문, 분석용 코드 예시와 명시적으로 가린 값은 실행 지시나 실제 비밀값으로 간주하지 않습니다.

## 한계

하네스는 Node 내장 모듈만 사용하며 네트워크 요청, 외부 프로세스 실행, 파일 수정을 하지 않습니다. 출처 내용의 진실성, 실제 가격·예약 가능성, 여행의 안전 또는 Codex 판단의 결정론은 보장하지 않으므로 별도 검토가 필요합니다.
