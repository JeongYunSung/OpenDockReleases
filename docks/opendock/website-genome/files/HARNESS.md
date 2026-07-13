# Website Genome Harness

## 실행

```bash
node .opendock/harness/opendock__website-genome/check.mjs
node .opendock/harness/opendock__website-genome/check.mjs .opendock/runs/website-genome/<run-id>/manifest.md
```

인자 없이 실행하면 `.opendock/runs/website-genome/`의 직계 run 폴더에서 active manifest를 찾습니다. active 상태는 `draft`, `active`, `in-progress`, `review`, `ready`입니다. 0개는 `Ready`, 2개 이상은 실패입니다. 명시적 인자가 있으면 dock run 디렉터리 안의 해당 manifest 하나만 검사합니다.

## 검사 계약

- 모든 target은 `analysis/website-genome/` 아래의 프로젝트 상대 경로입니다.
- 기준 Markdown 보고서에는 `URL / Scope`, `Capture Date`, `Sources`, `Facts`, `Assumptions`, `Recommendations`, `Typography`, `Color Roles`, `Spacing / Grid`, `Components`, `Responsive Behavior`, `Motion`, `Accessibility`, `Technology Evidence`, `Uncertainties`, `Reusable Tokens / Inventory`, `Privacy / Rights`가 필요합니다.
- `Sources`에는 source URL과 ISO 형식 access date가 있어야 합니다.
- `Color Roles`는 raw hex 목록이 아니라 semantic role을 포함해야 합니다.
- `Technology Evidence`는 근거와 confidence를 함께 기록해야 합니다.
- 여러 technology claim을 나누면 각 claim block에 evidence와 confidence를 함께 둡니다.
- 절대·traversal·보호 경로, NUL, symlink, binary·미지원 확장자, 1 MiB 초과 파일을 거부합니다.
- placeholder, 실제 secret 값, 실행형 prompt injection, 파괴적 명령, 근거 없는 보장을 거부합니다. fenced code, inline code, blockquote에 안전하게 인용한 문자열은 실행 지시로 보지 않습니다.
- 선택된 manifest와 선언 target 외에는 읽지 않습니다.

실패 시 rule id가 가리키는 section이나 target을 보완하고 같은 명령을 재실행합니다. 확인되지 않은 stack을 통과시키기 위해 confidence를 꾸미지 않습니다.

Codex acceptance를 포함한 외부 모델 검토는 이 deterministic harness와 별도이며, 그 결과의 결정성을 가정하지 않습니다.
