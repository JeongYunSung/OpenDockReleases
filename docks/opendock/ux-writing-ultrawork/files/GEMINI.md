# UX Writing Ultrawork

## 기본 동작
- 평소 요청에서는 현재 사용자가 이번 작업에서 만든 파일과 수정한 파일만 확인합니다.
- 명시된 target을 우선하고, 없으면 활성 run manifest의 target만 확인합니다.
- 관련 없는 프로젝트 전체를 재귀 검사하지 않습니다.
- 이번에 바뀐 사용자 문구를 writing contract, 공개 용어, locale과 복구 가능성 기준으로 확인합니다.

## 정밀 검수
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 harness와 전체 품질 게이트를 실행합니다.
- 기준 문서는 `.opendock/docks/ux-writing-ultrawork/README.md`, `.opendock/docks/ux-writing-ultrawork/HARNESS.md`, `.opendock/docks/ux-writing-ultrawork/WRITING.md`, `.opendock/docks/ux-writing-ultrawork/TERMS.md`입니다.
- 실패, 미검증 항목과 승인된 예외를 구분해 보고합니다.

## 안전 경계
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하고 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
