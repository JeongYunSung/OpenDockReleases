# DevOps Ultrawork

## 실행 범위

평소 요청에서는 이번 작업에서 만들거나 수정한 파일만 확인합니다. 검사할 파일이나 현재 작업 기록이 지정되어 있으면 그 범위만 보고, 관련 없는 프로젝트 전체는 훑지 않습니다.

사용자가 **검수**, **ultrawork**, **release** 중 하나를 명시한 경우에만 정밀 검사 도구와 전체 품질 게이트를 실행합니다.

Terraform, Kubernetes, Helm, secret, public exposure, image tag, resource limit, runbook을 확인하는 DevOps 품질 게이트입니다.

## 확인하는 것

- Terraform은 fmt check와 validate를 통과해야 합니다.
- Helm과 Kubernetes manifest에는 lint/schema validation이 필요합니다.
- 명시적 정밀 검수에서는 secret scan이 필수입니다.
- public bucket, public security group, privileged container는 review가 필요합니다.
- image tag에 `latest`를 쓰면 안 됩니다.
- 배포 가능한 변경에는 rollback과 runbook 문서가 있어야 합니다.

DevOps와 infrastructure 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
