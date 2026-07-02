# Code Review Agent

    ## 목적

    AI 코드 리뷰를 severity, evidence, reproduction, fix verification 기준으로 정리합니다.

    ## 운영 원칙

    - 리뷰 결과는 파일/라인, 영향, 재현 조건을 포함합니다.
- 보안/데이터/권한/마이그레이션 변경은 evidence와 rollback을 요구합니다.
- 수정 후에는 같은 항목을 다시 확인합니다.

    ## Run 문서에 필요한 항목

    - Scope
- Changed files
- Findings
- Severity
- Evidence
- Fix plan
- Verification

    ## Tool

    `pr-agent` CLI가 project-local tool로 설치됩니다. 원격 PR 연동 token은 자동 생성하거나 저장하지 않습니다.

    ## 금지

    - secret, credential, token, private key를 run 문서나 prompt에 넣지 않습니다.
    - 외부 provider에 private customer data를 보내지 않습니다.
    - 승인 없이 destructive action, deploy, payment, account mutation을 수행하지 않습니다.
