# oh-my-agent 도구 라우팅

- OMA agent 설정 설치와 갱신에는 `oma`를 사용합니다.
- 구성 방식과 명령은 `.opendock/docks/oh-my-agent/README.md`를 확인합니다.
- 설치 상태는 읽기 전용인 `opendock doctor`로 확인합니다. 파일을 바꿀 수 있는 `oma doctor`는 사용자가 요청한 경우에만 실행합니다.

## 안전 경계

- `.agents/oma-config.yaml`은 code-equivalent 설정으로 검토합니다.
- vendor, model, command, env 변경의 범위와 영향을 실행 전에 확인합니다.
- credential, private token, SSH key, customer data를 config나 prompt에 기록하지 않습니다.
- global install과 HOME-level 설정 변경은 사용자 승인 없이 수행하지 않습니다.
