# Paper Shaders Catalog

Source: https://shaders.paper.design
Fetched: 2026-07-02T00:00:00+09:00

This catalog is generated from the official Paper Shaders pages. Use it as the source of truth for component names, descriptions, sidebar-style controls, defaults, prop ranges, and setup guidance.

Machine-readable source: `.opendock/data/paper-shaders/catalog.json`

OpenDock install/update는 Paper Shaders catalog, harness와 `.codex/opendock/paper-shaders-ultrawork` reference runtime을 설치합니다. 각 shader의 `Install` 줄은 공식 페이지 출처를 보존한 참고 정보입니다. 실제 앱 코드가 `@paper-design/shaders-react`를 import해야 한다면 해당 앱의 package manifest에도 dependency가 있는지 확인합니다.

이미지나 프롬프트 기반 요청은 `.opendock/docks/paper-shaders-ultrawork/SHADER_PLAYBOOK.md`를 먼저 읽고 후보 2-3개를 제안한 뒤, 사용자가 선택한 shader만 적용합니다.

## Image Filters

### paper texture `PaperTexture`

- URL: https://shaders.paper.design/paper-texture
- Description: A static texture built from multiple noise layers, usable for a realistic paper and cardboard surfaces. Can be used as a image filter or as a texture.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://paper.design/flowers.webp"`, `colorBack="#ffffff"`, `colorFront="#9fadbc"`, `contrast=0.3`, `roughness=0.4`, `fiber=0.3`, `fiberSize=0.2`, `crumples=0.3`, `crumpleSize=0.35`, `folds=0.65`, `foldCount=5`, `drops=0.2`, `fade=0`, `seed=5.8`, `scale=0.6`, `fit="cover"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://paper.design/flowers.webp"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#ffffff"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#9fadbc"` | string | Hex, RGB, or HSL color | Foreground color |
| `contrast` | `contrast` | `0.3` | number | 0 to 1 | Blending behavior (sharper vs. smoother color transitions) |
| `roughness` | `roughness` | `0.4` | number | 0 to 1 | Pixel noise, related to canvas (not scalable) |
| `fiber` | `fiber` | `0.3` | number | 0 to 1 | Curly-shaped noise |
| `fiberSize` | `fiberSize` | `0.2` | number | 0 to 1 | Curly-shaped noise scale |
| `crumples` | `crumples` | `0.3` | number | 0 to 1 | Cell-based crumple pattern |
| `crumpleSize` | `crumpleSize` | `0.35` | number | 0 to 1 | Cell-based crumple pattern scale |
| `folds` | `folds` | `0.65` | number | 0 to 1 | Depth of the folds |
| `foldCount` | `foldCount` | `5` | number | 1 to 15 (integer) | Number of folds (15 max) |
| `drops` | `drops` | `0.2` | number | 0 to 1 | The visibility of speckle pattern |
| `fade` | `fade` | `0` | number | 0 to 1 | Big-scale noise mask applied to the pattern |
| `seed` | `seed` | `5.8` | number | 0 to 1000 | Seed applied to folds, crumples and dots |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `fit` | `fit` | `"cover"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | Foreground color |
| `contrast` | number | 0 to 1 | Blending behavior (sharper vs. smoother color transitions) |
| `roughness` | number | 0 to 1 | Pixel noise, related to canvas (not scalable) |
| `fiber` | number | 0 to 1 | Curly-shaped noise |
| `fiberSize` | number | 0 to 1 | Curly-shaped noise scale |
| `crumples` | number | 0 to 1 | Cell-based crumple pattern |
| `crumpleSize` | number | 0 to 1 | Cell-based crumple pattern scale |
| `folds` | number | 0 to 1 | Depth of the folds |
| `foldCount` | number | 1 to 15 (integer) | Number of folds (15 max) |
| `fade` | number | 0 to 1 | Big-scale noise mask applied to the pattern |
| `drops` | number | 0 to 1 | The visibility of speckle pattern |
| `seed` | number | 0 to 1000 | Seed applied to folds, crumples and dots |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { PaperTexture } from '@paper-design/shaders-react';

<PaperTexture
  width={1280}
  height={720}
  image="https://paper.design/flowers.webp"
  colorBack="#ffffff"
  colorFront="#9fadbc"
  contrast={0.3}
  roughness={0.4}
  fiber={0.3}
  fiberSize={0.2}
  crumples={0.3}
  crumpleSize={0.35}
  folds={0.65}
  foldCount={5}
  drops={0.2}
  fade={0}
  seed={5.8}
  scale={0.6}
  fit="cover"
/>
```

### fluted glass `FlutedGlass`

- URL: https://shaders.paper.design/fluted-glass
- Description: Fluted glass image filter transforms an image into streaked, ribbed distortions, giving a mix of clarity and obscurity.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://paper.design/flowers.webp"`, `colorBack="#00000000"`, `colorShadow="#000000"`, `colorHighlight="#ffffff"`, `size=0.5`, `shadows=0.25`, `highlights=0.1`, `shape="lines"`, `angle=0`, `distortionShape="prism"`, `distortion=0.5`, `shift=0`, `stretch=0`, `blur=0`, `edges=0.25`, `margin=0`, `grainMixer=0`, `grainOverlay=0`, `fit="cover"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://paper.design/flowers.webp"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#00000000"` | string | Hex, RGB, or HSL color | Background color |
| `colorShadow` | `colorShadow` | `"#000000"` | string | Hex, RGB, or HSL color | Shadows color |
| `colorHighlight` | `colorHighlight` | `"#ffffff"` | string | Hex, RGB, or HSL color | Highlights color |
| `size` | `size` | `0.5` | number | 0 to 1 | The size of the distortion shape grid |
| `shadows` | `shadows` | `0.25` | number | 0 to 1 | A color gradient added over both image and background, following the distortion shape |
| `highlights` | `highlights` | `0.1` | number | 0 to 1 | Thin stokes along distortion shape; useful for antialiasing on the small grid |
| `shape` | `shape` | `"lines"` | enum | \| "pattern" \| "wave" \| "lines" \| "linesIrregular" \| "zigzag" | The shape of the grid |
| `angle` | `angle` | `0` | number | 0 to 180 | Direction of the grid relative to the image |
| `distortionShape` | `distortionShape` | `"prism"` | enum | \| "prism" \| "lens" \| "contour" \| "cascade" \| "facete" | The shape of the distortion |
| `distortion` | `distortion` | `0.5` | number | 0 to 1 | The power of distortion applied within each stripe |
| `shift` | `shift` | `0` | number | -1 to 1 | Texture shift in direction opposite to the grid |
| `stretch` | `stretch` | `0` | number | 0 to 1 | Extra distortion along the grid lines |
| `blur` | `blur` | `0` | number | 0 to 1 | One-directional blur over the image and extra blur around the edges |
| `edges` | `edges` | `0.25` | number | 0 to 1 | Glass distortion and softness on the image edges |
| `margin` | `margin` | `0` | number | 0 to 1 | Distance from image edges to the effect |
| `grainMixer` | `grainMixer` | `0` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | `grainOverlay` | `0` | number | 0 to 1 | Post-processing b/w grain overlay |
| `fit` | `fit` | `"cover"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorShadow` | string | Hex, RGB, or HSL color | Shadows color |
| `colorHighlight` | string | Hex, RGB, or HSL color | Highlights color |
| `shadows` | number | 0 to 1 | A color gradient added over both image and background, following the distortion shape |
| `highlights` | number | 0 to 1 | Thin stokes along distortion shape; useful for antialiasing on the small grid |
| `size` | number | 0 to 1 | The size of the distortion shape grid |
| `shape` | enum | \| "pattern" \| "wave" \| "lines" \| "linesIrregular" \| "zigzag" | The shape of the grid |
| `angle` | number | 0 to 180 | Direction of the grid relative to the image |
| `distortionShape` | enum | \| "prism" \| "lens" \| "contour" \| "cascade" \| "facete" | The shape of the distortion |
| `distortion` | number | 0 to 1 | The power of distortion applied within each stripe |
| `shift` | number | -1 to 1 | Texture shift in direction opposite to the grid |
| `stretch` | number | 0 to 1 | Extra distortion along the grid lines |
| `blur` | number | 0 to 1 | One-directional blur over the image and extra blur around the edges |
| `edges` | number | 0 to 1 | Glass distortion and softness on the image edges |
| `margin` | number | 0 to 1 | Distance from image edges to the effect |
| `marginLeft` | number | 0 to 1 | Distance from the left edge to the effect |
| `marginRight` | number | 0 to 1 | Distance from the right edge to the effect |
| `marginTop` | number | 0 to 1 | Distance from the top edge to the effect |
| `grainMixer` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | number | 0 to 1 | Post-processing b/w grain overlay |
| `marginBottom` | number | 0 to 1 | Distance from the bottom edge to the effect |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { FlutedGlass } from '@paper-design/shaders-react';

<FlutedGlass
  width={1280}
  height={720}
  image="https://paper.design/flowers.webp"
  colorBack="#00000000"
  colorShadow="#000000"
  colorHighlight="#ffffff"
  size={0.5}
  shadows={0.25}
  highlights={0.1}
  shape="lines"
  angle={0}
  distortionShape="prism"
  distortion={0.5}
  shift={0}
  stretch={0}
  blur={0}
  edges={0.25}
  margin={0}
  grainMixer={0}
  grainOverlay={0}
  fit="cover"
/>
```

### water `Water`

- URL: https://shaders.paper.design/water
- Description: Water-like surface distortion with natural caustic realism. Works as an image filter or standalone animated texture.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://paper.design/flowers.webp"`, `colorBack="#8f8f8f"`, `colorHighlight="#ffffff"`, `highlights=0.07`, `layering=0.5`, `edges=0.8`, `waves=0.3`, `caustic=0.1`, `size=1`, `speed=1`, `scale=0.8`, `fit="contain"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://paper.design/flowers.webp"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#8f8f8f"` | string | Hex, RGB, or HSL color | Background color |
| `colorHighlight` | `colorHighlight` | `"#ffffff"` | string | Hex, RGB, or HSL color | Highlight color |
| `highlights` | `highlights` | `0.07` | number | 0 to 1 | A coloring added over the image/background, following the caustic shape |
| `layering` | `layering` | `0.5` | number | 0 to 1 | The power of 2nd layer of caustic distortion |
| `edges` | `edges` | `0.8` | number | 0 to 1 | Caustic distortion power on the image edges |
| `waves` | `waves` | `0.3` | number | 0 to 1 | Additional distortion based in simplex noise, independent from caustic |
| `caustic` | `caustic` | `0.1` | number | 0 to 1 | Power of caustic distortion |
| `size` | `size` | `1` | number | 0.01 to 7 | Pattern scale relative to the image |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.8` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `fit` | `fit` | `"contain"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorHighlight` | string | Hex, RGB, or HSL color | Highlight color |
| `highlights` | number | 0 to 1 | A coloring added over the image/background, following the caustic shape |
| `layering` | number | 0 to 1 | The power of 2nd layer of caustic distortion |
| `edges` | number | 0 to 1 | Caustic distortion power on the image edges |
| `waves` | number | 0 to 1 | Additional distortion based in simplex noise, independent from caustic |
| `caustic` | number | 0 to 1 | Power of caustic distortion |
| `size` | number | 0.01 to 7 | Pattern scale relative to the image |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Water } from '@paper-design/shaders-react';

<Water
  width={1280}
  height={720}
  image="https://paper.design/flowers.webp"
  colorBack="#8f8f8f"
  colorHighlight="#ffffff"
  highlights={0.07}
  layering={0.5}
  edges={0.8}
  waves={0.3}
  caustic={0.1}
  size={1}
  speed={1}
  scale={0.8}
  fit="contain"
/>
```

### image dithering `ImageDithering`

- URL: https://shaders.paper.design/image-dithering
- Description: A dithering image filter with support for 4 dithering modes and multiple color palettes (2-color, 3-color, and multicolor options, using either predefined colors or colors sampled from the original image).
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://paper.design/flowers.webp"`, `colorBack="#000c38"`, `colorFront="#94ffaf"`, `colorHighlight="#eaff94"`, `originalColors=false`, `inverted=false`, `type="8x8"`, `size=2`, `colorSteps=2`, `fit="cover"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://paper.design/flowers.webp"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#000c38"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#94ffaf"` | string | Hex, RGB, or HSL color | Foreground color |
| `colorHighlight` | `colorHighlight` | `"#eaff94"` | string | Hex, RGB, or HSL color | The secondary foreground color (set it same as colorFront to get a classic 2-color dithering) |
| `originalColors` | `originalColors` | `false` | boolean | \| true \| false | Use the original colors of the image |
| `inverted` | `inverted` | `false` | boolean | true or false | Invert the dithering output from the official example control. |
| `type` | `type` | `"8x8"` | enum | \| "random" \| "2x2" \| "4x4" \| "8x8" | Dithering type |
| `size` | `size` | `2` | number | 0.5 to 20 | Pixel size of dithering grid; linked to the screen space, not to the image box |
| `colorSteps` | `colorSteps` | `2` | number | 1 to 7 (integer) | Number of colors to use (applies to both color modes) |
| `fit` | `fit` | `"cover"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | Foreground color |
| `colorHighlight` | string | Hex, RGB, or HSL color | The secondary foreground color (set it same as colorFront to get a classic 2-color dithering) |
| `originalColors` | boolean | \| true \| false | Use the original colors of the image |
| `type` | enum | \| "random" \| "2x2" \| "4x4" \| "8x8" | Dithering type |
| `size` | number | 0.5 to 20 | Pixel size of dithering grid; linked to the screen space, not to the image box |
| `colorSteps` | number | 1 to 7 (integer) | Number of colors to use (applies to both color modes) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { ImageDithering } from '@paper-design/shaders-react';

<ImageDithering
  width={1280}
  height={720}
  image="https://paper.design/flowers.webp"
  colorBack="#000c38"
  colorFront="#94ffaf"
  colorHighlight="#eaff94"
  originalColors={false}
  inverted={false}
  type="8x8"
  size={2}
  colorSteps={2}
  fit="cover"
/>
```

### halftone dots `HalftoneDots`

- URL: https://shaders.paper.design/halftone-dots
- Description: A halftone-dot image filter featuring customizable grids, color palettes, and dot styles
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://paper.design/flowers.webp"`, `colorBack="#f2f1e8"`, `colorFront="#2b2b2b"`, `originalColors=false`, `type="gooey"`, `grid="hex"`, `inverted=false`, `size=0.5`, `radius=1.25`, `contrast=0.4`, `grainMixer=0.2`, `grainOverlay=0.2`, `grainSize=0.5`, `fit="cover"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://paper.design/flowers.webp"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#f2f1e8"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#2b2b2b"` | string | Hex, RGB, or HSL color | Foreground color |
| `originalColors` | `originalColors` | `false` | boolean | \| true \| false | Use the sampled image’s original colors instead of colorFront |
| `type` | `type` | `"gooey"` | enum | \| "classic" \| "gooey" \| "holes" \| "soft" | Dot style |
| `grid` | `grid` | `"hex"` | enum | \| "square" \| "hex" | Dots grid type |
| `inverted` | `inverted` | `false` | boolean | \| true \| false | Inverts the image luminance, doesn’t affect the color scheme; not effective at zero contrast |
| `size` | `size` | `0.5` | number | 0 to 1 | Grid size relative to the image box |
| `radius` | `radius` | `1.25` | number | 0 to 2 | Maximum dot size (relative to the grid cell) |
| `contrast` | `contrast` | `0.4` | number | 0 to 1 | Contrast applied to the sampled image |
| `grainMixer` | `grainMixer` | `0.2` | number | 0 to 1 | Strength of grain distortion applied to shape edges |
| `grainOverlay` | `grainOverlay` | `0.2` | number | 0 to 1 | Post-processing b/w grain overlay |
| `grainSize` | `grainSize` | `0.5` | number | 0 to 1 | The scale applied to both grain distortion and grain overlay |
| `fit` | `fit` | `"cover"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | Foreground color |
| `originalColors` | boolean | \| true \| false | Use the sampled image’s original colors instead of colorFront |
| `type` | enum | \| "classic" \| "gooey" \| "holes" \| "soft" | Dot style |
| `inverted` | boolean | \| true \| false | Inverts the image luminance, doesn’t affect the color scheme; not effective at zero contrast |
| `grid` | enum | \| "square" \| "hex" | Dots grid type |
| `size` | number | 0 to 1 | Grid size relative to the image box |
| `radius` | number | 0 to 2 | Maximum dot size (relative to the grid cell) |
| `contrast` | number | 0 to 1 | Contrast applied to the sampled image |
| `grainMixer` | number | 0 to 1 | Strength of grain distortion applied to shape edges |
| `grainOverlay` | number | 0 to 1 | Post-processing b/w grain overlay |
| `grainSize` | number | 0 to 1 | The scale applied to both grain distortion and grain overlay |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { HalftoneDots } from '@paper-design/shaders-react';

<HalftoneDots
  width={1280}
  height={720}
  image="https://paper.design/flowers.webp"
  colorBack="#f2f1e8"
  colorFront="#2b2b2b"
  originalColors={false}
  type="gooey"
  grid="hex"
  inverted={false}
  size={0.5}
  radius={1.25}
  contrast={0.4}
  grainMixer={0.2}
  grainOverlay={0.2}
  grainSize={0.5}
  fit="cover"
/>
```

### halftone cmyk `HalftoneCmyk`

- URL: https://shaders.paper.design/halftone-cmyk
- Description: CMYK halftone printing effect with customizable dot patterns and ink colors for each channel
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://paper.design/flowers.webp"`, `colorBack="#fbfaf4"`, `colorC="#00b3ff"`, `colorM="#fc4f9d"`, `colorY="#ffd900"`, `colorK="#231f20"`, `size=0.2`, `gridNoise=0.2`, `type="ink"`, `softness=1`, `contrast=1`, `floodC=0.15`, `floodM=0`, `floodY=0`, `floodK=0`, `gainC=0.3`, `gainM=0`, `gainY=0.2`, `gainK=0`, `grainMixer=0`, `grainOverlay=0`, `grainSize=0.5`, `fit="cover"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://paper.design/flowers.webp"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#fbfaf4"` | string | Hex, RGB, or HSL color | Background (paper) color |
| `colorC` | `colorC` | `"#00b3ff"` | string | Hex, RGB, or HSL color | Cyan ink color (alpha controls layer transparency, not dot size) |
| `colorM` | `colorM` | `"#fc4f9d"` | string | Hex, RGB, or HSL color | Magenta ink color (alpha controls layer transparency, not dot size) |
| `colorY` | `colorY` | `"#ffd900"` | string | Hex, RGB, or HSL color | Yellow ink color (alpha controls layer transparency, not dot size) |
| `colorK` | `colorK` | `"#231f20"` | string | Hex, RGB, or HSL color | Black ink color (alpha controls layer transparency, not dot size) |
| `size` | `size` | `0.2` | number | 0 to 1 | Grid size (relative to image box) |
| `gridNoise` | `gridNoise` | `0.2` | number | 0 to 1 | Displaces both dot positions and color sampling points; naturally makes the background more visible |
| `type` | `type` | `"ink"` | enum | \| "dots" \| "ink" \| "sharp" | Dot type style (the difference between dots and ink is visible only with low softness) |
| `softness` | `softness` | `1` | number | 0 to 1 | Dots edge softness |
| `contrast` | `contrast` | `1` | number | 0 to 2 | Input image contrast |
| `floodC` | `floodC` | `0.15` | number | 0 to 1 | Uniform cyan flood applied to all dots |
| `floodM` | `floodM` | `0` | number | 0 to 1 | Uniform magenta flood applied to all dots |
| `floodY` | `floodY` | `0` | number | 0 to 1 | Uniform yellow flood applied to all dots |
| `floodK` | `floodK` | `0` | number | 0 to 1 | Uniform black flood applied to all dots |
| `gainC` | `gainC` | `0.3` | number | -1 to 1 | Proportional cyan gain that enhances existing dots |
| `gainM` | `gainM` | `0` | number | -1 to 1 | Proportional magenta gain that enhances existing dots |
| `gainY` | `gainY` | `0.2` | number | -1 to 1 | Proportional yellow gain that enhances existing dots |
| `gainK` | `gainK` | `0` | number | -1 to 1 | Proportional black gain that enhances existing dots |
| `grainMixer` | `grainMixer` | `0` | number | 0 to 1 | Strength of grain disturbing dots shape |
| `grainOverlay` | `grainOverlay` | `0` | number | 0 to 1 | Post-processing b/w grain overlay |
| `grainSize` | `grainSize` | `0.5` | number | 0 to 1 | Size of grain overlay texture (relative to image box) |
| `fit` | `fit` | `"cover"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | string | Hex, RGB, or HSL color | Background (paper) color |
| `colorC` | string | Hex, RGB, or HSL color | Cyan ink color (alpha controls layer transparency, not dot size) |
| `colorM` | string | Hex, RGB, or HSL color | Magenta ink color (alpha controls layer transparency, not dot size) |
| `colorY` | string | Hex, RGB, or HSL color | Yellow ink color (alpha controls layer transparency, not dot size) |
| `colorK` | string | Hex, RGB, or HSL color | Black ink color (alpha controls layer transparency, not dot size) |
| `size` | number | 0 to 1 | Grid size (relative to image box) |
| `gridNoise` | number | 0 to 1 | Displaces both dot positions and color sampling points; naturally makes the background more visible |
| `type` | enum | \| "dots" \| "ink" \| "sharp" | Dot type style (the difference between dots and ink is visible only with low softness) |
| `softness` | number | 0 to 1 | Dots edge softness |
| `contrast` | number | 0 to 2 | Input image contrast |
| `floodC` | number | 0 to 1 | Uniform cyan flood applied to all dots |
| `floodM` | number | 0 to 1 | Uniform magenta flood applied to all dots |
| `floodY` | number | 0 to 1 | Uniform yellow flood applied to all dots |
| `floodK` | number | 0 to 1 | Uniform black flood applied to all dots |
| `gainC` | number | -1 to 1 | Proportional cyan gain that enhances existing dots |
| `gainM` | number | -1 to 1 | Proportional magenta gain that enhances existing dots |
| `gainY` | number | -1 to 1 | Proportional yellow gain that enhances existing dots |
| `gainK` | number | -1 to 1 | Proportional black gain that enhances existing dots |
| `grainSize` | number | 0 to 1 | Size of grain overlay texture (relative to image box) |
| `grainMixer` | number | 0 to 1 | Strength of grain disturbing dots shape |
| `grainOverlay` | number | 0 to 1 | Post-processing b/w grain overlay |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { HalftoneCmyk } from '@paper-design/shaders-react';

<HalftoneCmyk
  width={1280}
  height={720}
  image="https://paper.design/flowers.webp"
  colorBack="#fbfaf4"
  colorC="#00b3ff"
  colorM="#fc4f9d"
  colorY="#ffd900"
  colorK="#231f20"
  size={0.2}
  gridNoise={0.2}
  type="ink"
  softness={1}
  contrast={1}
  floodC={0.15}
  floodM={0}
  floodY={0}
  floodK={0}
  gainC={0.3}
  gainM={0}
  gainY={0.2}
  gainK={0}
  grainMixer={0}
  grainOverlay={0}
  grainSize={0.5}
  fit="cover"
/>
```

## Logo Animations

### heatmap `Heatmap`

- URL: https://shaders.paper.design/heatmap
- Description: A glowing gradient of colors flowing through an input shape. The effect creates a smoothly animated wave of intensity across the image. With default colors, it shift from cool blues to hot reds, like thermal energy radiating through the shape.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://shaders.paper.design/images/logos/diamond.svg"`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99", "#3399cc", "#3333cc"]`, `colorBack="#000000"`, `contour=0.5`, `angle=0`, `noise=0`, `innerGlow=0.5`, `outerGlow=0.5`, `speed=1`, `scale=0.75`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `7` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `color5` | `colors[4]` | `"#33cc99"` | string | Hex, RGB, or HSL color | Color slot 5 for the colors array. |
| `color6` | `colors[5]` | `"#3399cc"` | string | Hex, RGB, or HSL color | Color slot 6 for the colors array. |
| `color7` | `colors[6]` | `"#3333cc"` | string | Hex, RGB, or HSL color | Color slot 7 for the colors array. |
| `image` | `image` | `"https://shaders.paper.design/images/logos/diamond.svg"` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `contour` | `contour` | `0.5` | number | 0 to 1 | The heat intensity near the edges of the input shape |
| `angle` | `angle` | `0` | number | 0 to 360 | The direction of the heatwaves (angle relative to the shape) |
| `noise` | `noise` | `0` | number | 0 to 1 | Grain applied across the entire graphic |
| `innerGlow` | `innerGlow` | `0.5` | number | 0 to 1 | The size of the heated area inside the input shape |
| `outerGlow` | `outerGlow` | `0.5` | number | 0 to 1 | The side of the heated area outside the input shape |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.75` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | The image to use for the effect |
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 colors used to color the heatmap |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `contour` | number | 0 to 1 | The heat intensity near the edges of the input shape |
| `angle` | number | 0 to 360 | The direction of the heatwaves (angle relative to the shape) |
| `noise` | number | 0 to 1 | Grain applied across the entire graphic |
| `innerGlow` | number | 0 to 1 | The size of the heated area inside the input shape |
| `outerGlow` | number | 0 to 1 | The side of the heated area outside the input shape |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Heatmap } from '@paper-design/shaders-react';

<Heatmap
  width={1280}
  height={720}
  image="https://shaders.paper.design/images/logos/diamond.svg"
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99", "#3399cc", "#3333cc"]}
  colorBack="#000000"
  contour={0.5}
  angle={0}
  noise={0}
  innerGlow={0.5}
  outerGlow={0.5}
  speed={1}
  scale={0.75}
/>
```

### liquid metal `LiquidMetal`

- URL: https://shaders.paper.design/liquid-metal
- Description: Futuristic liquid metal material applied to uploaded logo or abstract shape.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://shaders.paper.design/images/logos/diamond.svg"`, `colorBack="#aaaaac"`, `colorTint="#ffffff"`, `shape="diamond"`, `repetition=2`, `softness=0.1`, `shiftRed=0.3`, `shiftBlue=0.3`, `distortion=0.07`, `contour=0.4`, `angle=70`, `speed=1`, `scale=0.6`, `fit="contain"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `image` | `image` | `"https://shaders.paper.design/images/logos/diamond.svg"` | HTMLImageElement \| string | Image object or URL | An optional image used as an effect mask. A transparent background is required. If no image is provided, the shader defaults to one of the predefined shapes. |
| `colorBack` | `colorBack` | `"#aaaaac"` | string | Hex, RGB, or HSL color | Background color |
| `colorTint` | `colorTint` | `"#ffffff"` | string | Hex, RGB, or HSL color | Overlay color (color burn blending used) |
| `shape` | `shape` | `"diamond"` | enum | \| "none" \| "circle" \| "daisy" \| "diamond" \| "metaballs" | The predefined shape used as an effect mask when no image is provided. |
| `repetition` | `repetition` | `2` | number | 1 to 10 | Density of pattern stripes |
| `softness` | `softness` | `0.1` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `shiftRed` | `shiftRed` | `0.3` | number | -1 to 1 | R-channel dispersion |
| `shiftBlue` | `shiftBlue` | `0.3` | number | -1 to 1 | B-channel dispersion |
| `distortion` | `distortion` | `0.07` | number | 0 to 1 | Noise distortion over the stripes pattern |
| `contour` | `contour` | `0.4` | number | 0 to 1 | Strength of the distortion on the shape edges |
| `angle` | `angle` | `70` | number | 0 to 360 | The direction of pattern animation (angle relative to the shape) |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `fit` | `fit` | `"contain"` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorTint` | string | Hex, RGB, or HSL color | Overlay color (color burn blending used) |
| `image` | HTMLImageElement \| string | Image object or URL | An optional image used as an effect mask. A transparent background is required. If no image is provided, the shader defaults to one of the predefined shapes. |
| `shape` | enum | \| "none" \| "circle" \| "daisy" \| "diamond" \| "metaballs" | The predefined shape used as an effect mask when no image is provided. |
| `repetition` | number | 1 to 10 | Density of pattern stripes |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `shiftRed` | number | -1 to 1 | R-channel dispersion |
| `shiftBlue` | number | -1 to 1 | B-channel dispersion |
| `distortion` | number | 0 to 1 | Noise distortion over the stripes pattern |
| `contour` | number | 0 to 1 | Strength of the distortion on the shape edges |
| `angle` | number | 0 to 360 | The direction of pattern animation (angle relative to the shape) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { LiquidMetal } from '@paper-design/shaders-react';

<LiquidMetal
  width={1280}
  height={720}
  image="https://shaders.paper.design/images/logos/diamond.svg"
  colorBack="#aaaaac"
  colorTint="#ffffff"
  shape="diamond"
  repetition={2}
  softness={0.1}
  shiftRed={0.3}
  shiftBlue={0.3}
  distortion={0.07}
  contour={0.4}
  angle={70}
  speed={1}
  scale={0.6}
  fit="contain"
/>
```

### gem smoke `GemSmoke`

- URL: https://shaders.paper.design/gem-smoke
- Description: Fluid, smoke shape animating behind the input image and being distorted by shape
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `image="https://shaders.paper.design/images/logos/diamond.svg"`, `colors=["#cc3333", "#cc9933"]`, `colorBack="#f0efea"`, `colorInner="#fafaf5"`, `shape="diamond"`, `innerDistortion=0.8`, `outerDistortion=0.6`, `outerGlow=0.55`, `innerGlow=1`, `offset=0`, `angle=0`, `size=0.1`, `speed=1`, `scale=0.6`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `2` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `image` | `image` | `"https://shaders.paper.design/images/logos/diamond.svg"` | HTMLImageElement \| string | Image object or URL | An optional image used as an effect mask. A transparent background is required. If no image is provided, the shader defaults to one of the predefined shapes. |
| `colorBack` | `colorBack` | `"#f0efea"` | string | Hex, RGB, or HSL color | Background color |
| `colorInner` | `colorInner` | `"#fafaf5"` | string | Hex, RGB, or HSL color | Additional color inside the input shape, mixing with smoke |
| `shape` | `shape` | `"diamond"` | enum | \| "none" \| "circle" \| "daisy" \| "diamond" \| "metaballs" | The predefined shape used as an effect mask when no image is provided. |
| `innerDistortion` | `innerDistortion` | `0.8` | number | 0 to 1 | The power of smoke distortion inside the input shape (shape defined by alpha channel) |
| `outerDistortion` | `outerDistortion` | `0.6` | number | 0 to 1 | The power of smoke distortion outside the input shape (shape defined by alpha channel) |
| `outerGlow` | `outerGlow` | `0.55` | number | 0 to 1 | The visibility of smoke shape out of the input shape (shape defined by alpha channel) |
| `innerGlow` | `innerGlow` | `1` | number | 0 to 1 | The visibility of smoke shape inside the input shape (shape defined by alpha channel) |
| `offset` | `offset` | `0` | number | -1 to 1 | Vertical offset of smoke inside the shape |
| `angle` | `angle` | `0` | number | 0 to 360 | Smoke direction |
| `size` | `size` | `0.1` | number | 0 to 1 | The size of smoke shape relative to the image box |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `image` | HTMLImageElement \| string | Image object or URL | An optional image used as an effect mask. A transparent background is required. If no image is provided, the shader defaults to one of the predefined shapes. |
| `shape` | enum | \| "none" \| "circle" \| "daisy" \| "diamond" \| "metaballs" | The predefined shape used as an effect mask when no image is provided. |
| `colors` | string[] | Hex, RGB, or HSL color | Up to 5 ray colors |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `innerDistortion` | number | 0 to 1 | The power of smoke distortion inside the input shape (shape defined by alpha channel) |
| `outerDistortion` | number | 0 to 1 | The power of smoke distortion outside the input shape (shape defined by alpha channel) |
| `outerGlow` | number | 0 to 1 | The visibility of smoke shape out of the input shape (shape defined by alpha channel) |
| `innerGlow` | number | 0 to 1 | The visibility of smoke shape inside the input shape (shape defined by alpha channel) |
| `colorInner` | string | Hex, RGB, or HSL color | Additional color inside the input shape, mixing with smoke |
| `offset` | number | -1 to 1 | Vertical offset of smoke inside the shape |
| `angle` | number | 0 to 360 | Smoke direction |
| `size` | number | 0 to 1 | The size of smoke shape relative to the image box |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { GemSmoke } from '@paper-design/shaders-react';

<GemSmoke
  width={1280}
  height={720}
  image="https://shaders.paper.design/images/logos/diamond.svg"
  colors={["#cc3333", "#cc9933"]}
  colorBack="#f0efea"
  colorInner="#fafaf5"
  shape="diamond"
  innerDistortion={0.8}
  outerDistortion={0.6}
  outerGlow={0.55}
  innerGlow={1}
  offset={0}
  angle={0}
  size={0.1}
  speed={1}
  scale={0.6}
/>
```

## Effects

### mesh gradient `MeshGradient`

- URL: https://shaders.paper.design/mesh-gradient
- Description: A flowing composition of color spots, moving along distinct trajectories and transformed by organic distortion.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33"]`, `distortion=0.8`, `swirl=0.1`, `grainMixer=0`, `grainOverlay=0`, `speed=1`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `4` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `distortion` | `distortion` | `0.8` | number | 0 to 1 | The power of organic noise distortion |
| `swirl` | `swirl` | `0.1` | number | 0 to 1 | The power of vortex distortion |
| `grainMixer` | `grainMixer` | `0` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | `grainOverlay` | `0` | number | 0 to 1 | Post-processing b/w grain overlay |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 color spots |
| `distortion` | number | 0 to 1 | The power of organic noise distortion |
| `swirl` | number | 0 to 1 | The power of vortex distortion |
| `grainMixer` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | number | 0 to 1 | Post-processing b/w grain overlay |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { MeshGradient } from '@paper-design/shaders-react';

<MeshGradient
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33"]}
  distortion={0.8}
  swirl={0.1}
  grainMixer={0}
  grainOverlay={0}
  speed={1}
/>
```

### static mesh gradient `StaticMeshGradient`

- URL: https://shaders.paper.design/static-mesh-gradient
- Description: Multi-point mesh gradient with up to 10 color spots, enhanced by two-direction warping, adjustable blend sharpness, and grain controls. Perfect for elegant wallpapers and atmospheric backdrops.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33"]`, `positions=2`, `waveX=1`, `waveXShift=0.6`, `waveY=1`, `waveYShift=0.21`, `mixing=0.93`, `grainMixer=0`, `grainOverlay=0`, `rotation=270`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `4` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `positions` | `positions` | `2` | number | 0 to 100 | Color spots placement |
| `waveX` | `waveX` | `1` | number | 0 to 1 | Strength of sine wave distortion along X axis |
| `waveXShift` | `waveXShift` | `0.6` | number | 0 to 1 | Phase offset applied to the X-axis wave |
| `waveY` | `waveY` | `1` | number | 0 to 1 | Strength of sine wave distortion along Y axis |
| `waveYShift` | `waveYShift` | `0.21` | number | 0 to 1 | Phase offset applied to the Y-axis wave |
| `mixing` | `mixing` | `0.93` | number | 0 to 1 | Blending behavior (sharper vs. smoother color transitions) |
| `grainMixer` | `grainMixer` | `0` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | `grainOverlay` | `0` | number | 0 to 1 | Post-processing b/w grain overlay |
| `rotation` | `rotation` | `270` | number | 0 to 360 | Overall rotation angle of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 colors used in the gradient |
| `positions` | number | 0 to 100 | Color spots placement |
| `waveX` | number | 0 to 1 | Strength of sine wave distortion along X axis |
| `waveXShift` | number | 0 to 1 | Phase offset applied to the X-axis wave |
| `waveY` | number | 0 to 1 | Strength of sine wave distortion along Y axis |
| `waveYShift` | number | 0 to 1 | Phase offset applied to the Y-axis wave |
| `mixing` | number | 0 to 1 | Blending behavior (sharper vs. smoother color transitions) |
| `grainMixer` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | number | 0 to 1 | Post-processing b/w grain overlay |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { StaticMeshGradient } from '@paper-design/shaders-react';

<StaticMeshGradient
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33"]}
  positions={2}
  waveX={1}
  waveXShift={0.6}
  waveY={1}
  waveYShift={0.21}
  mixing={0.93}
  grainMixer={0}
  grainOverlay={0}
  rotation={270}
/>
```

### static radial gradient `StaticRadialGradient`

- URL: https://shaders.paper.design/static-radial-gradient
- Description: Radial gradient with up to 10 blended colors, featuring advanced mixing modes, focal point controls, shape distortion, and grain effects
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33"]`, `colorBack="#000000"`, `radius=0.8`, `focalDistance=0.99`, `focalAngle=0`, `falloff=0.24`, `mixing=0.5`, `distortion=0`, `distortionShift=0`, `distortionFreq=12`, `grainMixer=0`, `grainOverlay=0`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `3` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `radius` | `radius` | `0.8` | number | 0 to 3 | The size of the shape |
| `focalDistance` | `focalDistance` | `0.99` | number | 0 to 3 | Distance of the focal point from center |
| `focalAngle` | `focalAngle` | `0` | number | 0 to 360 | Angle of the focal point in degrees (effective with focalDistance > 0) |
| `falloff` | `falloff` | `0.24` | number | -1 to 1 | Gradient decay (0 for linear gradient) |
| `mixing` | `mixing` | `0.5` | number | 0 to 1 | Blending behavior (sharper vs. smoother color transitions) |
| `distortion` | `distortion` | `0` | number | 0 to 1 | Strength of radial distortion |
| `distortionShift` | `distortionShift` | `0` | number | -1 to 1 | Radial distortion offset (effective with distortion > 0) |
| `distortionFreq` | `distortionFreq` | `12` | number | 0 to 20 (integer) | Radial distortion frequency (effective with distortion > 0) |
| `grainMixer` | `grainMixer` | `0` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | `grainOverlay` | `0` | number | 0 to 1 | Post-processing b/w grain overlay |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 colors used in the gradient |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `radius` | number | 0 to 3 | The size of the shape |
| `focalDistance` | number | 0 to 3 | Distance of the focal point from center |
| `falloff` | number | -1 to 1 | Gradient decay (0 for linear gradient) |
| `focalAngle` | number | 0 to 360 | Angle of the focal point in degrees (effective with focalDistance > 0) |
| `mixing` | number | 0 to 1 | Blending behavior (sharper vs. smoother color transitions) |
| `distortion` | number | 0 to 1 | Strength of radial distortion |
| `distortionShift` | number | -1 to 1 | Radial distortion offset (effective with distortion > 0) |
| `distortionFreq` | number | 0 to 20 (integer) | Radial distortion frequency (effective with distortion > 0) |
| `grainMixer` | number | 0 to 1 | Strength of grain distortion applied to the shapes’ edges |
| `grainOverlay` | number | 0 to 1 | Post-processing b/w grain overlay |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { StaticRadialGradient } from '@paper-design/shaders-react';

<StaticRadialGradient
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33"]}
  colorBack="#000000"
  radius={0.8}
  focalDistance={0.99}
  focalAngle={0}
  falloff={0.24}
  mixing={0.5}
  distortion={0}
  distortionShift={0}
  distortionFreq={12}
  grainMixer={0}
  grainOverlay={0}
/>
```

### dithering `Dithering`

- URL: https://shaders.paper.design/dithering
- Description: Animated 2-color dithering over with multiple pattern sources (noise, warp, dots, waves, ripple, swirl, sphere). Great for retro, print-like, or stylized UI textures.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colorBack="#000000"`, `colorFront="#00b3ff"`, `shape="sphere"`, `type="4x4"`, `size=2`, `speed=1`, `scale=0.6`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#00b3ff"` | string | Hex, RGB, or HSL color | The foreground (ink) color |
| `shape` | `shape` | `"sphere"` | enum | \| "simplex" \| "warp" \| "dots" \| "wave" \| "ripple" \| "swirl" \| "sphere" | Shape pattern type |
| `type` | `type` | `"4x4"` | enum | \| "random" \| "2x2" \| "4x4" \| "8x8" | Dithering type |
| `size` | `size` | `2` | number | 1 to 20 | Pixel size of dithering grid |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | The foreground (ink) color |
| `shape` | enum | \| "simplex" \| "warp" \| "dots" \| "wave" \| "ripple" \| "swirl" \| "sphere" | Shape pattern type |
| `type` | enum | \| "random" \| "2x2" \| "4x4" \| "8x8" | Dithering type |
| `size` | number | 1 to 20 | Pixel size of dithering grid |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Dithering } from '@paper-design/shaders-react';

<Dithering
  width={1280}
  height={720}
  colorBack="#000000"
  colorFront="#00b3ff"
  shape="sphere"
  type="4x4"
  size={2}
  speed={1}
  scale={0.6}
/>
```

### grain gradient `GrainGradient`

- URL: https://shaders.paper.design/grain-gradient
- Description: Multi-color gradients with grainy, noise-textured distortion available in 7 animated abstract forms.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33"]`, `colorBack="#000000"`, `softness=0.5`, `intensity=0.5`, `noise=0.25`, `shape="corners"`, `speed=1`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `4` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `softness` | `softness` | `0.5` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `intensity` | `intensity` | `0.5` | number | 0 to 1 | Distortion between color bands |
| `noise` | `noise` | `0.25` | number | 0 to 1 | Grainy noise overlay |
| `shape` | `shape` | `"corners"` | enum | \| "wave" \| "dots" \| "truchet" \| "corners" \| "ripple" \| "blob" \| "sphere" | Shape type |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 7 colors used in the gradient |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `intensity` | number | 0 to 1 | Distortion between color bands |
| `noise` | number | 0 to 1 | Grainy noise overlay |
| `shape` | enum | \| "wave" \| "dots" \| "truchet" \| "corners" \| "ripple" \| "blob" \| "sphere" | Shape type |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { GrainGradient } from '@paper-design/shaders-react';

<GrainGradient
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33"]}
  colorBack="#000000"
  softness={0.5}
  intensity={0.5}
  noise={0.25}
  shape="corners"
  speed={1}
/>
```

### dot orbit `DotOrbit`

- URL: https://shaders.paper.design/dot-orbit
- Description: Animated multi-color dots pattern with each dot orbiting around its cell center. Supports up to 40 colors and various shape and motion controls. Great for playful, dynamic backgrounds and UI textures.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99"]`, `colorBack="#000000"`, `stepsPerColor=4`, `size=1`, `sizeRange=0`, `spreading=1`, `speed=1.5`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `5` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `color5` | `colors[4]` | `"#33cc99"` | string | Hex, RGB, or HSL color | Color slot 5 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `stepsPerColor` | `stepsPerColor` | `4` | number | 1 to 4 (integer) | Number of extra colors between base colors (1 = N color palette, 2 = 2×N color palette, 3 = 3×N color palette, etc) |
| `size` | `size` | `1` | number | 0 to 1 | Dot radius relative to cell size |
| `sizeRange` | `sizeRange` | `0` | number | 0 to 1 | Random variation in shape size (0 = uniform size, higher = random value up to base size) |
| `spreading` | `spreading` | `1` | number | 0 to 1 | Maximum orbit distance |
| `speed` | `speed` | `1.5` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 base colors |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `stepsPerColor` | number | 1 to 4 (integer) | Number of extra colors between base colors (1 = N color palette, 2 = 2×N color palette, 3 = 3×N color palette, etc) |
| `size` | number | 0 to 1 | Dot radius relative to cell size |
| `sizeRange` | number | 0 to 1 | Random variation in shape size (0 = uniform size, higher = random value up to base size) |
| `spreading` | number | 0 to 1 | Maximum orbit distance |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { DotOrbit } from '@paper-design/shaders-react';

<DotOrbit
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99"]}
  colorBack="#000000"
  stepsPerColor={4}
  size={1}
  sizeRange={0}
  spreading={1}
  speed={1.5}
/>
```

### dot grid `DotGrid`

- URL: https://shaders.paper.design/dot-grid
- Description: Static grid pattern made of circles, diamonds, squares or triangles.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colorBack="#000000"`, `colorFill="#ffffff"`, `colorStroke="#ffaa00"`, `size=2`, `gapX=32`, `gapY=32`, `strokeWidth=0`, `sizeRange=0`, `opacityRange=0`, `shape="circle"`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `colorFill` | `colorFill` | `"#ffffff"` | string | Hex, RGB, or HSL color | Shape fill color |
| `colorStroke` | `colorStroke` | `"#ffaa00"` | string | Hex, RGB, or HSL color | Shape stroke color |
| `size` | `size` | `2` | number | 1 to 100 | Base size of each shape, pixels |
| `gapX` | `gapX` | `32` | number | 2 to 500 | Pattern horizontal spacing, pixels |
| `gapY` | `gapY` | `32` | number | 2 to 500 | Pattern vertical spacing, pixels |
| `strokeWidth` | `strokeWidth` | `0` | number | 0 to 50 | The outline stroke width, pixels |
| `sizeRange` | `sizeRange` | `0` | number | 0 to 1 | Random variation in shape size (0 = uniform size, higher = random value up to base size) |
| `opacityRange` | `opacityRange` | `0` | number | 0 to 1 | Random variation in shape opacity (0 = all shapes opaque, higher = semi-transparent dots) |
| `shape` | `shape` | `"circle"` | enum | \| "circle" \| "diamond" \| "square" \| "triangle" | The shape type |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFill` | string | Hex, RGB, or HSL color | Shape fill color |
| `colorStroke` | string | Hex, RGB, or HSL color | Shape stroke color |
| `shape` | enum | \| "circle" \| "diamond" \| "square" \| "triangle" | The shape type |
| `size` | number | 1 to 100 | Base size of each shape, pixels |
| `gapX` | number | 2 to 500 | Pattern horizontal spacing, pixels |
| `gapY` | number | 2 to 500 | Pattern vertical spacing, pixels |
| `strokeWidth` | number | 0 to 50 | The outline stroke width, pixels |
| `sizeRange` | number | 0 to 1 | Random variation in shape size (0 = uniform size, higher = random value up to base size) |
| `opacityRange` | number | 0 to 1 | Random variation in shape opacity (0 = all shapes opaque, higher = semi-transparent dots) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { DotGrid } from '@paper-design/shaders-react';

<DotGrid
  width={1280}
  height={720}
  colorBack="#000000"
  colorFill="#ffffff"
  colorStroke="#ffaa00"
  size={2}
  gapX={32}
  gapY={32}
  strokeWidth={0}
  sizeRange={0}
  opacityRange={0}
  shape="circle"
/>
```

### warp `Warp`

- URL: https://shaders.paper.design/warp
- Description: Animated color fields warped by noise and swirls, applied over base patterns (checks, stripes, or split edge). Blends up to 10 colors with adjustable distribution, softness, distortion, and swirl. Great for fluid, smoky, or marbled effects.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33"]`, `proportion=0.45`, `softness=1`, `distortion=0.25`, `swirl=0.8`, `swirlIterations=10`, `shape="checks"`, `shapeScale=0.1`, `speed=1`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `4` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `proportion` | `proportion` | `0.45` | number | 0 to 1 | Blend point between 2 colors (0.5 = equal distribution) |
| `softness` | `softness` | `1` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `distortion` | `distortion` | `0.25` | number | 0 to 1 | Strength of noise-based distortion |
| `swirl` | `swirl` | `0.8` | number | 0 to 1 | Strength of the swirl distortion |
| `swirlIterations` | `swirlIterations` | `10` | number | 0 to 20 | Number of layered swirl passes (effective with swirl > 0) |
| `shape` | `shape` | `"checks"` | enum | \| "checks" \| "stripes" \| "edge" | Base pattern type |
| `shapeScale` | `shapeScale` | `0.1` | number | 0 to 1 | Zoom level of the base pattern |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 colors in the gradient |
| `proportion` | number | 0 to 1 | Blend point between 2 colors (0.5 = equal distribution) |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `distortion` | number | 0 to 1 | Strength of noise-based distortion |
| `swirl` | number | 0 to 1 | Strength of the swirl distortion |
| `swirlIterations` | number | 0 to 20 | Number of layered swirl passes (effective with swirl > 0) |
| `shape` | enum | \| "checks" \| "stripes" \| "edge" | Base pattern type |
| `shapeScale` | number | 0 to 1 | Zoom level of the base pattern |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Warp } from '@paper-design/shaders-react';

<Warp
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33"]}
  proportion={0.45}
  softness={1}
  distortion={0.25}
  swirl={0.8}
  swirlIterations={10}
  shape="checks"
  shapeScale={0.1}
  speed={1}
/>
```

### spiral `Spiral`

- URL: https://shaders.paper.design/spiral
- Description: A single-colored animated spiral that morphs across a wide range of shapes - from crisp, thin-lined geometry to flowing whirlpool forms and wavy, abstract rings.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colorBack="#001429"`, `colorFront="#7ad1ff"`, `density=1`, `distortion=0`, `strokeWidth=0.5`, `strokeTaper=0`, `strokeCap=0`, `noise=0`, `noiseFrequency=0`, `softness=0`, `speed=1`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorBack` | `colorBack` | `"#001429"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#7ad1ff"` | string | Hex, RGB, or HSL color | Foreground (ink) color |
| `density` | `density` | `1` | number | 0 to 1 | Spacing falloff simulating perspective (0 = flat spiral) |
| `distortion` | `distortion` | `0` | number | 0 to 1 | Power of shape distortion applied along the spiral |
| `strokeWidth` | `strokeWidth` | `0.5` | number | 0 to 1 | Thickness of spiral curve |
| `strokeTaper` | `strokeTaper` | `0` | number | 0 to 1 | how much the stroke is loosing width away from center (0 = full visibility) |
| `strokeCap` | `strokeCap` | `0` | number | 0 to 1 | Extra stroke width at the center (no effect with strokeWidth = 0.5) |
| `noise` | `noise` | `0` | number | 0 to 1 | Noise distortion applied over the canvas (no effect with noiseFrequency = 0) |
| `noiseFrequency` | `noiseFrequency` | `0` | number | 0 to 1 | Moise frequency (no effect with noise = 0) |
| `softness` | `softness` | `0` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | Foreground (ink) color |
| `density` | number | 0 to 1 | Spacing falloff simulating perspective (0 = flat spiral) |
| `distortion` | number | 0 to 1 | Power of shape distortion applied along the spiral |
| `strokeWidth` | number | 0 to 1 | Thickness of spiral curve |
| `strokeTaper` | number | 0 to 1 | how much the stroke is loosing width away from center (0 = full visibility) |
| `strokeCap` | number | 0 to 1 | Extra stroke width at the center (no effect with strokeWidth = 0.5) |
| `noise` | number | 0 to 1 | Noise distortion applied over the canvas (no effect with noiseFrequency = 0) |
| `noiseFrequency` | number | 0 to 1 | Moise frequency (no effect with noise = 0) |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Spiral } from '@paper-design/shaders-react';

<Spiral
  width={1280}
  height={720}
  colorBack="#001429"
  colorFront="#7ad1ff"
  density={1}
  distortion={0}
  strokeWidth={0.5}
  strokeTaper={0}
  strokeCap={0}
  noise={0}
  noiseFrequency={0}
  softness={0}
  speed={1}
/>
```

### swirl `Swirl`

- URL: https://shaders.paper.design/swirl
- Description: Animated bands of color twisting and bending, producing spirals, arcs, and flowing circular patterns.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33"]`, `colorBack="#330000"`, `bandCount=4`, `twist=0.1`, `center=0.2`, `proportion=0.5`, `softness=0`, `noise=0.2`, `noiseFrequency=0.4`, `speed=0.32`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `3` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `colorBack` | `colorBack` | `"#330000"` | string | Hex, RGB, or HSL color | Background color |
| `bandCount` | `bandCount` | `4` | number | 0 to 15 (integer) | Number of color bands (0 for concentric ripples) |
| `twist` | `twist` | `0.1` | number | 0 to 1 | Vortex power (0 = straight sectoral shapes) |
| `center` | `center` | `0.2` | number | 0 to 1 | How far from the center the swirl colors begin to appear |
| `proportion` | `proportion` | `0.5` | number | 0 to 1 | Blend point between colors (0.5 = equal distribution) |
| `softness` | `softness` | `0` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `noise` | `noise` | `0.2` | number | 0 to 1 | Strength of noise distortion (no effect with noiseFrequency = 0) |
| `noiseFrequency` | `noiseFrequency` | `0.4` | number | 0 to 1 | Noise frequency (no effect with noise = 0) |
| `speed` | `speed` | `0.32` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 colors used for the stripes |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `bandCount` | number | 0 to 15 (integer) | Number of color bands (0 for concentric ripples) |
| `twist` | number | 0 to 1 | Vortex power (0 = straight sectoral shapes) |
| `center` | number | 0 to 1 | How far from the center the swirl colors begin to appear |
| `proportion` | number | 0 to 1 | Blend point between colors (0.5 = equal distribution) |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `noise` | number | 0 to 1 | Strength of noise distortion (no effect with noiseFrequency = 0) |
| `noiseFrequency` | number | 0 to 1 | Noise frequency (no effect with noise = 0) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Swirl } from '@paper-design/shaders-react';

<Swirl
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33"]}
  colorBack="#330000"
  bandCount={4}
  twist={0.1}
  center={0.2}
  proportion={0.5}
  softness={0}
  noise={0.2}
  noiseFrequency={0.4}
  speed={0.32}
/>
```

### waves `Waves`

- URL: https://shaders.paper.design/waves
- Description: Static line pattern configurable into textures ranging from sharp zigzags to smooth flowing waves.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colorBack="#000000"`, `colorFront="#ffbb00"`, `frequency=0.5`, `amplitude=0.5`, `spacing=1.2`, `proportion=0.1`, `softness=0`, `shape=0`, `scale=0.6`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#ffbb00"` | string | Hex, RGB, or HSL color | Foreground color |
| `frequency` | `frequency` | `0.5` | number | 0 to 2 | Wave frequency |
| `amplitude` | `amplitude` | `0.5` | number | 0 to 1 | Wave amplitude |
| `spacing` | `spacing` | `1.2` | number | 0 to 2 | The space between every two wavy lines |
| `proportion` | `proportion` | `0.1` | number | 0 to 1 | Blend point between front and back colors (0.5 = equal distribution) |
| `softness` | `softness` | `0` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `shape` | `shape` | `0` | number | 0 to 3 | Line shape control: zigzag at 0, sine at 1, irregular waves at 2. Intermediate values morph gradually between these shapes |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | Foreground color |
| `amplitude` | number | 0 to 1 | Wave amplitude |
| `frequency` | number | 0 to 2 | Wave frequency |
| `spacing` | number | 0 to 2 | The space between every two wavy lines |
| `proportion` | number | 0 to 1 | Blend point between front and back colors (0.5 = equal distribution) |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `shape` | number | 0 to 3 | Line shape control: zigzag at 0, sine at 1, irregular waves at 2. Intermediate values morph gradually between these shapes |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Waves } from '@paper-design/shaders-react';

<Waves
  width={1280}
  height={720}
  colorBack="#000000"
  colorFront="#ffbb00"
  frequency={0.5}
  amplitude={0.5}
  spacing={1.2}
  proportion={0.1}
  softness={0}
  shape={0}
  scale={0.6}
/>
```

### neuro noise `NeuroNoise`

- URL: https://shaders.paper.design/neuro-noise
- Description: A glowing, web-like structure of fluid lines and soft intersections. Great for creating atmospheric, organic-yet-futuristic visuals.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colorFront="#ffffff"`, `colorMid="#47a6ff"`, `colorBack="#000000"`, `brightness=0.05`, `contrast=0.3`, `speed=1`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorFront` | `colorFront` | `"#ffffff"` | string | Hex, RGB, or HSL color | Graphics highlight color |
| `colorMid` | `colorMid` | `"#47a6ff"` | string | Hex, RGB, or HSL color | Graphics main color |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `brightness` | `brightness` | `0.05` | number | 0 to 1 | Luminosity of the crossing points |
| `contrast` | `contrast` | `0.3` | number | 0 to 1 | Sharpness of the bright–dark transition |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorFront` | string | Hex, RGB, or HSL color | Graphics highlight color |
| `colorMid` | string | Hex, RGB, or HSL color | Graphics main color |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `brightness` | number | 0 to 1 | Luminosity of the crossing points |
| `contrast` | number | 0 to 1 | Sharpness of the bright–dark transition |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { NeuroNoise } from '@paper-design/shaders-react';

<NeuroNoise
  width={1280}
  height={720}
  colorFront="#ffffff"
  colorMid="#47a6ff"
  colorBack="#000000"
  brightness={0.05}
  contrast={0.3}
  speed={1}
/>
```

### perlin `PerlinNoise`

- URL: https://shaders.paper.design/perlin-noise
- Description: Classic animated 3D Perlin noise with exposed controls.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colorBack="#632ad5"`, `colorFront="#fccff7"`, `proportion=0.35`, `softness=0.1`, `octaveCount=1`, `persistence=1`, `lacunarity=1.5`, `speed=0.5`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorBack` | `colorBack` | `"#632ad5"` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | `colorFront` | `"#fccff7"` | string | Hex, RGB, or HSL color | Foreground color |
| `proportion` | `proportion` | `0.35` | number | 0 to 1 | Blend point between 2 colors (0.5 = equal distribution) |
| `softness` | `softness` | `0.1` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `octaveCount` | `octaveCount` | `1` | number | 1 to 8 (integer) | Perlin noise octaves number (more octaves for more detailed patterns) |
| `persistence` | `persistence` | `1` | number | 0.3 to 1 | Roughness, falloff between octaves |
| `lacunarity` | `lacunarity` | `1.5` | number | 1.5 to 10 | Frequency step, typically around 2. Defines how compressed the pattern is |
| `speed` | `speed` | `0.5` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorFront` | string | Hex, RGB, or HSL color | Foreground color |
| `proportion` | number | 0 to 1 | Blend point between 2 colors (0.5 = equal distribution) |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `octaveCount` | number | 1 to 8 (integer) | Perlin noise octaves number (more octaves for more detailed patterns) |
| `persistence` | number | 0.3 to 1 | Roughness, falloff between octaves |
| `lacunarity` | number | 1.5 to 10 | Frequency step, typically around 2. Defines how compressed the pattern is |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { PerlinNoise } from '@paper-design/shaders-react';

<PerlinNoise
  width={1280}
  height={720}
  colorBack="#632ad5"
  colorFront="#fccff7"
  proportion={0.35}
  softness={0.1}
  octaveCount={1}
  persistence={1}
  lacunarity={1.5}
  speed={0.5}
/>
```

### simplex noise `SimplexNoise`

- URL: https://shaders.paper.design/simplex-noise
- Description: A multi-color gradient mapped into smooth, animated curves built as a combination of 2 Simplex noises.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99"]`, `stepsPerColor=2`, `softness=0`, `speed=0.5`, `scale=0.6`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `5` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `color5` | `colors[4]` | `"#33cc99"` | string | Hex, RGB, or HSL color | Color slot 5 for the colors array. |
| `stepsPerColor` | `stepsPerColor` | `2` | number | 1 to 10 (integer) | Number of extra colors between base colors (1 = N color palette, 2 = 2×N color palette, 3 = 3×N color palette, etc) |
| `softness` | `softness` | `0` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |
| `speed` | `speed` | `0.5` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 base colors |
| `stepsPerColor` | number | 1 to 10 (integer) | Number of extra colors between base colors (1 = N color palette, 2 = 2×N color palette, 3 = 3×N color palette, etc) |
| `softness` | number | 0 to 1 | Color transition sharpness (0 = hard edge, 1 = smooth gradient) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { SimplexNoise } from '@paper-design/shaders-react';

<SimplexNoise
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99"]}
  stepsPerColor={2}
  softness={0}
  speed={0.5}
  scale={0.6}
/>
```

### voronoi `Voronoi`

- URL: https://shaders.paper.design/voronoi
- Description: Anti-aliased animated Voronoi pattern with smooth and customizable edges.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933"]`, `colorGlow="#ffffff"`, `colorGap="#2e0000"`, `stepsPerColor=3`, `distortion=0.4`, `gap=0.04`, `glow=0`, `speed=0.5`, `scale=0.5`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `2` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `colorGlow` | `colorGlow` | `"#ffffff"` | string | Hex, RGB, or HSL color | Color tint for the radial inner shadow effect inside cells (effective with glow > 0) |
| `colorGap` | `colorGap` | `"#2e0000"` | string | Hex, RGB, or HSL color | Color used for cell borders/gaps |
| `stepsPerColor` | `stepsPerColor` | `3` | number | 1 to 3 (integer) | Number of extra colors between base colors (1 = N color palette, 2 = 2×N color palette, 3 = 3×N color palette, etc) |
| `distortion` | `distortion` | `0.4` | number | 0 to 0.5 | Strength of noise-driven displacement of cell centers |
| `gap` | `gap` | `0.04` | number | 0 to 0.1 | Width of the border/gap between cells |
| `glow` | `glow` | `0` | number | 0 to 1 | Strength of the radial inner shadow inside cells |
| `speed` | `speed` | `0.5` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.5` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Base cell colors (up to 10) |
| `colorGlow` | string | Hex, RGB, or HSL color | Color tint for the radial inner shadow effect inside cells (effective with glow > 0) |
| `colorGap` | string | Hex, RGB, or HSL color | Color used for cell borders/gaps |
| `stepsPerColor` | number | 1 to 3 (integer) | Number of extra colors between base colors (1 = N color palette, 2 = 2×N color palette, 3 = 3×N color palette, etc) |
| `distortion` | number | 0 to 0.5 | Strength of noise-driven displacement of cell centers |
| `gap` | number | 0 to 0.1 | Width of the border/gap between cells |
| `glow` | number | 0 to 1 | Strength of the radial inner shadow inside cells |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Voronoi } from '@paper-design/shaders-react';

<Voronoi
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933"]}
  colorGlow="#ffffff"
  colorGap="#2e0000"
  stepsPerColor={3}
  distortion={0.4}
  gap={0.04}
  glow={0}
  speed={0.5}
  scale={0.5}
/>
```

### pulsing border `PulsingBorder`

- URL: https://shaders.paper.design/pulsing-border
- Description: Luminous trails of color merging into a glowing gradient contour.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33"]`, `colorBack="#000000"`, `roundness=0.25`, `thickness=0.1`, `softness=0.75`, `aspectRatio="auto"`, `intensity=0.2`, `bloom=0.25`, `spots=4`, `spotSize=0.5`, `pulse=0.25`, `smoke=0.3`, `smokeSize=0.6`, `speed=1`, `scale=0.6`, `marginLeft=0`, `marginRight=0`, `marginTop=0`, `marginBottom=0`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `3` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `roundness` | `roundness` | `0.25` | number | 0 to 1 | The border radius |
| `thickness` | `thickness` | `0.1` | number | 0 to 1 | The border base width |
| `softness` | `softness` | `0.75` | number | 0 to 1 | Border edge sharpness (0 = hard edge, 1 = smooth gradient) |
| `aspectRatio` | `aspectRatio` | `"auto"` | enum | \| "auto" \| "square" | Aspect ratio of the effect |
| `intensity` | `intensity` | `0.2` | number | 0 to 1 | Thickness of individual color spots |
| `bloom` | `bloom` | `0.25` | number | 0 to 1 | The power of glow (0 = normal color blending, 1 = fully additive blending) |
| `spots` | `spots` | `4` | number | 1 to 20 (integer) | Number of spots added for each color |
| `spotSize` | `spotSize` | `0.5` | number | 0 to 1 | Angular size of spots |
| `pulse` | `pulse` | `0.25` | number | 0 to 1 | Optional pulsing animation |
| `smoke` | `smoke` | `0.3` | number | 0 to 1 | Optional noisy shape extending the border shape |
| `smokeSize` | `smokeSize` | `0.6` | number | 0 to 1 | The size of the smoke effect (effective with smoke > 0) |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.6` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `marginLeft` | `marginLeft` | `0` | number | 0 to 1 | Distance from the left edge to the effect |
| `marginRight` | `marginRight` | `0` | number | 0 to 1 | Distance from the right edge to the effect |
| `marginTop` | `marginTop` | `0` | number | 0 to 1 | Distance from the top edge to the effect |
| `marginBottom` | `marginBottom` | `0` | number | 0 to 1 | Distance from the bottom edge to the effect |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 5 colors |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `roundness` | number | 0 to 1 | The border radius |
| `thickness` | number | 0 to 1 | The border base width |
| `softness` | number | 0 to 1 | Border edge sharpness (0 = hard edge, 1 = smooth gradient) |
| `aspectRatio` | enum | \| "auto" \| "square" | Aspect ratio of the effect |
| `intensity` | number | 0 to 1 | Thickness of individual color spots |
| `bloom` | number | 0 to 1 | The power of glow (0 = normal color blending, 1 = fully additive blending) |
| `spots` | number | 1 to 20 (integer) | Number of spots added for each color |
| `spotSize` | number | 0 to 1 | Angular size of spots |
| `pulse` | number | 0 to 1 | Optional pulsing animation |
| `smoke` | number | 0 to 1 | Optional noisy shape extending the border shape |
| `smokeSize` | number | 0 to 1 | The size of the smoke effect (effective with smoke > 0) |
| `margin` | number | 0 to 1 | Distance from canvas edges to the effect |
| `marginLeft` | number | 0 to 1 | Distance from the left edge to the effect |
| `marginRight` | number | 0 to 1 | Distance from the right edge to the effect |
| `marginTop` | number | 0 to 1 | Distance from the top edge to the effect |
| `marginBottom` | number | 0 to 1 | Distance from the bottom edge to the effect |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { PulsingBorder } from '@paper-design/shaders-react';

<PulsingBorder
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33"]}
  colorBack="#000000"
  roundness={0.25}
  thickness={0.1}
  softness={0.75}
  aspectRatio="auto"
  intensity={0.2}
  bloom={0.25}
  spots={4}
  spotSize={0.5}
  pulse={0.25}
  smoke={0.3}
  smokeSize={0.6}
  speed={1}
  scale={0.6}
  marginLeft={0}
  marginRight={0}
  marginTop={0}
  marginBottom={0}
/>
```

### metaballs `Metaballs`

- URL: https://shaders.paper.design/metaballs
- Description: Up to 20 colored gooey balls moving around the center and merging into smooth organic shapes.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99"]`, `colorBack="#000000"`, `count=10`, `size=0.83`, `speed=1`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `5` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `color5` | `colors[4]` | `"#33cc99"` | string | Hex, RGB, or HSL color | Color slot 5 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `count` | `count` | `10` | number | 1 to 20 | Number of balls |
| `size` | `size` | `0.83` | number | 0 to 1 | The size of the balls |
| `speed` | `speed` | `1` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 8 base colors |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `count` | number | 1 to 20 | Number of balls |
| `size` | number | 0 to 1 | The size of the balls |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { Metaballs } from '@paper-design/shaders-react';

<Metaballs
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99"]}
  colorBack="#000000"
  count={10}
  size={0.83}
  speed={1}
/>
```

### color panels `ColorPanels`

- URL: https://shaders.paper.design/color-panels
- Description: Glowing translucent 3D panels rotating around a central axis.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99", "#3399cc", "#3333cc"]`, `colorBack="#000000"`, `density=3`, `angle1=0`, `angle2=0`, `length=1.1`, `edges=false`, `blur=0`, `fadeIn=1`, `fadeOut=0.3`, `gradient=0`, `speed=0.5`, `scale=0.8`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `7` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `color5` | `colors[4]` | `"#33cc99"` | string | Hex, RGB, or HSL color | Color slot 5 for the colors array. |
| `color6` | `colors[5]` | `"#3399cc"` | string | Hex, RGB, or HSL color | Color slot 6 for the colors array. |
| `color7` | `colors[6]` | `"#3333cc"` | string | Hex, RGB, or HSL color | Color slot 7 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `density` | `density` | `3` | number | 0.25 to 7 | Angle between every 2 panels |
| `angle1` | `angle1` | `0` | number | -1 to 1 | Skew angle applied to all panes |
| `angle2` | `angle2` | `0` | number | -1 to 1 | Skew angle applied to all panes |
| `length` | `length` | `1.1` | number | 0 to 3 | Panel length (relative to total height) |
| `edges` | `edges` | `false` | boolean | \| true \| false | Color highlight on the panels edges |
| `blur` | `blur` | `0` | number | 0 to 0.5 | Side blur (0 for sharp edges) |
| `fadeIn` | `fadeIn` | `1` | number | 0 to 1 | Transparency near central axis |
| `fadeOut` | `fadeOut` | `0.3` | number | 0 to 1 | Transparency near viewer |
| `gradient` | `gradient` | `0` | number | 0 to 1 | Color mixing within a panel (0 = solid panel color, 1 = gradient of two colors) |
| `speed` | `speed` | `0.5` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.8` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 7 colors used to color the panels |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `density` | number | 0.25 to 7 | Angle between every 2 panels |
| `angle1` | number | -1 to 1 | Skew angle applied to all panes |
| `angle2` | number | -1 to 1 | Skew angle applied to all panes |
| `length` | number | 0 to 3 | Panel length (relative to total height) |
| `edges` | boolean | \| true \| false | Color highlight on the panels edges |
| `blur` | number | 0 to 0.5 | Side blur (0 for sharp edges) |
| `fadeIn` | number | 0 to 1 | Transparency near central axis |
| `fadeOut` | number | 0 to 1 | Transparency near viewer |
| `gradient` | number | 0 to 1 | Color mixing within a panel (0 = solid panel color, 1 = gradient of two colors) |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { ColorPanels } from '@paper-design/shaders-react';

<ColorPanels
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33", "#33cc99", "#3399cc", "#3333cc"]}
  colorBack="#000000"
  density={3}
  angle1={0}
  angle2={0}
  length={1.1}
  edges={false}
  blur={0}
  fadeIn={1}
  fadeOut={0.3}
  gradient={0}
  speed={0.5}
  scale={0.8}
/>
```

### smoke ring `SmokeRing`

- URL: https://shaders.paper.design/smoke-ring
- Description: Radial multi-colored gradient shaped with layered noise for a natural, smoky aesthetic.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333"]`, `colorBack="#000000"`, `noiseScale=3`, `noiseIterations=8`, `radius=0.25`, `thickness=0.65`, `innerShape=0.7`, `speed=0.5`, `scale=0.8`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `1` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `noiseScale` | `noiseScale` | `3` | number | 0.01 to 5 | The noise frequency |
| `noiseIterations` | `noiseIterations` | `8` | number | 1 to 8 (integer) | A number of noise layers, more layers gives more details |
| `radius` | `radius` | `0.25` | number | 0 to 1 | The radius of the ring shape |
| `thickness` | `thickness` | `0.65` | number | 0.01 to 1 | The thickness of the ring shape |
| `innerShape` | `innerShape` | `0.7` | number | 0 to 4 | The ring inner fill |
| `speed` | `speed` | `0.5` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `scale` | `scale` | `0.8` | number | 0.01 to 4 | Overall zoom level of the graphics |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 10 colors used for the gradient |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `thickness` | number | 0.01 to 1 | The thickness of the ring shape |
| `radius` | number | 0 to 1 | The radius of the ring shape |
| `innerShape` | number | 0 to 4 | The ring inner fill |
| `noiseIterations` | number | 1 to 8 (integer) | A number of noise layers, more layers gives more details |
| `noiseScale` | number | 0.01 to 5 | The noise frequency |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { SmokeRing } from '@paper-design/shaders-react';

<SmokeRing
  width={1280}
  height={720}
  colors={["#cc3333"]}
  colorBack="#000000"
  noiseScale={3}
  noiseIterations={8}
  radius={0.25}
  thickness={0.65}
  innerShape={0.7}
  speed={0.5}
  scale={0.8}
/>
```

### god rays `GodRays`

- URL: https://shaders.paper.design/god-rays
- Description: Animated rays of light radiating from the center, blended with up to 5 colors. The rays are adjustable by size, density, brightness and center glow. Great for dramatic backgrounds, logo reveals, and VFX like energy bursts or sun shafts.
- Install: `npm i @paper-design/shaders-react`
- Default props from official example: `width=1280`, `height=720`, `colors=["#cc3333", "#cc9933", "#99cc33", "#33cc33"]`, `colorBack="#000000"`, `colorBloom="#0000ff"`, `bloom=0.4`, `intensity=0.8`, `density=0.3`, `spotty=0.3`, `midSize=0.2`, `midIntensity=0.4`, `speed=0.75`, `offsetY=-0.55`

Sidebar-style controls from the official example defaults:

| control | maps to | default | type | values | description |
|---|---|---|---|---|---|
| `colorCount` | `colors.length` | `4` | number | 1 to 10 | Number of colors exposed in the right sidebar before mapping to the colors array. |
| `color1` | `colors[0]` | `"#cc3333"` | string | Hex, RGB, or HSL color | Color slot 1 for the colors array. |
| `color2` | `colors[1]` | `"#cc9933"` | string | Hex, RGB, or HSL color | Color slot 2 for the colors array. |
| `color3` | `colors[2]` | `"#99cc33"` | string | Hex, RGB, or HSL color | Color slot 3 for the colors array. |
| `color4` | `colors[3]` | `"#33cc33"` | string | Hex, RGB, or HSL color | Color slot 4 for the colors array. |
| `colorBack` | `colorBack` | `"#000000"` | string | Hex, RGB, or HSL color | Background color |
| `colorBloom` | `colorBloom` | `"#0000ff"` | string | Hex, RGB, or HSL color | Color overlay blended with the rays |
| `bloom` | `bloom` | `0.4` | number | 0 to 1 | Strength of the bloom/overlay effect |
| `intensity` | `intensity` | `0.8` | number | 0 to 1 | Visibility/strength of the rays |
| `density` | `density` | `0.3` | number | 0 to 1 | The number of rays |
| `spotty` | `spotty` | `0.3` | number | 0 to 1 | The length of the rays |
| `midSize` | `midSize` | `0.2` | number | 0 to 1 | Size of the circular glow shape in the center |
| `midIntensity` | `midIntensity` | `0.4` | number | 0 to 1 | Brightness/intensity of the central glow |
| `speed` | `speed` | `0.75` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `offsetY` | `offsetY` | `-0.55` | number | -1 to 1 | Vertical offset of the graphics center |

Shader-specific props:

| name | type | values | description |
|---|---|---|---|
| `colors` | string[] | Hex, RGB, or HSL color | Up to 5 ray colors |
| `colorBack` | string | Hex, RGB, or HSL color | Background color |
| `colorBloom` | string | Hex, RGB, or HSL color | Color overlay blended with the rays |
| `bloom` | number | 0 to 1 | Strength of the bloom/overlay effect |
| `intensity` | number | 0 to 1 | Visibility/strength of the rays |
| `density` | number | 0 to 1 | The number of rays |
| `spotty` | number | 0 to 1 | The length of the rays |
| `midSize` | number | 0 to 1 | Size of the circular glow shape in the center |
| `midIntensity` | number | 0 to 1 | Brightness/intensity of the central glow |

Common props shown on page:

| name | type | values | description |
|---|---|---|---|
| `speed` | number | — | Controls how fast the animation runs. speed=0 stops the animation loop, and speed=1 defines frame prop as timestamp in milliseconds |
| `frame` | number | — | Starting point of the animation. When speed=1, this value is treated as start time in milliseconds (try large frame values to see the difference). When speed=0 frame fully defines the state of static shader |
| `scale` | number | 0.01 to 4 | Overall zoom level of the graphics |
| `rotation` | number | 0 to 360 | Overall rotation angle of the graphics |
| `offsetX` | number | -1 to 1 | Horizontal offset of the graphics center |
| `offsetY` | number | -1 to 1 | Vertical offset of the graphics center |
| `width` | number \| string | — | CSS width style of the shader element |
| `height` | number \| string | — | CSS height style of the shader element |
| `fit` | enum | \| "contain" \| "cover" | How to fit the rendered shader into the canvas dimensions |
| `worldWidth` | number | — | Virtual width of the graphic before it's scaled to fit the canvas |
| `worldHeight` | number | — | Virtual height of the graphic before it's scaled to fit the canvas |
| `originX` | number | 0 to 1 | Reference point for positioning world width in the canvas |
| `originY` | number | 0 to 1 | Reference point for positioning world height in the canvas |
| `minPixelRatio` | number | — | Minimum pixel ratio to use when rendering the shader (default is 2 for double resolution) |
| `maxPixelCount` | number | — | Maximum pixel count that the shader may process |

Official example:

```tsx
import { GodRays } from '@paper-design/shaders-react';

<GodRays
  width={1280}
  height={720}
  colors={["#cc3333", "#cc9933", "#99cc33", "#33cc33"]}
  colorBack="#000000"
  colorBloom="#0000ff"
  bloom={0.4}
  intensity={0.8}
  density={0.3}
  spotty={0.3}
  midSize={0.2}
  midIntensity={0.4}
  speed={0.75}
  offsetY={-0.55}
/>
```
