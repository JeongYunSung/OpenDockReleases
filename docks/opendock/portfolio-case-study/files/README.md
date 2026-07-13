# Portfolio Case Study 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

`PORTFOLIO_CASE_STUDY_PLAYBOOK.md`를 읽고 `.opendock/templates/portfolio-case-study/RUN.md`를 `.opendock/runs/portfolio-case-study/<run-id>/manifest.md`로 복사합니다. 기준 사례 연구는 `portfolio/` 아래에 저장합니다.

```bash
node .opendock/harness/opendock__portfolio-case-study/check.mjs
node .opendock/harness/opendock__portfolio-case-study/check.mjs .opendock/runs/portfolio-case-study/<run-id>/manifest.md
```

인자가 없으면 직계 run manifest에서 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 찾습니다. active run이 없으면 `Ready`, 둘 이상이면 실패합니다. 인자가 있으면 정확히 그 manifest만 검사합니다.

Harness는 선택된 manifest와 선언된 `Target Files`만 읽습니다. unrelated project file이나 다른 portfolio 문서는 검사하지 않습니다.
