---
name: opendock-group-trip
description: 여러 사람의 선호·제약·예산을 공정한 결정 방식, 투명한 tradeoff, 일정 대안과 비용 배분으로 조율하고 검증할 때 사용합니다.
---

# Group Trip Skill

1. `GROUP_TRIP_PLAYBOOK.md`를 읽고 run 템플릿을 복사합니다.
2. 구성원마다 같은 형식으로 직접 밝힌 선호, 제약, 예산과 접근성 요구를 기록합니다.
3. 공통점, 갈등, tradeoff와 보호 조건을 분리합니다.
4. 투표·점수·순번 등 공정한 방식과 동점·이의 제기 규칙을 합의합니다.
5. `group-trip/` 아래에 일정·대안, 비용 배분과 열린 투표를 작성하고 최신 추천 근거의 URL·접근일을 남깁니다.
6. 대상 파일을 선언하고 `node .opendock/harness/opendock__group-trip/check.mjs <manifest-path>` 실패를 반복 수정합니다.
7. 통과 후 Codex 검토와 구성원 최종 동의를 별도로 수행합니다.

민감 특성 추정, 비동의 개인정보 공개, 실제 예약·결제, 비밀값 처리, 파괴 명령과 만족 보장은 금지합니다.
