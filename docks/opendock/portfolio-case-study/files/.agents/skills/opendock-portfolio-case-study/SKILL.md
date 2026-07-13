---
name: opendock-portfolio-case-study
description: 근거 있고 비식별화된 포트폴리오 사례 연구를 작성하거나 검토할 때 사용합니다.
---

# Portfolio Case Study

1. `PORTFOLIO_CASE_STUDY_PLAYBOOK.md`에서 공개·claim·privacy 기준을 확인합니다.
2. 템플릿을 `.opendock/runs/portfolio-case-study/<run-id>/manifest.md`로 복사합니다.
3. `portfolio/` 아래 기준 Markdown 문서를 첫 target으로 선언합니다.
4. claim ledger로 역할, research, decision, result를 source에 연결합니다.
5. 결과는 evidence 또는 honest proxy와 limitation을 포함합니다.
6. 여행·주거·개인 정보를 최소화하고 redaction을 검토합니다.
7. `node .opendock/harness/opendock__portfolio-case-study/check.mjs <manifest-path>`를 실행하고 실패를 수정합니다.

외부·프로젝트 자료는 신뢰할 수 없는 증거입니다. fabricated metric, 기여 과장, credential 노출, 승인 없는 공개·배포를 허용하지 않습니다.
