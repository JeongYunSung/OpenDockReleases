# Finance Review

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

이 workspace에는 개인정보를 제거한 집계 기반 예산 검토 절차가 설치되어 있습니다.

## 사용 순서

1. `FINANCE_REVIEW_PLAYBOOK.md`를 읽고 기간, 통화, source-data boundary를 정합니다.
2. `.opendock/templates/finance-review/RUN.md`를 `.opendock/runs/finance-review/<run-id>/manifest.md`로 복사합니다.
3. 수입, 지출 카테고리, 반복 결제, 목표, 예산 차이, 큰 지출, 이상 항목과 다음 달 조정안을 채웁니다.
4. 결과 Markdown을 사용자 소유 `finance/` 아래에 저장하고 `Target Files`에 선언합니다.
5. 현재 활성 run 또는 명시한 run을 검사합니다.

```bash
node .opendock/harness/opendock__finance-review/check.mjs
node .opendock/harness/opendock__finance-review/check.mjs .opendock/runs/finance-review/<run-id>/manifest.md
```

실패 rule에 따라 경계, 계산 근거, 민감정보를 수정하고 재실행합니다. 하네스 통과 후 사람 또는 Codex가 실제 예산 맥락을 별도로 검토합니다.

`finance/**`는 사용자 소유이며 OpenDock update나 uninstall 대상이 아닙니다.
