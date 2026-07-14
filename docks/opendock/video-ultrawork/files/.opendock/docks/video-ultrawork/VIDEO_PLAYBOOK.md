# Video Playbook

## 공통 계약

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs <command> [options]
```

- 모든 input/output/report는 project-relative path입니다.
- path segment는 `[A-Za-z0-9._-]+`만 허용합니다.
- helper는 self-contained local MP4/MOV/WebM/MKV regular file만 읽고 symlink, URL, HLS, concat, image sequence, 외부 data reference를 거부합니다.
- output/report가 이미 있으면 실패합니다. 명시적으로 교체할 때만 `--overwrite`를 사용합니다.
- media command는 output을 만든 직후 단일 파일 MediaInfo probe로 검증한 뒤 JSON report를 기록합니다.

## 명령

### inspect

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs inspect --input media/source.mp4 --report .opendock/runs/video/demo/inspect.json
```

video/audio/subtitle stream, dimensions, duration, codec, container를 JSON으로 기록합니다.

### trim

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs trim --input media/source.mp4 --output outputs/trim.mp4 --report .opendock/runs/video/demo/trim.json --start 2.5 --duration 8
```

정확한 구간을 H.264/AAC MP4로 다시 encode합니다. audio stream이 있으면 보존하고 요청 길이에 tolerance를 적용해 검증합니다.

### transcode

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs transcode --input media/source.mp4 --output outputs/video.webm --report .opendock/runs/video/demo/transcode.json --audio preserve
```

output extension은 `.mp4` 또는 `.webm`입니다. MP4는 H.264/AAC, WebM은 VP9/Opus를 사용합니다. `--audio preserve|drop`을 지원하며 기본값은 `preserve`입니다.

### subtitle

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs subtitle --input media/source.mp4 --subtitle captions/ko.srt --output outputs/subtitled.mp4 --report .opendock/runs/video/demo/subtitle.json
```

local `.srt` 또는 `.vtt`를 MP4 `mov_text` soft subtitle track으로 삽입합니다. video는 H.264, audio는 AAC로 변환하며 audio 존재 여부를 보존합니다.

### thumbnail

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs thumbnail --input media/source.mp4 --output outputs/thumb.png --report .opendock/runs/video/demo/thumbnail.json --time 3
```

`.png`, `.jpg`, `.jpeg` 한 frame을 생성합니다. audio가 없는 image stream과 source dimensions를 검증합니다.

### upscale

```bash
node .codex/opendock/video-ultrawork/video-helper.mjs upscale --input media/source.mp4 --output outputs/upscaled.mp4 --report .opendock/runs/video/demo/upscale.json --scale 2 --preset balanced
```

- `--scale 2|4`만 허용합니다.
- `--preset none|denoise|sharpen|balanced`를 지원합니다.
- Lanczos scale로 aspect ratio를 유지하고 output dimensions를 짝수로 만듭니다.
- 최대 output budget은 33,177,600 pixels입니다.
- denoise/sharpen 값은 artifact를 줄이기 위한 보수적 filter입니다.
- 이 기능은 AI super-resolution이 아니며 원본에 없는 detail을 복원하지 않습니다.

## Report와 harness

helper report에는 input/output probe, operation option, audio intent, 검증 check가 기록됩니다. `.opendock/templates/video/VIDEO_RUN.md`의 JSON schema로 현재 run output을 열거한 뒤 harness를 실행합니다.

## Dependency와 license

exact-pinned `node-av@6.1.1`과 `mediainfo.js@0.3.7`을 locked npm install로 준비합니다. FFmpeg `8.1-Jellyfin` executable은 dependency `postinstall`, OpenDock dependency `integrity`, 각 helper 실행에서 macOS arm64/x64와 Windows arm64/x64별 SHA-256을 검증하고 helper는 package version과 version prefix도 확인합니다. 검증 실패는 install, doctor 또는 operation을 실패 처리합니다. MediaInfo WASM은 한 local file만 읽습니다. FFmpeg binary는 별도 GitHub release download이므로 dependency를 올릴 때 digest와 실제 version을 다시 검증하고, 재배포·상업 사용 전에는 platform build의 license를 확인합니다.
