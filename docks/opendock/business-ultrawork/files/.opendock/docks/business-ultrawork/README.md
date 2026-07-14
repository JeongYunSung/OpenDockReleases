# Business Ultrawork

Business Ultrawork는 PM, founder, marketing 산출물을 두 단계로 검토합니다.

## 검토 방식

1. 모델이 문서의 목적과 맥락을 읽고 아래 도메인 가이드에 따라 의미 품질을 검토합니다.
2. Custom harness가 선언된 target의 객관적 안전·구조 불변식만 확인합니다.

Harness는 키워드 개수, 키워드 간 거리·밀도, 문서 점수로 품질을 추정하지 않습니다. 따라서 harness 통과만으로 PRD나 GTM의 내용이 승인되지는 않습니다.

## 도메인 가이드

- PRD: problem, goals, non-goals, success metrics, risks, requirements가 명확하고 서로 일관되는지 확인합니다.
- User story: acceptance criteria가 구체적이고 검증 가능하며 사용자 가치와 연결되는지 확인합니다.
- GTM: ICP, channel, pricing, positioning이 시장 가정과 실행 계획에 맞는지 확인합니다.
- Marketing copy: CTA가 독자와 채널에 적합하고 다음 행동이 명확한지 확인합니다.
- Claim: 근거 또는 source note가 주장의 강도와 최신성을 뒷받침하는지 확인합니다.
- Release note: 필요한 경우 breaking change의 영향과 migration 안내가 실행 가능한지 확인합니다.

이 항목은 단순 필드 존재 여부가 아니라 문맥, 구체성, 정합성, 근거를 모델이 판단하는 기준입니다.

## 실행 범위

평소에는 명시한 target 또는 최신 활성 run manifest의 `Target Files`만 검사합니다.

```bash
node .opendock/harness/business-ultrawork/check.mjs --target path/to/document.md
```

사용자가 release 전체 검사를 명시한 경우에만 프로젝트 범위를 검사합니다.

```bash
node .opendock/harness/business-ultrawork/check.mjs --release
```

검토 결과는 의미 품질 findings, harness failures, 미실행 검증, 승인된 예외를 구분해 보고합니다.
