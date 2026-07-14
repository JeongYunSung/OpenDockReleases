# Context7 MCP 사용 가이드

## 사용 시점

- API 사용법이 최신인지 확인할 때
- framework migration을 검토할 때
- 공식 문서 근거가 필요한 구현을 할 때

## 조회 기준

- library 이름과 기대 version을 정합니다.
- 확인한 documentation section과 적용한 API를 기록합니다.
- 모호한 결과는 공식 문서와 현재 dependency source로 다시 확인합니다.

## 금지

- 조회 결과를 project version 검토 없이 적용하지 않습니다.
- API key와 secret을 문서나 작업 기록에 저장하지 않습니다.
- MCP server를 장기 background process나 배포 구성에 자동 등록하지 않습니다.
