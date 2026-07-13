# Life Admin

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

이 workspace에는 개인정보를 최소화하는 생활 행정 관리 절차가 설치되어 있습니다.

## 사용 순서

1. `LIFE_ADMIN_PLAYBOOK.md`를 읽고 관리 범위와 기간을 정합니다.
2. `.opendock/templates/life-admin/RUN.md`를 `.opendock/runs/life-admin/<run-id>/manifest.md`로 복사합니다.
3. 구독, 갱신, 문서 metadata, 보증, 반복 업무, 담당자·날짜·상태, 알림을 채웁니다.
4. 결과 Markdown을 사용자 소유 `life-admin/` 아래에 저장하고 `Target Files`에 선언합니다.
5. 현재 활성 run 또는 명시한 run을 검사합니다.

```bash
node .opendock/harness/opendock__life-admin/check.mjs
node .opendock/harness/opendock__life-admin/check.mjs .opendock/runs/life-admin/<run-id>/manifest.md
```

실패 rule에 따라 민감정보를 가리고 누락된 증거를 보완한 뒤 재실행합니다. 하네스 통과 후 실제 알림 일정은 사람 또는 Codex가 별도로 검토합니다.

`life-admin/**`는 사용자 소유이며 OpenDock update나 uninstall 대상이 아닙니다.
