# Mobile Ultrawork

Flutter, React Native, Swift, Android, permission, 접근성, release readiness, runtime safety를 확인하는 모바일 품질 게이트입니다.

## 확인하는 것

- 모바일 permission에는 사용자가 이해할 수 있는 rationale이 필요합니다.
- Dart `print`와 debug-only code가 남아 있으면 안 됩니다.
- 화면에는 loading, empty, error, offline state가 필요합니다.
- tap target과 accessibility label을 검토해야 합니다.
- release checklist에는 signing, versioning, rollback이 포함되어야 합니다.
- network와 async failure는 명시적으로 처리해야 합니다.

모바일 앱 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
