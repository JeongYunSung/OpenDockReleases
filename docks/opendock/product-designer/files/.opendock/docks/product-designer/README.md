# Product Designer 사용 안내

Product Designer는 모호한 요청을 바로 화면으로 만들지 않습니다. 먼저 사용자 문제와 범위를 좁히고, 실제로 다른 방향을 비교한 뒤 검증 가능한 설계와 개발 전달까지 이어갑니다.

## 시작하기

AI에서 $opendock-product-designer를 선택하고 만들고 싶은 제품, 기능 또는 화면을 설명하세요.

처음에는 다음 순서로 진행합니다.

1. 프로젝트와 적용 가능한 DESIGN.md를 먼저 확인합니다.
2. 확인된 사실과 아직 필요한 결정을 짧게 정리합니다.
3. 가장 영향이 큰 질문 하나만 드립니다.
4. 목표와 범위를 승인하면 방향을 비교하고, 선택한 delivery profile에 필요한 명세·prototype·validation만 진행합니다.

외부 디자인 도구나 MCP가 없어도 이 과정은 끝까지 진행됩니다.

## 필요한 만큼만 전달받기

Product Designer는 작업의 크기가 아니라 이번 요청에서 실제로 필요한 결과를 기준으로 가장 작은 delivery profile을 선택합니다.

- **decision**: 두 방향의 trade-off를 비교하고 하나의 설계 결정을 확정합니다.
- **specification**: copy, component, 상태 또는 bounded flow를 구현 가능한 수준으로 명세합니다.
- **prototype**: 검증할 주장에 맞는 최소 prototype과 검증 결과를 만듭니다.
- **implementation**: 승인된 독립 작업공간에서 구현하고 Product Designer가 결과를 다시 검증합니다.

예를 들어 버튼 문구 하나를 다듬어 달라는 요청에 별도 prototype과 전체 제품 handoff를 만들지 않습니다. 반대로 구현을 요청했다면 prototype만 전달하고 전체 구현이 끝났다고 말하지 않습니다. AI는 시작할 때 선택한 범위와 이유를 알려주며, 범위를 넓혀야 할 때는 추가 결과물과 영향을 먼저 설명합니다.

어떤 profile에서도 현재 결과가 주장하는 내용, 안전과 적용되는 접근성 조건은 확인합니다. 다만 요청하지 않은 문서, 시안, 구현 또는 별도 handoff 파일은 만들지 않습니다.

## 세션 이어가기

긴 작업은 .opendock/runs/product-designer/<session-id>/SESSION.md에 checkpoint를 남길 수 있습니다. AI가 승인된 독립 작업공간에서 template을 바탕으로 생성·갱신하며, 사용자가 직접 파일 형식을 관리할 필요는 없습니다. 사용자에게는 Goal, 현재 결정, 미해결 선택과 Next action만 간결하게 보여줍니다. 실제 session은 사용자가 소유합니다.

처음 저장할 때 AI가 경로와 저장 항목을 먼저 보여주고 세 가지 중 하나를 묻습니다.

- **이번 저장만**: 이번 checkpoint 한 번만 저장합니다.
- **이 세션 동안 갱신**: 같은 SESSION.md의 같은 설계 정보만 세션 종료 또는 철회까지 갱신합니다.
- **파일 저장 없이 진행**: 현재 대화 안에서만 목표, 범위, 확정된 결정, 열린 모호함과 다음 행동을 기억합니다.

짧은 작업에는 첫 번째 또는 세 번째, 오래 이어가거나 다른 AI로 옮길 작업에는 두 번째가 적합합니다. 어느 선택도 코드 수정, 명령 실행이나 외부 전송을 허용하지 않습니다.

AI는 시작할 때 작업 깊이와 예상 설계 질문 횟수를 알려줍니다. 저장, 명령 또는 외부 연결 승인은 이 횟수와 별도이므로 실제 왕복은 늘 수 있습니다.

파일로 저장한 SESSION.md를 다른 AI에서 이어갈 때 “이 Product Designer 세션을 이어서 진행해줘”라고 요청하세요. AI는 persona, 현재 단계, 승인된 결정, DESIGN.md 변경과 다음 행동을 확인하고 이미 해결된 질문을 반복하지 않아야 합니다.

`파일 저장 없이 진행`을 선택하면 canonical SESSION.md를 흉내 내거나 긴 ledger를 매 응답에 보여주지 않습니다. 이 ephemeral capsule은 task/thread가 끝난 뒤 보존·재개되거나 Codex와 Claude Code 사이에서 자동 이전된다고 가정할 수 없습니다. 나중에 전환이 필요해지면 AI가 저장할 target path와 정보 범위를 보여주고 승인을 받은 뒤 full SESSION.md로 materialize합니다.

## 원본 보호

설계와 prototype은 원본과 분리된 공간에서 진행합니다. clone, Git init, worktree나 snapshot 생성, 파일 쓰기, dependency 설치, server 실행, commit, push와 배포는 실행 전에 범위와 목적을 설명하고 승인을 받습니다. 같은 단계에서 동일한 경로·host·데이터 범위로 이어지는 sandbox 생성, 파일 변경, 설치와 server 실행은 하나의 실행 계획으로 묶고, 범위가 넓어질 때만 다시 묻습니다.

GitHub를 전제로 하지 않습니다. 로컬 폴더, GitLab과 self-hosted Git, non-Git 프로젝트와 빈 프로젝트에서도 같은 워크플로우를 사용합니다.

## 검토

검토를 요청하면 AI가 현재 설계와 결과물만 Product Designer 워크플로우에 맞춰 다시 확인합니다. 별도의 전용 하네스를 실행하거나 관련 없는 프로젝트 전체를 검사하지 않습니다.
