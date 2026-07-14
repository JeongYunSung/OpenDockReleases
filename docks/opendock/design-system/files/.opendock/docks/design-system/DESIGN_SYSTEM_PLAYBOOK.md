# Design System Playbook

## 1. 시스템 계약

제품 범위, 소비 플랫폼, 지원 theme·locale, 기존 component와 token, 소유 팀, 비목표를 기록합니다. 원칙은 이후 naming, token과 component 결정에 사용할 수 있어야 합니다.

## 2. Semantic Token

각 token은 name, semantic role, primitive value, 적용 조건, contrast 또는 시각 근거를 가집니다.

- Color: canvas, surface, text, border, primary action, focus, success, warning, error
- Type: display, heading, body, label, caption, code
- Spacing: inset, stack, inline gap, section, control
- Radius: control, surface, overlay처럼 component 성격에 따른 역할
- Shadow: raised control, floating surface, modal overlay처럼 elevation 의미에 따른 역할

raw value만 나열하지 않습니다. naming은 platform syntax보다 의미를 먼저 표현하고 alias·versioning·deprecation 규칙을 포함합니다.

## 3. Component State

component마다 default, hover, active, focus, disabled, loading, error, empty, success의 적용성을 정리합니다. 특정 state가 해당하지 않으면 이유와 대체 피드백을 기록합니다. keyboard, touch, screen reader, reduced motion과 긴 텍스트·작은 viewport 동작을 함께 정의합니다.

## 4. 접근성과 반응형

텍스트 대비, focus visibility, 이름·역할·값, 상태 전달, target size, zoom과 reduced motion을 token·component 계약에 연결합니다. responsive 규칙에는 container, breakpoint, reflow, overflow와 content priority를 포함합니다.

## 5. Governance와 도입

제안, 검토, 승인, versioning, deprecation, 예외와 ownership 절차를 정의합니다. decision log에는 날짜, 결정, 근거, 대안, 영향과 owner를 남깁니다. adoption plan은 inventory, pilot, migration, 측정, deprecation 단계와 rollback 조건을 포함합니다.

## 6. 선택 가능한 산출물

현재 요청에 필요한 항목만 선택합니다.

- 시스템 원칙과 비목표
- semantic token과 naming 규칙
- component state와 접근성 계약
- responsive behavior
- governance, decision log와 adoption plan

## 7. 검토 기준

사용자가 검토를 요청하면 AI는 현재 결과물만 semantic role, state completeness, 접근성, responsive behavior, governance와 도입 위험 기준으로 직접 확인합니다.

## 8. 최소 데이터

문서와 fixture는 합성 값을 사용합니다. 실명, 연락처, 주소, 예약·계정 식별자와 같은 개인정보를 저장하지 않습니다. 실제 데이터가 필요하면 최소 필드만 사용하고 redaction 범위를 기록합니다.
