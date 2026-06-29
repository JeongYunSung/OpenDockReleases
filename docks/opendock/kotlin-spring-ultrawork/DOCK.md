# Kotlin Spring Ultrawork

Gradle, ktlint, detekt, DTO validation, profile, transaction, readiness를 확인하는 Kotlin/Spring Boot 품질 게이트입니다.

## 확인하는 것

- Gradle wrapper가 있어야 합니다.
- `ktlintCheck`, `detekt`, `test`, `build`, `bootJar`를 실행할 수 있어야 합니다.
- `application.yml`에 literal secret이 있으면 안 됩니다.
- Controller DTO에는 validation을 적용해야 합니다.
- write flow 주변의 transaction boundary가 명확해야 합니다.
- readiness와 health check가 있어야 합니다.

Kotlin과 Spring Boot 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
