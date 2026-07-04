# Paper Shaders Ultrawork

이 workspace에서 Paper Shaders를 정확하게 쓰기 위한 준비 파일입니다.

## 먼저 볼 파일

- `PAPER_SHADERS.md`: 29개 shader의 component, 설명, 우측 사이드바형 controls, 기본 예시, prop range
- `SHADER_PLAYBOOK.md`: 이미지/프롬프트 요청을 shader 후보 2-3개로 바꾸는 선택 가이드
- `.opendock/data/paper-shaders/catalog.json`: 하네스용 구조화 catalog
- `.opendock/templates/paper-shaders/SHADER_REQUEST.md`: 후보 제안과 사용자 선택을 기록하는 template
- `.codex/opendock/paper-shaders-ultrawork`: OpenDock이 npm dependency를 설치하는 reference runtime
- `HARNESS.md`: 검증 기준

## 사용 준비

OpenDock install/update는 Paper Shaders catalog, AI instructions, workflow, harness와 함께 `.codex/opendock/paper-shaders-ultrawork`에 `@paper-design/shaders-react` reference runtime을 설치합니다.

AI는 이 runtime에서 package와 type 정보를 확인할 수 있습니다. 실제 앱 코드가 `@paper-design/shaders-react`를 import해야 한다면 해당 앱의 package manifest에도 dependency가 있는지 확인합니다.

이미지, 로고, visual effect, background shader 요청을 받으면 `SHADER_PLAYBOOK.md`를 보고 후보 2-3개를 먼저 제안합니다. 사용자가 번호를 고르기 전에는 실제 적용을 시작하지 않습니다. 사용자가 “바로 골라서 적용”이라고 명시한 경우에만 추천 1순위를 적용합니다.

## 검증

```bash
node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs
```

하네스는 Paper Shaders import/component/prop 이름, alias import, namespace import, literal number range를 catalog 기준으로 확인합니다.
