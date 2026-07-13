# Design System Harness

## 실행

```bash
node .opendock/harness/opendock__design-system/check.mjs
node .opendock/harness/opendock__design-system/check.mjs .opendock/runs/design-system/<run-id>/manifest.md
```

인자가 없으면 `.opendock/runs/design-system/`의 직계 run manifest만 상태 판별에 사용합니다. `draft`, `active`, `in-progress`, `review`, `ready`가 active이며, 0개는 `Ready`, 2개 이상은 실패입니다. 명시적 인자가 있으면 dock run 디렉터리 안의 해당 manifest 하나만 검사합니다.

## 검사 계약

- target은 모두 `design-system/` 아래의 상대 경로여야 합니다.
- 기준 Markdown 문서에는 `Principles`, `Naming`, `Color Tokens`, `Type Tokens`, `Spacing Tokens`, `Radius Tokens`, `Shadow Tokens`, `Component States`, `Accessibility`, `Responsive Behavior`, `Governance`, `Decision Log`, `Adoption Plan`이 필요합니다.
- run manifest에는 위 section과 함께 `Evidence`, `Privacy / Sample Data`가 필요합니다.
- color token에는 canvas, surface, text, border, primary, focus 같은 semantic role이 필요합니다. raw palette만 있으면 실패합니다.
- component state에는 `focus`, `disabled`, `loading`, `error`의 적용 여부와 이유가 필요합니다.
- path traversal, 보호 경로, NUL, symlink, binary·미지원 확장자, 1 MiB 초과 파일을 거부합니다.
- placeholder, 실제 credential, 실행형 prompt injection, 파괴적 명령, 근거 없는 보장을 거부합니다. 안전한 fenced code, inline code, blockquote 인용은 명령으로 판정하지 않습니다.
- 다른 source, test, token 파일을 repo 전체에서 찾지 않습니다.

정적 harness는 브라우저 접근성, 시각 회귀, 실제 component 동작을 대신하지 않습니다. 실패를 수정한 뒤 같은 run manifest로 재실행하고 수동 검증이 남으면 handoff에 분리해 기록합니다.

Codex acceptance를 포함한 외부 모델 검토는 이 deterministic harness와 별도이며, 그 결과의 결정성을 가정하지 않습니다.
