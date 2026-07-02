# Paper Shaders Ultrawork Harness

실행:

```bash
node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs
```

## 검사 항목

- `PAPER_SHADERS.md`와 `.opendock/data/paper-shaders/catalog.json`이 설치되어 있어야 합니다.
- catalog에는 공식 Paper Shaders 29개 항목과 설명, 우측 사이드바형 controls가 있어야 합니다.
- `@paper-design/shaders-react`에서 import한 component는 catalog에 존재해야 합니다.
- named import, alias import, namespace import를 모두 검사합니다.
- JSX에서 Paper shader component에 넘기는 prop은 catalog에 있는 shader/common prop이거나 안전한 React/DOM prop이어야 합니다.
- 숫자 literal 값이 catalog range를 벗어나면 실패합니다.
- `colors` literal array는 10개를 넘기지 않습니다.
- 실제 shader 사용 코드가 없으면 설치 준비 상태로 통과합니다.

## 의도

이 harness는 프로젝트 전체 디자인을 심판하지 않습니다. Paper Shaders를 사용한 코드에만 강하게 적용됩니다.
