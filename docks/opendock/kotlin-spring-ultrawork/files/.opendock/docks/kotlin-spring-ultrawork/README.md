# Kotlin Spring Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

Gradle, ktlint, detekt, DTO validation, profile, transaction, readiness를 확인하는 Kotlin/Spring Boot 품질 게이트입니다.

## 확인하는 것

- Gradle wrapper가 있어야 합니다.
- `ktlintCheck`, `detekt`, `test`, `build`, `bootJar`를 실행할 수 있어야 합니다.
- `application.yml`에 literal secret이 있으면 안 됩니다.
- Controller DTO에는 validation을 적용해야 합니다.
- write flow 주변의 transaction boundary가 명확해야 합니다.
- readiness와 health check가 있어야 합니다.

Kotlin과 Spring Boot 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
