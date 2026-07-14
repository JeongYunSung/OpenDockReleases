# Interactive UI Ultrawork Harness

## 실행 범위

이 정밀 검수 문서는 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 적용합니다. 평소 요청에서는 현재 작업의 명시 target 또는 활성 run manifest target만 빠르게 확인하고 프로젝트 전체를 재귀 검사하지 않습니다.

## 실행

```bash
node .opendock/harness/interactive-ui-ultrawork/check.mjs
```

Harness는 `.opendock/runs/interactive-ui/`의 바로 아래 run 폴더만 확인합니다. `Status`가 `active`, `review`, `ready`, `ready-for-review`, `handoff`인 run 하나를 선택하고 그 `manifest.md`의 `Target Files`만 읽습니다. Repository 전체 재귀 검사는 하지 않습니다.

active run이 없으면 `Status: ready`로 종료 코드 0을 반환합니다. active run이 둘 이상이면 대상이 모호하므로 실패합니다.

## Run manifest 요구사항

- Interaction type, framework, primary trigger와 feedback
- Top-level `Primary Completion`, `Recovery Path`, `Focus Contract`와 구체적인 완료·복구·focus 조건
- CSS, WAAPI, Motion, special timeline/SVG 중 implementation tier
- Library decision과 installation policy
- idle, hover, focus, pressed/active, loading, error, disabled, reduced motion state matrix
- Keyboard, touch, focus, reduced motion evidence
- Loading, error, disabled, cleanup, horizontal overflow evidence
- Validation commands와 실제 result
- Motion 또는 special 선택 시 구체적 선택 근거

세 contract field는 첫 `##` section보다 앞에 있어야 합니다. Bare `TODO`, `TBD`, `N/A`, `none`, `미정`은 evidence가 아닙니다. 해당 없는 상태는 `not applicable - <구체적 이유>`처럼 이유를 기록합니다.

## 주요 Rule ID

- `multiple-active-runs`, `missing-run-field`, `missing-run-section`, `missing-state-evidence`
- `missing-target-files`, `unsafe-target-path`, `missing-target`, `target-symlink`, `target-too-large`
- `automatic-library-install`, `invalid-implementation-tier`, `motion-choice-evidence`, `special-choice-evidence`, `library-tier-mismatch`
- `nonsemantic-click-target`, `mouse-only-behavior`, `hover-only-behavior`, `focus-indicator-suppressed`
- `reduced-motion-missing`, `loading-state-missing`, `error-state-missing`, `disabled-state-missing`
- `timer-cleanup`, `listener-cleanup`, `transition-all`, `horizontal-overflow-risk`
- `missing-validation-result`

## 해석

정적 pattern은 blocker 후보를 빠르게 찾는 장치입니다. false positive가 있으면 target 파일을 빼지 말고 구현을 명확하게 만들거나 run manifest `Exceptions`에 human owner와 이유를 기록합니다. 현재 harness는 exception을 자동 면제하지 않으므로, rule을 해결할 수 없는 경우 handoff에서 실패와 승인 근거를 함께 보고합니다.

실제 keyboard tab order, focus restoration, screen reader announcement, touch target 크기, reduced-motion 체감, mobile viewport overflow는 브라우저 또는 device 검증 evidence로 보완해야 합니다.

Timer와 event listener cleanup은 target 파일별로 판정합니다. 다른 target 파일의 `clearInterval` 또는 `removeEventListener`는 cleanup evidence로 인정하지 않습니다.
