# Travel Journal 하네스 계약

```bash
node .opendock/harness/opendock__travel-journal/check.mjs [manifest-relative-path]
```

인자가 없으면 도크 run 디렉터리 바로 아래에서 활성 manifest만 찾습니다. 인자가 있으면 안전한 도크 전용 상대 경로의 manifest 하나만 검사합니다. 이후에는 선언된 `travel-journal/` 텍스트 파일만 읽습니다.

하네스는 시간선, 장소, 인물·동의, 하이라이트, 캡션, 사실 불확실성, 회고, 개인정보·가림, 사진·메모 inventory와 둘 이상의 최종 이야기 변형을 요구합니다. 경로 이동·symlink·바이너리·과대 파일, 미완성 표시, 실제 비밀값, 명령형 injection, 파괴 명령, 직접 식별자와 동의 없는 정밀 위치 메타데이터를 거부합니다.

안전한 인용과 분석용 금지 예시는 실패시키지 않습니다. 하네스는 파일을 수정하거나 원본 사진을 읽지 않으며 실제 동의, 저작권, 사실의 진실성 또는 Codex 응답의 결정론을 보장하지 않습니다.
