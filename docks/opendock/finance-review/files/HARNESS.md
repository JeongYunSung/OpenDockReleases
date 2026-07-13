# Finance Review Harness

인자가 없으면 `.opendock/runs/finance-review/`의 직계 manifest에서 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 찾습니다. 활성 run은 0개 또는 1개이며 0개면 `Ready`입니다. project-relative manifest 인자를 주면 discovery 없이 그 파일 하나만 검사합니다.

## 검사 범위

- 활성 또는 명시된 run manifest와 선언된 `finance/` Markdown target
- 기간·통화, source-data boundary와 URL·조회일, 수입, 지출 카테고리, 반복 결제, 목표, 예산·실제·차이, 큰 지출, 이상 항목, 다음 달 조정, 사실·가정·조정안, 불확실성·개인정보, 교육 목적 경계
- 절대 경로, traversal, 보호 경로, symlink, 비정규·비 UTF-8·NUL·512 KiB 초과 파일
- placeholder, credential·계좌·카드·라우팅 번호, 정확한 주거·미래 이동 정보, 실행형 파괴 지시, 지시 계층 우회, 투자·세무·법률 결과 보장

위험 문자열은 blockquote 또는 code fence로 안전하게 인용할 수 있지만 실제 secret 형태는 인용 안에서도 허용하지 않습니다.

```bash
node .opendock/harness/opendock__finance-review/check.mjs
node .opendock/harness/opendock__finance-review/check.mjs .opendock/runs/finance-review/<run-id>/manifest.md
```

저장소 전체, 완료 run의 target, 선언되지 않은 자료는 검사하지 않습니다. 이 gate는 정적 검증이며 사람 또는 Codex의 재무 맥락 검토와 외부 모델 재현성을 대신하지 않습니다.

