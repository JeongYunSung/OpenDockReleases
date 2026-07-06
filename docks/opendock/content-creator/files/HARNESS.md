# Content Creator Harness

이 harness는 Content Creator 작업 결과를 점검합니다. 전체 repo를 무차별로 스캔하지 않고 아래 범위만 봅니다.

## 검사 범위

- `CONTENT_CREATOR.md`
- `.opendock/runs/content-creator/**/*.md`
- `CONTENT_RUN.md`에서 파생된 run 문서

## 필수 기준

- Run 문서에는 `대상 독자` section이 있어야 합니다.
- Run 문서에는 `콘텐츠 브리프` section이 있어야 합니다.
- Run 문서에는 `채널 구조` section이 있어야 합니다.
- Run 문서에는 `제작 초안` section이 있어야 합니다.
- Run 문서에는 `업로드 체크리스트` section이 있어야 합니다.
- Run 문서에는 `근거와 권리` section이 있어야 합니다.
- Run 문서에는 `재활용 계획` section이 있어야 합니다.

## 실행

```bash
node .opendock/harness/opendock__content-creator/check.mjs
```

## 실패 시

1. 실패 메시지의 file과 rule을 확인합니다.
2. 누락된 section 또는 위험 문구를 수정합니다.
3. 수정할 수 없는 항목은 `Approved Exception:`으로 이유와 승인자를 남깁니다.
4. 다시 harness를 실행합니다.

## 안전 경계

- 이 harness는 secret 값을 출력하지 않습니다.
- `.git`, `node_modules`, `.opendock/tools`, `.opendock/runtimes` 같은 무거운 디렉터리를 보지 않습니다.
- 저작권 있는 본문/이미지/음원을 그대로 재사용하지 않고, source note와 rights note를 남깁니다.
