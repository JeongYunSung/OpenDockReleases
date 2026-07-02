---
name: opendock-paper-shaders-ultrawork
description: Paper Shaders의 image filter, logo animation, visual effect를 React 프로젝트에 적용할 때 사용합니다.
---

# Paper Shaders Ultrawork

Paper Shaders 작업을 요청받으면 이 skill을 사용합니다.

## Context

1. 먼저 `PAPER_SHADERS.md`를 읽습니다.
2. 정확한 데이터가 필요하면 `.opendock/data/paper-shaders/catalog.json`을 확인합니다.
3. 프로젝트에 `DESIGN.md`가 있으면 색상, motion, radius, layout 기준은 `DESIGN.md`가 우선입니다.

## Steps

1. 사용 목적을 분류합니다: image filter, logo animation, effect, background, hero accent.
2. catalog에서 적합한 shader 후보를 고릅니다.
3. 공식 예시의 default props와 catalog의 `controls` 기본값에서 시작합니다.
4. 우측 옵션 패널처럼 조정하되 documented range를 벗어나지 않습니다.
5. React 코드에서는 `@paper-design/shaders-react`에서 catalog에 있는 component만 import합니다.
6. 구현 후 `node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`를 실행합니다.
7. 실패하면 component/prop/range를 수정하고 다시 실행합니다.

## Guardrails

- 없는 prop이나 component를 만들지 않습니다.
- 색상은 최대한 project token 또는 DESIGN.md palette에서 가져옵니다.
- 텍스트 위 배경 shader는 contrast와 motion을 낮춥니다.
- 장시간 노출되는 UI에서는 speed, noise, glow, rotation을 보수적으로 둡니다.
- mobile viewport에서 shader가 핵심 정보를 덮지 않게 합니다.
