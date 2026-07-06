# Content Creator

블로그, 뉴스레터, 유튜브 스크립트, 썸네일 브리프, 업로드 체크리스트를 운영 가능한 콘텐츠 패키지로 정리하는 dock.

## 설치 후 제공되는 것

- `CONTENT_CREATOR.md`: 이 dock의 작업 원칙과 검토 기준
- `README.md`: 프로젝트 안에서 바로 보는 사용 안내
- `HARNESS.md`: 최종 handoff 전 확인 목록
- `.opendock/templates/content-creator/CONTENT_RUN.md`: 작업 run 기록 템플릿
- `.opendock/harness/opendock__content-creator/check.mjs`: 로컬 품질 검사
- `.agents/skills/opendock-content-creator/SKILL.md`: Codex/OMA 계열 agent가 읽는 skill
- `.claude/commands/opendock-content-creator/quality-gate.md`: Claude Code에서 호출할 수 있는 품질 게이트 문서

## 바로 쓰는 방법

1. `CONTENT_CREATOR.md`를 먼저 읽습니다.
2. `.opendock/templates/content-creator/CONTENT_RUN.md`를 `.opendock/runs/content-creator/<run-id>.md`로 복사합니다.
3. 목표, 범위, 근거, 결정, 남은 리스크를 기록합니다.
4. 작업 후 `node .opendock/harness/opendock__content-creator/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 human-approved exception으로 남깁니다.

## 주요 기준

- 콘텐츠는 audience, promise, angle, evidence, CTA를 먼저 정의합니다.
- 블로그/뉴스레터/영상/숏폼은 채널별 hook, structure, length, reuse plan이 달라야 합니다.
- 썸네일/제목은 과장보다 구체적인 기대효과와 시각적 대비를 우선합니다.
- 출처 없는 claim, 과장된 수치, 타인 저작물 무단 사용을 금지합니다.
- 업로드 전 title, description, tags, captions, asset rights, schedule, repurpose plan을 점검합니다.
- 브랜드 톤과 금지어는 프로젝트의 WRITING.md 또는 README 정책을 우선합니다.

## 안전 경계

저작권 있는 본문/이미지/음원을 그대로 재사용하지 않고, source note와 rights note를 남깁니다.

이 dock은 판단을 자동으로 확정하지 않습니다. 사용자가 바로 실행 가능한 문서와 agent 지시, 그리고 handoff 전 품질 게이트를 제공합니다.
