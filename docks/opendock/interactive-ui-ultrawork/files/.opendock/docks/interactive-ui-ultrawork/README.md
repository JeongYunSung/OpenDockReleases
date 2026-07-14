# Interactive UI Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

현재 작업에서 변경한 UI interaction만 대상으로 입력 parity, 상태, 모션, cleanup, responsive risk를 검증합니다.

## 시작

1. `.opendock/docks/interactive-ui-ultrawork/INTERACTION_PLAYBOOK.md`를 읽고 CSS, WAAPI, Motion, 특수 timeline/SVG 중 구현 계층을 선택합니다.
2. `.opendock/templates/interactive-ui/INTERACTION_RUN.md`를 `.opendock/runs/interactive-ui/<작업-id>/manifest.md`로 복사합니다.
3. `Status: active`와 `Target Files`를 채웁니다. Target에는 이번 작업에서 생성하거나 수정한 파일만 기록합니다.
4. Top-level `Primary Completion`, `Recovery Path`, `Focus Contract`에 관찰 가능한 완료 조건, 복구 경로, focus 소유권을 작성합니다.
5. interaction state matrix와 각 evidence를 실제 관찰·테스트 결과로 작성합니다.
6. harness를 실행하고 실패를 수정합니다.

```bash
node .opendock/harness/interactive-ui-ultrawork/check.mjs
```

macOS/Linux wrapper:

```bash
sh .opendock/harness/interactive-ui-ultrawork/check.sh
```

Windows PowerShell wrapper:

```powershell
.\.opendock\harness\interactive-ui-ultrawork\check.ps1
```

## 범위 원칙

- active run이 없으면 설치 준비 상태로 통과합니다.
- active run은 동시에 하나만 둡니다.
- harness는 현재 작업 기록와 그 manifest에 적힌 target 파일만 읽습니다.
- Timer와 event listener cleanup은 각 target 파일 안에서 확인하며 다른 target의 cleanup으로 대체할 수 없습니다.
- 사용자 UI 파일은 이 dock의 설치 소유권에 포함되지 않습니다.
- dependency 설치는 자동화하지 않습니다. 새 라이브러리가 필요하면 사용자 승인과 프로젝트의 정상 dependency workflow를 별도로 따릅니다.

상세 규칙과 rule id는 `.opendock/docks/interactive-ui-ultrawork/HARNESS.md`, 설계 기준은 `.opendock/docks/interactive-ui-ultrawork/INTERACTION_PLAYBOOK.md`를 참고합니다.
