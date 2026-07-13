# Video Run

작업마다 `.opendock/runs/video/<run-id>/manifest.json`을 만들고 아래 JSON 구조를 사용합니다. 이 template 자체를 output manifest로 쓰지 않습니다.

```json
{
  "schema": "opendock.video-run/v1",
  "status": "ready",
  "rights": "user-owned local source; output use approved for this project",
  "review": "helper verification and visual spot-check completed",
  "outputs": [
    {
      "operation": "trim",
      "path": "outputs/trim.mp4",
      "report": ".opendock/runs/video/demo/trim.json",
      "expected": {
        "container": "mp4",
        "videoCodec": "h264",
        "width": 1920,
        "height": 1080,
        "durationSeconds": 5,
        "durationToleranceSeconds": 0.5,
        "audio": "present",
        "subtitle": "absent"
      }
    }
  ]
}
```

## Output entry

- `operation`: `inspect`, `trim`, `transcode`, `subtitle`, `thumbnail`, `upscale`
- `path`: output path. `inspect`에서는 inspect JSON report path입니다.
- `report`: inspect 이외 operation의 helper JSON report이며 같은 run directory 안에 있어야 합니다.
- `expected.container`: `mp4`, `webm`, `png`, `jpeg`
- `expected.videoCodec`: `h264`, `vp9`, `png`, `mjpeg` 등 ffprobe codec name
- `expected.width`, `expected.height`: positive integer
- `expected.durationSeconds`: thumbnail 이외에는 positive number
- `expected.durationToleranceSeconds`: `0`보다 크고 `5` 이하
- `expected.audio`: `present` 또는 `absent`
- `expected.subtitle`: `present` 또는 `absent`

`inspect` entry는 source file을 다시 읽지 않습니다. inspect report의 `sourceProbe`를 expected contract와 비교합니다. 다른 operation은 현재 output을 ffprobe하고 helper report 및 expected contract와 비교합니다.

## 실행

```bash
node .opendock/harness/opendock__video-ultrawork/check.mjs --manifest .opendock/runs/video/<run-id>/manifest.json
```

Harness는 지정한 manifest와 그 manifest가 열거한 output/report만 검사합니다.
