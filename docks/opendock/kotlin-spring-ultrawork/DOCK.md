# Kotlin Spring Ultrawork

Spring 관례에 맞는 코드뿐 아니라 DTO 검증, 트랜잭션 경계, blocking 호출, profile 설정과 Gradle 재현성을 함께 봅니다. 강한 검수를 요청하면 ktlint, detekt, test, build와 보안 검사를 현재 변경 범위에서 엄격하게 확인합니다.

## 이런 때 사용하세요

- Kotlin Spring API와 배치 기능을 구현할 때
- 멀티모듈 구조와 Gradle 설정을 정리할 때
- 코루틴과 blocking 코드, 트랜잭션 문제를 검수할 때

## AI에서 이렇게 사용하세요

AI에서 `$opendock-kotlin-spring-ultrawork` 스킬을 선택한 뒤 자연어로 요청하세요. 스킬 선택 기능이 없는 AI에서는 요청에 “Kotlin Spring Ultrawork 기준으로”라고 적어도 됩니다.

### 요청 예시

> Kotlin Spring으로 주문 조회 API를 만들고 DTO 검증과 예외 응답을 포함해줘.

> 이번 변경을 ultrawork로 검수해서 ktlint, detekt, 테스트, 트랜잭션과 코루틴 문제를 고쳐줘.

## 검수 강도

- 평소 요청에서는 지금 만들거나 수정한 결과물에 필요한 기준만 적용해 빠르게 작업합니다.
- 요청에 `검수` 또는 `ultrawork`를 넣으면 현재 결과물에 강한 하네스와 AI 검토를 적용하고, 실패 항목을 고친 뒤 다시 확인합니다.
- 프로젝트 전체 검사는 사용자가 전체 범위를 명확히 요청한 경우에만 실행합니다. 관련 없는 기존 파일 때문에 작업을 늦추지 않습니다.

## 사용 후 얻는 것

- Spring 관례와 Kotlin 타입을 살린 구현
- 재현 가능한 Gradle 빌드와 테스트
- 현재 변경 범위의 정적 분석·트랜잭션·보안 검수 결과
