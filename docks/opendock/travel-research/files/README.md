# Travel Research 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

목적지 조사는 `.opendock/runs/travel-research/<run-id>/manifest.md` 한 건을 중심으로 수행합니다. 템플릿을 복사한 뒤 목적지, 체류 길이, 날짜, 비교 질문과 개인정보 최소화 방침을 먼저 채웁니다.

결과는 `travel-research/` 아래에 작성하고 대상 파일만 manifest에 선언합니다. 하네스는 선언되지 않은 프로젝트 파일을 읽지 않습니다.

```bash
node .opendock/harness/opendock__travel-research/check.mjs
node .opendock/harness/opendock__travel-research/check.mjs .opendock/runs/travel-research/<run-id>/manifest.md
```

인자 없이 실행하면 활성 상태 `draft`, `active`, `in-progress`, `review`, `ready`를 찾습니다. 활성 실행이 없으면 `Ready`, 둘 이상이면 실패합니다. manifest 인자를 주면 그 파일 하나만 검사합니다.

결정론적 하네스는 구조와 로컬 증거를 검사합니다. Codex의 추천 품질 승인과 출처 원문의 사실 확인은 별도 단계입니다.
