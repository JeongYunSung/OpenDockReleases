# Dock Builder 정밀 검수

이 workflow는 사용자가 `검수`, `ultrawork`, `release`를 명시한 경우에만 실행합니다.

1. `.opendock/docks/dock-builder/PLAYBOOK.md`와 대상 Dock의 목적을 확인합니다.
2. 정적 checker로 root 문서, namespaced README, Dock 유형, platform parity를 확인합니다.
3. Tool Dock이면 custom harness가 없는지 확인하고 install, update, doctor와 실제 command를 검증합니다.
4. 일반 Dock이면 custom harness, HARNESS, quality-gate가 없는지 확인하고 도메인 가이드 기반 대표 AI 작업을 검증합니다.
5. `*-ultrawork` 또는 `dock-builder`이면 정해진 두 경로, 대상 한정 범위와 객관적인 valid/invalid case를 확인합니다.
6. 임시 workspace에서 install, update, doctor, uninstall과 사용자 파일 보존을 확인합니다.
7. 보안 blocker와 path collision을 확인합니다.
8. `.opendock/templates/dock-builder/RELEASE_EVIDENCE.md`에 결과와 남은 위험을 기록합니다.
9. 실패를 수정하거나 hold 사유를 남기기 전에는 release-ready라고 말하지 않습니다.
