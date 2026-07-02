# Browser Agent

    ## 목적

    웹 탐색, UI smoke, browser task를 agent가 안전하게 수행하도록 준비합니다.

    ## 운영 원칙

    - 작업 전에 target URL과 allowed domains를 명시합니다.
- 로그인, 결제, 삭제, 제출 같은 민감 액션은 human approval을 받습니다.
- 스크린샷/요약/실패 원인을 run manifest에 남깁니다.

    ## Run 문서에 필요한 항목

    - Target
- Allowed domains
- Disallowed actions
- Task
- Result
- Screenshots or evidence
- Human approval needed

    ## Tool

    `agent-browser` CLI가 project-local tool로 설치됩니다. 브라우저 바이너리 다운로드가 필요한 경우 명시적으로 승인 후 진행합니다.

    ## 금지

    - secret, credential, token, private key를 run 문서나 prompt에 넣지 않습니다.
    - 외부 provider에 private customer data를 보내지 않습니다.
    - 승인 없이 destructive action, deploy, payment, account mutation을 수행하지 않습니다.
