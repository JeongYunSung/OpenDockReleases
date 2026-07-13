# Memory Book

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

이 workspace에는 출처·동의·가림을 포함한 기억책 제작 절차가 설치되어 있습니다.

## 사용 순서

1. `MEMORY_BOOK_PLAYBOOK.md`를 읽고 기간, 테마, 독자, 공유 범위를 정합니다.
2. `.opendock/templates/memory-book/RUN.md`를 `.opendock/runs/memory-book/<run-id>/manifest.md`로 복사합니다.
3. source inventory에 ID를 부여하고 timeline, highlights, captions에서 해당 ID를 인용합니다.
4. 인물 동의, 장소 granularity, EXIF/GPS, redaction, 불확실성을 검토합니다.
5. 결과 Markdown을 사용자 소유 `memories/` 아래에 저장하고 `Target Files`에 선언합니다.
6. 현재 활성 run 또는 명시한 run을 검사합니다.

```bash
node .opendock/harness/opendock__memory-book/check.mjs
node .opendock/harness/opendock__memory-book/check.mjs .opendock/runs/memory-book/<run-id>/manifest.md
```

source 사진·영상·PDF 같은 binary는 target으로 선언하지 않습니다. 하네스가 검증하는 것은 기억책 서사와 출력 계획 Markdown입니다. 실패를 수정한 뒤 사람 또는 Codex가 사실성·동의·서사를 별도로 검토합니다.

`memories/**`는 사용자 소유이며 OpenDock update나 uninstall 대상이 아닙니다.
