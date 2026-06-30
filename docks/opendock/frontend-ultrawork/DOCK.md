# Frontend Ultrawork

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
