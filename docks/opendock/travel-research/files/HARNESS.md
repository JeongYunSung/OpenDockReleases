# Travel Research 하네스 계약

## 실행과 범위

```bash
node .opendock/harness/opendock__travel-research/check.mjs [manifest-relative-path]
```

인자가 없으면 도크 전용 run 디렉터리의 바로 아래 manifest만 살펴 활성 실행을 찾습니다. 인자가 있으면 `.opendock/runs/travel-research/<run-id>/manifest.md` 한 파일만 검사합니다. 이후 읽는 파일은 해당 manifest가 선언한 `travel-research/` 대상뿐입니다.

## 검사 항목

- 상대 경로, 확장자, 크기, UTF-8, 일반 파일과 심볼릭 링크 경계
- 목적지·체류 길이·날짜와 조사 범위
- 동네, 교통, 날씨·계절, 안전, 현지 규칙·예절, 결제·연결, 비용, 관광객 함정
- URL·접근일이 있는 최신 출처와 사실·가정·추천 분리
- 불확실성, 지역별 상충관계, 추천 장단점과 개인정보 최소화·가림
- 활성 미완성 표시, 실제 비밀값, 명령형 prompt injection, 실행형 파괴 명령과 근거 없는 보장

안전한 인용, 코드로 감싼 금지 예시, 분석 문맥과 명시적으로 가린 값은 실패시키지 않습니다. 하네스는 네트워크, 외부 프로세스와 파일 수정을 사용하지 않으며 출처의 진실성이나 Codex 판단의 결정론을 보장하지 않습니다.
