# Figma Ultrawork

Figma node, 접근성, interaction state, Auto Layout, `DESIGN.md` 준수를 확인하는 Figma MCP 품질 게이트입니다.

## Run 범위

`.opendock/templates/figma/FIGMA_RUN.md`를 바탕으로 `.opendock/runs/figma/<run-id>/manifest.md`를 만듭니다. run manifest에는 현재 작업 중인 node-specific Figma URL, node id, MCP evidence, finding, review note를 기록합니다. local harness는 이 run 기록을 확인하고, 실제 canvas 검사는 official Figma MCP로 진행합니다.

## 확인하는 것

- `DESIGN.md`를 typography, color, layout, component, image, do/don't rule의 기준으로 읽습니다.
- node-specific Figma URL을 official Figma MCP로 읽습니다.
- 소수점 값과 negative tracking은 design contract에 명시된 경우에만 허용합니다.
- 관리되지 않는 color, 임의 font weight, 지원되지 않는 radius, fractional bounds, text overflow, 브랜드별 금지사항 위반을 막습니다.
- handoff 전에 button/CTA state coverage와 component-like frame의 Auto Layout을 확인합니다.

## 사용 방법

`node-id`가 포함된 Figma URL을 복사한 뒤, agent에게 해당 node에 Figma Ultrawork를 적용하라고 요청합니다.

Figma 작업물이 handoff 전에 프로젝트의 `DESIGN.md`를 따르는지 증명해야 할 때 사용합니다.
