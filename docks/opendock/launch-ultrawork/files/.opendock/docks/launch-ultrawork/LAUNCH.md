# Launch Ultrawork Guide

서비스 오픈 직전 랜딩, 가격, 약관, SEO, 온보딩, 결제, 분석, 에러 상태를 점검하는 출시 품질 게이트.

## 원칙

- 랜딩 페이지에는 대상 고객, 핵심 문제, 가치 제안, CTA, 신뢰 근거가 있어야 합니다.
- 가격/플랜은 포함 범위, 제한, 과금 주기, 환불/해지 경로가 명확해야 합니다.
- 약관/개인정보/쿠키/동의 문구는 법률 자문이 아니라 누락 체크와 검토 필요 표시로 다룹니다.
- 온보딩은 첫 성공 행동까지 5분 안에 도달할 수 있어야 합니다.
- 결제/회원가입/비밀번호/에러/빈 상태/로딩 상태를 실제 사용자 흐름으로 점검합니다.
- SEO metadata, OG image, sitemap, robots, analytics event, conversion funnel을 확인합니다.
- 출시 blocker는 owner, severity, fix path, release decision으로 기록합니다.

## 표준 작업 순서

1. 제품 목표와 출시 범위를 먼저 잠급니다.
2. 랜딩/가입/결제/온보딩/분석을 실제 사용자 경로로 나눕니다.
3. blocker와 nice-to-have를 분리합니다.
4. 수정 후 harness를 실행하고 남은 리스크를 공개합니다.

## 산출물 구조

Run 문서는 아래 section을 포함해야 합니다.

- 목표
- 범위
- 출시 체크리스트
- 차단 리스크
- 담당자
- 다음 행동

## 품질 판단 기준

- 사용자가 바로 다음 행동을 알 수 있어야 합니다.
- 주장과 결정에는 근거 또는 source note가 있어야 합니다.
- blocker와 improvement를 섞지 않습니다.
- 담당자, 리스크, 후속 행동이 없는 문서는 handoff하지 않습니다.
- `.opendock/docks/launch-ultrawork/HARNESS.md`와 run 문서가 서로 다른 기준을 말하면 `.opendock/docks/launch-ultrawork/LAUNCH.md`를 우선합니다.

## 예외 처리

예외는 다음 형식으로만 남깁니다.

```md
Approved Exception: <승인자 / 날짜 / 이유 / 만료 조건>
```

## 안전 경계

법률/세무/결제 규정의 최종 판단은 담당 전문가 검토 대상으로 표시합니다.
