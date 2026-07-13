# Portfolio Case Study Harness

## 실행

```bash
node .opendock/harness/opendock__portfolio-case-study/check.mjs
node .opendock/harness/opendock__portfolio-case-study/check.mjs .opendock/runs/portfolio-case-study/<run-id>/manifest.md
```

인자 없이 실행하면 `.opendock/runs/portfolio-case-study/` 직계 run 폴더의 `manifest.md` 상태만 확인합니다. `draft`, `active`, `in-progress`, `review`, `ready`가 active입니다. 0개는 `Ready`, 2개 이상은 실패합니다. 인자를 주면 dock run 디렉터리 안의 지정 manifest 하나만 검사합니다.

## 검사 계약

- 모든 target은 `portfolio/` 아래의 상대 경로여야 합니다.
- 기준 Markdown 문서에는 `Background`, `Problem`, `Role / Constraints`, `Research / Evidence`, `Decisions / Process`, `Solution`, `Results`, `Reflection`, `Privacy / Redaction`이 필요합니다.
- `Results`에는 `Evidence:` 또는 `Proxy:`와 한계가 있어야 합니다.
- manifest에는 claim review와 privacy review evidence가 있어야 합니다.
- fabricated metric, unsupported guarantee, placeholder, 실제 credential, 실행형 prompt injection, 파괴적 명령을 거부합니다.
- 절대·traversal·보호 경로, NUL, symlink, binary·미지원 확장자, 1 MiB 초과 파일을 거부합니다.
- fenced code, inline code, blockquote로 안전하게 인용한 위험 문자열은 실행 지시로 판단하지 않습니다.
- 선택된 manifest와 target 이외의 프로젝트 파일은 읽지 않습니다.

Harness는 claim source의 진위를 자동 확인하지 않습니다. 실패를 수정하고 근거가 없는 결과는 proxy와 limitation으로 정직하게 바꾼 뒤 재실행합니다. 법무·고객·팀 공개 승인은 별도 절차입니다.

Codex acceptance를 포함한 외부 모델 검토는 이 deterministic harness와 별도이며, 그 결과의 결정성을 가정하지 않습니다.
