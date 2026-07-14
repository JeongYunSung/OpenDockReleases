# Design System

제품의 토큰, 컴포넌트 상태와 접근성 규칙을 일관된 계약으로 정리합니다.

## 설치 후 생기는 것

- `.opendock/docks/design-system/README.md`: 빠른 사용 안내
- `.opendock/docks/design-system/DESIGN_SYSTEM_PLAYBOOK.md`: 디자인 시스템 기준
- `.opendock/templates/design-system/RUN.md`: 선택형 작업 메모
- `.agents/skills/opendock-design-system/SKILL.md`: agent 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 playbook에 따라 요청된 토큰, 컴포넌트 또는 운영 문서를 바로 작성하거나 수정합니다. 템플릿은 정리가 필요할 때만 사용하고 현재 작업에 필요한 section만 선택합니다.

> 현재 UI를 보고 색상 토큰과 버튼 상태 계약을 정리해줘.

## 검토 방법

사용자가 검토를 요청하면 현재 결과물만 `DESIGN_SYSTEM_PLAYBOOK.md` 기준으로 AI가 직접 검토합니다. 요청하지 않은 과거 결과물이나 프로젝트 전체는 검사하지 않습니다.

## 안전

기존 토큰과 컴포넌트를 근거 없이 덮어쓰지 않고 접근성 기준을 유지합니다. 승인 없이 관련 없는 파일 수정·삭제, 설치, 배포 또는 migration을 실행하지 않습니다.
