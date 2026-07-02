# Agent Security Quality Gate

1. `SECURITY.md`를 읽습니다.
2. 변경 범위가 민감 영역인지 판단합니다.
3. evidence, risk, owner, rollback 또는 mitigation을 확인합니다.
4. secret 값이 문서나 코드에 남지 않았는지 확인합니다.
5. `node .opendock/harness/opendock__agent-security/check.mjs`를 실행합니다.
