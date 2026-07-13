# UX Audit 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

`UX_AUDIT_PLAYBOOK.md`를 읽고 `.opendock/templates/ux-audit/RUN.md`를 `.opendock/runs/ux-audit/<run-id>/manifest.md`로 복사합니다. 기준 보고서는 `audits/ux/` 아래에 만들고 manifest의 `Target Files`에 이번 run의 산출물만 적습니다.

```bash
node .opendock/harness/opendock__ux-audit/check.mjs
node .opendock/harness/opendock__ux-audit/check.mjs .opendock/runs/ux-audit/<run-id>/manifest.md
```

인자가 없으면 dock run 디렉터리에서 active 상태를 찾습니다. `draft`, `active`, `in-progress`, `review`, `ready`가 active로 계산되며, active run이 없으면 설치 준비 상태인 `Ready`로 통과합니다. 인자를 주면 정확히 그 manifest만 검사합니다.

Harness는 active manifest와 선언된 target만 읽습니다. 다른 프로젝트 파일이나 과거 감사 결과는 검사하지 않습니다.
