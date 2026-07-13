---
name: opendock-travel-journal
description: 사진과 메모를 시간선, 캡션, 회고와 여러 이야기 변형으로 정리하면서 사실 불확실성, 인물 동의와 개인정보 가림을 검증할 때 사용합니다.
---

# Travel Journal Skill

1. `TRAVEL_JOURNAL_PLAYBOOK.md`를 읽고 run 템플릿을 복사합니다.
2. 필요한 사진·메모만 안전한 ID로 inventory에 기록하고 원본 경로·메타데이터를 복제하지 않습니다.
3. 시간선·장소 근거, 인물 동의, 사실 불확실성과 공개 범위를 확인합니다.
4. `travel-journal/` 아래에 하이라이트, 캡션, 회고와 짧은·긴 최종 이야기 변형을 작성합니다.
5. 대상 파일을 선언하고 `node .opendock/harness/opendock__travel-journal/check.mjs <manifest-path>` 실패를 반복 수정합니다.
6. 통과 후 Codex와 사람이 서사 품질, 사실, 동의, 저작권과 가림을 별도로 검토합니다.

동의 없는 신원·정밀 위치 공개, 사실 창작, 원본 수정·삭제, 자동 게시, 비밀값 처리와 파괴 명령은 금지합니다.
