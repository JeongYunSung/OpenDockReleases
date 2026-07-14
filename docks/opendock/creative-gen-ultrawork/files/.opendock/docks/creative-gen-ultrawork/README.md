# Creative Generation Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

이 dock은 반복 가능한 prompt-first 생성 작업을 위한 workspace를 준비합니다.

- 이미지 생성
- 로고 생성
- 파비콘 생성
- 영상 생성
- 음성 생성
- asset 및 resource 분석

## 빠른 시작

1. 작업 폴더를 만듭니다: `.opendock/runs/creative-gen/<작업-id>/`.
2. `.opendock/templates/creative-gen/GENERATION_BRIEF.md`를 `brief.md`로 복사합니다.
3. `.opendock/templates/creative-gen/OUTPUT_MANIFEST.md`를 `manifest.md`로 복사합니다.
4. `brief.md`의 `Status`를 `active`로 바꾸고 하나 이상의 생성 종류를 선택합니다.
5. 먼저 최종 생성 프롬프트를 작성하고, `manifest.md`의 `Prompt Draft`, `Prompt Review`, `Final Prompt`에 기록합니다.
6. 그 최종 프롬프트를 image/video/audio generation model에 다시 요청해 asset을 생성하거나 분석합니다.
7. 결과물을 정해진 폴더에 넣습니다.
   - `assets/generated/images/`
   - `assets/generated/vectors/`
   - `assets/generated/logos/`
   - `assets/generated/favicons/`
   - `assets/generated/videos/`
   - `assets/generated/audio/`
8. 작업 기록을 업데이트합니다.
9. `.opendock/docks/creative-gen-ultrawork/HARNESS.md` 체크리스트를 완료합니다.

현재 작업 기록에 적힌 output path만 검사합니다. 예전에 만든 asset이 `assets/generated/**`에 남아 있어도 현재 작업에는 영향을 주지 않습니다.

## 작업 루프

```text
brief -> prompt draft -> prompt review -> final prompt -> generate -> record -> check -> revise -> handoff
```

이미지 mode에서는 손으로 SVG/HTML/CSS 도형을 그린 placeholder를 결과물로 인정하지 않습니다. 사용자가 명시적으로 vector/source artwork를 요청하지 않았다면 image generation/editing model을 사용합니다.

사용자가 SVG/source vector를 요청한 경우에는 `Mode: vector`를 사용하고 결과물을 `assets/generated/vectors/`에 둡니다. SVG는 `viewBox`, title 또는 aria-label, 안전한 내부 reference, 제어된 palette, 구조적인 path/group/defs 구성을 가져야 하며, 단순 도형 placeholder나 의미 없는 도형 떡칠은 실패로 봅니다.

정밀 검사가 실패하면 결과물이나 작업 기록을 고친 뒤 다시 검사합니다.

```bash
node .opendock/harness/creative-gen-ultrawork/check.mjs --manifest .opendock/runs/creative-gen/<작업-id>/manifest.md
```

`release` 검수에서만 `--release`를 사용해 모든 생성 작업을 확인합니다.

양식 원본은 OpenDock이 관리합니다. 작업별로 복사한 기록은 생성 작업에 맞게 자유롭게 수정해도 됩니다.
