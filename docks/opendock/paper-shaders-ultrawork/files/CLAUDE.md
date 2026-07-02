# Paper Shaders Ultrawork

Paper Shaders를 사용하는 UI, logo animation, image filter, visual effect 작업에서는 이 문서를 우선 적용합니다.

## 기본 원칙

1. 먼저 `PAPER_SHADERS.md` 또는 `.opendock/data/paper-shaders/catalog.json`에서 shader를 고릅니다.
2. component 이름과 prop 이름은 catalog에 있는 값만 사용합니다.
3. 우측 옵션 패널처럼 값을 조정할 때는 `controls` 섹션의 기본값에서 시작하고 catalog의 range를 벗어나지 않습니다.
4. `DESIGN.md`가 있으면 색상, radius, typography, motion 기준은 `DESIGN.md`를 최우선으로 둡니다.
5. Paper shader는 배경, hero, logo animation, visual accent, image treatment 용도로 씁니다. 정보 위계와 접근성을 가리면 안 됩니다.
6. 지나친 glow, noise, speed, rotation은 피하고 사용자가 오래 보는 UI에서는 motion을 낮춥니다.
7. 사용자가 정적 화면을 요구하면 `speed={0}` 또는 static shader 계열을 우선 검토합니다.
8. 구현 후 `node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`를 실행합니다.

## 설치

프로젝트 package manager에 맞춰 `@paper-design/shaders-react`를 설치합니다.

```bash
npm i @paper-design/shaders-react
```

## 구현 루프

1. 목적을 정합니다: image filter, logo animation, decorative effect, interactive hero 중 하나.
2. catalog에서 후보 2-3개를 비교합니다.
3. 색상은 `DESIGN.md`의 accent와 surface token에 맞춥니다.
4. 공식 예시와 `controls` 기본값에서 시작하고 하나씩 조정합니다.
5. mobile viewport에서 과한 motion, contrast, text overlap이 없는지 확인합니다.
6. 하네스 실패를 수정한 뒤 결과를 보고합니다.

## 금지

- catalog에 없는 component나 prop을 만들지 않습니다.
- shader를 텍스트 가독성 위에 직접 깔지 않습니다.
- `speed`, `scale`, `noise`, `glow`를 과하게 올려 제품 UI를 산만하게 만들지 않습니다.
- 공식 출처를 벗어난 임의 API를 사실처럼 말하지 않습니다.
