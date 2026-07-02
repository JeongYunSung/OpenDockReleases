# Paper Shaders Ultrawork Quality Gate

1. `PAPER_SHADERS.md`에서 원하는 효과 후보를 고릅니다.
2. image filter, logo animation, effect 중 목적을 정합니다.
3. `DESIGN.md`가 있으면 key color, surface, motion 기준을 먼저 고정합니다.
4. 공식 예시 code를 복사하지 말고 현재 프로젝트 구조에 맞게 적용합니다.
5. props는 catalog의 controls, shader-specific props, common props만 사용합니다.
6. 숫자 값은 documented range 안에서 시작합니다.
7. 구현 후 mobile/desktop에서 시각 과밀, text contrast, motion 부담을 확인합니다.
8. `node .opendock/harness/opendock__paper-shaders-ultrawork/check.mjs`를 실행합니다.
9. 실패 항목을 수정하고 다시 실행합니다.
10. 최종 답변에는 선택한 shader, 조정한 props, 검증 결과를 짧게 보고합니다.
