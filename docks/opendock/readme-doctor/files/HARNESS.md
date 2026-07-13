## README Doctor Harness

```bash
node .opendock/harness/opendock__readme-doctor/check.mjs
node .opendock/harness/opendock__readme-doctor/check.mjs .opendock/runs/readme-doctor/<run-id>/manifest.md
```

인자가 없으면 dock run root 바로 아래 manifest의 status만 확인합니다. `draft`, `active`, `in-progress`, `review`, `ready`는 활성 상태이며, 0개는 Ready, 1개는 검사, 2개 이상은 실패입니다. 인자가 있으면 run root 안의 해당 regular manifest 하나만 읽고 다른 run을 발견하지 않습니다.

검사 대상은 manifest와 선언된 `docs/readme-doctor/*.{md,patch,diff}`, 선택적 `README.md`뿐입니다. 저장소 전체나 선언하지 않은 source를 재귀 검사하지 않습니다.

- audit의 독자, 현재 상태, 누락·노후 항목, 검증 명령, 예제, troubleshooting, compatibility, license·contribution, 제안 변경, validation evidence를 확인합니다.
- source URL과 ISO access date, 사실·가정·권고 구분을 확인합니다.
- README를 target으로 선언했으면 설치 또는 빠른 시작, 예제, troubleshooting, compatibility, license 또는 contribution 섹션을 확인합니다.
- unsafe path, binary·과대 파일, symlink, placeholder, 실제 credential 값, 실행형 위험 지시, prompt injection, 근거 없는 보장을 거부합니다.
- 분석 evidence로 명시하고 실행하지 않았다고 기록한 위험 문자열 인용은 거부하지 않습니다.

harness는 정적이고 deterministic하지만 문서의 진실성 전부를 스스로 증명하지 않습니다. Codex acceptance와 독자 검토는 별도이며 외부 모델 결정성을 전제하지 않습니다.

