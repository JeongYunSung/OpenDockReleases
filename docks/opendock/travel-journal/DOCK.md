# Travel Journal

흩어진 사진과 메모를 사실과 기억의 불확실성을 구분한 여행 기록으로 정리하는 도크입니다. 개인 여행기를 남기는 사람, 가족·동행자의 동의를 지키며 공유본을 만드는 사람, 짧은 캡션과 긴 이야기 변형을 함께 작성하는 에이전트를 위한 품질 게이트입니다.

## 설치되는 내용

- 프로젝트용 `README.md`, `AGENTS.md`, `HARNESS.md` 관리 블록
- `TRAVEL_JOURNAL_PLAYBOOK.md` 기록·동의·가림 플레이북
- `opendock-travel-journal` skill과 품질 게이트 workflow
- `.opendock/templates/travel-journal/RUN.md` 실행 기록 템플릿
- `.opendock/harness/opendock__travel-journal/check.mjs` 로컬 하네스

## 프롬프트 예시

- "교토 여행 사진 18장과 메모를 날짜순으로 정리해 장소, 하이라이트, 캡션, 회고를 포함한 짧은 글과 긴 글 두 버전으로 만들어줘."
- "사진 속 동행자는 가명으로 바꾸고 공개 동의를 확인하지 못한 얼굴과 정확한 위치 메타데이터는 공유본에서 제외해줘."
- "현재 travel-journal 실행의 사진·메모 inventory와 사실 불확실성 표시, 개인정보 가림을 검사해줘."

## 사용 흐름

1. 템플릿을 `.opendock/runs/travel-journal/<run-id>/manifest.md`로 복사합니다.
2. 필요한 사진·메모만 안전한 식별자로 inventory에 적고 원본 위치나 EXIF 값을 복제하지 않습니다.
3. 시간선, 장소, 인물 동의, 사실 불확실성과 공유 범위를 확인합니다.
4. 결과를 `travel-journal/` 아래에 작성하고 manifest에 선언합니다.
5. 하네스를 통과하도록 수정한 뒤 Codex가 서사 흐름과 표현 품질을 별도로 검토합니다.

## 안전과 한계

- 동의하지 않은 인물의 실명, 얼굴 설명, 연락처와 신원 단서를 공개하지 않습니다. 가명·삭제·모호화 중 적절한 방식을 사용합니다.
- 정확한 GPS 좌표, 상세 숙소·자택 위치, 촬영기기 일련번호와 원본 EXIF는 명시적 공개 동의 없이 포함하지 않습니다.
- 기억이 불확실한 날짜, 장소, 대화와 인과관계를 사실로 만들지 않습니다.
- 원본 사진을 수정·삭제하지 않으며 저작권과 초상권은 사용자가 확인해야 합니다.
- 하네스는 실제 동의, 저작권, 기억의 진실성 또는 외부 모델의 결정론을 보장하지 않습니다.

## 언어와 산출물 소유권

Run manifest의 `Language`는 `ko` 또는 `en`으로 기록하고 산출물도 같은 언어로 작성합니다. `travel-journal/` 아래 결과는 사용자 소유이며 Dock manifest가 관리하지 않으므로 OpenDock update와 uninstall이 삭제하지 않습니다.
