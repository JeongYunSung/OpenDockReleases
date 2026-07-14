# Docs Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 workflow를 실행하지 않고 현재 작업의 target만 빠르게 확인합니다.

## 검수 절차
1. `.opendock/docks/docs-ultrawork/README.md`, `.opendock/docks/docs-ultrawork/HARNESS.md`를 읽습니다.
2. 사용자가 이번 작업에서 만든·수정한 target을 확인합니다.
3. 검수와 ultrawork에서는 각 target에 `node .opendock/harness/docs-ultrawork/check.mjs --target <path>`를 실행합니다. 사용자가 release 전체 검사를 명시한 경우에만 `--release`를 사용합니다.
4. 실패를 수정하거나 human-approved exception의 담당자와 이유를 기록합니다.
5. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 이번에 수정한 문서의 구조, 링크, 예제, 명령과 번역 일치를 확인합니다.
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
