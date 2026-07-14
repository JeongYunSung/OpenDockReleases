# Mobile Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

Flutter, React Native, Swift, Android, permission, 접근성, release readiness, runtime safety를 확인하는 모바일 품질 게이트입니다.

## 확인하는 것

- 모바일 permission에는 사용자가 이해할 수 있는 rationale이 필요합니다.
- Dart `print`와 debug-only code가 남아 있으면 안 됩니다.
- 화면에는 loading, empty, error, offline state가 필요합니다.
- tap target과 accessibility label을 검토해야 합니다.
- VoiceOver/TalkBack에서 읽히는 순서와 이름을 확인하고, icon-only action에는 label/tooltip/semanticLabel을 둡니다.
- 사용자 font scaling, dynamic type, reduced motion을 임의로 끄지 않습니다.
- release checklist에는 signing, versioning, rollback이 포함되어야 합니다.
- network와 async failure는 명시적으로 처리해야 합니다.

모바일 앱 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
