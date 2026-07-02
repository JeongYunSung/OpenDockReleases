# Context Engineering

    ## 목적

    큰 repo에서 AI가 전부 읽지 않고 task에 필요한 scope와 evidence만 고르게 합니다.

    ## 운영 원칙

    - 작업 질문, target files, 제외 경로, token budget을 먼저 정합니다.
- context pack은 출처 파일 목록과 선택 이유를 포함합니다.
- secret이나 민감 설정 파일은 context pack에 포함하지 않습니다.

    ## Run 문서에 필요한 항목

    - Question
- Target scope
- Source files
- Excluded paths
- Token budget
- Summary
- Open questions

    ## Tool

    `code-review-graph`와 `codectx`가 project-local tool로 설치됩니다. 색인은 workspace 안에서만 다룹니다.

    ## 금지

    - secret, credential, token, private key를 run 문서나 prompt에 넣지 않습니다.
    - 외부 provider에 private customer data를 보내지 않습니다.
    - 승인 없이 destructive action, deploy, payment, account mutation을 수행하지 않습니다.
