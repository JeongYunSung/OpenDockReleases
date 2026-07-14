# Customer Support AI

고객 문의를 분류하고 정책에 근거한 답변과 이관 기준을 만듭니다.

## 설치 후 생기는 것

- `.opendock/docks/customer-support-ai/README.md`: 빠른 사용 안내
- `.opendock/docks/customer-support-ai/CUSTOMER_SUPPORT.md`: 고객지원 작성 기준
- `.opendock/templates/customer-support/SUPPORT_RUN.md`: 선택형 작업 메모
- `.agents/skills/opendock-customer-support-ai/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 고객지원 기준에 따라 요청된 답변, 매크로 또는 분석을 바로 작성합니다. 템플릿은 정리가 필요할 때만 사용하고 현재 작업에 필요한 section만 선택합니다.

> 이 문의의 답변 초안과 상담원 이관 필요 여부를 정리해줘.

## 검토 방법

사용자가 검토를 요청하면 현재 결과물만 `CUSTOMER_SUPPORT.md` 기준으로 AI가 직접 검토합니다. 요청하지 않은 과거 결과물이나 프로젝트 전체는 검사하지 않습니다.

## 안전

고객 개인정보를 최소화하고 환불·보상·법적 약속을 담당자 승인 없이 확정하지 않습니다. 승인 없이 관련 없는 파일 수정·삭제, credential 접근, 배포 또는 위험한 명령을 실행하지 않습니다.
