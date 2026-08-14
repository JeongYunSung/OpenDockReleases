# Dock Builder 정밀 검수

사용자가 `검수` 또는 `ultrawork`를 명시한 경우 현재 Dock에만 다음을 수행합니다. 전체 컬렉션은 `전체 검수`를 명시한 경우에만 확인합니다.

1. 대상 Dock에 정적 checker를 실행해 목적, 정확한 스킬명, 실제 요청 예시와 결과가 분명한지 확인합니다.
2. Tool Dock이면 custom harness 없이 install, update, doctor와 실제 command를 확인합니다.
3. 비-tool custom harness가 있으면 namespaced HARNESS와 `check.mjs`의 성공·실패 사례를 확인합니다.
4. 임시 workspace에서 uninstall과 사용자 파일 보존을 확인합니다.
5. macOS/Windows parity, 보안 결과, 남은 위험을 검수 결과로 정리합니다.
