# Memory Book Harness

인자가 없으면 `.opendock/runs/memory-book/`의 직계 manifest에서 `draft`, `active`, `in-progress`, `review`, `ready` 상태를 찾습니다. 활성 run은 0개 또는 1개이며 0개면 `Ready`입니다. project-relative manifest 인자를 주면 discovery 없이 그 파일 하나만 검사합니다.

## 검사 범위

- 활성 또는 명시된 run manifest와 선언된 `memories/` Markdown target
- 기간·테마, source ID inventory, source를 인용한 timeline·highlights·captions, 인물 동의·공유 범위, 장소 granularity, reflection, redactions, 최종 narrative/output plan, 검증·불확실성
- 절대 경로, traversal, 보호 경로, symlink, binary 확장자, 비정규·비 UTF-8·NUL·512 KiB 초과 파일
- placeholder, credential·전체 식별번호, EXIF/GPS 좌표, 정확한 주소·숙소·상세 이동 계획, 근거 없는 기억 창작, 실행형 파괴 지시, 지시 계층 우회

분석 대상의 위험 문구는 blockquote 또는 code fence로 인용할 수 있지만 실제 secret 값은 인용 안에서도 허용하지 않습니다.

```bash
node .opendock/harness/opendock__memory-book/check.mjs
node .opendock/harness/opendock__memory-book/check.mjs .opendock/runs/memory-book/<run-id>/manifest.md
```

저장소 전체, source binary, 완료 run의 target, 선언되지 않은 파일은 검사하지 않습니다. 이 gate는 정적 증거 검사이며 사람 또는 Codex의 사실성·동의 수용 판단과 외부 모델 재현성을 대신하지 않습니다.

