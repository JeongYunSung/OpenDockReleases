# Purchase Decision Harness

이 gate는 인자가 없을 때 `.opendock/runs/purchase-decision/`의 직계 run manifest에서 활성 상태를 판별합니다. 활성 상태는 `draft`, `active`, `in-progress`, `review`, `ready`이며 정확히 0개 또는 1개여야 합니다. 0개면 `Ready`로 통과합니다.

project-relative manifest 경로를 인자로 전달하면 discovery를 수행하지 않고 그 manifest 하나만 검증합니다.

## 검사 범위

- 활성 또는 명시된 run manifest의 `Target Files`
- 그 목록에 선언된 `purchases/` 아래 Markdown 정규 파일
- 사용 사례, Must/Should/Won't, 후보, URL·조회일, 사실·가정, 가중 비교, dealbreaker, 총소유비용, 위험, 추천 이유, 다음 확인 단계, 제휴 공개
- 절대 경로, traversal, 보호 경로, symlink segment, 비정규 파일, 512 KiB 초과, 비 UTF-8·NUL 데이터
- placeholder, 실제 secret 형태, 계정 식별자, 실행형 파괴 지시, 상위 지시 무시 요구, 근거 없는 최저가·최고 제품 보장

안전 분석이나 외부 증거에서 위험 문자열을 언급해야 하면 Markdown blockquote 또는 code fence로 인용하고 실행 지시와 분리합니다. 실제 credential처럼 보이는 값은 인용 여부와 관계없이 저장하면 안 됩니다.

## 실행

```bash
node .opendock/harness/opendock__purchase-decision/check.mjs
node .opendock/harness/opendock__purchase-decision/check.mjs .opendock/runs/purchase-decision/<run-id>/manifest.md
```

이 하네스는 저장소 전체, 과거 완료 run의 target, 선언되지 않은 파일을 재귀 검사하지 않습니다. 통과는 구조와 고위험 패턴 검사를 의미하며 사람 또는 Codex의 정성 수용 판단과 외부 모델 재현성을 대신하지 않습니다.

