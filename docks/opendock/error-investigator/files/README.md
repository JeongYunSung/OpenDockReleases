## OpenDock Error Investigator

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

현재 프로젝트의 오류를 증거 중심으로 조사할 때 사용하는 작업 안내입니다. 조사 산출물은 `debug/*.md`에 두며, OpenDock은 이 사용자 산출물을 소유하거나 삭제하지 않습니다.

1. `.opendock/templates/error-investigator/RUN.md`를 `.opendock/runs/error-investigator/<run-id>/manifest.md`로 복사합니다.
2. run manifest의 `Target Files`에 이번 조사 보고서만 기록합니다.
3. `ERROR_INVESTIGATION_PLAYBOOK.md`에 따라 재현, 가설, 실험, 근본 원인, 최소 수정, 회귀 테스트, 예방·rollback 근거를 작성합니다.
4. 아래 명령으로 검사하고 실패 항목을 수정한 뒤 다시 실행합니다.

```bash
node .opendock/harness/opendock__error-investigator/check.mjs
```

특정 run만 검사하려면 project-relative manifest 경로를 인자로 전달합니다. 원문 로그와 비밀값은 수집하지 말고, 집·숙소·여행 일정·개인 연락처·정확한 위치 등 개인 데이터는 최소화하고 마스킹합니다. 정적 harness 통과와 Codex 수용 검토는 별도 절차입니다.
