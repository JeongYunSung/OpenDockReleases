# Purchase Decision

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

이 workspace에는 근거 중심 구매 비교 절차가 설치되어 있습니다.

## 사용 순서

1. `PURCHASE_DECISION_PLAYBOOK.md`를 읽고 사용 사례와 결정 기간을 정합니다.
2. `.opendock/templates/purchase-decision/RUN.md`를 `.opendock/runs/purchase-decision/<run-id>/manifest.md`로 복사합니다.
3. Must, Should, Won't 기준과 후보, 출처 URL·조회일, 사실·가정을 기록합니다.
4. 결과 Markdown을 사용자 소유 `purchases/` 아래에 저장하고 `Target Files`에 선언합니다.
5. 다음 명령으로 현재 활성 run을 검사합니다.

```bash
node .opendock/harness/opendock__purchase-decision/check.mjs
```

특정 run만 검사하려면 project-relative manifest 경로를 전달합니다.

```bash
node .opendock/harness/opendock__purchase-decision/check.mjs .opendock/runs/purchase-decision/<run-id>/manifest.md
```

실패하면 rule id가 가리키는 증거, 경로, 개인정보 문제를 수정하고 같은 명령을 다시 실행합니다. 하네스 통과 후에도 추천의 실제 적합성은 사람 또는 Codex가 별도로 검토합니다.

`purchases/**`는 사용자 소유이며 OpenDock update나 uninstall 대상이 아닙니다.
