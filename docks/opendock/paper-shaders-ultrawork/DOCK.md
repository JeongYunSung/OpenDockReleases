# Paper Shaders Ultrawork

Paper Shaders의 image filter, logo animation, effect를 React 프로젝트에서 정확한 props로 쓰도록 돕는 dock입니다.

이 dock은 공식 사이트의 29개 상세 페이지를 기준으로 다음을 설치합니다.

- `PAPER_SHADERS.md`: shader별 component, 설명, 우측 사이드바형 controls, 기본 예시, prop range catalog
- `SHADER_PLAYBOOK.md`: 이미지/프롬프트 요청을 shader 후보 2-3개로 바꾸는 선택 가이드
- `.opendock/data/paper-shaders/catalog.json`: 하네스가 읽는 구조화 catalog
- `.opendock/templates/paper-shaders/SHADER_REQUEST.md`: 후보 제안과 사용자 선택을 기록하는 template
- `.agents/skills/opendock-paper-shaders-ultrawork/SKILL.md`: AI가 Paper shader를 구현할 때 따를 규칙
- `.agents/workflows/opendock-paper-shaders-ultrawork/quality-gate.md`: 선택, 구현, 검증 workflow
- `.opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`: React 코드의 component/prop 오용 검사
- `.codex/opendock/paper-shaders-ultrawork`: OpenDock이 npm dependency를 설치하는 Paper Shaders reference runtime

## 사용 목적

- Paper Shaders를 단순히 설치하는 게 아니라, 각 상세 페이지 우측 옵션 패널에 있는 값과 prop 범위를 프로젝트 안에서 바로 참고하게 합니다.
- 이미지나 프롬프트 요청이 들어오면 바로 구현하지 않고 후보 2-3개를 제안한 뒤 사용자가 선택한 shader만 적용하게 합니다.
- `colors` 배열은 `colorCount`, `color1...` 같은 control 형태로도 풀어 둬서 AI가 사이드바 조작처럼 안전하게 값을 고를 수 있습니다.
- AI가 없는 prop을 지어내거나, component 이름을 틀리거나, range 밖 숫자를 넣는 일을 줄입니다.
- 디자인 작업에서는 `DESIGN.md`의 색, radius, motion 기준을 먼저 따르고 Paper shader는 그 기준을 보조하는 시각 효과로 씁니다.

## 출처

- https://shaders.paper.design
- https://github.com/paper-design/shaders

## 설치 후 확인

OpenDock install/update는 Paper Shaders catalog, AI instructions, workflow, harness와 함께 `.codex/opendock/paper-shaders-ultrawork`에 `@paper-design/shaders-react` reference runtime을 설치합니다.

사용자가 logo animation, visual effect, image filter를 요청하면 AI는 `SHADER_PLAYBOOK.md` 기준으로 후보 2-3개를 제안하고 선택을 받은 뒤 적용해야 합니다. OpenDock-managed runtime으로 package와 types를 확인하고, 실제 앱 코드가 `@paper-design/shaders-react`를 import해야 한다면 해당 앱의 package manifest에도 dependency가 있는지 확인합니다.

검증은 다음으로 실행합니다.

```bash
node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs
```
