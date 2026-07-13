# Video Ultrawork Harness

## 실행

```bash
node .opendock/harness/opendock__video-ultrawork/check.mjs --manifest .opendock/runs/video/<run-id>/manifest.json
```

`--manifest`는 필수이며 `.opendock/runs/video/<run-id>/manifest.json` 형태의 project-relative regular file만 허용합니다.

## 검사 범위

- 지정한 run manifest 하나
- manifest의 `outputs`에 열거된 output file
- 각 output이 참조하는 같은 run directory의 helper report

source video, 다른 run, 프로젝트 전체, output directory 전체는 scan하지 않습니다.

## 검사 항목

- schema, status, rights, review, non-empty outputs
- helper report operation/path 일치와 `verification.status: passed`
- current output의 video stream, dimensions, duration tolerance
- audio present/absent intent
- operation별 codec/container
- subtitle track, thumbnail image stream, upscale scale 2/4 및 source 대비 정확한 output dimensions
- manifest expected contract와 helper report/current single-file MediaInfo probe 결과의 일치
- traversal, URL, absolute path, symlink, oversized JSON 거부

검사 실패는 rule id와 target path를 출력하고 non-zero로 종료합니다. manifest 예시는 `.opendock/templates/video/VIDEO_RUN.md`에 있습니다.
