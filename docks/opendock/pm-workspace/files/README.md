# PM Workspace 운영 안내

Run manifest의 `Language`를 `ko` 또는 `en`으로 설정하고, 제목과 본문을 선택한 언어로 일관되게 작성합니다. 실행 결과 폴더는 사용자 소유이며 Dock update와 uninstall의 관리 대상이 아닙니다.

제품 문서는 `PM_WORKSPACE_PLAYBOOK.md`와 run별 manifest를 기준으로 작성합니다. 산출물은 `product/` 아래에 두며 OpenDock 설치 파일로 관리하지 않습니다.

## 빠른 시작

1. `.opendock/templates/pm-workspace/RUN.md`를 `.opendock/runs/pm-workspace/<run-id>/manifest.md`로 복사합니다.
2. `[[...]]` 표식을 실제 값으로 바꾸고 product target을 선언합니다.
3. 사실, 가정, open question을 분리한 뒤 필수 PM 섹션을 작성합니다.
4. acceptance criteria, metric, edge case, risk, dependency와 decision log를 검토합니다.
5. 전체 active run discovery 또는 특정 manifest 검증을 실행합니다.

```bash
node .opendock/harness/opendock__pm-workspace/check.mjs
node .opendock/harness/opendock__pm-workspace/check.mjs .opendock/runs/pm-workspace/<run-id>/manifest.md
```

특정 manifest 인자는 project 내부의 상대 또는 절대 경로를 받을 수 있으며 `.opendock/runs/pm-workspace/` 내부 regular file이어야 합니다.

## 개인정보

목적에 필요한 최소 데이터만 기록합니다. 집 주소, 세부 여행 일정, 예약 번호, 실명, 연락처, 계정·주문 식별자와 개인 건강·재무 정보는 삭제하거나 비식별 표기로 바꿉니다.

Harness는 active manifest 또는 명시한 manifest와 선언 target만 읽습니다. 통과는 문서 구조와 안전 계약에 대한 deterministic 결과이며 외부 모델 응답의 결정성을 뜻하지 않습니다.
