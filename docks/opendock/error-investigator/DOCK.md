# Error Investigator

오류 증거, 재현 조건, 원인 가설과 최소 수정안을 추적합니다.

## 설치 후 생기는 것

- `.opendock/docks/error-investigator/README.md`: 빠른 사용 안내
- `.opendock/docks/error-investigator/ERROR_INVESTIGATION_PLAYBOOK.md`: 오류 조사 기준
- `.opendock/templates/error-investigator/RUN.md`: 선택형 조사 메모
- `.agents/skills/opendock-error-investigator/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 playbook에 따라 오류를 바로 조사하고 필요한 최소 수정과 회귀 테스트를 수행합니다. 템플릿은 조사 기록이 필요할 때만 사용하고 현재 작업에 필요한 section만 선택합니다.

> 이 오류 로그와 최근 변경을 근거로 원인을 조사해줘.

## 검토 방법

사용자가 검토를 요청하면 현재 조사 결과만 `ERROR_INVESTIGATION_PLAYBOOK.md` 기준으로 AI가 직접 검토합니다. 요청하지 않은 과거 조사나 프로젝트 전체는 검사하지 않습니다.

## 안전

로그의 비밀과 개인정보를 제거하고 production 변경, 배포, 대량 삭제 또는 강제 reset을 승인 없이 실행하지 않습니다.
