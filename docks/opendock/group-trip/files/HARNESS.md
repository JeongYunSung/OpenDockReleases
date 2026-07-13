# Group Trip 하네스 계약

하네스는 선택적 manifest 상대 경로를 받습니다. 인자가 없으면 `.opendock/runs/group-trip/` 바로 아래에서 활성 실행만 발견하고, 인자가 있으면 지정한 한 파일만 검사합니다.

```bash
node .opendock/harness/opendock__group-trip/check.mjs [manifest-relative-path]
```

검사 범위는 활성·명시 manifest와 그 manifest가 선언한 `group-trip/` 텍스트 파일뿐입니다. 다른 프로젝트 파일은 읽지 않습니다.

필수 검사는 구성원별 선호·제약·예산, 공통점, 갈등, tradeoff, 공정한 결정 방식, 일정·대안, 비용 배분, 접근성, 열린 투표, 최신 출처, 사실·가정·추천과 개인정보 가림입니다. 심볼릭 링크·경로 이동·바이너리·과대 파일, 미완성 표시, 실제 비밀값, 명령형 injection, 파괴 명령, 민감 특성 추정과 무조건적 만족 보장을 거부합니다.

안전한 인용과 분석 예시는 실행 지시로 보지 않습니다. 하네스는 합의의 정당성, 실제 가격 또는 Codex 응답의 결정론을 보장하지 않습니다.
