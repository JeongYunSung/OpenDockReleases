# Paper Shaders Ultrawork

Paper Shaders의 image filter, logo animation, effect를 React 프로젝트에서 정확한 props로 쓰도록 돕는 dock입니다.

이 dock은 공식 사이트의 29개 상세 페이지를 기준으로 다음을 설치합니다.

- `PAPER_SHADERS.md`: shader별 component, 설명, 우측 사이드바형 controls, 기본 예시, prop range catalog
- `.opendock/data/paper-shaders/catalog.json`: 하네스가 읽는 구조화 catalog
- `.agents/skills/opendock-paper-shaders-ultrawork/SKILL.md`: AI가 Paper shader를 구현할 때 따를 규칙
- `.agents/workflows/opendock-paper-shaders-ultrawork/quality-gate.md`: 선택, 구현, 검증 workflow
- `.opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`: React 코드의 component/prop 오용 검사

## 사용 목적

- Paper Shaders를 단순히 설치하는 게 아니라, 각 상세 페이지 우측 옵션 패널에 있는 값과 prop 범위를 프로젝트 안에서 바로 참고하게 합니다.
- `colors` 배열은 `colorCount`, `color1...` 같은 control 형태로도 풀어 둬서 AI가 사이드바 조작처럼 안전하게 값을 고를 수 있습니다.
- AI가 없는 prop을 지어내거나, component 이름을 틀리거나, range 밖 숫자를 넣는 일을 줄입니다.
- 디자인 작업에서는 `DESIGN.md`의 색, radius, motion 기준을 먼저 따르고 Paper shader는 그 기준을 보조하는 시각 효과로 씁니다.

## 출처

- https://shaders.paper.design
- https://github.com/paper-design/shaders

## 설치 후 확인

`PAPER_SHADERS.md`에서 원하는 shader를 고른 뒤, 프로젝트 package manager에 맞게 다음 의존성을 추가하세요.

```bash
npm i @paper-design/shaders-react
```

검증은 다음으로 실행합니다.

```bash
node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs
```
