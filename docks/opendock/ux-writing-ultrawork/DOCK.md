# UX Writing Ultrawork

한국어와 영어 제품 문구를 `WRITING.md` 기준에 맞춰 점검하는 UX writing 품질 게이트입니다.

서비스를 만들고 나면 화면 안에 개발자스러운 말이 남기 쉽습니다. 이 dock은 버튼, 에러, 빈 상태, 로딩, 성공 메시지, 메뉴명, 기능명, 플랜명처럼 사용자가 직접 보는 텍스트를 프로젝트 컨셉에 맞게 고치도록 돕습니다.

## 기준

`WRITING.md`가 최우선입니다. Toss식 해요체, Material/Apple식 plain language, GOV.UK식 쉬운 말 같은 일반 원칙은 fallback입니다. 프로젝트가 `WRITING.md`에서 더 전문적이거나 더 캐주얼한 톤을 요구하면 그 기준을 따릅니다.

## 제공하는 것

- 한국어/영어 voice, tone, UI copy rule을 담는 `WRITING.md`
- 공개 용어와 피해야 할 내부 용어를 관리하는 `TERMS.md`
- 현재 작업 target만 검사하는 run manifest
- Codex, Claude Code, Gemini, Cursor용 지침
- 개발자스러운 용어, 해결 행동 없는 에러, 문체 혼용, placeholder copy를 잡는 harness

## 작업 흐름

```text
WRITING.md 확인 -> TERMS.md 확인 -> target file 지정 -> copy audit -> rewrite -> harness -> handoff
```

작업마다 `.opendock/runs/ux-writing/<run-id>/manifest.md`를 만들고 현재 작업에서 검토할 target file만 적습니다. harness는 그 파일만 검사합니다.

## 검사하는 것

- `WRITING.md`가 있는지
- `TERMS.md`의 피해야 할 표현이 target에 남아 있는지
- payload, endpoint, schema, token, null, undefined 같은 내부 구현어가 사용자 문구에 노출되는지
- 한국어 문체가 해요체/합니다체 안에서 섞이지 않는지
- 영어 문구가 짧고 직접적이며 sentence case를 지키는지
- 에러 문구에 사용자가 다음에 할 행동이 있는지
- 버튼/CTA가 명사보다 행동 중심인지
- TODO, Lorem ipsum, 임시 작명 같은 placeholder가 남아 있는지

코드나 문서 전체를 임의로 훑는 도구가 아니라, 사용자가 보는 문구를 명시적으로 골라 품질을 올리는 게이트입니다.
