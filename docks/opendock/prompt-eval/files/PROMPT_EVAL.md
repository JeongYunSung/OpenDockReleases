# Prompt Eval

    ## 목적

    프롬프트, agent 지시문, RAG 답변, UX writing 답변을 반복 평가합니다.

    ## 운영 원칙

    - 평가 목적과 실패 기준을 먼저 적습니다.
- 테스트 케이스는 성공 케이스와 위험 케이스를 함께 둡니다.
- model output을 그대로 신뢰하지 않고 근거, 안전성, 일관성, 형식 준수를 봅니다.

    ## Run 문서에 필요한 항목

    - Objective
- Dataset
- Pass criteria
- Models or agents
- Result
- Failed cases
- Next prompt change

    ## Tool

    `promptfoo` CLI가 project-local tool로 설치됩니다. 실제 provider key는 사용자가 별도 관리합니다.

    ## 금지

    - secret, credential, token, private key를 run 문서나 prompt에 넣지 않습니다.
    - 외부 provider에 private customer data를 보내지 않습니다.
    - 승인 없이 destructive action, deploy, payment, account mutation을 수행하지 않습니다.
