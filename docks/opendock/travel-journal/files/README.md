# Travel Journal 사용 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

템플릿을 `.opendock/runs/travel-journal/<run-id>/manifest.md`로 복사하고 기록 범위, 사진·메모 inventory, 시간선, 장소, 인물 동의와 가림 방침을 채웁니다. 결과는 `travel-journal/` 아래에 작성해 대상 파일로 선언합니다.

```bash
node .opendock/harness/opendock__travel-journal/check.mjs
node .opendock/harness/opendock__travel-journal/check.mjs .opendock/runs/travel-journal/<run-id>/manifest.md
```

인자가 없으면 활성 실행을 발견하며 0개일 때 `Ready`, 2개 이상일 때 실패합니다. 인자를 주면 지정 manifest 하나만 검사합니다. 하네스는 선언된 결과만 읽고 원본 사진이나 다른 프로젝트 파일을 순회하지 않습니다.

필요한 원본만 최소 사용하고 가명, 위치 모호화와 메타데이터 제거를 기본값으로 둡니다. 결정론적 하네스와 Codex 서사 품질 검토는 별도이며 실제 동의·저작권을 대신하지 않습니다.
