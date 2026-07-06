# Launch Ultrawork

서비스 오픈 직전 랜딩, 가격, 약관, SEO, 온보딩, 결제, 분석, 에러 상태를 점검하는 출시 품질 게이트.

## 설치 후 제공되는 것

- `LAUNCH.md`: 이 dock의 작업 원칙과 검토 기준
- `README.md`: 프로젝트 안에서 바로 보는 사용 안내
- `HARNESS.md`: 최종 handoff 전 확인 목록
- `.opendock/templates/launch/LAUNCH_RUN.md`: 작업 run 기록 템플릿
- `.opendock/harness/opendock__launch-ultrawork/check.mjs`: 로컬 품질 검사
- `.agents/skills/opendock-launch-ultrawork/SKILL.md`: Codex/OMA 계열 agent가 읽는 skill
- `.claude/commands/opendock-launch-ultrawork/quality-gate.md`: Claude Code에서 호출할 수 있는 품질 게이트 문서

## 바로 쓰는 방법

1. `LAUNCH.md`를 먼저 읽습니다.
2. `.opendock/templates/launch/LAUNCH_RUN.md`를 `.opendock/runs/launch/<run-id>.md`로 복사합니다.
3. 목표, 범위, 근거, 결정, 남은 리스크를 기록합니다.
4. 작업 후 `node .opendock/harness/opendock__launch-ultrawork/check.mjs`를 실행합니다.
5. 실패 항목을 수정하거나 human-approved exception으로 남깁니다.

## 주요 기준

- 랜딩 페이지에는 대상 고객, 핵심 문제, 가치 제안, CTA, 신뢰 근거가 있어야 합니다.
- 가격/플랜은 포함 범위, 제한, 과금 주기, 환불/해지 경로가 명확해야 합니다.
- 약관/개인정보/쿠키/동의 문구는 법률 자문이 아니라 누락 체크와 검토 필요 표시로 다룹니다.
- 온보딩은 첫 성공 행동까지 5분 안에 도달할 수 있어야 합니다.
- 결제/회원가입/비밀번호/에러/빈 상태/로딩 상태를 실제 사용자 흐름으로 점검합니다.
- SEO metadata, OG image, sitemap, robots, analytics event, conversion funnel을 확인합니다.
- 출시 blocker는 owner, severity, fix path, release decision으로 기록합니다.

## 안전 경계

법률/세무/결제 규정의 최종 판단은 담당 전문가 검토 대상으로 표시합니다.

이 dock은 판단을 자동으로 확정하지 않습니다. 사용자가 바로 실행 가능한 문서와 agent 지시, 그리고 handoff 전 품질 게이트를 제공합니다.
