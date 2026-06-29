# Creative Generation Ultrawork

이미지, 로고, 파비콘, 영상, 음성, asset 분석 작업을 반복 가능하게 만드는 prompt-first skill, workflow, harness 루프입니다.

## 제공하는 것

- 막연한 요청을 검토 가능한 output requirement로 바꾸는 managed template을 제공합니다.
- 바로 만들지 않고, 먼저 고품질 생성 프롬프트를 설계하고 검토한 뒤 그 프롬프트로 생성하도록 유도합니다.
- 생성 asset마다 run-scoped brief와 manifest를 남기는 workflow를 제공합니다.
- Codex, Claude Code, Gemini, Cursor용 agent 지침을 제공합니다.
- create, document, check, revise를 반복하는 workflow를 제공합니다.
- output file, metadata, rights note, review record를 검증하는 Node 기반 harness를 제공합니다.

## 지원 모드

- `image`
- `vector`
- `logo`
- `favicon`
- `video`
- `audio`
- `asset-analysis`

생성형 asset을 폴더에 대충 떨어뜨리는 방식이 아니라, 반복 가능하고 문서화되어 있으며 handoff 가능한 상태로 관리해야 할 때 사용합니다.

새 생성 작업은 설치된 template을 바탕으로 `.opendock/runs/creative-gen/<run-id>/brief.md`와 `manifest.md`를 만들어야 합니다. root의 `GENERATION_BRIEF.md`, `OUTPUT_MANIFEST.md`는 기존 프로젝트 호환용입니다.

harness는 active run manifest에 적힌 output path만 검사합니다. 이전에 생성된 asset은 현재 run이 참조하지 않는 한 무시됩니다.

이미지 mode에서는 손으로 SVG/HTML/CSS 도형을 그린 placeholder를 결과물로 인정하지 않습니다. 먼저 최종 생성 프롬프트를 만든 뒤 image generation/editing model에 다시 요청하는 흐름을 기본값으로 사용합니다.

사용자가 SVG/source vector를 명시적으로 요청한 경우에는 `vector` mode를 사용합니다. 결과물은 `assets/generated/vectors/`에 저장하고, SVG에는 `viewBox`, title 또는 aria-label, 안전한 내부 reference, 제어된 palette, 구조적인 path/group/defs 구성이 있어야 합니다. 단순 도형 placeholder나 의미 없이 많은 도형을 쌓은 SVG는 통과하지 않습니다.
