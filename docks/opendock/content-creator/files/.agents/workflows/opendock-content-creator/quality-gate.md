# Content Creator Quality Gate

1. `CONTENT_CREATOR.md`를 읽습니다.
2. `.opendock/runs/content-creator/` 아래 이번 작업 run 문서를 확인하거나 새로 만듭니다.
3. 아래 기준으로 산출물을 검토합니다.

- 콘텐츠는 audience, promise, angle, evidence, CTA를 먼저 정의합니다.
- 블로그/뉴스레터/영상/숏폼은 채널별 hook, structure, length, reuse plan이 달라야 합니다.
- 썸네일/제목은 과장보다 구체적인 기대효과와 시각적 대비를 우선합니다.
- 출처 없는 claim, 과장된 수치, 타인 저작물 무단 사용을 금지합니다.
- 업로드 전 title, description, tags, captions, asset rights, schedule, repurpose plan을 점검합니다.
- 브랜드 톤과 금지어는 프로젝트의 WRITING.md 또는 README 정책을 우선합니다.

4. `node .opendock/harness/opendock__content-creator/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 `Approved Exception:`으로 승인된 예외를 남깁니다.
6. 최종 응답에는 통과/실패/미검증 항목을 구분해서 보고합니다.

## 안전 경계

저작권 있는 본문/이미지/음원을 그대로 재사용하지 않고, source note와 rights note를 남깁니다.
