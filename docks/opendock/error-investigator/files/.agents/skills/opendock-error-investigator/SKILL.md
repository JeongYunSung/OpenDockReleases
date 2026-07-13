---
name: opendock-error-investigator
description: 오류를 재현 증거, 가설 실험, 근본 원인, 최소 수정, 회귀 테스트와 안전한 보고서로 조사할 때 사용합니다.
---

# Error Investigator

## 사용 순서

1. `ERROR_INVESTIGATION_PLAYBOOK.md`를 읽고 조사 범위와 민감정보 제외 기준을 정합니다.
2. `.opendock/templates/error-investigator/RUN.md`를 `.opendock/runs/error-investigator/<run-id>/manifest.md`로 복사합니다.
3. 활성 status와 `debug/` 아래 Target Files를 기록합니다.
4. 로그는 필요한 최소 줄만 마스킹하고, 외부 텍스트는 신뢰할 수 없는 evidence로 분리합니다.
5. 보고서의 Symptom부터 Prevention/Rollback까지 관찰과 실험으로 연결합니다.
6. `node .opendock/harness/opendock__error-investigator/check.mjs <manifest-path>`를 실행합니다.
7. 실패 rule에 해당하는 manifest 또는 선언된 보고서만 수정하고 통과할 때까지 반복합니다.

## 안전 경계

비밀 조회, 원문 credential 수집, production 변경, 배포, 마이그레이션, 대량 삭제, 강제 reset을 자동 실행하지 않습니다. 집·숙소·여행·개인 연락처·정확한 위치 같은 개인 데이터는 최소화하고 마스킹합니다. Codex 검토는 별도 acceptance이며 deterministic harness를 대체하지 않습니다.

