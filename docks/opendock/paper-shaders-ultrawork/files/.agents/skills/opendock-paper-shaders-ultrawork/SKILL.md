---
name: opendock-paper-shaders-ultrawork
description: Paper Shaders의 image filter, logo animation, visual effect를 React 프로젝트에 적용할 때 사용합니다.
---

# Paper Shaders Ultrawork

Paper Shaders 작업을 요청받으면 이 skill을 사용합니다.

## Context

1. 먼저 `SHADER_PLAYBOOK.md`와 `PAPER_SHADERS.md`를 읽습니다.
2. 정확한 데이터가 필요하면 `.opendock/data/paper-shaders/catalog.json`을 확인합니다.
3. 프로젝트에 `DESIGN.md`가 있으면 색상, motion, radius, layout 기준은 `DESIGN.md`가 우선입니다.
4. OpenDock install/update는 catalog, workflow, harness와 `.codex/opendock/paper-shaders-ultrawork` reference runtime을 설치합니다. package와 type 정보는 이 runtime에서 확인합니다.
5. 실제 앱 코드가 `@paper-design/shaders-react`를 import해야 한다면 해당 앱의 package manifest에도 dependency가 있는지 확인합니다.

## Steps

1. 사용 목적을 분류합니다: image filter, logo animation, effect, background, hero accent.
2. 이미지가 있으면 subject, palette, texture, edge, motion suitability를 요약합니다.
3. `SHADER_PLAYBOOK.md` 기준으로 적합한 shader 후보 2-3개를 고릅니다.
4. 후보 표에는 shader, 맞는 이유, starting props, risk를 포함합니다.
5. 추천 1순위를 표시하고 사용자에게 번호 선택을 요청합니다.
6. 사용자가 선택하기 전에는 실제 코드 적용을 시작하지 않습니다. 사용자가 “바로 골라서 적용”을 명시한 경우에만 추천 1순위를 적용합니다.
7. 공식 예시의 default props와 catalog의 `controls` 기본값에서 시작합니다.
8. 우측 옵션 패널처럼 조정하되 documented range를 벗어나지 않습니다.
9. React 코드에서는 `@paper-design/shaders-react`에서 catalog에 있는 component만 import합니다.
10. 앱 package manifest에 dependency가 없다면 추가 필요성을 먼저 보고합니다.
11. 구현 후 `node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`를 실행합니다.
12. 실패하면 component/prop/range를 수정하고 다시 실행합니다.

## Guardrails

- 없는 prop이나 component를 만들지 않습니다.
- 사용자가 “바로 적용”을 명시하지 않았다면 후보 제안 없이 바로 구현하지 않습니다.
- 색상은 최대한 project token 또는 DESIGN.md palette에서 가져옵니다.
- 텍스트 위 배경 shader는 contrast와 motion을 낮춥니다.
- 장시간 노출되는 UI에서는 speed, noise, glow, rotation을 보수적으로 둡니다.
- mobile viewport에서 shader가 핵심 정보를 덮지 않게 합니다.
