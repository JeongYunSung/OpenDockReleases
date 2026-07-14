# Paper Shaders Playbook

이미지, 로고, 프롬프트 기반 요청을 Paper Shaders 연출로 바꿀 때 사용하는 선택 가이드입니다.

## 기본 흐름

1. 요청을 먼저 분류합니다: image filter, logo animation, background effect, hero scene, visual accent.
2. 이미지가 있으면 이미지의 subject, edge, contrast, palette, texture, transparency, motion suitability를 요약합니다.
3. `.opendock/docks/paper-shaders-ultrawork/PAPER_SHADERS.md`와 `.opendock/data/paper-shaders/catalog.json`에서 후보 2-3개를 고릅니다.
4. 바로 적용하지 말고 후보 표를 보여주고 사용자의 선택을 받습니다.
5. 선택된 shader만 적용합니다. 사용자가 명시적으로 “바로 골라서 적용”이라고 한 경우에만 추천 1순위를 적용합니다.
6. props는 우측 사이드바형 controls의 default에서 시작하고 한 번에 2-3개만 조정합니다.
7. `DESIGN.md`가 있으면 색상, radius, motion, layout 기준을 먼저 따릅니다.
8. 구현 후 `node .opendock/harness/paper-shaders-ultrawork/check.mjs`를 실행합니다.

## 후보 제안 형식

```text
요청 해석:
- 목적:
- 입력 이미지/프롬프트 특징:
- 디자인 제약:

후보:
1. ShaderName - 왜 맞는지, 핵심 props, 주의점
2. ShaderName - 왜 맞는지, 핵심 props, 주의점
3. ShaderName - 왜 맞는지, 핵심 props, 주의점

추천: 1번/2번/3번
적용하려면 번호를 선택해 주세요.
```

## 요청 유형별 후보

| 요청 유형 | 우선 후보 | 사용 기준 |
|---|---|---|
| 이미지에 물결/유리/왜곡 필터 | `Water`, `FlutedGlass`, `LiquidMetal` | 이미지 subject가 유지되어야 할 때는 distortion, waves, caustic을 낮게 시작합니다. |
| 이미지에 질감/프린트 느낌 | `PaperTexture`, `ImageDithering`, `HalftoneDots`, `HalftoneCmyk` | editorial, retro, print, tactile 요청에 적합합니다. |
| 로고 주변 열감/글로우 | `Heatmap`, `PulsingBorder`, `GodRays` | 로고 실루엣이 명확할 때 좋습니다. glow와 outerGlow는 과하게 올리지 않습니다. |
| 로고 자체가 움직이는 추상 애니메이션 | `DotOrbit`, `Metaballs`, `SmokeRing`, `Voronoi` | 브랜드가 playful, futuristic, experimental일 때 적합합니다. |
| 제품 hero 배경 | `MeshGradient`, `StaticMeshGradient`, `GrainGradient`, `Waves` | 텍스트 가독성이 우선입니다. speed는 낮게 두거나 static 계열을 씁니다. |
| 강한 사이버/AI 분위기 | `NeuroNoise`, `PerlinNoise`, `SimplexNoise`, `Warp` | 과한 노이즈와 회전은 피하고 accent 영역에 제한합니다. |
| 부드러운 컬러 필드 | `StaticRadialGradient`, `MeshGradient`, `ColorPanels` | SaaS, productivity, onboarding 배경에 적합합니다. |
| 장식적 경계/프레임 | `PulsingBorder`, `DotGrid`, `ColorPanels` | 버튼이나 카드 전체를 덮지 말고 boundary accent로 씁니다. |

## 이미지 기반 판단

- Subject가 중요하면 `Water`, `FlutedGlass`, `ImageDithering`처럼 원본을 유지하는 filter 계열을 우선합니다.
- 로고나 단순 shape면 `Heatmap`, `PulsingBorder`, `DotOrbit`, `Metaballs`처럼 silhouette가 살아나는 shader를 우선합니다.
- 얼굴, 제품 사진, 텍스트가 포함된 이미지는 강한 distortion을 피합니다.
- 투명 PNG/SVG 로고는 background shader와 logo silhouette shader를 분리해서 제안합니다.

## 프롬프트 기반 판단

- “고급스러운”, “차분한”, “프로덕트”는 static gradient 또는 low-speed shader를 우선합니다.
- “강렬한”, “에너지”, “런칭”은 Heatmap, GodRays, PulsingBorder를 후보에 넣습니다.
- “실험적”, “AI”, “미래적”은 NeuroNoise, Warp, Voronoi를 후보에 넣습니다.
- “종이”, “빈티지”, “프린트”는 PaperTexture, Halftone, Dithering 계열을 우선합니다.

## 적용 기준

- Component와 prop 이름은 catalog에 있는 값만 사용합니다.
- 숫자 값은 documented range 안에서 시작합니다.
- `colors`는 10개 이하로 유지합니다.
- 텍스트 위에 shader를 깔 때는 contrast와 motion을 낮춥니다.
- mobile에서는 shader 영역이 정보나 CTA를 덮지 않아야 합니다.
- 앱 package manifest에 `@paper-design/shaders-react`가 없으면 추가 필요성을 먼저 보고합니다.
