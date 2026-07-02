# Paper Shaders Ultrawork

이 workspace에서 Paper Shaders를 정확하게 쓰기 위한 준비 파일입니다.

## 먼저 볼 파일

- `PAPER_SHADERS.md`: 29개 shader의 component, 설명, 우측 사이드바형 controls, 기본 예시, prop range
- `.opendock/data/paper-shaders/catalog.json`: 하네스용 구조화 catalog
- `HARNESS.md`: 검증 기준

## 설치

`@paper-design/shaders-react`는 프로젝트 package manager에 맞춰 직접 설치합니다.

```bash
npm i @paper-design/shaders-react
```

## 검증

```bash
node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs
```

하네스는 Paper Shaders import/component/prop 이름, alias import, namespace import, literal number range를 catalog 기준으로 확인합니다.
