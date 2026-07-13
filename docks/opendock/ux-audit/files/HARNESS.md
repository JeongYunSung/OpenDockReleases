# UX Audit Harness

## 실행

```bash
node .opendock/harness/opendock__ux-audit/check.mjs
node .opendock/harness/opendock__ux-audit/check.mjs .opendock/runs/ux-audit/<run-id>/manifest.md
```

인자가 없으면 `.opendock/runs/ux-audit/`의 직계 run 폴더에 있는 `manifest.md`만 확인해 active run을 찾습니다. active 상태는 `draft`, `active`, `in-progress`, `review`, `ready`입니다. 0개면 `Ready`로 통과하고 2개 이상이면 실패합니다. 인자가 있으면 해당 경로가 dock run 디렉터리 안의 안전한 일반 파일인지 확인한 후 그 manifest만 검증합니다.

## 검사 계약

- `Target Files`는 하나 이상이어야 하며 모두 `audits/ux/` 아래의 상대 경로여야 합니다.
- 기준 보고서는 Markdown이어야 하며 `Scope`, `Product Context`, `Findings`, `Severity`, `Evidence`, `Recommendation`, `Priority`, `Accessibility`, `Responsive`, `Copy` section을 포함합니다.
- run manifest에는 위 section과 함께 `Data Boundaries`, `Validation`, `Limitations` evidence가 필요합니다.
- finding은 관찰 근거와 조치 가능한 개선안을 함께 기록해야 합니다.
- 여러 finding ID를 사용하면 각 finding block이 자체 evidence와 recommendation을 가져야 합니다.
- 절대 경로, `..`, NUL, 보호 디렉터리, symlink segment, 일반 파일이 아닌 target, 지원하지 않는 확장자, 1 MiB 초과 파일을 거부합니다.
- active manifest와 target에서 미완성 placeholder, 실제 credential처럼 보이는 값, 실행형 prompt injection, 파괴적 명령, 근거 없는 보장을 거부합니다.
- 안전 분석을 위해 fenced code, inline code, blockquote로 인용한 위험 문자열은 실행 지시로 판정하지 않습니다.
- 관련 없는 프로젝트 파일은 읽거나 검사하지 않습니다.

## 실패 보완

실패 메시지의 rule id와 파일을 확인하고 manifest 또는 선언된 target을 수정한 뒤 재실행합니다. 실제로 검증하지 못한 항목은 통과로 꾸미지 말고 보고서의 한계로 남깁니다.

Codex acceptance를 포함한 외부 모델 검토는 이 deterministic harness와 별도이며, 그 결과의 결정성을 가정하지 않습니다.
