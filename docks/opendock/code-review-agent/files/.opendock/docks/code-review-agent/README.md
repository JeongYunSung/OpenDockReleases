# Code Review Agent

`pr-agent`를 사용해 Pull Request와 변경 사항을 근거 중심으로 검토합니다.

## 빠른 확인

```sh
pr-agent --help
opendock doctor
```

원격 provider 연결 전 token과 코드 전송 범위를 확인합니다. Finding에는 파일·라인, 영향, 재현 조건, 수정 확인 방법을 포함합니다.

상세 원칙은 `CODE_REVIEW.md`, 선택적 리뷰 기록 양식은 `CODE_REVIEW_RUN.md`를 참고합니다.

이 도구 Dock에는 별도 정밀 검사 도구가 없습니다. 설치 검수는 `opendock doctor`와 실제 `pr-agent` 명령으로 진행합니다.
