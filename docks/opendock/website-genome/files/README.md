# Website Genome 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

`WEBSITE_GENOME_PLAYBOOK.md`를 읽고 `.opendock/templates/website-genome/RUN.md`로 `.opendock/runs/website-genome/<run-id>/manifest.md`를 만듭니다. 기준 보고서는 `analysis/website-genome/` 아래에 저장합니다.

```bash
node .opendock/harness/opendock__website-genome/check.mjs
node .opendock/harness/opendock__website-genome/check.mjs .opendock/runs/website-genome/<run-id>/manifest.md
```

인자가 없으면 직계 run manifest에서 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 찾습니다. active run이 없으면 `Ready`로 통과하고 둘 이상이면 실패합니다. 인자가 있으면 정확히 그 manifest만 검사합니다.

검사 범위는 선택된 manifest와 그 `Target Files`뿐입니다. unrelated project file, 과거 분석, 원본 사이트 asset은 읽지 않습니다.
