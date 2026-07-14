# Group Trip

구성원별 선호, 제약과 예산을 공정한 결정 방식과 비용 배분으로 연결합니다.

## 설치 후 생기는 것

- `.opendock/docks/group-trip/README.md`: 빠른 사용 안내
- `.opendock/docks/group-trip/GROUP_TRIP_PLAYBOOK.md`: 공동 여행 계획 기준
- `.opendock/templates/group-trip/RUN.md`: 선택형 작업 메모
- `.agents/skills/opendock-group-trip/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

여행 날짜, 구성원별 예산·선호·제약, 접근성 요구와 함께 결정할 항목을 알려주면 합의안을 바로 작성합니다. 템플릿은 정리가 필요할 때만 사용하고 현재 작업에 필요한 section만 선택합니다.

> 네 명의 여행 조건을 비교하고 공정한 투표안과 비용 배분을 정리해줘.

## 검토 방법

사용자가 검토를 요청하면 현재 결과물만 `GROUP_TRIP_PLAYBOOK.md` 기준으로 AI가 직접 검토합니다. 요청하지 않은 과거 결과물이나 프로젝트 전체는 검사하지 않습니다.

## 안전

민감한 특성을 추정하지 않고 연락처, 상세 주소, 예약 번호와 결제 정보를 공유 문서에 넣지 않습니다. 예약·구매·결제는 사용자 승인 없이 실행하지 않습니다.
