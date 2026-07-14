# Video Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. `.opendock/templates/video/VIDEO_RUN.md`로 current run의 `manifest.json`을 만들고 project-relative source와 output만 기록합니다.
2. helper report의 검증 상태, 크기, 길이, audio intent, codec, container와 rights를 확인합니다.
3. `node .opendock/harness/video-ultrawork/check.mjs --manifest .opendock/runs/video/<run-id>/manifest.json`을 실행합니다.
4. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 현재 run의 source, output, report, codec, 크기, 길이, audio intent와 rights를 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
