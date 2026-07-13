# Design System 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

`DESIGN_SYSTEM_PLAYBOOK.md`를 읽고 `.opendock/templates/design-system/RUN.md`로 `.opendock/runs/design-system/<run-id>/manifest.md`를 만듭니다. 기준 문서와 보조 token 파일은 `design-system/` 아래에 둡니다.

```bash
node .opendock/harness/opendock__design-system/check.mjs
node .opendock/harness/opendock__design-system/check.mjs .opendock/runs/design-system/<run-id>/manifest.md
```

인자 없이 실행하면 직계 run manifest의 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 찾습니다. active run 0개는 `Ready`, 2개 이상은 실패입니다. 인자가 있으면 정확히 그 manifest만 검사합니다.

Harness는 선택한 manifest와 `Target Files`만 읽습니다. user-created `design-system/` 산출물은 OpenDock 설치 파일이 아니며 manifest에서 명시된 현재 run 대상만 검사됩니다.
