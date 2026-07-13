## Error Investigator Harness

실행 경로는 `.opendock/harness/opendock__error-investigator/check.mjs`입니다.

```bash
node .opendock/harness/opendock__error-investigator/check.mjs
node .opendock/harness/opendock__error-investigator/check.mjs .opendock/runs/error-investigator/<run-id>/manifest.md
```

인자가 없으면 `.opendock/runs/error-investigator/`의 바로 아래 run manifest만 읽습니다. `draft`, `active`, `in-progress`, `review`, `ready`를 활성 상태로 보며, 활성 run이 없으면 Ready, 하나면 검사, 둘 이상이면 실패합니다. 인자가 있으면 dock run root 안의 해당 regular manifest 하나만 검사하고 다른 run을 발견하지 않습니다.

검사 범위는 활성 또는 명시 manifest와 그 `Target Files`에 선언된 `debug/*.md`뿐입니다. 저장소 전체를 재귀 탐색하지 않으며 관련 없는 잘못된 파일은 결과에 영향을 주지 않습니다.

다음 항목을 실패로 처리합니다.

- 절대 경로, `..`, NUL, 보호 디렉터리, 지원하지 않는 확장자, 과대 파일, binary, symlink segment
- 누락된 조사·검증·개인정보 evidence와 보고서 필수 섹션
- 미완성 placeholder, 실제로 보이는 credential 값, 실행 지시 형태의 파괴적 명령, 상위 지시를 바꾸려는 prompt injection, 근거 없는 보장
- 마스킹되지 않은 로그와 최소 데이터·개인정보 처리 근거 누락

분석용으로 명확히 표시하고 실행하지 않았다고 기록한 위험 문자열 인용은 명령으로 취급하지 않습니다. 이 구분은 정적 휴리스틱이며 실행 안전성을 완전히 증명하지 않습니다. Codex acceptance는 이 deterministic 검사와 별도이며 외부 모델의 결정성을 전제하지 않습니다.

