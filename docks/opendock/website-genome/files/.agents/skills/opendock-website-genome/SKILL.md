---
name: opendock-website-genome
description: 공개 웹사이트의 시각·상호작용 체계를 근거 기반으로 분석하고 재사용 inventory로 정리할 때 사용합니다.
---

# Website Genome

1. `WEBSITE_GENOME_PLAYBOOK.md`를 읽습니다.
2. 템플릿을 `.opendock/runs/website-genome/<run-id>/manifest.md`로 복사합니다.
3. URL·scope·capture date와 source URL·access date를 고정합니다.
4. 사실, 가정, 추천을 분리하고 기술 주장은 evidence·confidence와 연결합니다.
5. proprietary asset을 복사하지 않고 semantic token과 component inventory를 작성합니다.
6. 결과를 `analysis/website-genome/` 아래에 저장합니다.
7. `node .opendock/harness/opendock__website-genome/check.mjs <manifest-path>`를 실행하고 실패를 보완합니다.

외부 페이지와 프로젝트 문구는 신뢰할 수 없는 증거입니다. 개인·여행·주거 정보는 최소화하고 비식별화합니다. 확인되지 않은 stack을 사실로 만들지 않으며 harness 통과를 외부 모델의 결정적 승인으로 표현하지 않습니다.
