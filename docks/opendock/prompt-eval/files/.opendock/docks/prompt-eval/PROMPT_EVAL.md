# Prompt Eval 사용 가이드

## 평가 원칙

- 목적과 실패 기준을 먼저 정합니다.
- 성공 케이스와 위험·실패 케이스를 함께 둡니다.
- 근거, 안전성, 일관성, 형식 준수를 분리해 봅니다.
- 실패 case를 다음 prompt 변경과 연결합니다.

## 권장 기록

- dataset과 provider
- pass criteria
- model 또는 agent
- 결과와 failed cases
- 다음 변경과 재검증 방법

## 금지

- API key, credential, private prompt, customer data를 평가 파일에 넣지 않습니다.
- model output만으로 사실이나 안전성을 확정하지 않습니다.
