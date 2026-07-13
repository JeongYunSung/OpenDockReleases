# Product Roast Harness

## 실행

프로젝트 root에서 실행합니다.

```bash
node .opendock/harness/opendock__product-roast/check.mjs
node .opendock/harness/opendock__product-roast/check.mjs .opendock/runs/product-roast/<run-id>/manifest.md
```

## 범위

- `.opendock/runs/product-roast/` 바로 아래 run의 `manifest.md`에서 상태만 확인합니다.
- active 상태는 `draft`, `active`, `in-progress`, `review`, `ready`입니다.
- active run이 없으면 `Ready`로 종료 코드 0을 반환합니다.
- active run이 하나면 그 manifest와 `Target Files`에 선언된 파일만 읽습니다.
- active run이 둘 이상이면 실패합니다.
- project 내부의 상대 또는 절대 manifest 인자를 주면 discovery 없이 `.opendock/runs/product-roast/` 내부의 지정 regular file만 검증합니다.
- 저장소 전체나 `reviews/product-roast/` 전체를 재귀 탐색하지 않습니다.

## 검사 항목

- 제품, 범위, ISO 날짜, 허용된 리뷰 톤
- run의 review evidence, severity, keep/change, prioritization, validation, limitation 섹션
- facts, assumptions, recommendations 구분과 source URL·access date
- 리뷰 산출물의 first impression, value proposition, information architecture, CTA, trust, copy, pricing, onboarding, mobile, facts, assumptions, recommendations, evidence, findings, keep/change, action plan
- severity 값, 유지·변경 결정, 두 단계 이상의 우선순위
- 안전한 상대 경로, 허용 확장자, 크기 제한, regular non-symlink file
- 미완성 표식, credential, prompt injection, 파괴적 명령, 모욕, 근거 없는 보장·전환율 수치

검사는 Markdown의 fenced code, inline code, blockquote에 분석 목적으로 인용된 위험 문자열을 능동 실행 지시로 취급하지 않습니다. credential 검사는 인용 여부와 무관하게 실제 secret 형태의 고신뢰 패턴을 차단합니다.

## 수정 loop

실패 출력의 `[rule-id]`와 파일을 확인하고 해당 manifest 또는 선언 target만 수정합니다. 다른 프로젝트 파일을 우회적으로 고치거나 target 목록을 넓혀 실패를 숨기지 않습니다. 모든 실패를 고친 뒤 같은 명령을 다시 실행합니다.

## 한계

이 harness는 실제 사용자 조사, 접근성 도구, 모바일 기기 테스트, 분석 실험을 대신하지 않습니다. 형식과 명시적 근거 및 안전 위반을 deterministic하게 검사합니다.
Codex 또는 다른 외부 모델이 항상 동일한 내용을 생성한다고 주장하지 않습니다.
Codex 정성 acceptance는 이 deterministic harness와 분리된 별도 검토입니다.
