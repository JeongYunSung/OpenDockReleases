# Memory Book

사진, 메모, 편지, 인터뷰처럼 흩어진 개인 기록을 출처가 추적되는 타임라인과 서사로 정리하려는 개인·가족·소규모 공동체를 위한 dock입니다. 기억을 만들어내지 않고 동의, 장소의 안전한 수준, 가림 범위를 먼저 정한 뒤 캡션과 회고, 최종 출력 계획을 구성합니다.

## 설치되는 내용

- `MEMORY_BOOK_PLAYBOOK.md`: source inventory, timeline, consent, caption, redaction 원칙
- `.opendock/templates/memory-book/RUN.md`: 기간·테마, 대상 파일, 검증과 불확실성을 기록하는 run 템플릿
- `.agents/skills/opendock-memory-book/`: 출처 기반 memory book 제작 skill
- `.agents/workflows/opendock-memory-book/`: inventory부터 privacy gate까지의 workflow
- `.opendock/harness/opendock__memory-book/check.mjs`: 현재 run과 선언된 `memories/` Markdown만 검사하는 결정론적 gate

## 요청 예시

```text
2019년 가족 여행 사진과 내 메모를 작은 기억책 초안으로 정리해줘. 사진마다 source id를 붙이고 정확한 숙소·GPS·EXIF 위치는 제거해줘.
```

```text
부모님 결혼기념일 memory book을 만들고 싶어. 인터뷰에서 확인된 일과 추정인 부분을 구분하고, 등장인물별 동의와 공유 범위를 먼저 정리해줘.
```

```text
지난 1년의 팀 하이라이트를 타임라인, 짧은 캡션, 회고로 구성해줘. 확인할 수 없는 사건이나 감정은 만들지 말고 최종 PDF 제작 계획까지만 작성해줘.
```

## 작업 흐름

1. 기간, 테마, 독자, 공유 범위를 정합니다.
2. 각 source에 ID, 유형, 날짜, 제공자 역할, 동의 상태를 부여합니다.
3. source ID를 인용해 timeline, highlights, captions를 작성하고 사실과 회고를 분리합니다.
4. 인물 동의, 정확한 주소, 상세 여행 동선, EXIF·GPS, 개인 식별자를 검토하고 가립니다.
5. 결과 Markdown을 사용자 소유 `memories/` 아래에 저장하고 run manifest에 선언합니다.
6. 하네스 실패를 수정한 뒤 사람 또는 Codex가 서사와 동의를 별도로 수용 검토합니다.

## 안전과 한계

- 자료가 없는 기억, 발언, 감정을 사실처럼 만들지 않습니다. 미확인 내용은 명확히 표시하거나 제외합니다.
- 실명은 동의된 경우에만 사용하고 기본값은 역할·이니셜·가명입니다.
- 집과 여행 장소는 도시·지역 수준으로 낮추며 정확한 주소, 숙소, 미래 일정, EXIF/GPS 좌표를 공개하지 않습니다.
- source media는 명시적 승인 없이 외부 provider로 보내지 않으며 credential이나 민감 식별자를 저장하지 않습니다.
- 하네스는 Markdown 구조와 고위험 패턴을 검사할 뿐 기억의 진실성 전체나 외부 모델 재현성을 보장하지 않습니다.

