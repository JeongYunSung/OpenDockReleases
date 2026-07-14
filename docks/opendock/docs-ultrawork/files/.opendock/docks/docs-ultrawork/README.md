# Docs Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

Markdown 위생, link, heading, code fence, quick start, CLI drift, 다국어 싱크를 확인하는 문서 품질 게이트입니다.

## 확인하는 것

- Markdown code fence에는 언어를 적어야 합니다.
- OpenDock install 예시에는 `@version`이 포함되어야 합니다.
- API/registry 관련 URL은 `registry.opendock.app`을 가리켜야 합니다.
- README quick start는 5분 안에 따라 할 수 있어야 합니다.
- 오래된 package name과 stale version 문구는 제거해야 합니다.
- 다국어 문서는 구조가 서로 맞아야 합니다.

문서 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
