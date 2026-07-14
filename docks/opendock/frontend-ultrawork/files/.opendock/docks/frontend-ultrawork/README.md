# Frontend Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

React, TypeScript, 접근성, route smoke check, build readiness를 확인하는 프론트엔드 품질 게이트입니다.

## 확인하는 것

- `package.json`이 있다면 formatter, lint, typecheck, test, build script가 있어야 합니다.
- `console.log`, `debugger`, 넓은 범위의 `any`, `href="#"` placeholder를 막습니다.
- image에는 alt text가, form control에는 label이, button에는 명시적인 type이 필요합니다.
- button 안에 link, link 안에 button을 넣지 않습니다. div/span 클릭 핸들러는 semantic element로 바꾸거나 role, tabIndex, keyboard handler를 함께 둡니다.
- icon-only action, select, textarea에는 accessible name이 필요하고 positive tabIndex는 금지합니다.
- 사용자 플로우 테스트는 가능하면 `getByRole`/role-name 기준으로 작성합니다.
- API flow에는 loading state와 error state가 필요합니다.
- 사용자가 보는 route나 page에는 smoke test가 있어야 합니다.
- bundle 증가와 불필요한 중복 dependency는 review가 필요합니다.

프론트엔드 구현 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
