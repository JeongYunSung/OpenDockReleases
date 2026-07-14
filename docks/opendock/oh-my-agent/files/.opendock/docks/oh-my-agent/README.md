# oh-my-agent

`oma`를 사용해 Dock 전용 작업 공간의 설정을 기준으로 프로젝트 AI 도구 설정을 설치하고 업데이트합니다.

## 빠른 확인

```sh
oma --version
opendock doctor
```

초기 설정은 OpenDock이 만든 Dock 전용 작업 공간에 보관됩니다. 디렉터리 이름에는 충돌 방지용 식별자가 붙으므로 경로를 직접 수정하지 마세요. OpenDock 설치는 `oma -y install`, 업데이트는 `oma update --ci --all`을 그 공간에서 실행합니다.

상세 구조는 같은 폴더의 `OH_MY_AGENT.md`, 선택적 변경 기록 양식은 `OMA_RUN.md`를 참고합니다.

이 도구 Dock 자체에는 별도 정밀 검사 도구가 없습니다. `opendock doctor`는 설치 상태를 읽기 전용으로 확인합니다. 더 깊은 OMA 진단이 필요할 때만 사용자가 `oma doctor`를 직접 실행합니다.
