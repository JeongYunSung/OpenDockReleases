## OpenDock README Doctor

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

현재 프로젝트의 README를 실제 코드와 검증 결과에 맞춰 진단하는 안내입니다. `.opendock/templates/readme-doctor/RUN.md`로 run을 만들고, `docs/readme-doctor/`에 audit를 작성한 뒤 필요한 경우에만 프로젝트 `README.md` 또는 patch를 Target Files에 추가합니다.

```bash
node .opendock/harness/opendock__readme-doctor/check.mjs
```

package, 명령, 버전은 package manifest, task 정의, source 또는 실행 결과에서 확인한 것만 기록합니다. source URL과 access date를 남기고 사실, 가정, 권고를 구분합니다. 예제에는 실제 credential이나 집·숙소·여행·개인 위치·연락처 같은 데이터를 넣지 않습니다. Codex acceptance는 deterministic harness와 별도로 기록합니다.
