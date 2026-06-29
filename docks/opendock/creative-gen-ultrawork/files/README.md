# Creative Generation Ultrawork

이 dock은 반복 가능한 prompt-first 생성 작업을 위한 workspace를 준비합니다.

- 이미지 생성
- 로고 생성
- 파비콘 생성
- 영상 생성
- 음성 생성
- asset 및 resource 분석

## 빠른 시작

1. run 폴더를 만듭니다: `.opendock/runs/creative-gen/<run-id>/`.
2. `.opendock/templates/creative-gen/GENERATION_BRIEF.md`를 `brief.md`로 복사합니다.
3. `.opendock/templates/creative-gen/OUTPUT_MANIFEST.md`를 `manifest.md`로 복사합니다.
4. run brief의 `Status`를 `active`로 바꾸고 하나 이상의 mode를 선택합니다.
5. 먼저 최종 생성 프롬프트를 작성하고, `manifest.md`의 `Prompt Draft`, `Prompt Review`, `Final Prompt`에 기록합니다.
6. 그 최종 프롬프트를 image/video/audio generation model에 다시 요청해 asset을 생성하거나 분석합니다.
7. 결과물을 정해진 폴더에 넣습니다.
   - `assets/generated/images/`
   - `assets/generated/logos/`
   - `assets/generated/favicons/`
   - `assets/generated/videos/`
   - `assets/generated/audio/`
8. run manifest를 업데이트합니다.
9. `HARNESS.md` 체크리스트를 완료합니다.

active run manifest에 적힌 output path만 검사합니다. 예전에 만든 asset이 `assets/generated/**`에 남아 있어도 현재 run에는 영향을 주지 않습니다.

## 작업 루프

```text
brief -> prompt draft -> prompt review -> final prompt -> generate -> record -> check -> revise -> handoff
```

이미지 mode에서는 손으로 SVG/HTML/CSS 도형을 그린 placeholder를 결과물로 인정하지 않습니다. 사용자가 명시적으로 vector/source artwork를 요청하지 않았다면 image generation/editing model을 사용합니다.

harness가 실패하면 결과물이나 manifest를 고친 뒤 다시 검사합니다.

template은 OpenDock이 관리합니다. run 문서는 프로젝트 작업 산출물이므로 생성 작업마다 자유롭게 수정해도 됩니다.
