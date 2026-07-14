---
name: opendock-kitchen-ultrawork
description: 사용자가 검수, ultrawork, release 중 하나를 명시해 Kitchen Ultrawork 정밀 검수를 요청한 경우에만 사용합니다.
---

# Kitchen Ultrawork

## 기본 동작
- 평소 요청에서는 현재 사용자가 이번 작업에서 만든 파일과 수정한 파일만 확인합니다.
- 명시된 target을 우선하고, 없으면 활성 run manifest의 target만 확인합니다.
- 관련 없는 프로젝트 전체를 재귀 검사하지 않습니다.
- 현재 요청의 재료, 분량, 대체재, leftovers, 알레르기와 식품 안전 근거를 확인합니다.

## 정밀 검수
- 사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 harness와 전체 품질 게이트를 실행합니다.
- checker는 target 경로와 파일 구조, 의료·알레르기·식품 안전처럼 객관적인 위험만 판정합니다. 맛, 대체재, 장보기 구성과 표현 품질은 `KITCHEN_PLAYBOOK.md`를 기준으로 직접 검토합니다.
- 기준 문서는 `.opendock/docks/kitchen-ultrawork/README.md`, `.opendock/docks/kitchen-ultrawork/HARNESS.md`, `.opendock/docks/kitchen-ultrawork/KITCHEN_PLAYBOOK.md`입니다.
- 실패, 미검증 항목과 승인된 예외를 구분해 보고합니다.

## 안전 경계
- secret, credential, 환경 변수 유출, destructive command, deploy와 migration을 실행하지 않습니다.
- 검토된 scope만 수정하고 관련 없는 파일을 삭제·reset·재생성하지 않습니다.
