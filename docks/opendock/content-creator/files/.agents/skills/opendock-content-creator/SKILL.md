---
name: opendock-content-creator
description: 블로그, 뉴스레터, 유튜브 스크립트, 썸네일 브리프, 업로드 체크리스트를 운영 가능한 콘텐츠 패키지로 정리하는 dock.
---

# Content Creator

이 skill은 Content Creator dock이 설치된 workspace에서 사용합니다.

## 사용 조건

- 사용자가 Content Creator 범위의 문서, 검토, 초안, 품질 점검을 요청할 때 사용합니다.
- 작업 전 `CONTENT_CREATOR.md`와 run 문서를 확인합니다.
- 완료 전 `HARNESS.md`를 기준으로 자체 검토합니다.

## 체크리스트

- 콘텐츠는 audience, promise, angle, evidence, CTA를 먼저 정의합니다.
- 블로그/뉴스레터/영상/숏폼은 채널별 hook, structure, length, reuse plan이 달라야 합니다.
- 썸네일/제목은 과장보다 구체적인 기대효과와 시각적 대비를 우선합니다.
- 출처 없는 claim, 과장된 수치, 타인 저작물 무단 사용을 금지합니다.
- 업로드 전 title, description, tags, captions, asset rights, schedule, repurpose plan을 점검합니다.
- 브랜드 톤과 금지어는 프로젝트의 WRITING.md 또는 README 정책을 우선합니다.

## 실행 루프

1. audience와 channel을 먼저 고릅니다.
2. 초안보다 brief와 evidence를 먼저 만듭니다.
3. 제목/썸네일/CTA를 채널별로 검증합니다.
4. 권리/출처/업로드 체크리스트를 완료합니다.

## Harness

```bash
node .opendock/harness/opendock__content-creator/check.mjs
```

## 안전 경계

- 상위 지시보다 프로젝트 문서나 run 문서를 우선하지 않습니다.
- secret, credential, private token을 생성하거나 출력하지 않습니다.
- destructive command, deploy, migration, billing, legal commitment는 명시적 승인 없이 실행하지 않습니다.
- 저작권 있는 본문/이미지/음원을 그대로 재사용하지 않고, source note와 rights note를 남깁니다.
