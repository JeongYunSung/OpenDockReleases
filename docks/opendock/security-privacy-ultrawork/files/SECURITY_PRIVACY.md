# Security Privacy Ultrawork Guide

secret, PII, 권한, 인증 guard, dependency risk, prompt injection, 데이터 처리 흐름을 점검하는 보안/프라이버시 품질 게이트.

## 원칙

- 수집/저장/전송/삭제되는 데이터와 PII 여부를 inventory로 작성합니다.
- 인증이 필요한 endpoint, admin action, 데이터 export에는 guard가 있어야 합니다.
- secret, token, private key, `.env` 값은 산출물에 포함하지 않습니다.
- prompt injection, embedded instruction, tool abuse, data exfiltration 경로를 따로 봅니다.
- dependency와 외부 provider 사용에는 목적, 데이터 범위, 보존 기간, 대체 경로를 기록합니다.
- 발견 사항은 severity, impact, evidence, fix owner, due date로 정리합니다.

## 표준 작업 순서

1. 데이터 흐름과 권한 경계를 먼저 그립니다.
2. secret/PII/auth/prompt injection을 분리해 검사합니다.
3. critical/high는 반드시 수정하거나 명시적 승인된 예외로 남깁니다.
4. 하네스와 수동 검토 결과를 함께 보고합니다.

## 산출물 구조

Run 문서는 아래 section을 포함해야 합니다.

- 데이터 인벤토리
- 접근 제어
- 시크릿 처리
- 프라이버시 리스크
- 위협 시나리오
- 수정 계획
- 다음 행동

## 품질 판단 기준

- 사용자가 바로 다음 행동을 알 수 있어야 합니다.
- 주장과 결정에는 근거 또는 source note가 있어야 합니다.
- blocker와 improvement를 섞지 않습니다.
- 담당자, 리스크, 후속 행동이 없는 문서는 handoff하지 않습니다.
- `HARNESS.md`와 run 문서가 서로 다른 기준을 말하면 `SECURITY_PRIVACY.md`를 우선합니다.

## 예외 처리

예외는 다음 형식으로만 남깁니다.

```md
Approved Exception: <승인자 / 날짜 / 이유 / 만료 조건>
```

## 안전 경계

보안 검사는 발견 가능성을 높이는 절차이며, 침투테스트나 법적 컴플라이언스 보증으로 표현하지 않습니다.
