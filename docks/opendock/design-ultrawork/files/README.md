# Design Ultrawork

시각적 완성도, 접근성, 반응형 layout, interaction state, `DESIGN.md` 준수를 확인하는 디자인/UI 품질 게이트입니다.

## StyleSeed Loop

UI 작업을 할 때는 https://styleseed-demo.vercel.app/llms-full.txt 를 읽고, `DESIGN.md`와 함께 StyleSeed 규칙을 적용합니다.

복사해서 쓸 수 있는 지시문:

```text
https://styleseed-demo.vercel.app/llms-full.txt 를 읽고 이 프로젝트의 모든 UI에 StyleSeed 디자인 규칙을 적용해줘. 먼저 plan mode에서 나와 key color와 motion style을 확정한 뒤, 규칙에 맞게 만들고 마지막에 one accent, one radius 기준으로 일관성을 자체 점검해줘.
```

작업을 시작하기 전에 사용자와 함께 `STYLESEED.md`를 확정하거나 업데이트합니다. 포함할 항목은 app type, key color/accent, radius personality, shadow language, motion style, type direction, density입니다.

## Run 범위

`.opendock/templates/design/DESIGN_RUN.md`를 바탕으로 `.opendock/runs/design/<run-id>/manifest.md`를 만들고, 현재 작업에서 만들거나 수정한 파일만 적습니다. harness는 그 target file만 검사합니다. 기본값으로 프로젝트 전체를 검사하지 않습니다.

## 확인하는 것

- `DESIGN.md`를 typography, color, layout, component, image, do/don't rule의 기준으로 읽습니다.
- StyleSeed 일관성을 추가로 확인합니다: one accent, one radius personality, one shadow language, one icon set, hardcoded hex보다 semantic token 우선, 보이는 focus ring, 최소 44px touch target.
- 디자인 단계 접근성은 결과물의 기본 요건입니다. 색상만으로 상태를 전달하지 않고, 텍스트 대비, focus/focus-visible, 최소 44px touch target, 명확한 label/alt, reduced motion을 함께 확인합니다.
- 소수점 값과 negative tracking은 design contract에 명시된 경우에만 허용합니다.
- viewport 기반 font-size, 관리되지 않는 color, 임의 font weight, 지원되지 않는 radius, pure black, emoji icon, Tailwind `text-[var(...)]` font-size pattern, 브랜드별 금지사항 위반을 막습니다.
- button, chip, tab, compact control의 text overflow를 막습니다.
- 모바일 viewport에서 horizontal scroll이 생기면 안 됩니다.
- hover, focus, disabled, loading, empty, error state가 표현되어야 합니다.
- color contrast는 WCAG AA를 목표로 하고, `DESIGN.md`가 더 엄격하지 않다면 typography scale은 절제되어야 합니다.

구현 파일이 프로젝트의 `DESIGN.md`를 제대로 따르는지 증명해야 할 때 사용합니다.
