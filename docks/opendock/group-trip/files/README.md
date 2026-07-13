# Group Trip 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

`.opendock/templates/group-trip/RUN.md`를 새 run의 `manifest.md`로 복사하고 구성원별 직접 입력을 먼저 채웁니다. 결과는 `group-trip/` 아래에 작성해 대상 파일로 선언합니다.

```bash
node .opendock/harness/opendock__group-trip/check.mjs
node .opendock/harness/opendock__group-trip/check.mjs .opendock/runs/group-trip/<run-id>/manifest.md
```

인자 없는 실행은 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 활성으로 발견합니다. 0개면 `Ready`, 2개 이상이면 실패합니다. 인자를 주면 해당 manifest 하나만 검사합니다.

구성원 입력에는 가명, 선호, 제약, 예산과 직접 요청한 접근성 지원만 남깁니다. 민감 특성을 추정하지 말고 동의 철회 시 공유본과 run 근거에서 제거·가림 처리합니다. 결정론적 하네스와 Codex 합의 품질 검토는 별도 단계입니다.
