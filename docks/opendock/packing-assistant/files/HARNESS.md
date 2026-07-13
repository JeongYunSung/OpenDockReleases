# Packing Assistant 하네스 계약

```bash
node .opendock/harness/opendock__packing-assistant/check.mjs [manifest-relative-path]
```

인자가 없으면 도크 run 디렉터리의 활성 manifest만 발견하고, 인자가 있으면 그 manifest만 검사합니다. 읽는 산출물은 manifest에 선언된 `packing/` 텍스트 파일뿐입니다.

하네스는 목적지·날짜·기상 출처, 활동·숙소·교통, 수하물·의료 제약, 수량이 있는 카테고리별 체크리스트, 재착용·세탁, 서류·전자기기·의약품 caveat, 출발 직전 목록과 현지 구매 대안을 요구합니다. 경로 이동·symlink·바이너리·과대 파일, 미완성 표시, 실제 비밀값, 명령형 injection, 파괴 명령, 근거 없는 보장과 의료 처방 문구를 거부합니다.

인용·분석 문맥의 위험 문자열과 명시적으로 가린 값은 실패시키지 않습니다. 하네스는 네트워크나 외부 프로세스를 사용하지 않고 파일을 수정하지 않으며 실제 규정·의료 적합성 또는 Codex 결정론을 보장하지 않습니다.
