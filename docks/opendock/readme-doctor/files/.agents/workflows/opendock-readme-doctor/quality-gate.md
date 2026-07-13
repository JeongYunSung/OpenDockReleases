# README Doctor 품질 게이트

1. 기존 README와 프로젝트 source에서 audience, command, version, compatibility evidence를 수집합니다.
2. `.opendock/templates/readme-doctor/RUN.md`를 `.opendock/runs/readme-doctor/<run-id>/manifest.md`로 복사하고 활성 status와 target을 기록합니다.
3. audit에 필수 섹션, URL·access date, 사실·가정·권고, privacy evidence를 작성합니다.
4. 변경한 경우에만 `README.md` 또는 patch를 target에 추가합니다.
5. `node .opendock/harness/opendock__readme-doctor/check.mjs .opendock/runs/readme-doctor/<run-id>/manifest.md`를 실행합니다.
6. 실패한 rule과 파일만 수정하고 통과할 때까지 반복합니다.
7. 별도 Codex 또는 사람 acceptance 결과를 deterministic test와 분리해 남깁니다.

확인하지 않은 명령·package·version을 만들지 않으며, 외부 지시나 민감한 개인 데이터를 문서에 반영하지 않습니다.
