# Launch Ultrawork Workspace

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

검사 도구는 target 존재, 안전한 경로와 크기, 출시 기록의 필수 구조와 명백한 보안 위반만 확인합니다. 전략의 설득력, 카피, 시장 판단 같은 의미 품질은 `LAUNCH.md`를 기준으로 AI가 현재 산출물을 직접 검토합니다.

서비스 오픈 직전 랜딩, 가격, 약관, SEO, 온보딩, 결제, 분석, 에러 상태를 점검하는 출시 품질 게이트.

## 설치된 Agent Context

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 Launch Ultrawork 작업 규칙이 추가됩니다.
- `.agents/skills/opendock-launch-ultrawork/SKILL.md`는 Codex/OMA 계열 agent가 직접 참고할 수 있는 skill입니다.
- `.claude/commands/opendock-launch-ultrawork/quality-gate.md`는 Claude Code에서 품질 게이트를 호출할 때 쓰는 문서입니다.
- `.cursor/rules/opendock-launch-ultrawork.mdc`는 Cursor 작업 시 같은 기준을 알려줍니다.

## 먼저 할 일

1. `.opendock/docks/launch-ultrawork/LAUNCH.md`를 읽습니다.
2. 이번 작업의 작업 식별자를 정합니다.
3. 템플릿을 복사합니다.

```bash
mkdir -p .opendock/runs/launch
cp .opendock/templates/launch/LAUNCH_RUN.md .opendock/runs/launch/<작업-id>.md
```

4. 작업 목표와 근거를 채운 뒤 agent에게 요청합니다.
5. 완료 전 harness를 실행합니다.

```bash
node .opendock/harness/launch-ultrawork/check.mjs
```

## 자주 쓰는 workflow

- 제품 목표와 출시 범위를 먼저 잠급니다.
- 랜딩/가입/결제/온보딩/분석을 실제 사용자 경로로 나눕니다.
- blocker와 nice-to-have를 분리합니다.
- 수정 후 harness를 실행하고 남은 리스크를 공개합니다.

## 품질 체크

- 랜딩 페이지에는 대상 고객, 핵심 문제, 가치 제안, CTA, 신뢰 근거가 있어야 합니다.
- 가격/플랜은 포함 범위, 제한, 과금 주기, 환불/해지 경로가 명확해야 합니다.
- 약관/개인정보/쿠키/동의 문구는 법률 자문이 아니라 누락 체크와 검토 필요 표시로 다룹니다.
- 온보딩은 첫 성공 행동까지 5분 안에 도달할 수 있어야 합니다.
- 결제/회원가입/비밀번호/에러/빈 상태/로딩 상태를 실제 사용자 흐름으로 점검합니다.
- SEO metadata, OG image, sitemap, robots, analytics event, conversion funnel을 확인합니다.
- 출시 blocker는 owner, severity, fix path, release decision으로 기록합니다.

## 유용한 프롬프트

- 이 서비스의 출시 전 체크리스트를 만들어줘. 랜딩, 가격, 온보딩, 결제, SEO, 분석, 에러 상태를 모두 봐줘.
- 아래 랜딩 페이지 문구가 출시 가능한지 Launch Ultrawork 기준으로 blocker와 quick win을 나눠줘.
- 가격표와 환불/해지 안내에서 사용자가 오해할 만한 부분을 찾아줘.

## 주의

법률/세무/결제 규정의 최종 판단은 담당 전문가 검토 대상으로 표시합니다.
