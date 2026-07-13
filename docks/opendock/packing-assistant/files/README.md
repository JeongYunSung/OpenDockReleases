# Packing Assistant 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

템플릿을 `.opendock/runs/packing-assistant/<run-id>/manifest.md`로 복사하고 목적지, 날짜, 날씨 출처, 활동, 숙소·교통, 수하물과 의료 제약을 채웁니다. 결과는 `packing/` 아래에 만들고 manifest에 선언합니다.

```bash
node .opendock/harness/opendock__packing-assistant/check.mjs
node .opendock/harness/opendock__packing-assistant/check.mjs .opendock/runs/packing-assistant/<run-id>/manifest.md
```

인자 없이 실행하면 활성 상태를 발견해 0개일 때 `Ready`, 2개 이상일 때 실패합니다. 인자를 주면 지정 manifest 하나만 검사합니다. 선언되지 않은 짐 목록이나 프로젝트 파일은 읽지 않습니다.

건강·처방 정보는 필요한 제약만 최소 기록하고 공유본에서는 가립니다. 하네스는 구조와 근거를 결정론적으로 검사하지만 실제 무게, 규정 승인과 Codex 판단의 결정론은 보장하지 않습니다.
