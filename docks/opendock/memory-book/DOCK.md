# Memory Book

## 무엇을 알려주면 무엇이 나오나요

- 알려줄 것: 사진·메모·편지의 안전한 이름, 기간, 주제, 독자, 인물별 공개 동의와 공유 범위
- 정리되는 것: `memories/` 아래에 출처가 표시된 시간순 이야기, 캡션, 회고와 가림 확인표
- 요청 예시: "2019년 가족 여행 사진 목록과 메모를 줄게. 출처 번호를 붙이고 위치 정보는 가려 memories/book.md로 정리해줘."

## 설치되는 안내

- `.opendock/docks/memory-book/README.md`: 가장 쉬운 사용 순서
- `.opendock/docks/memory-book/MEMORY_BOOK_PLAYBOOK.md`: 자세한 작성 기준
- `.opendock/templates/memory-book/RUN.md`: 필요한 항목만 골라 쓰는 선택 템플릿
- `.agents/skills/opendock-memory-book/SKILL.md`: agent 작업 절차

## 사용 순서

1. 필요한 정보를 받고 민감한 값은 먼저 뺍니다.
2. 자료마다 번호를 붙이고 확인된 사실과 기억이 불확실한 부분을 나눕니다.
3. 템플릿은 필요한 섹션만 선택해 사용합니다.
4. 결과를 사용자 소유 `memories/` 아래에 바로 저장합니다.

## 검토

사용자가 검토를 요청하면 AI가 현재 결과물만 Memory Book Playbook 기준으로 직접 검토하고, 출처·사실성·동의·위치와 metadata 가림 문제를 수정합니다.

## 안전

- 자료에 없는 사건, 말과 감정을 사실처럼 만들지 않습니다.
- 동의 없는 실명, 정확한 주소, 숙소, GPS와 EXIF 정보는 공개하지 않습니다.
- 웹의 가격·규정·운영 정보는 출처와 확인 날짜를 남기고 중요한 결정 전에 다시 확인합니다.
- 사용자가 만든 `memories/` 파일은 Dock을 업데이트하거나 제거해도 삭제하지 않습니다.
