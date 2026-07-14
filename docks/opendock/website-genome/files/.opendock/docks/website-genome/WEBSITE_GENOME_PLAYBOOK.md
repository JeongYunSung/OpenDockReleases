# Website Genome Playbook

평소에는 별도 준비 없이 바로 분석합니다. 작업 메모가 필요하면 선택 템플릿에서 관련 섹션만 사용하고, 사용자가 검토를 요청하면 AI가 현재 결과물만 이 플레이북 기준으로 직접 검토합니다.

## 1. 캡처 계약

URL, 페이지 목록, UI 상태, viewport, locale, theme, 인증 여부와 캡처 날짜를 먼저 고정합니다. 모든 source에는 URL과 접근일을 기록합니다. 시간이 지나면 달라질 수 있는 관찰은 현재 캡처의 사실로만 표현합니다.

개인화 페이지보다 공개·비식별 상태를 우선합니다. 여행 일정, 집 주소, 정확한 위치, 실명, 연락처, 예약·계정 식별자가 나타나면 분석에 필요한 최소 영역만 남기고 즉시 가립니다.

## 2. 분석 축

요청과 대상 페이지에 관련된 축만 선택합니다. 아래 항목을 모두 별도 섹션으로 작성할 필요는 없습니다.

- Typography: family를 추정으로 단정하지 않고 hierarchy, size, weight, line height, 용도를 기록합니다.
- Color Roles: canvas, surface, text, border, primary action, focus, semantic state처럼 역할로 기록합니다.
- Spacing / Grid: container, column, gutter, rhythm, breakpoint 변화를 기록합니다.
- Components: 반복 단위, variant, state, content rule을 inventory로 만듭니다.
- Responsive Behavior: 숨김·재배치·축약·overflow·navigation 변화를 viewport별로 기록합니다.
- Motion: trigger, property, duration 범위, easing, reduced-motion 동작을 관찰합니다.
- Accessibility: semantics, keyboard, focus, contrast, alternative text, zoom과 상태 전달을 다룹니다.

## 3. 기술 증거

framework, CMS, hosting, analytics는 DOM attribute, response header, 공개 repository 또는 vendor가 명시한 자료 같은 근거가 있을 때만 기록합니다. 각 항목에 evidence와 confidence를 붙입니다. class name이나 bundle 이름 하나만으로 확정하지 않습니다.

## 4. 사실·가정·추천

관찰 가능한 사실, 해석이 필요한 가정, 다른 프로젝트에 적용할 추천을 분리합니다. 추천에는 원본을 복사하지 않고 적용 가능한 원리와 한계를 씁니다. proprietary image, icon, font binary, source code는 수집하거나 결과물에 포함하지 않습니다.

## 5. 재사용 인벤토리

token 후보는 semantic name, 관찰 값, 사용 맥락, confidence를 함께 기록합니다. 단일 raw palette나 숫자 목록은 genome이 아닙니다. component inventory에는 상태와 responsive 변형을 포함합니다.

## 6. 검토

검토 요청에서는 현재 결과물의 관찰 근거, 사실·가정 구분, 기술 confidence, 재사용 가능성과 권리 처리를 확인합니다.
