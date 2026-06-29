# DevOps Ultrawork

Terraform, Kubernetes, Helm, secret, public exposure, image tag, resource limit, runbook을 확인하는 DevOps 품질 게이트입니다.

## 확인하는 것

- Terraform은 fmt check와 validate를 통과해야 합니다.
- Helm과 Kubernetes manifest에는 lint/schema validation이 필요합니다.
- handoff 전에 secret scan이 필수입니다.
- public bucket, public security group, privileged container는 review가 필요합니다.
- image tag에 `latest`를 쓰면 안 됩니다.
- 배포 가능한 변경에는 rollback과 runbook 문서가 있어야 합니다.

DevOps와 infrastructure 품질을 집중적으로 점검해야 하는 workspace에 사용합니다.
