# Life Admin Harness

인자가 없으면 `.opendock/runs/life-admin/`의 직계 run manifest에서 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 찾습니다. 활성 run은 0개 또는 1개여야 하며 0개면 `Ready`입니다. project-relative manifest 경로를 전달하면 discovery 없이 그 파일 하나만 검증합니다.

## 검사 범위

- 활성 또는 명시된 run manifest와 그 안의 `Target Files`
- 선언된 `life-admin/` 아래 Markdown 정규 파일
- 범위·기간, 구독, 갱신, 문서 metadata, 보증, 반복 업무, 담당자·날짜·상태, 알림, 연간 checklist, URL·조회일, 사실·가정·제안, 개인정보 가림
- 절대 경로, traversal, 보호 경로, symlink, 비정규·비 UTF-8·NUL·512 KiB 초과 파일
- placeholder, credential·전체 식별번호, 정확한 주거·미래 이동 정보, 실행형 파괴 지시, 지시 계층 우회, 누락 없음 보장

위험한 외부 문구를 분석할 때는 blockquote 또는 code fence로 인용하고 실행 지시와 분리합니다. 실제 secret 형태는 인용 안에서도 허용하지 않습니다.

```bash
node .opendock/harness/opendock__life-admin/check.mjs
node .opendock/harness/opendock__life-admin/check.mjs .opendock/runs/life-admin/<run-id>/manifest.md
```

저장소 전체, 완료 run의 target, 선언되지 않은 파일은 검사하지 않습니다. 이 gate는 정적 구조 검사이며 사람 또는 Codex 수용 판단과 외부 모델 재현성을 대신하지 않습니다.

