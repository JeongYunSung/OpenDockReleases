# 로컬 영상 작업

이 프로젝트에는 외부 업로드 없이 로컬 파일을 처리하는 Video Ultrawork helper가 설치되어 있습니다.

## 기본 순서

1. `.opendock/runs/video/<run-id>/`를 만듭니다.
2. `.opendock/templates/video/VIDEO_RUN.md`를 참고해 `manifest.json`을 준비합니다.
3. `node .codex/opendock/video-ultrawork/video-helper.mjs <command> ...`로 처리합니다.
4. helper가 생성한 JSON report와 output을 run manifest에 기록합니다.
5. 아래 harness를 실행하고 실패를 수정합니다.

```bash
node .opendock/harness/opendock__video-ultrawork/check.mjs --manifest .opendock/runs/video/<run-id>/manifest.json
```

지원 명령은 `inspect`, `trim`, `transcode`, `subtitle`, `thumbnail`, `upscale`입니다. 정확한 option과 output contract는 `VIDEO_PLAYBOOK.md`에 있습니다.

## 소유권

원본 영상, 생성 영상, subtitle, thumbnail, run report는 사용자 파일입니다. OpenDock이 설치·업데이트·제거하는 `files` payload에 포함되지 않습니다. source의 권리와 output 사용 조건은 run manifest에 기록합니다.

## 입력과 dependency 주의

helper는 exact-pinned `node-av@6.1.1`의 FFmpeg `8.1-Jellyfin`과 `mediainfo.js@0.3.7`을 사용합니다. dependency 설치의 `postinstall`과 helper 실행 시점에 지원 platform별 SHA-256과 version을 검증합니다. OpenDock은 설치 직후와 doctor에서 dependency executable SHA-256을 다시 계산하며, doctor task는 verified executable과 integrity marker 존재도 확인합니다. 입력은 self-contained MP4/MOV/WebM/MKV로 제한하며 playlist, concat, image sequence, network URL, 외부 data reference는 처리하지 않습니다. 바이너리 재배포와 상업 사용 전에는 `DOCK.md`의 provenance와 license 주의를 검토합니다.
