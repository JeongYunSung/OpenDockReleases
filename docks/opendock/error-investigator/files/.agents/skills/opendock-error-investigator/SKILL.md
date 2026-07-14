---
name: opendock-error-investigator
description: 오류를 재현 증거, 가설 실험, 근본 원인, 최소 수정과 회귀 테스트로 조사할 때 사용합니다.
---

# Error Investigator

## 작업 순서

1. `.opendock/docks/error-investigator/ERROR_INVESTIGATION_PLAYBOOK.md`를 읽고 조사 범위와 민감정보 제외 기준을 정합니다.
2. 증상, 기대 동작, 실제 동작, 환경과 최근 변경을 확인합니다.
3. 재현 가능한 최소 사례를 만들고 가설별 반증 조건을 세웁니다.
4. 관찰과 실험으로 근본 원인을 좁힌 뒤 가장 작은 수정 범위를 선택합니다.
5. 수정 전 실패와 수정 후 통과를 보여주는 회귀 테스트를 추가하거나 실행합니다.
6. 조사 메모가 유용하면 선택 템플릿에서 필요한 section만 사용합니다.
7. 사용자가 검토를 요청하면 현재 조사 결과만 playbook 기준으로 AI가 직접 검토합니다.

## 안전 경계

비밀 조회, 원문 credential 수집, production 변경, 배포, migration, 대량 삭제와 강제 reset을 자동 실행하지 않습니다. 로그와 fixture에는 필요한 최소 데이터만 사용합니다.
