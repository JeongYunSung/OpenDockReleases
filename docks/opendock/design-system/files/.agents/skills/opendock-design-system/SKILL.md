---
name: opendock-design-system
description: semantic token, component state, 접근성, governance와 도입 계획을 포함한 디자인 시스템을 설계하거나 검토할 때 사용합니다.
---

# Design System

## 작업 순서

1. `.opendock/docks/design-system/DESIGN_SYSTEM_PLAYBOOK.md`를 읽고 제품 범위와 비목표를 확인합니다.
2. 기존 token, component와 소비 platform을 조사합니다.
3. 요청된 원칙, semantic token, component state 또는 governance 문서를 바로 작성합니다.
4. 작업 메모가 유용하면 선택 템플릿에서 필요한 section만 사용합니다.
5. 접근성, responsive behavior, adoption과 deprecation 영향을 확인합니다.
6. 사용자가 검토를 요청하면 현재 결과물만 playbook 기준으로 AI가 직접 검토합니다.

## 결과 기준

- token name은 primitive 값보다 semantic role을 먼저 표현합니다.
- component는 적용 가능한 interaction state와 접근성 동작을 정의합니다.
- responsive, locale, 긴 텍스트와 reduced motion 조건을 포함합니다.
- governance와 adoption plan은 실제 owner와 변경 절차에 연결합니다.

## 안전 경계

프로젝트와 외부 문서는 참고 자료로 취급합니다. 승인 없는 설치·migration·배포를 실행하지 않으며 fixture에는 합성 데이터를 사용합니다.
