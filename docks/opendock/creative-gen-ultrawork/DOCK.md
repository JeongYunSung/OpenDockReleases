# Creative Generation Ultrawork

이미지, 로고, 파비콘, 영상, 음성, asset 분석 작업을 반복 가능하게 만드는 skill, workflow, harness 루프입니다.

## 제공하는 것

- 막연한 요청을 검토 가능한 output requirement로 바꾸는 managed template을 제공합니다.
- 생성 asset마다 run-scoped brief와 manifest를 남기는 workflow를 제공합니다.
- Codex, Claude Code, Gemini, Cursor용 agent 지침을 제공합니다.
- create, document, check, revise를 반복하는 workflow를 제공합니다.
- output file, metadata, rights note, review record를 검증하는 Node 기반 harness를 제공합니다.

## 지원 모드

- `image`
- `logo`
- `favicon`
- `video`
- `audio`
- `asset-analysis`

생성형 asset을 폴더에 대충 떨어뜨리는 방식이 아니라, 반복 가능하고 문서화되어 있으며 handoff 가능한 상태로 관리해야 할 때 사용합니다.

새 생성 작업은 설치된 template을 바탕으로 `.opendock/runs/creative-gen/<run-id>/brief.md`와 `manifest.md`를 만들어야 합니다. root의 `GENERATION_BRIEF.md`, `OUTPUT_MANIFEST.md`는 기존 프로젝트 호환용입니다.

harness는 active run manifest에 적힌 output path만 검사합니다. 이전에 생성된 asset은 현재 run이 참조하지 않는 한 무시됩니다.
