# 출처와 패키징 기록

## 참고 자료

- 원본 프로젝트: [annieppss/ux-review-lab](https://github.com/annieppss/ux-review-lab)
- 확인한 revision: `c670f912fd3f2650debe1e3c7bb93335ceb01b1b`
- 확인일: 2026-09-02
- 참고 범위: `skills/ux-review-lab/SKILL.md`와 기능별 `references/` 문서

원본의 빠른 UX 점검, 역할별 리뷰, 선택적 예상 주목도라는 기능 구성을 참고해 OpenDock용 안내와 스킬을 작성했습니다. 원본 저장소 전체, 예시 화면, 이미지 자산은 포함하지 않습니다.

## OpenDock 구성

사용자 홈 설치 대신 프로젝트 상대 경로로 파일을 배치합니다. 스킬 이름은 `opendock-ux-review-lab`입니다. 1.0.1부터 동일한 스킬 원본을 Codex의 `.agents/skills/`와 Claude Code의 `.claude/skills/`에 설치합니다. 기능 가이드는 프로젝트의 `.opendock/docks/ux-review-lab/`에 한 번만 설치하고 선택된 기능의 문서만 읽도록 연결합니다.

Claude Code의 프로젝트 스킬 위치와 호출 규칙은 [공식 스킬 문서](https://code.claude.com/docs/en/skills)를 기준으로 합니다. Claude용 별도 실행 엔진이나 전역 설정을 추가하지 않습니다.

리뷰팀에 별도 에이전트 실행이나 attestation을 요구하지 않습니다. 저장 파일, 작업 메모리, 단어 수집, 반복 검사 스크립트도 추가하지 않습니다. Figma·브라우저·영상·이미지 도구는 호스트의 가용성과 권한에 따릅니다.

## 배포 허락

확인한 원본 revision에는 LICENSE 파일이 없습니다. 2026-09-02 사용자가 원저작자로부터 이 Dock의 공개 배포 허락을 받았다고 확인했습니다. 이 패키지는 그 확인에 근거해 OpenDock Registry 배포를 준비합니다. 이 기록이 원본 저장소에 새 라이선스를 부여하거나 다른 자료의 무제한 재배포를 허용하는 것은 아닙니다.

## 로고

원본 저장소의 예시 이미지를 로고로 재사용하지 않았습니다. 2026-09-02에 내장 `image_gen` 도구로 새로 제작해 패키지 루트 `logo.png`에 저장했습니다. 원본 작성자의 로고나 공식 제휴 표시가 아닙니다. 화면·돋보기·체크 구성이 표시되며 텍스트와 기존 브랜드 표식이 없는지 시각적으로 확인했습니다.

생성 프롬프트:

> Create an original square 512x512 app catalog icon for a UX screen review tool named UX Review Lab. No text, no letters, no numbers, no existing brand marks. Crisp simple flat graphic: one white screen wireframe with a few charcoal interface lines, a teal magnifying glass inspecting the screen, and a small coral check accent. Light neutral background. Strong legible silhouette at 64 pixels, generous safe padding. Professional quiet software-tool visual, not 3D, not glossy, no gradients, no shadows, no shield, no lightning bolt. This image is the new logo.png for a local OpenDock package.

배포 전 같은 도구로 화면·돋보기·체크 정체성을 유지한 단순화 편집을 수행했습니다. 편집 결과는 배포용 256x256 PNG로 변환했으며 48,985 bytes로 Registry의 512KB 제한을 충족합니다. 최종 아이콘은 텍스트나 기존 브랜드 표식이 없는지 다시 확인했습니다.

편집 프롬프트:

> Edit this UX review icon into a compact flat catalog logo. Keep its identity: one interface window, teal magnifying glass, coral check. Use a square 256 by 256 pixel output if supported. Simplify drastically to large completely flat solid-color shapes, removing texture, shading, gradients, gloss, card detail, tiny UI lines and all transparency noise. White solid background, charcoal window outline, teal magnifier and coral check, with clean padding. No text, no brand marks. PNG should be small and compressible, under 512KB. This is a production icon normalization for a registry with a 512KB limit, not a new illustration.
