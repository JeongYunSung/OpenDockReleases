# Context Engineering

`code-review-graph`와 `codectx`를 사용해 큰 저장소에서 필요한 맥락만 찾습니다.

## 빠른 확인

```sh
code-review-graph --help
codectx --help
opendock doctor
```

질문, 대상 경로, 제외 경로, 필요한 출력 범위를 먼저 정합니다. 생성된 graph와 요약은 최신 source와 다시 대조합니다.

상세 원칙은 `CONTEXT_ENGINEERING.md`, 선택적 조사 양식은 `CONTEXT_PACK.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 두 CLI의 실제 명령으로 진행합니다.
