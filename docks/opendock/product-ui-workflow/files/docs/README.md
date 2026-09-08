# Product UI Workflow

제품 UI 요청을 결정된 요구사항, 독자 작성 시나리오, 디자인 시스템, 재사용 가능한 Storybook 컴포넌트와 검증된 화면으로 완성하는 프로젝트 로컬 워크플로입니다.

Codex는 `.agents/skills/`의 `$opendock-product-ui-workflow`를, Claude Code는 `.claude/skills/`의 `/opendock-product-ui-workflow`를 읽습니다. 두 환경은 같은 원본 스킬과 가이드를 사용합니다.

Dock은 `oh-my-design-cli` 2.0.0을 프로젝트 전용 `omd` 및 `oh-my-design` 명령으로 설치합니다. 설치 중에는 Storybook을 초기화하거나 애플리케이션 의존성·MCP 설정을 변경하지 않으며, Chromatic 로그인, 기준 이미지 승인 또는 백그라운드 서비스 시작도 수행하지 않습니다.

새 화면이나 여러 상태가 있는 기능에는 전체 흐름을 사용합니다. 기존 컴포넌트 하나 또는 문구만 바꾸는 작업에는 필요한 단계와 현재 프로젝트 테스트만 적용합니다.
