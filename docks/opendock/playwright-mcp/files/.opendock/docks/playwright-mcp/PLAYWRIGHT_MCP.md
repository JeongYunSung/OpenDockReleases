# Playwright MCP 사용 가이드

## 실행 전

- target URL과 allowed hosts를 정합니다.
- login 필요 여부와 허용 action을 확인합니다.
- screenshot, trace, output directory 범위를 정합니다.

## 권장 옵션

- `--isolated`: 기존 browser session과 분리
- `--headless`: 반복 검증과 CI에서 사용
- `--allowed-hosts`: 자동화 대상 host 제한
- `--output-dir`: 결과 파일 위치 고정

## 금지

- 승인 없이 실제 계정 login, 결제, 삭제, 배포를 실행하지 않습니다.
- unrestricted file access를 기본값으로 사용하지 않습니다.
- 외부 사이트에 credential이나 private data를 입력하지 않습니다.
