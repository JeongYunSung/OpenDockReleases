# Creative Generation Ultrawork Quality Gate

## 실행 조건
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 이 workflow를 실행합니다.
- 평소 요청에서는 이 절차를 실행하지 않고 이번 작업에서 바꾼 파일만 빠르게 확인합니다.

## 검수 절차
1. `.opendock/runs/creative-gen/<작업-id>/`에 `brief.md`와 `manifest.md`를 만들고 생성 종류와 결과 조건을 기록합니다.
2. asset 생성 전에 prompt 초안을 쓰고 subject clarity, style, composition, constraints, negative prompt와 quality criteria를 검토합니다.
3. 최종 prompt로 생성한 output만 안정된 경로에 저장하고 tool, model, date, rights, review와 revision을 manifest에 기록합니다.
4. `node .opendock/harness/creative-gen-ultrawork/check.mjs --manifest .opendock/runs/creative-gen/<작업-id>/manifest.md`를 실행하고 실패를 수정합니다. `release` 요청일 때만 `--release`를 사용합니다.
5. 통과, 실패, 미검증 항목과 남은 위험을 구분해 보고합니다.

## 안전 경계
- 생성 전 prompt를 검토하고 output path, model, date, rights, review 기록을 남깁니다.
- 비밀값, 인증 정보, 환경 변수 유출, 위험한 명령, 배포와 이전 작업을 실행하지 않습니다.
- 검토된 scope만 수정하며 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
