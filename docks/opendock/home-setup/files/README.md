# Home Setup 작업 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

현재 집 설정 작업은 `.opendock/runs/home-setup/<run-id>/manifest.md`로 관리하고 실제 결과는 `home-setup/` 아래에 저장합니다.

1. `.opendock/templates/home-setup/RUN.md`를 새 run의 `manifest.md`로 복사합니다.
2. `Target Files`에 결과 파일을 선언하고 실측·재고·예산·안전 근거를 채웁니다.
3. `HOME_SETUP_PLAYBOOK.md`에 따라 계획을 작성합니다. 결과 언어는 사용자의 언어를 따를 수 있습니다.
4. 활성 run을 검사합니다.

```bash
node .opendock/harness/opendock__home-setup/check.mjs
```

특정 run만 검사하려면 프로젝트 기준 상대 경로를 전달합니다.

```bash
node .opendock/harness/opendock__home-setup/check.mjs .opendock/runs/home-setup/<run-id>/manifest.md
```

활성 상태는 `draft`, `active`, `in-progress`, `review`, `ready`입니다. 자동 탐색 시 활성 run이 없으면 Ready, 둘 이상이면 실패합니다. 명시 경로 모드는 다른 run을 탐색하지 않습니다.
