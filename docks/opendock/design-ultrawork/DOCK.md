# Design Ultrawork

시각적 완성도, 접근성, 반응형 layout, interaction state, `DESIGN.md` 준수를 확인하는 디자인/UI 품질 게이트입니다.

이 dock은 결과물을 만든 뒤 검사만 하지 않습니다. UI를 만들기 전에 레퍼런스 리서치와 layout playbook을 통해 화면 유형, first gaze, primary action, section architecture를 먼저 정하게 합니다. 색상도 Coolors, Color Hunt, Adobe Color의 조합 원리를 참고하되, 결과물에는 `DESIGN.md` 기준의 semantic role map과 contrast plan으로만 반영합니다. Create UI 공개 문서는 component code 복사 대상이 아니라 component 선택, semantic token, state/accessibility 기준으로 흡수합니다.

## Layout Planning

작업 전 아래 문서를 읽습니다.

- `REFERENCE_RESEARCH.md`: 어떤 작업에서 어떤 reference category를 볼지 정합니다.
- `LAYOUT_PLAYBOOK.md`: ecommerce, blog, portfolio, landing, SaaS, dashboard, mobile 구조를 고릅니다.
- `COLOR_PLAYBOOK.md`: palette source, mood, role map, contrast plan, color risks를 정합니다.
- `PATTERN_GUIDE.md`: navbar, CTA, hero, card, motion, icon, accessibility pattern을 정합니다.
- `CREATE_UI_PLAYBOOK.md`: Create UI의 component inventory, typography/spacing/radius/shadow token 원칙, state coverage를 정합니다.

레퍼런스는 복사 대상이 아닙니다. layout intent, hierarchy, density, interaction purpose만 추출하고, screenshot/exact copy/brand asset/paid content를 결과물에 넣지 않습니다.

## StyleSeed Loop

UI 작업을 할 때는 https://styleseed-demo.vercel.app/llms-full.txt 를 읽고, `DESIGN.md`와 함께 StyleSeed 규칙을 적용합니다.

복사해서 쓸 수 있는 지시문:

```text
https://styleseed-demo.vercel.app/llms-full.txt 를 읽고 이 프로젝트의 모든 UI에 StyleSeed 디자인 규칙을 적용해줘. 먼저 plan mode에서 나와 key color와 motion style을 확정한 뒤, 규칙에 맞게 만들고 마지막에 one accent, one radius 기준으로 일관성을 자체 점검해줘.
```

작업을 시작하기 전에 사용자와 함께 `STYLESEED.md`를 확정하거나 업데이트합니다. 포함할 항목은 app type, key color/accent, radius personality, shadow language, motion style, type direction, density입니다.

## Run 범위

`.opendock/templates/design/DESIGN_RUN.md`를 바탕으로 `.opendock/runs/design/<run-id>/manifest.md`를 만들고, 현재 작업에서 만들거나 수정한 파일만 적습니다. harness는 그 target file만 검사합니다. 기본값으로 프로젝트 전체를 검사하지 않습니다.

manifest에는 `Layout Type`, `First Gaze`, `Primary Action`, `Section Architecture`, `Palette Source`, `Palette Mood`, `Palette Role Map`, `Contrast Plan`, `Color Risks`, `Reference Categories`, `Reference Notes`, `Component Inventory`, `Typography Token Plan`, `Spacing Token Plan`, `Radius Token Plan`, `Shadow Token Plan`, `State Coverage`도 함께 기록합니다.

## 확인하는 것

- `DESIGN.md`를 typography, color, layout, component, image, do/don't rule의 기준으로 읽습니다.
- 제작 전 layout planning이 기록되어 있는지 확인합니다.
- 제작 전 palette planning이 기록되어 있는지 확인합니다.
- 제작 전 component decision과 semantic token planning이 기록되어 있는지 확인합니다.
- StyleSeed 일관성을 추가로 확인합니다: one accent, one radius personality, one shadow language, one icon set, hardcoded hex보다 semantic token 우선, 보이는 focus ring, 최소 44px touch target.
- 디자인 단계 접근성은 결과물의 기본 요건입니다. 색상만으로 상태를 전달하지 않고, 텍스트 대비, focus/focus-visible, 최소 44px touch target, 명확한 label/alt, reduced motion을 함께 확인합니다.
- 소수점 값과 negative tracking은 design contract에 명시된 경우에만 허용합니다.
- viewport 기반 font-size, 관리되지 않는 color, 임의 font weight, 지원되지 않는 radius, pure black, emoji icon, Tailwind `text-[var(...)]` font-size pattern, 브랜드별 금지사항 위반을 막습니다.
- button, chip, tab, compact control의 text overflow를 막습니다.
- form, toast, inline alert, modal, select/combobox, tabs, badge/chip 같은 component가 목적과 상태에 맞게 선택되었는지 확인합니다.
- 모바일 viewport에서 horizontal scroll이 생기면 안 됩니다.
- hover, focus, disabled, loading, empty, error state가 표현되어야 합니다.
- color contrast는 WCAG AA를 목표로 하고, `DESIGN.md`가 더 엄격하지 않다면 typography scale은 절제되어야 합니다.

구현 파일이 프로젝트의 `DESIGN.md`를 제대로 따르는지 증명해야 할 때 사용합니다.
