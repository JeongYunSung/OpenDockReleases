# Context Engineering 사용 가이드

## 범위 설정

- 작업 질문과 target files를 먼저 정합니다.
- 제외할 generated, vendor, secret 경로를 명시합니다.
- 필요한 관계와 출력 크기만 요청합니다.

## 결과 검토

- source file 목록과 선택 이유를 남깁니다.
- graph와 summary가 현재 source와 일치하는지 확인합니다.
- 불확실한 관계는 실제 definition과 caller를 다시 읽습니다.

## 금지

- `.env`, keychain, SSH key, cloud credential, private token을 입력에 포함하지 않습니다.
- private customer data를 외부 provider로 보내지 않습니다.
- 생성된 요약을 검증 없이 source 사실로 확정하지 않습니다.
