# 로컬 영상 작업

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

이 프로젝트에는 외부 업로드 없이 로컬 파일을 처리하는 Video Ultrawork helper가 설치되어 있습니다.

## 기본 순서

1. `.opendock/runs/video/<작업-id>/`를 만듭니다.
2. `.opendock/templates/video/VIDEO_RUN.md`를 참고해 `manifest.json`을 준비합니다.
3. `node .codex/opendock/video-ultrawork/video-helper.mjs <command> ...`로 처리합니다.
4. helper가 생성한 JSON report와 output을 작업 기록에 기록합니다.
5. 아래 harness를 실행하고 실패를 수정합니다.

```bash
node .opendock/harness/video-ultrawork/check.mjs --manifest .opendock/runs/video/<작업-id>/manifest.json
```

지원 명령은 `inspect`, `trim`, `transcode`, `subtitle`, `thumbnail`, `upscale`입니다. 정확한 option과 output contract는 `.opendock/docks/video-ultrawork/VIDEO_PLAYBOOK.md`에 있습니다.

## 소유권

원본 영상, 생성 영상, subtitle, thumbnail, run report는 사용자 파일입니다. OpenDock이 설치·업데이트·제거하는 `files` payload에 포함되지 않습니다. source의 권리와 output 사용 조건은 작업 기록에 기록합니다.

## 입력과 dependency 주의

영상 도구는 고정된 버전의 `node-av@6.1.1`, FFmpeg `8.1-Jellyfin`, `mediainfo.js@0.3.7`을 사용합니다. 설치와 실행 때 지원 운영체제에 맞는 파일인지 확인합니다. 입력은 자체 포함된 MP4/MOV/WebM/MKV 파일로 제한하며 재생 목록, 여러 파일 이어 붙이기, 이미지 시퀀스, 네트워크 주소, 외부 데이터 참조는 처리하지 않습니다. 바이너리 재배포와 상업 사용 전에는 같은 폴더의 `VIDEO_PLAYBOOK.md`에 있는 출처와 라이선스 주의를 검토합니다.
