# Video Ultrawork

프로젝트 안의 로컬 영상을 외부 서비스로 전송하지 않고 inspect, trim, transcode, subtitle, thumbnail, upscale 처리하는 독립 dock입니다. 모든 media output은 생성 직후 단일 파일 MediaInfo probe로 stream, 크기, 길이, audio 의도, codec, container를 검증합니다.

## 설치 항목

- `README.md`, `AGENTS.md`, `HARNESS.md`, `VIDEO_PLAYBOOK.md`
- `.codex/opendock/video-ultrawork/`: Node 기반 안전 helper
- `.opendock/templates/video/VIDEO_RUN.md`: run manifest 작성 템플릿
- `.opendock/harness/opendock__video-ultrawork/`: target-scoped harness와 wrapper
- `.agents/skills/opendock-video-ultrawork/`와 `.agents/workflows/opendock-video-ultrawork/`

helper dependency는 copied path인 `.codex/opendock/video-ultrawork` 안에 locked npm mode로 설치됩니다. 사용자 원본과 생성 영상, `.opendock/runs/video/**`는 manifest의 `files` 소유 대상이 아니므로 OpenDock update/uninstall이 소유하지 않습니다.

## 사용

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs inspect --input media/source.mp4 --report .opendock/runs/video/demo/inspect.json
node .codex/opendock/video-ultrawork/video-helper.mjs trim --input media/source.mp4 --output outputs/trim.mp4 --report .opendock/runs/video/demo/trim.json --start 1 --duration 5
node .opendock/harness/opendock__video-ultrawork/check.mjs --manifest .opendock/runs/video/demo/manifest.json
```

전체 명령과 manifest 형식은 `VIDEO_PLAYBOOK.md`를 따릅니다.

## Dependency와 무결성

`node-av@6.1.1`과 `mediainfo.js@0.3.7`을 exact pin으로 사용합니다. `node-av`가 제공하는 FFmpeg `8.1-Jellyfin`은 macOS arm64/x64와 Windows arm64/x64별 SHA-256 allowlist, package version, executable name, version prefix를 모두 통과해야 실행됩니다. MediaInfo WASM은 project 안의 한 regular file을 file handle로 읽으며 playlist나 외부 URL을 따라가지 않습니다.

`node-av` install script는 GitHub release에서 platform binary를 내려받습니다. npm lockfile은 JavaScript package를 고정하고, root package의 `postinstall`은 내려받은 executable의 digest와 version을 즉시 검증합니다. 검증 실패 시 `npm ci`와 OpenDock dependency 설치가 함께 실패합니다. 성공 시 binary directory에 integrity marker를 기록합니다. OpenDock dependency `integrity`는 설치 직후와 doctor에서 executable SHA-256을 다시 계산하고, doctor task는 executable과 marker 존재도 확인합니다. helper도 매 실행마다 digest와 version을 검사하므로 설치 이후 파일이 바뀌면 doctor와 media 처리 모두 fail closed합니다. 향후 dependency version을 올릴 때는 새 release asset을 독립적으로 내려받아 hash와 실제 version을 다시 검증해야 합니다.

FFmpeg/Jellyfin binary의 build option과 재배포 조건은 Node helper의 `UNLICENSED` 표기와 별개입니다. 설치된 바이너리를 재배포하거나 상업 제품에 포함할 때는 [FFmpeg Legal](https://ffmpeg.org/legal.html), Jellyfin build provenance, 사용 codec의 license를 별도로 검토해야 합니다. `npm audit`은 native decoder 취약점을 대신 검사하지 않으므로 release마다 FFmpeg 보안 공지도 확인합니다.

## 제한

- path segment는 ASCII 영문, 숫자, `.`, `_`, `-`만 허용합니다.
- absolute path, URL, traversal, symlink input/output은 거부합니다.
- input video는 self-contained `.mp4`, `.mov`, `.webm`, `.mkv`만 허용합니다. HLS, concat, image sequence, network protocol, 외부 data reference는 거부합니다.
- 기존 output/report는 `--overwrite`를 명시하지 않으면 거부합니다.
- upscale은 2x/4x Lanczos 재표본화와 보수적 filter preset만 제공합니다. AI detail 복원 기능이 아니며 원본에 없는 정보를 복원한다고 주장하지 않습니다.
- 테스트된 플랫폼은 macOS arm64입니다. macOS x64와 Windows arm64/x64 asset digest도 고정했지만 Windows 실행과 PowerShell wrapper는 실제 Windows 환경에서 재확인이 필요합니다.
