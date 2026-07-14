# Agent Security

현재 변경 범위의 보안 위험, 영향, 근거와 완화책을 검토합니다.

## 설치 후 생기는 것

- `.opendock/docks/agent-security/README.md`: 사용 안내
- `.opendock/docks/agent-security/SECURITY.md`: 보안 검토 기준
- `.opendock/templates/agent-security/SECURITY_REVIEW.md`: 선택형 보안 리뷰 템플릿
- `.agents/skills/opendock-agent-security/SKILL.md`: AI 작업 절차
- 루트 `AGENTS.md`: 짧은 요청 라우팅과 안전 규칙

## 사용 방법

평소에는 `SECURITY.md` 기준으로 요청을 바로 처리합니다. 템플릿은 선택 사항이며 현재 변경과 관련된 섹션만 골라 사용합니다.

> 이번 인증 변경의 위협, 영향, 완화책을 검토해줘.

사용자가 검토를 요청하면 AI가 현재 결과물만 `SECURITY.md` 기준으로 직접 검토하고 민감 영역, 공격 가능성, 영향, 근거, 완화책과 잔여 위험을 설명합니다.

## 안전

실제 secret을 노출하거나 위험 발견을 실제 공격 실행으로 확대하지 않습니다. 승인 없이 배포, 권한 변경, 이전, 관련 없는 파일 변경 또는 파괴적 명령을 실행하지 않습니다.
