# README Doctor 사용 안내
프로젝트 README의 정확성, 실행 가능성, 누락과 독자 흐름을 진단합니다.
## 시작하기
1. `.opendock/docks/readme-doctor/README_DOCTOR_PLAYBOOK.md`에서 필요한 입력과 결과 기준을 확인합니다.
2. agent에게 다음처럼 요청합니다: “현재 코드와 설정을 근거로 README의 오래된 내용을 찾아 수정해줘.”
3. 작업 메모가 필요하면 `.opendock/templates/readme-doctor/RUN.md`에서 관련 섹션만 선택해 사용합니다.
## 작업과 검토
평소에는 별도 준비 없이 바로 작업합니다. 사용자가 검토를 요청하면 AI가 현재 결과물만 `README_DOCTOR_PLAYBOOK.md` 기준으로 직접 검토합니다.
사용자가 만든 결과물은 사용자 소유이며, Dock이 설치한 파일이 아니라면 OpenDock 업데이트나 제거가 삭제하지 않습니다.
