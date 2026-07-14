# Dock 테스트 범위

검증되지 않은 명령은 실제 프로젝트에서 실행하지 않습니다. 정밀 검수는 새 임시 workspace에서 수행합니다.

## 일반 요청

- 현재 요청에서 바꾼 Dock만 정적 checker로 확인합니다.
- manifest 최신 규격과 source/target path를 확인합니다.
- root 문서 금지와 namespaced README를 확인합니다.
- root `AGENTS.md` 규칙이 20개 이하인지 확인합니다.
- Tool, 일반, Ultrawork/Dock Builder의 custom harness 정책을 확인합니다.
- macOS와 Windows 설치 계약이 같은지 확인합니다.

여기까지 통과하면 일반 수정의 빠른 확인은 끝납니다. 저장소 전체 harness나 실제 설치 시나리오는 자동으로 확장하지 않습니다.

## 검수·ultrawork·release

### 공통

- 빈 workspace install
- 기존 프로젝트 install과 관련 없는 사용자 파일 보존
- update no-change
- managed file 사용자 수정 충돌
- 새 버전에서 제거된 managed file 정리
- doctor 성공과 실패 메시지
- uninstall 뒤 managed file 정리와 사용자 파일 보존
- macOS와 Windows manifest 선택 및 file mapping parity
- 여러 Dock이 함께 설치될 때 path collision

### Tool Dock

- tool package와 project-local shim 생성
- update 뒤 오래된 tool 상태 정리
- doctor에서 tool과 command 확인
- 선언한 대표 command의 실제 실행과 종료 코드
- tool manager에 필요한 runtime과 project-local shim 확인
- uninstall 뒤 Dock 소유 tool과 shim 정리

Tool Dock에는 custom harness 성공·실패 사례를 요구하지 않습니다.

### 일반 Dock

- custom harness, HARNESS, quality-gate workflow가 없음
- root AGENTS가 20개 이하의 routing/safety 규칙만 포함
- skill과 domain guide가 바로 작업 가능한 지침을 제공
- 대표 요청에서 AI가 현재 산출물만 보고 결과를 생성하거나 검토
- template을 사용하지 않아도 정상 작업 가능

### Ultrawork와 Dock Builder

- `.opendock/docks/<dock-name>/HARNESS.md` 설치
- `.opendock/harness/<dock-name>/check.mjs` 설치
- 올바른 사례 성공
- 의도적으로 잘못된 사례 non-zero 실패
- 현재 요청 산출물 밖의 unrelated file을 검사하지 않음
- 일반 실행은 빠르게 대기하고, 검수는 지정 작업만, release는 명시적 전체 모드에서만 넓게 검사
- 의미·문체·창의성을 regex로 점수화하지 않고 객관적 조건만 자동 판정

### Dependencies

- 지원 manager와 mode
- 설치 대상이 복사된 안전한 project-relative folder인지 확인
- install 뒤 dependency output 생성
- update에서 stale output 정리와 재설치
- uninstall에서 generated output만 정리하고 source와 사용자 파일 보존

## Registry

- 정확한 `owner/name@version` reference 사용
- platform별 artifact와 `--file` 일치
- Registry의 `DOCK.md`, logo, tag 표시 확인
- 검증하지 못한 platform과 남은 위험 기록
