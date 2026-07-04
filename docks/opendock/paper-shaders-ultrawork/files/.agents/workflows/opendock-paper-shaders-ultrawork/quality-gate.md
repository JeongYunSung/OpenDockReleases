# Paper Shaders Ultrawork Quality Gate

1. `PAPER_SHADERS.md`에서 원하는 효과 후보를 고릅니다.
2. image filter, logo animation, effect 중 목적을 정합니다.
3. 이미지가 있으면 subject, palette, texture, edge, motion suitability를 요약합니다.
4. `SHADER_PLAYBOOK.md` 기준으로 후보 2-3개를 표로 제안합니다.
5. 추천 1순위를 표시하고 사용자의 번호 선택을 기다립니다.
6. 사용자가 선택하기 전에는 적용을 시작하지 않습니다. 사용자가 “바로 골라서 적용”을 명시한 경우에만 추천 1순위를 적용합니다.
7. `.codex/opendock/paper-shaders-ultrawork` reference runtime에서 `@paper-design/shaders-react` package와 type 정보를 확인합니다.
8. 실제 앱 코드가 `@paper-design/shaders-react`를 import해야 한다면 해당 앱의 package manifest에도 dependency가 있는지 확인합니다.
9. `DESIGN.md`가 있으면 key color, surface, motion 기준을 먼저 고정합니다.
10. 공식 예시 code를 복사하지 말고 현재 프로젝트 구조에 맞게 적용합니다.
11. props는 catalog의 controls, shader-specific props, common props만 사용합니다.
12. 숫자 값은 documented range 안에서 시작합니다.
13. 구현 후 mobile/desktop에서 시각 과밀, text contrast, motion 부담을 확인합니다.
14. `node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`를 실행합니다.
15. 실패 항목을 수정하고 다시 실행합니다.
16. 최종 답변에는 제안한 후보, 선택된 shader, 조정한 props, 검증 결과를 짧게 보고합니다.
